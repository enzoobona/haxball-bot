from pathlib import Path

import pytest

from bracket.database import database
from bracket.logic.uploaded_files import (
    remove_uploaded_file,
    restore_uploaded_file,
    save_uploaded_file,
)
from bracket.models.db.stage_item import StageType
from bracket.models.db.stage_item_inputs import StageItemInputInsertable
from bracket.utils.dummy_records import (
    DUMMY_MATCH1,
    DUMMY_PLAYER1,
    DUMMY_PLAYER2,
    DUMMY_ROUND1,
    DUMMY_STAGE1,
    DUMMY_STAGE_ITEM1,
    DUMMY_TEAM1,
    DUMMY_TEAM2,
)
from bracket.utils.http import HTTPMethod
from tests.integration_tests.api.shared import send_tournament_request
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


@pytest.mark.asyncio(loop_scope="session")
async def test_match_numbers_stats_and_profiles(
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
                    "type": StageType.ROUND_ROBIN,
                }
            )
        ) as stage_item,
        inserted_round(DUMMY_ROUND1.model_copy(update={"stage_item_id": stage_item.id})) as round_,
        inserted_team(DUMMY_TEAM1.model_copy(update={"tournament_id": tournament_id})) as team1,
        inserted_team(DUMMY_TEAM2.model_copy(update={"tournament_id": tournament_id})) as team2,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=0, team_id=team1.id, tournament_id=tournament_id, stage_item_id=stage_item.id
            )
        ) as input1,
        inserted_stage_item_input(
            StageItemInputInsertable(
                slot=1, team_id=team2.id, tournament_id=tournament_id, stage_item_id=stage_item.id
            )
        ) as input2,
        inserted_player_in_team(
            DUMMY_PLAYER1.model_copy(update={"tournament_id": tournament_id}), team1.id
        ) as p1,
        inserted_player_in_team(
            DUMMY_PLAYER2.model_copy(update={"tournament_id": tournament_id}), team2.id
        ) as p2,
        inserted_match(
            DUMMY_MATCH1.model_copy(
                update={
                    "round_id": round_.id,
                    "stage_item_input1_id": input1.id,
                    "stage_item_input2_id": input2.id,
                    "court_id": None,
                }
            )
        ) as match1,
        inserted_match(
            DUMMY_MATCH1.model_copy(
                update={
                    "round_id": round_.id,
                    "stage_item_input1_id": input2.id,
                    "stage_item_input2_id": input1.id,
                    "court_id": None,
                }
            )
        ) as match2,
    ):
        # --- numeración por torneo: no depende del id global ---
        first = await send_tournament_request(
            HTTPMethod.GET, "matches/number/1", auth_context
        )
        second = await send_tournament_request(
            HTTPMethod.GET, "matches/number/2", auth_context
        )
        assert (first["data"]["id"], first["data"]["number"]) == (match1.id, 1)
        assert (second["data"]["id"], second["data"]["number"]) == (match2.id, 2)
        assert (
            await send_tournament_request(HTTPMethod.GET, "matches/number/3", auth_context)
        )["detail"] == "Match not found"

        by_id = await send_tournament_request(HTTPMethod.GET, f"matches/{match2.id}", auth_context)
        assert by_id["data"]["number"] == 2

        stages = await send_tournament_request(HTTPMethod.GET, "stages", auth_context)
        numbers = {
            m["id"]: m["number"]
            for st in stages["data"]
            for item in st["stage_items"]
            for r in item["rounds"]
            for m in r["matches"]
        }
        assert numbers == {match1.id: 1, match2.id: 2}

        # --- se juega el partido 1: team1 gana 3-1 ---
        body = {
            "stage_item_input1_score": 3,
            "stage_item_input2_score": 1,
            "player_stats": [
                {"player_id": p1.id, "team_id": team1.id, "goals": 3, "assists": 0},
                {"player_id": p2.id, "team_id": team2.id, "goals": 1, "assists": 0},
            ],
        }
        await send_tournament_request(
            HTTPMethod.POST, f"matches/{match1.id}/finish", auth_context, json=body
        )

        # --- tabla pública de estadísticas ---
        table = await send_tournament_request(HTTPMethod.GET, "stats/players", auth_context)
        rows = {row["player_id"]: row for row in table["data"]}
        assert rows[p1.id]["goals"] == 3
        assert rows[p1.id]["wins"] == 1
        assert rows[p1.id]["matches_played"] == 1
        assert rows[p1.id]["team_name"] == team1.name
        assert rows[p2.id]["losses"] == 1

        # --- perfil de jugador ---
        profile = (
            await send_tournament_request(
                HTTPMethod.GET, f"players/{p1.id}/profile", auth_context
            )
        )["data"]
        assert profile["player"]["name"] == p1.name
        assert len(profile["matches"]) == 1
        entry = profile["matches"][0]
        assert (entry["number"], entry["goals_for"], entry["goals_against"]) == (1, 3, 1)
        assert entry["opponent_name"] == team2.name
        assert entry["goals"] == 3

        loser = (
            await send_tournament_request(
                HTTPMethod.GET, f"players/{p2.id}/profile", auth_context
            )
        )["data"]["matches"][0]
        assert (loser["goals_for"], loser["goals_against"]) == (1, 3)

        # --- perfil de equipo ---
        team_profile = (
            await send_tournament_request(
                HTTPMethod.GET, f"teams/{team1.id}/profile", auth_context
            )
        )["data"]
        assert team_profile["team"]["id"] == team1.id
        assert [p["player_id"] for p in team_profile["players"]] == [p1.id]
        assert (team_profile["goals_for"], team_profile["goals_against"]) == (3, 1)
        assert [(m["number"], m["played"]) for m in team_profile["matches"]] == [
            (1, True),
            (2, False),
        ]
        # En el partido 2 team1 era el visitante: los goles se ven desde su lado.
        assert team_profile["matches"][1]["opponent_name"] == team2.name

        # --- 404 para ids que no existen ---
        assert (
            await send_tournament_request(HTTPMethod.GET, "players/999999/profile", auth_context)
        )["detail"] == "Player not found"
        assert (
            await send_tournament_request(HTTPMethod.GET, "teams/999999/profile", auth_context)
        )["detail"] == "Team not found"


@pytest.mark.asyncio(loop_scope="session")
async def test_uploaded_logo_is_restored_when_missing_on_disk(
    startup_and_shutdown_uvicorn_server: None,
) -> None:
    path = "static/tournament-logos/test-restore.png"
    content = b"\x89PNG fake"
    await save_uploaded_file(path, content)
    try:
        assert Path(path).read_bytes() == content

        # Simula el reinicio del hosting: el archivo desaparece del disco.
        Path(path).unlink()
        assert not Path(path).exists()

        assert await restore_uploaded_file("tournament-logos/test-restore.png") is True
        assert Path(path).read_bytes() == content

        assert await restore_uploaded_file("tournament-logos/no-existe.png") is False
        assert await restore_uploaded_file("../etc/passwd") is False
    finally:
        await remove_uploaded_file(path)

    assert not Path(path).exists()
    row = await database.fetch_one(
        "SELECT 1 FROM uploaded_files WHERE path = 'tournament-logos/test-restore.png'"
    )
    assert row is None
