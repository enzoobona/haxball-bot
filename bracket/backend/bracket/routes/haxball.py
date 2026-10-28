"""Jugadores con cuenta: perfil, vinculacion de navegadores de Haxball y estadisticas.

Flujo:
1. El usuario crea su perfil (su nombre de jugador) en la web: `POST /haxball/me/profile`.
2. Pide un codigo de un solo uso: `POST /haxball/me/link-code` (vence en pocos minutos).
3. En la sala escribe `!vincular CODIGO`. El bot (que es una cuenta ADMIN) llama a
   `POST /haxball/link` con el codigo y el `auth` del navegador, y queda guardado auth <-> perfil.
4. El bot baja la lista auth -> perfil con `GET /haxball/identities` para reconocer a cada
   jugador que entra, sin pedirle clave.
"""

from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from bracket.config import config
from bracket.database import database
from bracket.logic.haxball_identity import (
    MAX_IDENTITIES_PER_PROFILE,
    format_link_code,
    generate_link_code,
    is_well_formed_link_code,
)
from bracket.models.db.profile import (
    HaxballLinkBody,
    HaxballLinkResult,
    LinkCode,
    MyHaxball,
    PlayerProfileBody,
    PlayerProfilePublic,
)
from bracket.models.db.user import UserPublic
from bracket.routes.auth import admin_authenticated, user_authenticated
from bracket.routes.models import (
    HaxballIdentitiesResponse,
    HaxballLinkResponse,
    LinkCodeResponse,
    MyHaxballResponse,
    PlayerProfilesResponse,
    SuccessResponse,
)
from bracket.sql.profiles import (
    sql_consume_link_code,
    sql_count_identities_of_profile,
    sql_create_link_code,
    sql_create_profile,
    sql_delete_identity,
    sql_get_all_identities_for_bot,
    sql_get_identities_of_profile,
    sql_get_profile_by_user,
    sql_get_profile_id_of_auth,
    sql_get_profile_stats,
    sql_get_profile_tournament_stats,
    sql_insert_identity,
    sql_link_open_players_by_name,
    sql_rename_profile,
    sql_search_profiles,
)
from bracket.utils.errors import UniqueIndex, check_unique_constraint_violation
from bracket.utils.id_types import UserId

router = APIRouter(prefix=config.api_prefix)

INVALID_CODE = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="El código no es válido o ya venció. Generá uno nuevo desde tu perfil en la web.",
)


async def _build_my_haxball(user_id: UserId) -> MyHaxball:
    profile = await sql_get_profile_by_user(user_id)

    if profile is None:
        return MyHaxball(max_identities=MAX_IDENTITIES_PER_PROFILE)

    return MyHaxball(
        profile=PlayerProfilePublic(id=profile.id, name=profile.name),
        identities=await sql_get_identities_of_profile(profile.id),
        max_identities=MAX_IDENTITIES_PER_PROFILE,
        stats=await sql_get_profile_stats(profile.id),
        tournaments=await sql_get_profile_tournament_stats(profile.id),
    )


# ---------------------------------------------------------------------------
# Lo que usa el propio jugador desde la web
# ---------------------------------------------------------------------------


@router.get("/haxball/me", response_model=MyHaxballResponse)
async def get_my_haxball(user: UserPublic = Depends(user_authenticated)) -> MyHaxballResponse:
    """Mi jugador: perfil, navegadores vinculados y estadisticas acumuladas."""
    return MyHaxballResponse(data=await _build_my_haxball(user.id))


@router.post("/haxball/me/profile", response_model=MyHaxballResponse)
async def create_my_profile(
    body: PlayerProfileBody, user: UserPublic = Depends(user_authenticated)
) -> MyHaxballResponse:
    """Crea mi jugador. El nombre queda reservado: nadie mas puede usarlo en las salas."""
    with check_unique_constraint_violation(
        {UniqueIndex.player_profiles_name_key_key, UniqueIndex.player_profiles_user_id_key}
    ):
        profile = await sql_create_profile(user.id, body.name)

    # Si el torneo ya tenia cargado a un jugador con este nombre, queda vinculado.
    await sql_link_open_players_by_name(profile)
    return MyHaxballResponse(data=await _build_my_haxball(user.id))


@router.put("/haxball/me/profile", response_model=MyHaxballResponse)
async def rename_my_profile(
    body: PlayerProfileBody, user: UserPublic = Depends(user_authenticated)
) -> MyHaxballResponse:
    profile = await sql_get_profile_by_user(user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Todavía no creaste tu jugador")

    with check_unique_constraint_violation({UniqueIndex.player_profiles_name_key_key}):
        profile = await sql_rename_profile(profile.id, body.name)

    await sql_link_open_players_by_name(profile)
    return MyHaxballResponse(data=await _build_my_haxball(user.id))


@router.post("/haxball/me/link-code", response_model=LinkCodeResponse)
async def create_link_code(user: UserPublic = Depends(user_authenticated)) -> LinkCodeResponse:
    """Codigo de un solo uso para vincular un navegador. Reemplaza al anterior, si lo habia."""
    profile = await sql_get_profile_by_user(user.id)
    if profile is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Primero creá tu jugador")

    if await sql_count_identities_of_profile(profile.id) >= MAX_IDENTITIES_PER_PROFILE:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Ya tenés {MAX_IDENTITIES_PER_PROFILE} navegadores vinculados. "
            "Desvinculá alguno para agregar otro.",
        )

    code = generate_link_code()
    expires_at = await sql_create_link_code(user.id, code)
    return LinkCodeResponse(data=LinkCode(code=format_link_code(code), expires_at=expires_at))


@router.delete("/haxball/me/identities/{identity_id}", response_model=SuccessResponse)
async def delete_my_identity(
    identity_id: int, user: UserPublic = Depends(user_authenticated)
) -> SuccessResponse:
    profile = await sql_get_profile_by_user(user.id)
    if profile is None or not await sql_delete_identity(profile.id, identity_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontró ese navegador vinculado")

    return SuccessResponse()


# ---------------------------------------------------------------------------
# Lo que usa el bot (cuenta ADMIN)
# ---------------------------------------------------------------------------


@router.get("/haxball/identities", response_model=HaxballIdentitiesResponse)
async def get_identities(_: UserPublic = Depends(admin_authenticated)) -> HaxballIdentitiesResponse:
    """Lista `auth -> perfil` para que el bot reconozca a los jugadores que entran a la sala."""
    return HaxballIdentitiesResponse(data=await sql_get_all_identities_for_bot())


@router.post("/haxball/link", response_model=HaxballLinkResponse)
async def link_haxball_identity(
    body: HaxballLinkBody, _: UserPublic = Depends(admin_authenticated)
) -> HaxballLinkResponse:
    """El bot confirma un `!vincular CODIGO`: guarda auth <-> perfil y gasta el codigo."""
    if not is_well_formed_link_code(body.code):
        raise INVALID_CODE

    # Si algo falla adentro, la transaccion se revierte y el codigo NO se gasta.
    async with database.transaction():
        user_id = await sql_consume_link_code(body.code)
        if user_id is None:
            raise INVALID_CODE

        profile = await sql_get_profile_by_user(user_id)
        if profile is None:
            raise INVALID_CODE

        linked_to = await sql_get_profile_id_of_auth(body.auth)

        if linked_to == profile.id:
            return HaxballLinkResponse(
                data=HaxballLinkResult(profile_id=profile.id, name=profile.name, already_linked=True)
            )

        if linked_to is not None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Este navegador ya está vinculado a otro jugador. "
                "Esa persona tiene que desvincularlo desde su perfil en la web.",
            )

        if await sql_count_identities_of_profile(profile.id) >= MAX_IDENTITIES_PER_PROFILE:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Ese jugador ya tiene {MAX_IDENTITIES_PER_PROFILE} navegadores vinculados.",
            )

        with check_unique_constraint_violation({UniqueIndex.haxball_identities_auth_key}):
            await sql_insert_identity(profile.id, body.auth)

    return HaxballLinkResponse(data=HaxballLinkResult(profile_id=profile.id, name=profile.name))


# ---------------------------------------------------------------------------
# Lo que usa el organizador
# ---------------------------------------------------------------------------


@router.get("/haxball/profiles", response_model=PlayerProfilesResponse)
async def search_profiles(
    search: str | None = None,
    limit: int = 20,
    _: UserPublic = Depends(admin_authenticated),
) -> PlayerProfilesResponse:
    """Para vincular a mano una fila de jugador de un torneo con un perfil."""
    return PlayerProfilesResponse(data=await sql_search_profiles(search, min(max(limit, 1), 100)))
