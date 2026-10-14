from __future__ import annotations

import json
from decimal import Decimal
from typing import Annotated

from heliclockter import datetime_utc
from pydantic import BaseModel, Field, StringConstraints, field_validator

from bracket.logic.ranking.statistics import START_ELO
from bracket.models.db.player import Player
from bracket.models.db.shared import BaseModelORM
from bracket.utils.id_types import PlayerId, TeamId, TournamentId


HexColor = Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")]


class TeamStyle(BaseModelORM):
    """Camiseta y emoji del equipo (los usa el bot de Haxball al armar la sala).

    - `shirt_color_1..3`: hasta 3 colores en hexadecimal (#RRGGBB), de las franjas de la camiseta.
      Sin ninguno cargado, el bot elige un color.
    - `shirt_text_color`: color del número de la camiseta. Vacío = el bot elige uno legible.
    - `shirt_angle`: ángulo de las franjas, igual que en Haxball (0 = verticales, 90 = horizontales).
    - `emoji`: opcional; reemplaza a la bandera en los mensajes de la sala.
    """

    shirt_color_1: HexColor | None = None
    shirt_color_2: HexColor | None = None
    shirt_color_3: HexColor | None = None
    shirt_text_color: HexColor | None = None
    shirt_angle: int = Field(default=180, ge=0, le=360)
    emoji: Annotated[str, StringConstraints(max_length=16)] | None = None

    @field_validator(
        "shirt_color_1", "shirt_color_2", "shirt_color_3", "shirt_text_color", mode="after"
    )
    @classmethod
    def uppercase_color(cls, color: str | None) -> str | None:
        return color.upper() if color is not None else None

    @field_validator("emoji", mode="before")
    @classmethod
    def empty_emoji_is_none(cls, emoji: object) -> object:
        if isinstance(emoji, str) and emoji.strip() == "":
            return None

        return emoji.strip() if isinstance(emoji, str) else emoji


class TeamInsertable(TeamStyle):
    created: datetime_utc
    name: str
    tournament_id: TournamentId
    active: bool
    elo_score: Decimal = START_ELO
    swiss_score: Decimal = Decimal("0.0")
    wins: int = 0
    draws: int = 0
    losses: int = 0
    logo_path: str | None = None


class Team(TeamInsertable):
    id: TeamId


class TeamWithPlayers(BaseModel):
    id: TeamId
    players: list[Player]
    elo_score: Decimal = START_ELO
    swiss_score: Decimal = Decimal("0.0")
    wins: int = 0
    draws: int = 0
    losses: int = 0
    name: str
    logo_path: str | None = None

    @property
    def player_ids(self) -> list[PlayerId]:
        return [player.id for player in self.players]

    @field_validator("players", mode="before")
    @staticmethod
    def handle_players(values: list[Player]) -> list[Player]:
        if isinstance(values, str):
            values_json = json.loads(values)
            if values_json == [None]:
                return []
            return values_json

        return values


class FullTeamWithPlayers(TeamWithPlayers, Team):
    pass


class TeamBody(TeamStyle):
    name: Annotated[str, StringConstraints(min_length=1, max_length=30)]
    active: bool
    player_ids: set[PlayerId]


class TeamMultiBody(BaseModelORM):
    names: str = Field(..., min_length=1)
    active: bool
