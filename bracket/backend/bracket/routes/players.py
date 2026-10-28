from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from bracket.config import config
from bracket.database import database
from bracket.logic.subscriptions import check_requirement
from bracket.models.db.player import (
    Player,
    PlayerBody,
    PlayerMultiBody,
    PlayerProfileLinkBody,
    PlayerStatsBody,
)
from bracket.models.db.tournament import Tournament
from bracket.models.db.user import UserPublic
from bracket.routes.auth import user_authenticated_for_tournament
from bracket.routes.models import (
    PaginatedPlayers,
    PlayersResponse,
    SinglePlayerResponse,
    SuccessResponse,
)
from bracket.routes.util import disallow_archived_tournament
from bracket.schema import players
from bracket.sql.players import (
    get_all_players_in_tournament,
    get_player_by_id,
    get_player_count,
    insert_player,
    sql_delete_player,
    sql_set_player_profile,
)
from bracket.sql.profiles import sql_get_profile_by_id, sql_profile_has_player_in_tournament
from bracket.utils.db import fetch_one_parsed
from bracket.utils.errors import UniqueIndex, check_unique_constraint_violation
from bracket.utils.id_types import PlayerId, TournamentId
from bracket.utils.pagination import PaginationPlayers
from bracket.utils.types import assert_some

router = APIRouter(prefix=config.api_prefix)


@router.get("/tournaments/{tournament_id}/players", response_model=PlayersResponse)
async def get_players(
    tournament_id: TournamentId,
    not_in_team: bool = False,
    pagination: PaginationPlayers = Depends(),
    _: UserPublic = Depends(user_authenticated_for_tournament),
) -> PlayersResponse:
    return PlayersResponse(
        data=PaginatedPlayers(
            players=await get_all_players_in_tournament(
                tournament_id, not_in_team=not_in_team, pagination=pagination
            ),
            count=await get_player_count(tournament_id, not_in_team=not_in_team),
        )
    )


@router.put("/tournaments/{tournament_id}/players/{player_id}", response_model=SinglePlayerResponse)
async def update_player_by_id(
    tournament_id: TournamentId,
    player_id: PlayerId,
    player_body: PlayerBody,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
) -> SinglePlayerResponse:
    await database.execute(
        query=players.update().where(
            (players.c.id == player_id) & (players.c.tournament_id == tournament_id)
        ),
        values=player_body.model_dump(),
    )
    return SinglePlayerResponse(
        data=assert_some(
            await fetch_one_parsed(
                database,
                Player,
                players.select().where(
                    (players.c.id == player_id) & (players.c.tournament_id == tournament_id)
                ),
            )
        )
    )

@router.put(
    "/tournaments/{tournament_id}/players/{player_id}/profile",
    response_model=SinglePlayerResponse,
)
async def link_player_to_profile(
    tournament_id: TournamentId,
    player_id: PlayerId,
    body: PlayerProfileLinkBody,
    _: UserPublic = Depends(user_authenticated_for_tournament),
) -> SinglePlayerResponse:
    """Vincula (o desvincula, con `profile_id: null`) una fila del torneo con un jugador con cuenta.

    Funciona tambien en torneos archivados: es la forma de reclamar estadisticas viejas.
    """
    player = await get_player_by_id(player_id, tournament_id)
    if player is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontró el jugador")

    if body.profile_id is not None:
        if await sql_get_profile_by_id(body.profile_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontró ese jugador con cuenta")

        if player.profile_id != body.profile_id and await sql_profile_has_player_in_tournament(
            body.profile_id, tournament_id
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Ese jugador con cuenta ya está vinculado a otro jugador de este torneo",
            )

    with check_unique_constraint_violation({UniqueIndex.ix_players_tournament_profile}):
        await sql_set_player_profile(tournament_id, player_id, body.profile_id)

    return SinglePlayerResponse(data=assert_some(await get_player_by_id(player_id, tournament_id)))


@router.post(
    "/tournaments/{tournament_id}/players/{player_id}/stats/increment",
    response_model=SinglePlayerResponse,
)
async def increment_player_stats(
    tournament_id: TournamentId,
    player_id: PlayerId,
    stats: PlayerStatsBody,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
) -> SinglePlayerResponse:

    await database.execute(
        query=players.update()
        .where(
            (players.c.id == player_id)
            & (players.c.tournament_id == tournament_id)
        )
        .values(
            goals=players.c.goals + stats.goals,
            assists=players.c.assists + stats.assists,
        )
    )

    return SinglePlayerResponse(
        data=assert_some(
            await fetch_one_parsed(
                database,
                Player,
                players.select().where(
                    (players.c.id == player_id)
                    & (players.c.tournament_id == tournament_id)
                ),
            )
        )
    )

@router.delete("/tournaments/{tournament_id}/players/{player_id}", response_model=SuccessResponse)
async def delete_player(
    tournament_id: TournamentId,
    player_id: PlayerId,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
) -> SuccessResponse:
    await sql_delete_player(tournament_id, player_id)
    return SuccessResponse()


@router.post("/tournaments/{tournament_id}/players", response_model=SuccessResponse)
async def create_single_player(
    player_body: PlayerBody,
    tournament_id: TournamentId,
    user: UserPublic = Depends(user_authenticated_for_tournament),
    _: Tournament = Depends(disallow_archived_tournament),
) -> SuccessResponse:
    existing_players = await get_all_players_in_tournament(tournament_id)
    check_requirement(existing_players, user, "max_players")
    await insert_player(player_body, tournament_id)
    return SuccessResponse()


@router.post("/tournaments/{tournament_id}/players_multi", response_model=SuccessResponse)
async def create_multiple_players(
    player_body: PlayerMultiBody,
    tournament_id: TournamentId,
    user: UserPublic = Depends(user_authenticated_for_tournament),
    _: Tournament = Depends(disallow_archived_tournament),
) -> SuccessResponse:
    player_names = [player.strip() for player in player_body.names.split("\n") if len(player) > 0]
    existing_players = await get_all_players_in_tournament(tournament_id)
    check_requirement(existing_players, user, "max_players", additions=len(player_names))

    for player_name in player_names:
        await insert_player(PlayerBody(name=player_name, active=player_body.active), tournament_id)

    return SuccessResponse()
