from decimal import Decimal

from heliclockter import datetime_utc
from pydantic import Field

from bracket.models.db.shared import BaseModelORM
from bracket.utils.id_types import PlayerId, PlayerProfileId, TournamentId


class PlayerInsertable(BaseModelORM):
    active: bool
    name: str
    created: datetime_utc
    tournament_id: TournamentId
    goals: int = 0
    assists: int = 0
    elo_score: Decimal = Decimal("0.0")
    swiss_score: Decimal = Decimal("0.0")
    wins: int = 0
    draws: int = 0
    losses: int = 0
    # Perfil (jugador con cuenta) vinculado a esta fila. None = jugador sin cuenta.
    profile_id: PlayerProfileId | None = None


class Player(PlayerInsertable):
    id: PlayerId

    def __hash__(self) -> int:
        return self.id


class PlayerWithProfile(Player):
    """Fila de jugador de un torneo, con el nombre de la cuenta a la que esta vinculada (si hay)."""

    profile_name: str | None = None


class PlayerBody(BaseModelORM):
    name: str = Field(..., min_length=1, max_length=30)
    active: bool


class PlayerMultiBody(BaseModelORM):
    names: str = Field(..., min_length=1)
    active: bool

class PlayerStatsBody(BaseModelORM):
    goals: int = Field(default=0, ge=0)
    assists: int = Field(default=0, ge=0)


class PlayerProfileLinkBody(BaseModelORM):
    # None desvincula la fila de su perfil.
    profile_id: PlayerProfileId | None = None


class PlayerToInsert(PlayerBody):
    created: datetime_utc
    tournament_id: TournamentId
    goals: int = 0
    assists: int = 0
    elo_score: Decimal = Decimal("1200.0")
    swiss_score: Decimal
    wins: int = 0
    draws: int = 0
    losses: int = 0
    profile_id: PlayerProfileId | None = None
