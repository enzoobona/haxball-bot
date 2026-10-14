"""add player goals and assists

Revision ID: 2c90cb52fed9
Revises: c1ab44651e79
Create Date: 2026-08-31 18:38:06.652156

"""

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision: str | None = "2c90cb52fed9"
down_revision: str | None = "c1ab44651e79"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "players",
        sa.Column(
            "goals",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "players",
        sa.Column(
            "assists",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("players", "assists")
    op.drop_column("players", "goals")