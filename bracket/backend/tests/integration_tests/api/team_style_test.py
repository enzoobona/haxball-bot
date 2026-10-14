import pytest

from bracket.database import database
from bracket.models.db.team import Team
from bracket.schema import teams
from bracket.utils.db import fetch_one_parsed_certain
from bracket.utils.dummy_records import DUMMY_TEAM1
from bracket.utils.http import HTTPMethod
from tests.integration_tests.api.shared import send_tournament_request
from tests.integration_tests.models import AuthContext
from tests.integration_tests.sql import assert_row_count_and_clear, inserted_team

STYLE = {
    "shirt_color_1": "#ff1212",
    "shirt_color_2": "#FFFFFF",
    "shirt_color_3": "#0800ff",
    "shirt_text_color": "#000000",
    "shirt_angle": 90,
    "emoji": "🦅",
}


@pytest.mark.asyncio(loop_scope="session")
async def test_create_team_with_style(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    body = {"name": "Los Pibes", "active": True, "player_ids": [], **STYLE}

    response = await send_tournament_request(HTTPMethod.POST, "teams", auth_context, None, body)

    team = response["data"]
    assert team["shirt_color_1"] == "#FF1212"  # se normaliza a mayúsculas
    assert team["shirt_color_3"] == "#0800FF"
    assert team["shirt_text_color"] == "#000000"
    assert team["shirt_angle"] == 90
    assert team["emoji"] == "🦅"

    # el listado (lo que lee el bot) trae los mismos datos
    listing = await send_tournament_request(HTTPMethod.GET, "teams", auth_context)
    assert listing["data"]["teams"][0]["emoji"] == "🦅"
    assert listing["data"]["teams"][0]["shirt_color_2"] == "#FFFFFF"

    await assert_row_count_and_clear(teams, 1)


@pytest.mark.asyncio(loop_scope="session")
async def test_create_team_without_style_uses_defaults(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    body = {"name": "Sin estilo", "active": True, "player_ids": []}

    response = await send_tournament_request(HTTPMethod.POST, "teams", auth_context, None, body)

    team = response["data"]
    assert team["shirt_color_1"] is None
    assert team["shirt_text_color"] is None
    assert team["emoji"] is None
    assert team["shirt_angle"] == 180

    await assert_row_count_and_clear(teams, 1)


@pytest.mark.asyncio(loop_scope="session")
async def test_update_team_style_and_clear_fields(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    async with inserted_team(
        DUMMY_TEAM1.model_copy(update={"tournament_id": auth_context.tournament.id})
    ) as team_inserted:
        path = f"teams/{team_inserted.id}"
        base = {"name": "Equipo", "active": True, "player_ids": []}

        await send_tournament_request(HTTPMethod.PUT, path, auth_context, None, base | STYLE)
        saved = await fetch_one_parsed_certain(
            database, Team, query=teams.select().where(teams.c.id == team_inserted.id)
        )
        assert (saved.shirt_color_1, saved.shirt_angle, saved.emoji) == ("#FF1212", 90, "🦅")

        # Un cliente que NO conoce estos campos no debe pisarlos
        await send_tournament_request(
            HTTPMethod.PUT, path, auth_context, None, base | {"name": "Renombrado"}
        )
        saved = await fetch_one_parsed_certain(
            database, Team, query=teams.select().where(teams.c.id == team_inserted.id)
        )
        assert saved.name == "Renombrado"
        assert (saved.shirt_color_1, saved.shirt_angle, saved.emoji) == ("#FF1212", 90, "🦅")

        # Mandar null / vacío sí los borra
        cleared = {"shirt_color_2": None, "shirt_color_3": None, "shirt_text_color": None}
        await send_tournament_request(
            HTTPMethod.PUT, path, auth_context, None, base | cleared | {"emoji": ""}
        )
        saved = await fetch_one_parsed_certain(
            database, Team, query=teams.select().where(teams.c.id == team_inserted.id)
        )
        assert saved.emoji is None
        assert saved.shirt_color_2 is None
        assert saved.shirt_color_3 is None
        assert saved.shirt_text_color is None
        assert saved.shirt_color_1 == "#FF1212"  # este no se tocó

        await assert_row_count_and_clear(teams, 1)


@pytest.mark.asyncio(loop_scope="session")
@pytest.mark.parametrize(
    "invalid",
    [
        {"shirt_color_1": "rojo"},
        {"shirt_color_1": "#FFF"},
        {"shirt_text_color": "#GGGGGG"},
        {"shirt_angle": 400},
        {"shirt_angle": -1},
        {"emoji": "x" * 40},
    ],
)
async def test_team_style_validation(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext, invalid: dict
) -> None:
    body = {"name": "Invalido", "active": True, "player_ids": []} | invalid

    response = await send_tournament_request(HTTPMethod.POST, "teams", auth_context, None, body)

    assert "detail" in response  # 422: no se crea el equipo
    await assert_row_count_and_clear(teams, 0)
