"""roles de usuario, perfiles de jugador (cuentas), identidades de Haxball y sin goles en contra

Revision ID: d3f7a9b1c204
Revises: d4e8f2a1b7c3
Create Date: 2026-10-27 12:00:00.000000

* `users.role` (ADMIN / USER). Todos los usuarios que ya existen eran organizadores, asi que
  quedan como ADMIN; las cuentas nuevas que se registran por la web son USER.
* `player_profiles`: el "jugador con cuenta". Un perfil pertenece a un unico usuario y puede
  estar asociado a una fila de `players` en cada torneo (`players.profile_id`).
* `haxball_identities`: los `auth` de Haxball (uno por navegador) vinculados a un perfil.
* `haxball_link_codes`: codigos de un solo uso para vincular un navegador desde la sala.
* Se eliminan los goles en contra de los jugadores (`own_goals`).

"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

from alembic import op

# revision identifiers, used by Alembic.
revision: str | None = "d3f7a9b1c204"
down_revision: str | None = "d4e8f2a1b7c3"
branch_labels: str | None = None
depends_on: str | None = None

user_role = ENUM("ADMIN", "USER", name="user_role", create_type=False)


def _columns(inspector: sa.Inspector, table: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()

    # --- users.role ---
    ENUM("ADMIN", "USER", name="user_role").create(bind, checkfirst=True)
    inspector = sa.inspect(bind)

    if "role" not in _columns(inspector, "users"):
        op.add_column(
            "users",
            sa.Column("role", user_role, server_default="USER", nullable=False),
        )
        # Quienes ya tenian cuenta eran organizadores: conservan todos sus permisos.
        op.execute("UPDATE users SET role = 'ADMIN'")

    # --- player_profiles ---
    op.create_table(
        "player_profiles",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("name_key", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("name_key"),
    )
    op.create_index("ix_player_profiles_id", "player_profiles", ["id"])

    # --- haxball_identities ---
    op.create_table(
        "haxball_identities",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("profile_id", sa.BigInteger(), nullable=False),
        sa.Column("auth", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["player_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("auth"),
    )
    op.create_index("ix_haxball_identities_id", "haxball_identities", ["id"])
    op.create_index("ix_haxball_identities_profile_id", "haxball_identities", ["profile_id"])

    # --- haxball_link_codes ---
    op.create_table(
        "haxball_link_codes",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_hash"),
    )
    op.create_index("ix_haxball_link_codes_id", "haxball_link_codes", ["id"])
    op.create_index("ix_haxball_link_codes_user_id", "haxball_link_codes", ["user_id"])

    # --- players.profile_id ---
    op.add_column("players", sa.Column("profile_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "players_profile_id_fkey",
        "players",
        "player_profiles",
        ["profile_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_players_profile_id", "players", ["profile_id"])
    # Un perfil no puede tener dos filas en el mismo torneo.
    op.create_index(
        "ix_players_tournament_profile",
        "players",
        ["tournament_id", "profile_id"],
        unique=True,
        postgresql_where=sa.text("profile_id IS NOT NULL"),
    )

    # --- sin goles en contra ---
    inspector = sa.inspect(bind)
    if "own_goals" in _columns(inspector, "players"):
        op.drop_column("players", "own_goals")
    if "own_goals" in _columns(inspector, "match_player_stats"):
        op.drop_column("match_player_stats", "own_goals")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "own_goals" not in _columns(inspector, "match_player_stats"):
        op.add_column(
            "match_player_stats",
            sa.Column("own_goals", sa.Integer(), nullable=False, server_default="0"),
        )
    if "own_goals" not in _columns(inspector, "players"):
        op.add_column(
            "players",
            sa.Column("own_goals", sa.Integer(), nullable=False, server_default="0"),
        )

    op.drop_index("ix_players_tournament_profile", table_name="players")
    op.drop_index("ix_players_profile_id", table_name="players")
    op.drop_constraint("players_profile_id_fkey", "players", type_="foreignkey")
    op.drop_column("players", "profile_id")

    op.drop_table("haxball_link_codes")
    op.drop_table("haxball_identities")
    op.drop_table("player_profiles")

    op.drop_column("users", "role")
    ENUM("ADMIN", "USER", name="user_role").drop(bind, checkfirst=True)
