from bracket.database import database
from bracket.models.db.stats import (
    PlayerMatchEntry,
    PlayerStatsRow,
    TeamMatchEntry,
)
from bracket.utils.id_types import PlayerId, TeamId, TournamentId

# Todos los partidos del torneo con su número (por orden de id). El número se calcula ANTES de
# filtrar, así coincide con el que se muestra en el resto del sitio y en la sala de Haxball.
NUMBERED_MATCHES_CTE = """
    numbered_matches AS (
        SELECT
            m.id,
            ROW_NUMBER() OVER (ORDER BY m.id) AS number,
            m.played,
            m.start_time,
            m.stage_item_input1_score AS score1,
            m.stage_item_input2_score AS score2,
            input1.team_id AS team1_id,
            input2.team_id AS team2_id,
            r.is_draft,
            c.name AS court_name
        FROM matches AS m
        JOIN rounds AS r ON r.id = m.round_id
        JOIN stage_items AS si ON si.id = r.stage_item_id
        JOIN stages AS s ON s.id = si.stage_id
        LEFT JOIN stage_item_inputs AS input1 ON input1.id = m.stage_item_input1_id
        LEFT JOIN stage_item_inputs AS input2 ON input2.id = m.stage_item_input2_id
        LEFT JOIN courts AS c ON c.id = m.court_id
        WHERE s.tournament_id = :tournament_id
    )
"""

PLAYER_STATS_SELECT = """
    SELECT
        p.id AS player_id,
        p.name,
        t.id AS team_id,
        t.name AS team_name,
        (
            SELECT COUNT(*) FROM match_player_stats AS mps WHERE mps.player_id = p.id
        ) AS matches_played,
        p.goals,
        p.assists,
        p.wins,
        p.draws,
        p.losses
    FROM players AS p
    LEFT JOIN LATERAL (
        SELECT teams.id, teams.name
        FROM players_x_teams AS pxt
        JOIN teams ON teams.id = pxt.team_id
        WHERE pxt.player_id = p.id
        ORDER BY pxt.id
        LIMIT 1
    ) AS t ON TRUE
    WHERE p.tournament_id = :tournament_id
"""


async def sql_get_players_stats(
    tournament_id: TournamentId, *, team_id: TeamId | None = None
) -> list[PlayerStatsRow]:
    team_filter = (
        "AND EXISTS (SELECT 1 FROM players_x_teams AS x "
        "WHERE x.player_id = p.id AND x.team_id = :team_id)"
        if team_id is not None
        else ""
    )
    values: dict[str, int] = {"tournament_id": tournament_id}
    if team_id is not None:
        values["team_id"] = team_id

    result = await database.fetch_all(
        query=f"{PLAYER_STATS_SELECT} {team_filter} ORDER BY p.goals DESC, p.assists DESC, p.name",
        values=values,
    )
    return [PlayerStatsRow.model_validate(dict(row._mapping)) for row in result]


async def sql_get_player_stats(
    tournament_id: TournamentId, player_id: PlayerId
) -> PlayerStatsRow | None:
    result = await database.fetch_one(
        query=f"{PLAYER_STATS_SELECT} AND p.id = :player_id",
        values={"tournament_id": tournament_id, "player_id": player_id},
    )
    return PlayerStatsRow.model_validate(dict(result._mapping)) if result is not None else None


async def sql_get_player_match_log(
    tournament_id: TournamentId, player_id: PlayerId
) -> list[PlayerMatchEntry]:
    query = f"""
        WITH {NUMBERED_MATCHES_CTE}
        SELECT
            nm.id AS match_id,
            nm.number,
            nm.start_time,
            mps.team_id,
            own.name AS team_name,
            opp.id AS opponent_id,
            opp.name AS opponent_name,
            CASE WHEN nm.team1_id = mps.team_id THEN nm.score1 ELSE nm.score2 END AS goals_for,
            CASE WHEN nm.team1_id = mps.team_id THEN nm.score2 ELSE nm.score1 END
                AS goals_against,
            mps.goals,
            mps.assists
        FROM match_player_stats AS mps
        JOIN numbered_matches AS nm ON nm.id = mps.match_id
        JOIN teams AS own ON own.id = mps.team_id
        LEFT JOIN teams AS opp
            ON opp.id = CASE WHEN nm.team1_id = mps.team_id THEN nm.team2_id ELSE nm.team1_id END
        WHERE mps.player_id = :player_id
          AND nm.is_draft IS FALSE
        ORDER BY nm.number DESC
    """
    result = await database.fetch_all(
        query=query, values={"tournament_id": tournament_id, "player_id": player_id}
    )
    return [PlayerMatchEntry.model_validate(dict(row._mapping)) for row in result]


async def sql_get_team_match_log(
    tournament_id: TournamentId, team_id: TeamId
) -> list[TeamMatchEntry]:
    query = f"""
        WITH {NUMBERED_MATCHES_CTE}
        SELECT
            nm.id AS match_id,
            nm.number,
            nm.played,
            nm.start_time,
            nm.court_name,
            opp.id AS opponent_id,
            opp.name AS opponent_name,
            CASE WHEN nm.team1_id = :team_id THEN nm.score1 ELSE nm.score2 END AS goals_for,
            CASE WHEN nm.team1_id = :team_id THEN nm.score2 ELSE nm.score1 END AS goals_against
        FROM numbered_matches AS nm
        LEFT JOIN teams AS opp
            ON opp.id = CASE WHEN nm.team1_id = :team_id THEN nm.team2_id ELSE nm.team1_id END
        WHERE (nm.team1_id = :team_id OR nm.team2_id = :team_id)
          AND nm.is_draft IS FALSE
        ORDER BY nm.number
    """
    result = await database.fetch_all(
        query=query, values={"tournament_id": tournament_id, "team_id": team_id}
    )
    return [TeamMatchEntry.model_validate(dict(row._mapping)) for row in result]
