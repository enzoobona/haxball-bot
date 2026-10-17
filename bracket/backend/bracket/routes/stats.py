from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from bracket.config import config
from bracket.models.db.stats import PlayerProfile, TeamProfile
from bracket.models.db.user import UserPublic
from bracket.routes.auth import user_authenticated_or_public_dashboard
from bracket.routes.models import (
    PlayerProfileResponse,
    PlayersStatsResponse,
    TeamProfileResponse,
)
from bracket.sql.stats import (
    sql_get_player_match_log,
    sql_get_player_stats,
    sql_get_players_stats,
    sql_get_team_match_log,
)
from bracket.sql.teams import get_team_by_id
from bracket.utils.id_types import PlayerId, TeamId, TournamentId

router = APIRouter(prefix=config.api_prefix)


@router.get("/tournaments/{tournament_id}/stats/players", response_model=PlayersStatsResponse)
async def get_players_stats(
    tournament_id: TournamentId,
    _: UserPublic | None = Depends(user_authenticated_or_public_dashboard),
) -> PlayersStatsResponse:
    """Tabla de estadísticas de todos los jugadores del torneo (vista pública)."""
    return PlayersStatsResponse(data=await sql_get_players_stats(tournament_id))


@router.get(
    "/tournaments/{tournament_id}/players/{player_id}/profile",
    response_model=PlayerProfileResponse,
)
async def get_player_profile(
    tournament_id: TournamentId,
    player_id: PlayerId,
    _: UserPublic | None = Depends(user_authenticated_or_public_dashboard),
) -> PlayerProfileResponse:
    """Estadísticas de un jugador y su actuación partido por partido."""
    player = await sql_get_player_stats(tournament_id, player_id)
    if player is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    return PlayerProfileResponse(
        data=PlayerProfile(
            player=player, matches=await sql_get_player_match_log(tournament_id, player_id)
        )
    )


@router.get(
    "/tournaments/{tournament_id}/teams/{team_id}/profile",
    response_model=TeamProfileResponse,
)
async def get_team_profile(
    tournament_id: TournamentId,
    team_id: TeamId,
    _: UserPublic | None = Depends(user_authenticated_or_public_dashboard),
) -> TeamProfileResponse:
    """Estadísticas de un equipo: plantel, goles y partidos."""
    team = await get_team_by_id(team_id, tournament_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    matches = await sql_get_team_match_log(tournament_id, team_id)
    return TeamProfileResponse(
        data=TeamProfile(
            team=team,
            players=await sql_get_players_stats(tournament_id, team_id=team_id),
            goals_for=sum(m.goals_for for m in matches if m.played),
            goals_against=sum(m.goals_against for m in matches if m.played),
            matches=matches,
        )
    )
