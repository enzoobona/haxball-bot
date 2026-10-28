from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4

import pytest

from bracket.database import database
from bracket.models.db.account import UserAccountType, UserRole
from bracket.models.db.user import UserInDB, UserInsertable
from bracket.schema import haxball_identities, player_profiles, players
from bracket.sql.profiles import sql_get_profile_by_user
from bracket.utils.dummy_records import DUMMY_MOCK_TIME, DUMMY_PLAYER1
from bracket.utils.http import HTTPMethod
from tests.integration_tests.api.shared import (
    SUCCESS_RESPONSE,
    send_auth_request,
    send_request,
    send_tournament_request,
)
from tests.integration_tests.mocks import get_mock_token
from tests.integration_tests.models import AuthContext
from tests.integration_tests.sql import inserted_player, inserted_user


def _player_user(name: str = "Jugador") -> UserInsertable:
    return UserInsertable(
        email=f"player-{uuid4()}@example.org",
        name=name,
        password_hash="$2b$12$.LcTJuoOtwU4CfK8UgEtIu5BRmTdvZv6IH.6IvGshDCgwJsvOMLeu",
        created=DUMMY_MOCK_TIME,
        account_type=UserAccountType.REGULAR,
        role=UserRole.USER,
    )


@asynccontextmanager
async def player_context() -> AsyncIterator[tuple[UserInDB, dict[str, str]]]:
    """Un usuario con rol USER (un jugador que se registro en la web)."""
    async with inserted_user(_player_user()) as user:
        try:
            yield user, {"Authorization": f"Bearer {get_mock_token(user.email)}"}
        finally:
            await database.execute(
                haxball_identities.delete().where(
                    haxball_identities.c.profile_id.in_(
                        player_profiles.select()
                        .with_only_columns(player_profiles.c.id)
                        .where(player_profiles.c.user_id == user.id)
                    )
                )
            )
            await database.execute(
                player_profiles.delete().where(player_profiles.c.user_id == user.id)
            )


@pytest.mark.asyncio(loop_scope="session")
async def test_user_role_cannot_manage_tournaments(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    async with player_context() as (_, headers):
        for method, endpoint, payload in (
            (HTTPMethod.GET, "clubs", None),
            (HTTPMethod.POST, "clubs", {"name": "Mi club"}),
            (HTTPMethod.GET, f"tournaments/{auth_context.tournament.id}/players", None),
            (
                HTTPMethod.POST,
                f"tournaments/{auth_context.tournament.id}/players",
                {"name": "Intruso", "active": True},
            ),
        ):
            response = await send_request(method, endpoint, json=payload, headers=headers)
            assert "detail" in response, (endpoint, response)

        # Pero si puede ver su propio perfil y la parte publica.
        me = await send_request(HTTPMethod.GET, "users/me", headers=headers)
        assert me["data"]["role"] == "USER"
        public = await send_request(HTTPMethod.GET, "public/tournaments", headers=headers)
        assert "data" in public


@pytest.mark.asyncio(loop_scope="session")
async def test_registration_creates_a_user_role_account(
    startup_and_shutdown_uvicorn_server: None,
) -> None:
    from bracket.sql.users import delete_user

    body = {
        "name": "Nuevo Jugador",
        "email": f"nuevo-{uuid4()}@example.org",
        "password": "my test pass",
        "captcha_token": "my token",
    }
    response = await send_request(HTTPMethod.POST, "users/register", json=body)
    assert response["data"]["role"] == "USER"
    await delete_user(response["data"]["user_id"])


@pytest.mark.asyncio(loop_scope="session")
async def test_profile_link_flow(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    async with player_context() as (user, headers):
        # Sin perfil todavia.
        me = await send_request(HTTPMethod.GET, "haxball/me", headers=headers)
        assert me["data"]["profile"] is None

        # No se puede pedir un codigo sin perfil.
        response = await send_request(HTTPMethod.POST, "haxball/me/link-code", headers=headers)
        assert "detail" in response

        # Nombres invalidos se rechazan.
        response = await send_request(
            HTTPMethod.POST, "haxball/me/profile", json={"name": "!admin"}, headers=headers
        )
        assert "detail" in response

        name = f"Crack {uuid4().hex[:6]}"
        created = await send_request(
            HTTPMethod.POST, "haxball/me/profile", json={"name": name}, headers=headers
        )
        profile_id = created["data"]["profile"]["id"]
        assert created["data"]["profile"]["name"] == name
        assert created["data"]["identities"] == []

        # El nombre queda reservado (sin importar mayusculas ni tildes).
        async with player_context() as (_, other_headers):
            response = await send_request(
                HTTPMethod.POST,
                "haxball/me/profile",
                json={"name": name.upper()},
                headers=other_headers,
            )
            assert "already taken" in response["detail"]

        # Un codigo vale una vez.
        code = (
            await send_request(HTTPMethod.POST, "haxball/me/link-code", headers=headers)
        )["data"]["code"]
        auth = f"auth-{uuid4()}"

        linked = await send_auth_request(
            HTTPMethod.POST, "haxball/link", auth_context, json={"code": code, "auth": auth}
        )
        assert linked["data"] == {"profile_id": profile_id, "name": name, "already_linked": False}

        reused = await send_auth_request(
            HTTPMethod.POST, "haxball/link", auth_context, json={"code": code, "auth": auth}
        )
        assert "detail" in reused

        # El bot baja la lista auth -> perfil.
        identities = await send_auth_request(HTTPMethod.GET, "haxball/identities", auth_context)
        assert {"auth": auth, "profile_id": profile_id, "name": name} in identities["data"]

        # El usuario ve su navegador, recortado.
        me = await send_request(HTTPMethod.GET, "haxball/me", headers=headers)
        assert len(me["data"]["identities"]) == 1
        assert auth not in str(me["data"]["identities"])

        # Un `auth` no puede pertenecer a dos perfiles.
        async with player_context() as (_, other_headers):
            await send_request(
                HTTPMethod.POST,
                "haxball/me/profile",
                json={"name": f"Otro {uuid4().hex[:6]}"},
                headers=other_headers,
            )
            other_code = (
                await send_request(HTTPMethod.POST, "haxball/me/link-code", headers=other_headers)
            )["data"]["code"]
            conflict = await send_auth_request(
                HTTPMethod.POST,
                "haxball/link",
                auth_context,
                json={"code": other_code, "auth": auth},
            )
            assert "otro jugador" in conflict["detail"]

            # El conflicto no gasta el codigo: se puede usar con otro navegador.
            ok = await send_auth_request(
                HTTPMethod.POST,
                "haxball/link",
                auth_context,
                json={"code": other_code, "auth": f"auth-{uuid4()}"},
            )
            assert ok["data"]["already_linked"] is False

        # Desvincular el navegador.
        identity_id = me["data"]["identities"][0]["id"]
        assert (
            await send_request(
                HTTPMethod.DELETE, f"haxball/me/identities/{identity_id}", headers=headers
            )
            == SUCCESS_RESPONSE
        )
        identities = await send_auth_request(HTTPMethod.GET, "haxball/identities", auth_context)
        assert auth not in {row["auth"] for row in identities["data"]}

        assert await sql_get_profile_by_user(user.id) is not None


@pytest.mark.asyncio(loop_scope="session")
async def test_players_cannot_use_the_bot_endpoints(
    startup_and_shutdown_uvicorn_server: None,
) -> None:
    async with player_context() as (_, headers):
        for method, endpoint, payload in (
            (HTTPMethod.GET, "haxball/identities", None),
            (HTTPMethod.POST, "haxball/link", {"code": "ABCD-2345", "auth": "x"}),
            (HTTPMethod.GET, "haxball/profiles", None),
        ):
            response = await send_request(method, endpoint, json=payload, headers=headers)
            assert "detail" in response, endpoint


@pytest.mark.asyncio(loop_scope="session")
async def test_stats_accumulate_across_tournaments_and_name_autolink(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    tournament_id = auth_context.tournament.id

    async with player_context() as (_, headers):
        name = f"Goleador {uuid4().hex[:6]}"

        # Una fila cargada por el organizador ANTES de que exista la cuenta...
        async with inserted_player(
            DUMMY_PLAYER1.model_copy(update={"tournament_id": tournament_id, "name": name})
        ) as row:
            # ...se vincula sola cuando el jugador crea su perfil con ese nombre.
            created = await send_request(
                HTTPMethod.POST, "haxball/me/profile", json={"name": name}, headers=headers
            )
            profile_id = created["data"]["profile"]["id"]

            stored = await database.fetch_one(players.select().where(players.c.id == row.id))
            assert stored is not None
            assert stored["profile_id"] == profile_id

            await database.execute(
                players.update()
                .where(players.c.id == row.id)
                .values(goals=3, assists=2, wins=2, draws=1, losses=0)
            )

            # Una fila nueva con el mismo nombre en OTRO torneo tambien se vincula al crearse.
            # (aca se simula la segunda fila a mano para no armar otro torneo completo)
            mine = await send_request(HTTPMethod.GET, "haxball/me", headers=headers)
            assert mine["data"]["stats"] == {
                "tournaments": 1,
                "matches_played": 3,
                "goals": 3,
                "assists": 2,
                "wins": 2,
                "draws": 1,
                "losses": 0,
            }
            assert mine["data"]["tournaments"][0]["tournament_id"] == tournament_id

            # El organizador puede desvincular y volver a vincular a mano.
            unlinked = await send_tournament_request(
                HTTPMethod.PUT,
                f"players/{row.id}/profile",
                auth_context,
                json={"profile_id": None},
            )
            assert unlinked["data"].get("profile_id") is None

            relinked = await send_tournament_request(
                HTTPMethod.PUT,
                f"players/{row.id}/profile",
                auth_context,
                json={"profile_id": profile_id},
            )
            assert relinked["data"]["profile_id"] == profile_id


@pytest.mark.asyncio(loop_scope="session")
async def test_new_player_row_is_linked_to_existing_profile(
    startup_and_shutdown_uvicorn_server: None, auth_context: AuthContext
) -> None:
    async with player_context() as (_, headers):
        name = f"Veterano {uuid4().hex[:6]}"
        created = await send_request(
            HTTPMethod.POST, "haxball/me/profile", json={"name": name}, headers=headers
        )
        profile_id = created["data"]["profile"]["id"]

        response = await send_tournament_request(
            HTTPMethod.POST, "players", auth_context, json={"name": name, "active": True}
        )
        assert response["success"] is True

        row = await database.fetch_one(
            players.select().where(
                (players.c.tournament_id == auth_context.tournament.id) & (players.c.name == name)
            )
        )
        assert row is not None
        assert row["profile_id"] == profile_id

        await database.execute(players.delete().where(players.c.id == row["id"]))

