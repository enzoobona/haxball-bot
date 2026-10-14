from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from bracket.database import database
from bracket.config import config
from bracket.logic.planning.conflicts import handle_conflicts
from bracket.logic.planning.matches import (
    get_scheduled_matches,
    handle_match_reschedule,
    reorder_matches_for_court,
    schedule_all_unscheduled_matches,
)
from bracket.logic.ranking.calculation import (
    recalculate_ranking_for_stage_item,
)
from bracket.logic.ranking.elimination import update_inputs_in_subsequent_elimination_rounds
from bracket.logic.scheduling.upcoming_matches import (
    get_draft_round_in_stage_item,
    get_upcoming_matches_for_swiss,
)
from bracket.models.db.match import (
    Match,
    MatchBody,
    MatchCreateBody,
    MatchCreateBodyFrontend,
    MatchFilter,
    MatchRescheduleBody,
    MatchFinishBody
)
from bracket.models.db.stage_item import StageType
from bracket.models.db.tournament import Tournament
from bracket.models.db.user import UserPublic
from bracket.routes.auth import (
    user_authenticated_for_tournament,
    user_authenticated_or_public_dashboard,
)
from bracket.routes.models import (
    MatchHaxballResponse,
    MatchPlayerStatsResponse,
    SingleMatchResponse,
    SuccessResponse,
    UpcomingMatchesResponse,
)
from bracket.routes.util import disallow_archived_tournament, match_dependency
from bracket.sql.courts import get_all_courts_in_tournament
from bracket.sql.matches import (
    sql_create_match,
    sql_delete_match,
    sql_count_players_in_tournament,
    sql_finish_match,
    sql_get_match_for_update,
    sql_get_match_haxball,
    sql_get_match_player_stats_detail,
    sql_reset_match,
    sql_update_match,
)
from bracket.sql.rounds import get_round_by_id
from bracket.sql.stage_items import get_stage_item
from bracket.sql.stage_item_inputs import get_stage_item_input_by_id
from bracket.sql.stages import get_full_tournament_details
from bracket.sql.tournaments import sql_get_tournament
from bracket.sql.validation import check_foreign_keys_belong_to_tournament
from bracket.utils.id_types import MatchId, StageItemId, TournamentId
from bracket.utils.types import assert_some

router = APIRouter(prefix=config.api_prefix)


@router.get(
    "/tournaments/{tournament_id}/stage_items/{stage_item_id}/upcoming_matches",
    response_model=UpcomingMatchesResponse,
)
async def get_matches_to_schedule(
    tournament_id: TournamentId,
    stage_item_id: StageItemId,
    elo_diff_threshold: int = 200,
    iterations: int = 2_000,
    only_recommended: bool = False,
    limit: int = 50,
    _: UserPublic = Depends(user_authenticated_for_tournament),
) -> UpcomingMatchesResponse:
    match_filter = MatchFilter(
        elo_diff_threshold=elo_diff_threshold,
        only_recommended=only_recommended,
        limit=limit,
        iterations=iterations,
    )

    draft_round, stage_item = await get_draft_round_in_stage_item(tournament_id, stage_item_id)
    courts = await get_all_courts_in_tournament(tournament_id)
    if len(courts) <= len(draft_round.matches):
        return UpcomingMatchesResponse(data=[])

    return UpcomingMatchesResponse(
        data=get_upcoming_matches_for_swiss(match_filter, stage_item, draft_round)
    )

@router.get(
    "/tournaments/{tournament_id}/matches/{match_id}",
    response_model=MatchHaxballResponse,
)
async def get_match_haxball(
    tournament_id: TournamentId,
    match_id: MatchId,
    _: UserPublic = Depends(user_authenticated_for_tournament),
) -> MatchHaxballResponse:
    match = await sql_get_match_haxball(tournament_id, match_id,)

    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found",)
    
    return MatchHaxballResponse(data=match)

@router.get(
    "/tournaments/{tournament_id}/matches/{match_id}/player_stats",
    response_model=MatchPlayerStatsResponse,
)
async def get_match_player_stats(
    tournament_id: TournamentId,
    match_id: MatchId,
    _: UserPublic | None = Depends(user_authenticated_or_public_dashboard),
) -> MatchPlayerStatsResponse:
    """Goles, asistencias y goles en contra de cada jugador en un partido ya jugado."""
    return MatchPlayerStatsResponse(
        data=await sql_get_match_player_stats_detail(tournament_id, match_id)
    )


@router.delete("/tournaments/{tournament_id}/matches/{match_id}", response_model=SuccessResponse)
async def delete_match(
    tournament_id: TournamentId,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
    match: Match = Depends(match_dependency),
) -> SuccessResponse:
    round_ = await get_round_by_id(tournament_id, match.round_id)
    stage_item = await get_stage_item(tournament_id, round_.stage_item_id)

    if not round_.is_draft or stage_item.type != StageType.SWISS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete matches from draft rounds in Swiss stage items",
        )

    await sql_delete_match(match.id)

    stage_item = await get_stage_item(tournament_id, round_.stage_item_id)

    await recalculate_ranking_for_stage_item(tournament_id, stage_item)
    return SuccessResponse()


@router.post("/tournaments/{tournament_id}/matches", response_model=SingleMatchResponse)
async def create_match(
    tournament_id: TournamentId,
    match_body: MatchCreateBodyFrontend,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
) -> SingleMatchResponse:
    await check_foreign_keys_belong_to_tournament(match_body, tournament_id)

    round_ = await get_round_by_id(tournament_id, match_body.round_id)
    stage_item = await get_stage_item(tournament_id, round_.stage_item_id)

    if not round_.is_draft or stage_item.type != StageType.SWISS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only create matches in draft rounds of Swiss stage items",
        )

    tournament = await sql_get_tournament(tournament_id)
    body_with_durations = MatchCreateBody(
        **match_body.model_dump(),
        duration_minutes=tournament.duration_minutes,
        margin_minutes=tournament.margin_minutes,
    )

    return SingleMatchResponse(data=await sql_create_match(body_with_durations))


@router.post("/tournaments/{tournament_id}/schedule_matches", response_model=SuccessResponse)
async def schedule_matches(
    tournament_id: TournamentId,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
) -> SuccessResponse:
    stages = await get_full_tournament_details(tournament_id)
    await schedule_all_unscheduled_matches(tournament_id, stages)
    return SuccessResponse()


@router.post(
    "/tournaments/{tournament_id}/matches/{match_id}/reschedule", response_model=SuccessResponse
)
async def reschedule_match(
    tournament_id: TournamentId,
    match_id: MatchId,
    body: MatchRescheduleBody,
    tournament: Tournament = Depends(disallow_archived_tournament),
    _: UserPublic = Depends(user_authenticated_for_tournament),
) -> SuccessResponse:
    await check_foreign_keys_belong_to_tournament(body, tournament_id)
    await handle_match_reschedule(tournament, body, match_id)
    await handle_conflicts(await get_full_tournament_details(tournament_id))
    return SuccessResponse()

@router.post(
    "/tournaments/{tournament_id}/matches/{match_id}/finish",
    response_model=SuccessResponse,
)
async def finish_match(
    tournament_id: TournamentId,
    match_id: MatchId,
    body: MatchFinishBody,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
    match: Match = Depends(match_dependency),
) -> SuccessResponse:

    player_ids = [
        stat.player_id
        for stat in body.player_stats
    ]

    if len(player_ids) != len(set(player_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A player cannot appear more than once in player_stats",
        )

    if await sql_count_players_in_tournament(player_ids, tournament_id) != len(player_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more players in player_stats do not belong to this tournament",
        )

    tournament = await sql_get_tournament(tournament_id)

    async with database.transaction():

        locked_match = await sql_get_match_for_update(
            match_id
        )

        if locked_match is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found",
            )

        if locked_match.played:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Match has already been played",
            )

        stage_item_input1 = await get_stage_item_input_by_id(
            tournament_id,
            locked_match.stage_item_input1_id,
        )

        stage_item_input2 = await get_stage_item_input_by_id(
            tournament_id,
            locked_match.stage_item_input2_id,
        )

        if (
            stage_item_input1 is None
            or stage_item_input2 is None
            or stage_item_input1.team_id is None
            or stage_item_input2.team_id is None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Match does not have two assigned teams",
            )

        team_1_id = stage_item_input1.team_id
        team_2_id = stage_item_input2.team_id

        valid_team_ids = {
            team_1_id,
            team_2_id,
        }

        for stat in body.player_stats:
            if stat.team_id not in valid_team_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Player {stat.player_id} "
                        f"has an invalid team"
                    ),
                )

        await sql_finish_match(
            match_id=match_id,
            team_1_id=team_1_id,
            team_2_id=team_2_id,
            team_1_score=body.stage_item_input1_score,
            team_2_score=body.stage_item_input2_score,
            player_stats=body.player_stats,
        )

        round_ = await get_round_by_id(
            tournament_id,
            locked_match.round_id,
        )

        stage_item = await get_stage_item(
            tournament_id,
            round_.stage_item_id,
        )

        await recalculate_ranking_for_stage_item(
            tournament_id,
            stage_item,
        )

        if stage_item.type == StageType.SINGLE_ELIMINATION:
            await update_inputs_in_subsequent_elimination_rounds(
                round_.id,
                stage_item,
                {match_id},
            )

    return SuccessResponse()

@router.post(
    "/tournaments/{tournament_id}/matches/{match_id}/reset",
    response_model=SuccessResponse,
)
async def reset_match(
    tournament_id: TournamentId,
    match_id: MatchId,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
    match: Match = Depends(match_dependency),
) -> SuccessResponse:

    async with database.transaction():

        locked_match = await sql_get_match_for_update(
            match_id
        )

        if locked_match is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found",
            )

        if not locked_match.played:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Match has not been played",
            )

        round_ = await get_round_by_id(
            tournament_id,
            locked_match.round_id,
        )

        stage_item = await get_stage_item(
            tournament_id,
            round_.stage_item_id,
        )

        await sql_reset_match(match_id)

        await recalculate_ranking_for_stage_item(
            tournament_id,
            stage_item,
        )

        if stage_item.type == StageType.SINGLE_ELIMINATION:
            await update_inputs_in_subsequent_elimination_rounds(
                round_.id,
                stage_item,
                {match_id},
            )

    return SuccessResponse()

@router.put("/tournaments/{tournament_id}/matches/{match_id}", response_model=SuccessResponse)
async def update_match_by_id(
    tournament_id: TournamentId,
    match_id: MatchId,
    match_body: MatchBody,
    _: UserPublic = Depends(user_authenticated_for_tournament),
    __: Tournament = Depends(disallow_archived_tournament),
    match: Match = Depends(match_dependency),
) -> SuccessResponse:
    await check_foreign_keys_belong_to_tournament(match_body, tournament_id)
    tournament = await sql_get_tournament(tournament_id)

    await sql_update_match(match_id, match_body, tournament)

    round_ = await get_round_by_id(tournament_id, match.round_id)
    stage_item = await get_stage_item(tournament_id, round_.stage_item_id)
    await recalculate_ranking_for_stage_item(tournament_id, stage_item)

    if (
        match_body.custom_duration_minutes != match.custom_duration_minutes
        or match_body.custom_margin_minutes != match.custom_margin_minutes
    ):
        tournament = await sql_get_tournament(tournament_id)
        scheduled_matches = get_scheduled_matches(await get_full_tournament_details(tournament_id))
        await reorder_matches_for_court(tournament, scheduled_matches, assert_some(match.court_id))

    if stage_item.type == StageType.SINGLE_ELIMINATION:
        await update_inputs_in_subsequent_elimination_rounds(round_.id, stage_item, {match_id})

    return SuccessResponse()
