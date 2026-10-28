from heliclockter import datetime_utc
from pydantic import BaseModel, Field, field_validator

from bracket.logic.haxball_identity import (
    NICKNAME_MAX_LENGTH,
    NICKNAME_MIN_LENGTH,
    validate_nickname,
)
from bracket.models.db.shared import BaseModelORM
from bracket.utils.id_types import HaxballIdentityId, PlayerProfileId, TournamentId, UserId


class PlayerProfile(BaseModelORM):
    """El jugador con cuenta: tiene id propio y estadisticas acumuladas entre torneos."""

    id: PlayerProfileId
    user_id: UserId
    name: str
    name_key: str
    created: datetime_utc


class PlayerProfilePublic(BaseModel):
    id: PlayerProfileId
    name: str


class PlayerProfileBody(BaseModel):
    name: str = Field(..., min_length=NICKNAME_MIN_LENGTH, max_length=NICKNAME_MAX_LENGTH)

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        return validate_nickname(value)


class HaxballIdentityMasked(BaseModel):
    id: HaxballIdentityId
    auth_hint: str
    created: datetime_utc


class HaxballIdentityForBot(BaseModel):
    auth: str
    profile_id: PlayerProfileId
    name: str


class HaxballLinkBody(BaseModel):
    code: str = Field(..., min_length=1, max_length=32)
    auth: str = Field(..., min_length=1, max_length=256)


class HaxballLinkResult(BaseModel):
    profile_id: PlayerProfileId
    name: str
    already_linked: bool = False


class LinkCode(BaseModel):
    code: str
    expires_at: datetime_utc


class ProfileStats(BaseModel):
    tournaments: int = 0
    matches_played: int = 0
    goals: int = 0
    assists: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0


class ProfileTournamentStats(BaseModel):
    tournament_id: TournamentId
    tournament_name: str
    goals: int = 0
    assists: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0


class MyHaxball(BaseModel):
    """Todo lo que la pagina "Mi jugador" necesita en una sola respuesta."""

    profile: PlayerProfilePublic | None = None
    identities: list[HaxballIdentityMasked] = []
    max_identities: int
    stats: ProfileStats = ProfileStats()
    tournaments: list[ProfileTournamentStats] = []
