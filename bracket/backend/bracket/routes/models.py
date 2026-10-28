from pydantic import BaseModel

from bracket.logic.scheduling.handle_stage_activation import StageItemInputUpdate
from bracket.models.db.club import Club
from bracket.models.db.court import Court
from bracket.models.db.match import Match, MatchHaxball, MatchPlayerStatsDetail, SuggestedMatch
from bracket.models.db.player import Player, PlayerWithProfile
from bracket.models.db.profile import (
    HaxballIdentityForBot,
    HaxballLinkResult,
    LinkCode,
    MyHaxball,
    PlayerProfilePublic,
)
from bracket.models.db.ranking import Ranking
from bracket.models.db.stats import PlayerProfile, PlayerStatsRow, TeamProfile
from bracket.models.db.stage_item_inputs import (
    StageItemInputOptionFinal,
    StageItemInputOptionTentative,
)
from bracket.models.db.team import FullTeamWithPlayers, Team
from bracket.models.db.tournament import Tournament
from bracket.models.db.user import UserPublic
from bracket.models.db.util import StageWithStageItems
from bracket.routes.auth import Token
from bracket.utils.id_types import StageId, StageItemId


class SuccessResponse(BaseModel):
    success: bool = True


class DataResponse[DataT](BaseModel):
    data: DataT


class ClubsResponse(DataResponse[list[Club]]):
    pass


class ClubResponse(DataResponse[Club | None]):
    pass


class TournamentResponse(DataResponse[Tournament]):
    pass


class TournamentsResponse(DataResponse[list[Tournament]]):
    pass


class PaginatedPlayers(BaseModel):
    count: int
    players: list[PlayerWithProfile]


class PlayersResponse(DataResponse[PaginatedPlayers]):
    pass


class SinglePlayerResponse(DataResponse[Player]):
    pass


class StagesWithStageItemsResponse(DataResponse[list[StageWithStageItems]]):
    pass


class UpcomingMatchesResponse(DataResponse[list[SuggestedMatch]]):
    pass

class MatchHaxballResponse(DataResponse[MatchHaxball]):
    pass


class MatchPlayerStatsResponse(DataResponse[list[MatchPlayerStatsDetail]]):
    pass

class SingleMatchResponse(DataResponse[Match]):
    pass


class PaginatedTeams(BaseModel):
    count: int
    teams: list[FullTeamWithPlayers]


class TeamsWithPlayersResponse(DataResponse[PaginatedTeams]):
    pass


class SingleTeamResponse(DataResponse[Team]):
    pass


class UserPublicResponse(DataResponse[UserPublic]):
    pass


class TokenResponse(DataResponse[Token]):
    pass


class CourtsResponse(DataResponse[list[Court]]):
    pass


class SingleCourtResponse(DataResponse[Court]):
    pass


class RankingsResponse(DataResponse[list[Ranking]]):
    pass


class StageItemInputOptionsResponse(
    DataResponse[dict[StageId, list[StageItemInputOptionTentative | StageItemInputOptionFinal]]]
):
    pass


class StageRankingResponse(DataResponse[dict[StageItemId, list[StageItemInputUpdate]]]):
    pass


class PlayersStatsResponse(DataResponse[list[PlayerStatsRow]]):
    pass


class PlayerProfileResponse(DataResponse[PlayerProfile]):
    pass


class TeamProfileResponse(DataResponse[TeamProfile]):
    pass


class MyHaxballResponse(DataResponse[MyHaxball]):
    pass


class LinkCodeResponse(DataResponse[LinkCode]):
    pass


class HaxballIdentitiesResponse(DataResponse[list[HaxballIdentityForBot]]):
    pass


class HaxballLinkResponse(DataResponse[HaxballLinkResult]):
    pass


class PlayerProfilesResponse(DataResponse[list[PlayerProfilePublic]]):
    pass
