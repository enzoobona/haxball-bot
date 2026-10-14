"""haxball: match_player_stats (con team_id) y goles en contra

Revision ID: a7c3e1f4b902
Revises: 2c90cb52fed9
Create Date: 2026-10-11 12:00:00.000000

La tabla `match_player_stats` existía en `schema.py` (y el código la usa), pero no tenía
migración y le faltaba la columna `team_id`. Esta migración es idempotente: sirve tanto para
bases que ya la crearon a mano como para bases que todavía no la tienen.

"""

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision: str | None = "a7c3e1f4b902"
down_revision: str | None = "2c90cb52fed9"
branch_labels: str | None = None
depends_on: str | None = None


def _columns(inspector: sa.Inspector, table: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # --- players.own_goals ---
    if "own_goals" not in _columns(inspector, "players"):
        op.add_column(
            "players",
            sa.Column("own_goals", sa.Integer(), nullable=False, server_default="0"),
        )

    # --- match_player_stats ---
    if "match_player_stats" not in inspector.get_table_names():
        op.create_table(
            "match_player_stats",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column("match_id", sa.BigInteger(), nullable=False),
            sa.Column("player_id", sa.BigInteger(), nullable=False),
            sa.Column("team_id", sa.BigInteger(), nullable=False),
            sa.Column("goals", sa.Integer(), server_default="0", nullable=False),
            sa.Column("assists", sa.Integer(), server_default="0", nullable=False),
            sa.Column("own_goals", sa.Integer(), server_default="0", nullable=False),
            sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("match_id", "player_id"),
        )
        op.create_index("ix_match_player_stats_id", "match_player_stats", ["id"])
        op.create_index("ix_match_player_stats_match_id", "match_player_stats", ["match_id"])
        op.create_index("ix_match_player_stats_player_id", "match_player_stats", ["player_id"])
        op.create_index("ix_match_player_stats_team_id", "match_player_stats", ["team_id"])
        return

    columns = _columns(inspector, "match_player_stats")

    if "own_goals" not in columns:
        op.add_column(
            "match_player_stats",
            sa.Column("own_goals", sa.Integer(), nullable=False, server_default="0"),
        )

    if "team_id" not in columns:
        op.add_column("match_player_stats", sa.Column("team_id", sa.BigInteger(), nullable=True))
        # Se completa con el equipo del partido al que pertenece el jugador.
        op.execute(
            """
            UPDATE match_player_stats AS mps
            SET team_id = pxt.team_id
            FROM matches AS m
            JOIN stage_item_inputs AS i1 ON i1.id = m.stage_item_input1_id
            JOIN stage_item_inputs AS i2 ON i2.id = m.stage_item_input2_id,
                 players_x_teams AS pxt
            WHERE m.id = mps.match_id
              AND pxt.player_id = mps.player_id
              AND pxt.team_id IN (i1.team_id, i2.team_id)
            """
        )
        # Sin equipo no se puede atribuir el resultado: esas filas se descartan.
        op.execute("DELETE FROM match_player_stats WHERE team_id IS NULL")
        op.alter_column("match_player_stats", "team_id", nullable=False)
        op.create_foreign_key(
            "match_player_stats_team_id_fkey",
            "match_player_stats",
            "teams",
            ["team_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("ix_match_player_stats_team_id", "match_player_stats", ["team_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "match_player_stats" in inspector.get_table_names() and "own_goals" in _columns(
        inspector, "match_player_stats"
    ):
        op.drop_column("match_player_stats", "own_goals")

    if "own_goals" in _columns(inspector, "players"):
        op.drop_column("players", "own_goals")
