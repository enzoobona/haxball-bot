from heliclockter import datetime_utc
from pydantic import BaseModel

from bracket.models.db.team import Team
from bracket.utils.id_types import MatchId, PlayerId, TeamId


class PlayerStatsRow(BaseModel):
    """Estadísticas acumuladas de un jugador en el torneo (vista pública)."""

    player_id: PlayerId
    name: str
    team_id: TeamId | None = None
    team_name: str | None = None
    matches_played: int = 0
    goals: int = 0
    assists: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0


class PlayerMatchEntry(BaseModel):
    """Una actuación de un jugador en un partido ya jugado."""

    match_id: MatchId
    number: int
    start_time: datetime_utc | None = None
    team_id: TeamId
    team_name: str
    opponent_id: TeamId | None = None
    opponent_name: str | None = None
    goals_for: int
    goals_against: int
    goals: int
    assists: int


class PlayerProfile(BaseModel):
    player: PlayerStatsRow
    matches: list[PlayerMatchEntry]


class TeamMatchEntry(BaseModel):
    match_id: MatchId
    number: int
    played: bool
    start_time: datetime_utc | None = None
    court_name: str | None = None
    opponent_id: TeamId | None = None
    opponent_name: str | None = None
    goals_for: int
    goals_against: int


class TeamProfile(BaseModel):
    team: Team
    players: list[PlayerStatsRow]
    goals_for: int
    goals_against: int
    matches: list[TeamMatchEntry]
