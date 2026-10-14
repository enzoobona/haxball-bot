"""equipos: colores de camiseta, color del texto, angulo y emoji

Revision ID: c9d41a7e2b55
Revises: a7c3e1f4b902
Create Date: 2026-10-12 12:00:00.000000

Idempotente: agrega cada columna solo si todavia no existe.

"""

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision: str | None = "c9d41a7e2b55"
down_revision: str | None = "a7c3e1f4b902"
branch_labels: str | None = None
depends_on: str | None = None

NULLABLE_TEXT_COLUMNS = (
    "shirt_color_1",
    "shirt_color_2",
    "shirt_color_3",
    "shirt_text_color",
    "emoji",
)


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("teams")}

    for name in NULLABLE_TEXT_COLUMNS:
        if name not in columns:
            op.add_column("teams", sa.Column(name, sa.String(), nullable=True))

    if "shirt_angle" not in columns:
        op.add_column(
            "teams",
            sa.Column("shirt_angle", sa.Integer(), nullable=False, server_default="180"),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("teams")}

    for name in ("shirt_angle", *reversed(NULLABLE_TEXT_COLUMNS)):
        if name in columns:
            op.drop_column("teams", name)
