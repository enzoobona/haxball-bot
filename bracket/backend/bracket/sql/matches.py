from datetime import datetime

from heliclockter import datetime_utc

from bracket.database import database
from bracket.models.db.match import (
    Match,
    MatchBody,
    MatchCreateBody,
    MatchHaxball,
    MatchPlayerStats,
    MatchPlayerStatsDetail,
)
from bracket.models.db.tournament import Tournament
from bracket.utils.id_types import (
    CourtId,
    MatchId,
    PlayerId,
    RoundId,
    StageItemId,
    StageItemInputId,
    TeamId,
    TournamentId,
)

async def sql_get_match_for_update(
    match_id: MatchId,
) -> Match | None:
    query = """
        SELECT *
        FROM matches
        WHERE id = :match_id
        FOR UPDATE
    """

    result = await database.fetch_one(
        query=query,
        values={"match_id": match_id},
    )

    if result is None:
        return None

    return Match.model_validate(dict(result._mapping))

async def sql_delete_match(match_id: MatchId) -> None:
    query = """
        DELETE FROM matches
        WHERE matches.id = :match_id
        """
    await database.execute(query=query, values={"match_id": match_id})


async def sql_delete_matches_for_stage_item_id(stage_item_id: StageItemId) -> None:
    query = """
        DELETE FROM matches
        WHERE matches.id IN (
            SELECT matches.id
            FROM matches
            LEFT JOIN rounds ON matches.round_id = rounds.id
            WHERE rounds.stage_item_id = :stage_item_id
        )
        """
    await database.execute(query=query, values={"stage_item_id": stage_item_id})


async def sql_create_match(match: MatchCreateBody) -> Match:
    query = """
        INSERT INTO matches (
            round_id,
            court_id,
            stage_item_input1_id,
            stage_item_input2_id,
            stage_item_input1_winner_from_match_id,
            stage_item_input2_winner_from_match_id,
            duration_minutes,
            custom_duration_minutes,
            margin_minutes,
            custom_margin_minutes,
            stage_item_input1_score,
            stage_item_input2_score,
            stage_item_input1_conflict,
            stage_item_input2_conflict,
            created
        )
        VALUES (
            :round_id,
            :court_id,
            :stage_item_input1_id,
            :stage_item_input2_id,
            :stage_item_input1_winner_from_match_id,
            :stage_item_input2_winner_from_match_id,
            :duration_minutes,
            :custom_duration_minutes,
            :margin_minutes,
            :custom_margin_minutes,
            0,
            0,
            false,
            false,
            NOW()
        )
        RETURNING *
    """
    result = await database.fetch_one(query=query, values=match.model_dump())

    if result is None:
        raise ValueError("Could not create stage")

    return Match.model_validate(dict(result._mapping))


async def sql_update_match(match_id: MatchId, match: MatchBody, tournament: Tournament) -> None:
    query = """
        UPDATE matches
        SET round_id = :round_id,
            stage_item_input1_score = :stage_item_input1_score,
            stage_item_input2_score = :stage_item_input2_score,
            court_id = :court_id,
            custom_duration_minutes = :custom_duration_minutes,
            custom_margin_minutes = :custom_margin_minutes,
            duration_minutes = :duration_minutes,
            margin_minutes = :margin_minutes
        WHERE matches.id = :match_id
        RETURNING *
        """

    duration_minutes = (
        match.custom_duration_minutes
        if match.custom_duration_minutes is not None
        else tournament.duration_minutes
    )
    margin_minutes = (
        match.custom_margin_minutes
        if match.custom_margin_minutes is not None
        else tournament.margin_minutes
    )
    await database.execute(
        query=query,
        values={
            "match_id": match_id,
            **match.model_dump(),
            "duration_minutes": duration_minutes,
            "margin_minutes": margin_minutes,
        },
    )

def get_player_result_column(
    player_team_id: TeamId,
    team_1_id: TeamId | None,
    team_1_score: int,
    team_2_score: int,
) -> str:
    """Devuelve "wins", "draws" o "losses" según el resultado desde el equipo del jugador."""
    if team_1_score == team_2_score:
        return "draws"

    team_1_won = team_1_score > team_2_score
    player_is_team_1 = player_team_id == team_1_id

    return "wins" if team_1_won == player_is_team_1 else "losses"


async def sql_finish_match(
    match_id: MatchId,
    team_1_id: TeamId,
    team_2_id: TeamId,
    team_1_score: int,
    team_2_score: int,
    player_stats: list[MatchPlayerStats],
) -> None:

    for stat in player_stats:
        if stat.team_id not in {team_1_id, team_2_id}:
            raise ValueError(
                f"Player {stat.player_id} has invalid team "
                f"{stat.team_id}"
            )

        result_column = get_player_result_column(
            stat.team_id, team_1_id, team_1_score, team_2_score
        )

        await database.execute(
            query="""
                INSERT INTO match_player_stats (
                    match_id,
                    player_id,
                    team_id,
                    goals,
                    assists
                )
                VALUES (
                    :match_id,
                    :player_id,
                    :team_id,
                    :goals,
                    :assists
                )
            """,
            values={
                "match_id": match_id,
                "player_id": stat.player_id,
                "team_id": stat.team_id,
                "goals": stat.goals,
                "assists": stat.assists,
            },
        )

        await database.execute(
            query=f"""
                UPDATE players
                SET
                    goals = goals + :goals,
                    assists = assists + :assists,
                    {result_column} = {result_column} + 1
                WHERE id = :player_id
            """,
            values={
                "player_id": stat.player_id,
                "goals": stat.goals,
                "assists": stat.assists,
            },
        )

    await database.execute(
        query="""
            UPDATE matches
            SET
                stage_item_input1_score = :team_1_score,
                stage_item_input2_score = :team_2_score,
                played = TRUE
            WHERE id = :match_id
        """,
        values={
            "match_id": match_id,
            "team_1_score": team_1_score,
            "team_2_score": team_2_score,
        },
    )

async def sql_reset_match(
    match_id: MatchId,
) -> None:

    match = await database.fetch_one(
        query="""
            SELECT
                m.stage_item_input1_score,
                m.stage_item_input2_score,
                input1.team_id AS team_1_id
            FROM matches AS m
            LEFT JOIN stage_item_inputs AS input1
                ON input1.id = m.stage_item_input1_id
            WHERE m.id = :match_id
        """,
        values={"match_id": match_id},
    )

    if match is None:
        raise ValueError("Match not found")

    team_1_score = match["stage_item_input1_score"]
    team_2_score = match["stage_item_input2_score"]
    team_1_id = match["team_1_id"]

    stats = await database.fetch_all(
        query="""
            SELECT
                player_id,
                team_id,
                goals,
                assists
            FROM match_player_stats
            WHERE match_id = :match_id
        """,
        values={"match_id": match_id},
    )

    for stat in stats:
        # Cada jugador suma wins/draws/losses según SU equipo (antes se descontaba
        # la misma columna a todos, dejando contadores negativos o desfasados).
        result_column = get_player_result_column(
            stat["team_id"], team_1_id, team_1_score, team_2_score
        )

        await database.execute(
            query=f"""
                UPDATE players
                SET
                    goals = GREATEST(goals - :goals, 0),
                    assists = GREATEST(assists - :assists, 0),
                    {result_column} = GREATEST({result_column} - 1, 0)
                WHERE id = :player_id
            """,
            values={
                "player_id": stat["player_id"],
                "goals": stat["goals"],
                "assists": stat["assists"],
            },
        )

    await database.execute(
        query="""
            DELETE FROM match_player_stats
            WHERE match_id = :match_id
        """,
        values={"match_id": match_id},
    )

    await database.execute(
        query="""
            UPDATE matches
            SET
                played = FALSE,
                stage_item_input1_score = 0,
                stage_item_input2_score = 0
            WHERE id = :match_id
        """,
        values={"match_id": match_id},
    )

async def sql_set_input_ids_for_match(
    round_id: RoundId, match_id: MatchId, input_ids: list[StageItemInputId | None]
) -> None:
    query = """
        UPDATE matches
        SET stage_item_input1_id = :input1_id,
            stage_item_input2_id = :input2_id
        WHERE round_id = :round_id
        AND matches.id = :match_id
        """
    await database.execute(
        query=query,
        values={
            "round_id": round_id,
            "match_id": match_id,
            "input1_id": input_ids[0],
            "input2_id": input_ids[1],
        },
    )


async def sql_reschedule_match(
    match_id: MatchId,
    court_id: CourtId | None,
    start_time: datetime_utc,
    position_in_schedule: int | None,
    duration_minutes: int,
    margin_minutes: int,
    custom_duration_minutes: int | None,
    custom_margin_minutes: int | None,
    stage_item_input1_conflict: bool,
    stage_item_input2_conflict: bool,
) -> None:
    query = """
        UPDATE matches
        SET court_id = :court_id,
            start_time = :start_time,
            position_in_schedule = :position_in_schedule,
            duration_minutes = :duration_minutes,
            margin_minutes = :margin_minutes,
            custom_duration_minutes = :custom_duration_minutes,
            custom_margin_minutes = :custom_margin_minutes,
            stage_item_input1_conflict = :stage_item_input1_conflict,
            stage_item_input2_conflict = :stage_item_input2_conflict
        WHERE matches.id = :match_id
        """
    await database.execute(
        query=query,
        values={
            "court_id": court_id,
            "match_id": match_id,
            "position_in_schedule": position_in_schedule,
            "start_time": datetime.fromisoformat(start_time.isoformat()),
            "duration_minutes": duration_minutes,
            "margin_minutes": margin_minutes,
            "custom_duration_minutes": custom_duration_minutes,
            "custom_margin_minutes": custom_margin_minutes,
            "stage_item_input1_conflict": stage_item_input1_conflict,
            "stage_item_input2_conflict": stage_item_input2_conflict,
        },
    )


async def sql_reschedule_match_and_determine_duration_and_margin(
    court_id: CourtId | None,
    start_time: datetime_utc,
    position_in_schedule: int | None,
    match: Match,
    tournament: Tournament,
) -> None:
    duration_minutes = (
        tournament.duration_minutes
        if match.custom_duration_minutes is None
        else match.custom_duration_minutes
    )
    margin_minutes = (
        tournament.margin_minutes
        if match.custom_margin_minutes is None
        else match.custom_margin_minutes
    )
    await sql_reschedule_match(
        match.id,
        court_id,
        start_time,
        position_in_schedule,
        duration_minutes,
        margin_minutes,
        match.custom_duration_minutes,
        match.custom_margin_minutes,
        match.stage_item_input1_conflict,
        match.stage_item_input2_conflict,
    )


async def sql_get_match(match_id: MatchId) -> Match:
    query = """
        SELECT *
        FROM matches
        WHERE matches.id = :match_id
        """
    result = await database.fetch_one(query=query, values={"match_id": match_id})

    if result is None:
        raise ValueError("Could not create stage")

    return Match.model_validate(dict(result._mapping))

async def sql_get_match_haxball(
    tournament_id: TournamentId,
    match_id: MatchId,
) -> MatchHaxball | None:

    query = """
        SELECT
            m.id,
            (
                SELECT COUNT(*)
                FROM matches AS m2
                JOIN rounds AS r2 ON r2.id = m2.round_id
                JOIN stage_items AS si2 ON si2.id = r2.stage_item_id
                JOIN stages AS s2 ON s2.id = si2.stage_id
                WHERE s2.tournament_id = :tournament_id
                  AND m2.id <= m.id
            ) AS number,
            t1.id AS team_1_id,
            t1.name AS team_1_name,
            t2.id AS team_2_id,
            t2.name AS team_2_name,
            m.played,
            si.type AS stage_type
        FROM matches AS m
        JOIN stage_item_inputs AS input1
            ON input1.id = m.stage_item_input1_id
        JOIN stage_item_inputs AS input2
            ON input2.id = m.stage_item_input2_id
        JOIN teams AS t1
            ON t1.id = input1.team_id
        JOIN teams AS t2
            ON t2.id = input2.team_id
        JOIN rounds AS r
            ON r.id = m.round_id
        JOIN stage_items AS si
            ON si.id = r.stage_item_id
        JOIN stages AS s
            ON s.id = si.stage_id
        WHERE m.id = :match_id
          AND s.tournament_id = :tournament_id
    """

    result = await database.fetch_one(
        query=query,
        values={
            "tournament_id": tournament_id,
            "match_id": match_id,
        },
    )

    if result is None:
        return None

    return MatchHaxball.model_validate(dict(result._mapping))

async def sql_get_match_haxball_by_number(
    tournament_id: TournamentId,
    number: int,
) -> MatchHaxball | None:
    """Busca un partido por su número dentro del torneo (el que se usa en la sala de Haxball)."""
    match_id = await database.fetch_val(
        query="""
            SELECT numbered.id
            FROM (
                SELECT m.id, ROW_NUMBER() OVER (ORDER BY m.id) AS number
                FROM matches AS m
                JOIN rounds AS r ON r.id = m.round_id
                JOIN stage_items AS si ON si.id = r.stage_item_id
                JOIN stages AS s ON s.id = si.stage_id
                WHERE s.tournament_id = :tournament_id
            ) AS numbered
            WHERE numbered.number = :number
        """,
        values={"tournament_id": tournament_id, "number": number},
    )
    if match_id is None:
        return None

    return await sql_get_match_haxball(tournament_id, MatchId(match_id))


async def sql_count_players_in_tournament(
    player_ids: list[PlayerId],
    tournament_id: TournamentId,
) -> int:
    """Cuántos de los jugadores indicados pertenecen realmente al torneo."""
    if len(player_ids) < 1:
        return 0

    result = await database.fetch_val(
        query="""
            SELECT COUNT(*)
            FROM players
            WHERE id = ANY(:player_ids)
              AND tournament_id = :tournament_id
        """,
        values={"player_ids": player_ids, "tournament_id": tournament_id},
    )
    return int(result or 0)


async def sql_get_match_player_stats_detail(
    tournament_id: TournamentId,
    match_id: MatchId,
) -> list[MatchPlayerStatsDetail]:
    query = """
        SELECT
            mps.player_id,
            p.name AS player_name,
            mps.team_id,
            t.name AS team_name,
            mps.goals,
            mps.assists
        FROM match_player_stats AS mps
        JOIN players AS p
            ON p.id = mps.player_id
        JOIN teams AS t
            ON t.id = mps.team_id
        JOIN matches AS m
            ON m.id = mps.match_id
        JOIN rounds AS r
            ON r.id = m.round_id
        JOIN stage_items AS si
            ON si.id = r.stage_item_id
        JOIN stages AS s
            ON s.id = si.stage_id
        WHERE mps.match_id = :match_id
          AND s.tournament_id = :tournament_id
        ORDER BY mps.team_id, mps.goals DESC, mps.assists DESC, p.name
    """

    result = await database.fetch_all(
        query=query,
        values={"tournament_id": tournament_id, "match_id": match_id},
    )

    return [
        MatchPlayerStatsDetail.model_validate(dict(row._mapping))
        for row in result
    ]


async def clear_scores_for_matches_in_stage_item(
    tournament_id: TournamentId, stage_item_id: StageItemId
) -> None:
    query = """
        UPDATE matches
        SET stage_item_input1_score = 0,
            stage_item_input2_score = 0
        FROM rounds
        JOIN stage_items ON rounds.stage_item_id = stage_items.id
        JOIN stages ON stages.id = stage_items.stage_id
        WHERE   rounds.id = matches.round_id
            AND stages.tournament_id = :tournament_id
            AND stage_items.id = :stage_item_id
        """
    await database.execute(
        query=query,
        values={
            "stage_item_id": stage_item_id,
            "tournament_id": tournament_id,
        },
    )
