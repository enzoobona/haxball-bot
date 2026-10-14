import pytest

from bracket.database import database
from bracket.models.db.stage_item import StageType
from bracket.models.db.stage_item_inputs import StageItemInputInsertable
from bracket.schema import matches, players
from bracket.utils.dummy_records import (
    DUMMY_MATCH1,
    DUMMY_PLAYER1,
    DUMMY_PLAYER2,
    DUMMY_PLAYER3,
    DUMMY_PLAYER4,
    DUMMY_ROUND1,
    DUMMY_STAGE1,
    DUMMY_STAGE_ITEM1,
    DUMMY_TEAM1,
    DUMMY_TEAM2,
)
from bracket.utils.http import HTTPMethod
from tests.integration_tests.api.shared import SUCCESS_RESPONSE, send_tournament_request
from tests.integration_tests.models import AuthContext
from tests.integration_tests.sql import (
    inserted_match,
    inserted_player_in_team,
    inserted_round,
    inserted_stage,
    inserted_stage_item,
    inserted_stage_item_input,
    inserted_team,
)


async def _player_row(player_id: int) -> dict[str, int]:
    row = await database.fetch_one(
        players.select().where(players.c.id == player_id),
    )
    assert row is not None
    return {
        key: row[key]
        for key in ("wins", "draws", "losses", "goals", "assists", "own_goals")
    }


@pytest.mark.asyncio(loop_scope="session")
@pytest.mark.parametrize(
    ("score1", "score2", "team1_result", "team2_result"),
    [
        (3, 1, "wins", "losses"),
        (0, 2, "losses", "wins"),
        (1, 1, "draws", "draws"),
    ],
)
async def test_finish_and_reset_match(
    startup_and_shutdown_uvicorn_server: None,
    auth_context: AuthContext,
    score1: int,
    score2: int,
    team1_result: str,
    team2_result: str,
) -> None:
    tournament_id = auth_context.tournament.id
    async with (
        inserted_stage(DUMMY_STAGE1.model_copy(update={"tournament_id": tournament_id})) as stage,
        inserted_stage_item(
            DUMMY_STAGE_ITEM1.model_copy(
                update={
                    "stage_id": stage.id,
                    "ranking_id": auth_context.ranking.id,
                    "type": StageType.ROUND_ROBIN,
                }
            )
        ) as stage_item,
        inserted_round(DUMMY_ROUND1.model_copy(update={"stage_item_id": stage_item.id})) as round_,
        inserted_team(DUMMY_TEAM1.model_copy(update={"tournament_id": tournament_id})) as team1,
        inserted_team(DUMMY_TEAM2.model_copy(update={"tournament_id": tournament_id})) as team2,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=0,
                team_id=team1.id,
                tournament_id=tournament_id,
                stage_item_id=stage_item.id,
            )
        ) as input1,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=1,
                team_id=team2.id,
                tournament_id=tournament_id,
                stage_item_id=stage_item.id,
            )
        ) as input2,
        inserted_player_in_team(
            DUMMY_PLAYER1.model_copy(update={"tournament_id": tournament_id}), team1.id
        ) as p1,
        inserted_player_in_team(
            DUMMY_PLAYER2.model_copy(update={"tournament_id": tournament_id}), team1.id
        ) as p2,
        inserted_player_in_team(
            DUMMY_PLAYER3.model_copy(update={"tournament_id": tournament_id}), team2.id
        ) as p3,
        inserted_player_in_team(
            DUMMY_PLAYER4.model_copy(update={"tournament_id": tournament_id}), team2.id
        ) as p4,
        inserted_match(
            DUMMY_MATCH1.model_copy(
                update={
                    "round_id": round_.id,
                    "stage_item_input1_id": input1.id,
                    "stage_item_input2_id": input2.id,
                    "court_id": None,
                }
            )
        ) as match,
    ):
        # --- datos que consume el bot ---
        info = await send_tournament_request(HTTPMethod.GET, f"matches/{match.id}", auth_context)
        assert info["data"]["stage_type"] == "ROUND_ROBIN"
        assert info["data"]["played"] is False
        assert info["data"]["team_1_id"] == team1.id
        assert info["data"]["team_2_id"] == team2.id

        body = {
            "stage_item_input1_score": score1,
            "stage_item_input2_score": score2,
            "player_stats": [
                {"player_id": p1.id, "team_id": team1.id, "goals": 2, "assists": 0},
                {"player_id": p2.id, "team_id": team1.id, "goals": 0, "assists": 1},
                {"player_id": p3.id, "team_id": team2.id, "goals": 1, "assists": 0},
                {"player_id": p4.id, "team_id": team2.id, "own_goals": 1},
            ],
        }
        assert (
            await send_tournament_request(
                HTTPMethod.POST, f"matches/{match.id}/finish", auth_context, json=body
            )
            == SUCCESS_RESPONSE
        )

        zero = {"wins": 0, "draws": 0, "losses": 0}
        assert await _player_row(p1.id) == zero | {team1_result: 1} | {
            "goals": 2, "assists": 0, "own_goals": 0
        }
        assert await _player_row(p2.id) == zero | {team1_result: 1} | {
            "goals": 0, "assists": 1, "own_goals": 0
        }
        assert await _player_row(p3.id) == zero | {team2_result: 1} | {
            "goals": 1, "assists": 0, "own_goals": 0
        }
        assert await _player_row(p4.id) == zero | {team2_result: 1} | {
            "goals": 0, "assists": 0, "own_goals": 1
        }

        # --- detalle por partido (lo usa el frontend) ---
        detail = await send_tournament_request(
            HTTPMethod.GET, f"matches/{match.id}/player_stats", auth_context
        )
        by_name = {row["player_name"]: row for row in detail["data"]}
        assert len(by_name) == 4
        assert by_name[p1.name]["goals"] == 2
        assert by_name[p1.name]["team_name"] == team1.name
        assert by_name[p4.name]["own_goals"] == 1
        assert by_name[p4.name]["team_id"] == team2.id

        # --- no se puede cerrar dos veces ---
        response = await send_tournament_request(
            HTTPMethod.POST, f"matches/{match.id}/finish", auth_context, json=body
        )
        assert "already been played" in response["detail"]

        # --- reset: cada jugador descuenta según SU equipo y todo vuelve a cero ---
        assert (
            await send_tournament_request(
                HTTPMethod.POST, f"matches/{match.id}/reset", auth_context, json={}
            )
            == SUCCESS_RESPONSE
        )
        for player in (p1, p2, p3, p4):
            assert await _player_row(player.id) == {
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals": 0,
                "assists": 0,
                "own_goals": 0,
            }

        row = await database.fetch_one(matches.select().where(matches.c.id == match.id))
        assert row is not None
        assert row["played"] is False
        assert (row["stage_item_input1_score"], row["stage_item_input2_score"]) == (0, 0)

        detail = await send_tournament_request(
            HTTPMethod.GET, f"matches/{match.id}/player_stats", auth_context
        )
        assert detail["data"] == []


@pytest.mark.asyncio(loop_scope="session")
async def test_finish_match_rejects_invalid_players_and_teams(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    tournament_id = auth_context.tournament.id
    async with (
        inserted_stage(DUMMY_STAGE1.model_copy(update={"tournament_id": tournament_id})) as stage,
        inserted_stage_item(
            DUMMY_STAGE_ITEM1.model_copy(
                update={
                    "stage_id": stage.id,
                    "ranking_id": auth_context.ranking.id,
                    "type": StageType.SINGLE_ELIMINATION,
                }
            )
        ) as stage_item,
        inserted_round(DUMMY_ROUND1.model_copy(update={"stage_item_id": stage_item.id})) as round_,
        inserted_team(DUMMY_TEAM1.model_copy(update={"tournament_id": tournament_id})) as team1,
        inserted_team(DUMMY_TEAM2.model_copy(update={"tournament_id": tournament_id})) as team2,
        inserted_team(DUMMY_TEAM2.model_copy(update={"tournament_id": tournament_id})) as team3,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=0,
                team_id=team1.id,
                tournament_id=tournament_id,
                stage_item_id=stage_item.id,
            )
        ) as input1,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=1,
                team_id=team2.id,
                tournament_id=tournament_id,
                stage_item_id=stage_item.id,
            )
        ) as input2,
        inserted_player_in_team(
            DUMMY_PLAYER1.model_copy(update={"tournament_id": tournament_id}), team1.id
        ) as p1,
        inserted_match(
            DUMMY_MATCH1.model_copy(
                update={
                    "round_id": round_.id,
                    "stage_item_input1_id": input1.id,
                    "stage_item_input2_id": input2.id,
                    "court_id": None,
                }
            )
        ) as match,
    ):
        # El bot decide si un empate necesita desempate mirando este campo.
        info = await send_tournament_request(HTTPMethod.GET, f"matches/{match.id}", auth_context)
        assert info["data"]["stage_type"] == "SINGLE_ELIMINATION"

        # Equipo que no juega este partido
        bad_team = {
            "stage_item_input1_score": 1,
            "stage_item_input2_score": 0,
            "player_stats": [{"player_id": p1.id, "team_id": team3.id, "goals": 1}],
        }
        response = await send_tournament_request(
            HTTPMethod.POST, f"matches/{match.id}/finish", auth_context, json=bad_team
        )
        assert "invalid team" in response["detail"]

        # Jugador que no existe en este torneo
        bad_player = {
            "stage_item_input1_score": 1,
            "stage_item_input2_score": 0,
            "player_stats": [{"player_id": 999_999_999, "team_id": team1.id, "goals": 1}],
        }
        response = await send_tournament_request(
            HTTPMethod.POST, f"matches/{match.id}/finish", auth_context, json=bad_player
        )
        assert "do not belong to this tournament" in response["detail"]

        row = await database.fetch_one(matches.select().where(matches.c.id == match.id))
        assert row is not None
        assert row["played"] is False
