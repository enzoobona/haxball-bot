"""uploaded_files: copia en la base de los logos subidos

Revision ID: d4e8f2a1b7c3
Revises: c9d41a7e2b55
Create Date: 2026-10-17 12:00:00.000000

Los logos de equipos y torneos se guardaban solo en el disco del servidor. En hostings con disco
efímero (plan gratuito de Render) se perdían en cada reinicio y las imágenes aparecían rotas.
Ahora también se guardan en esta tabla y se restauran al disco cuando falta el archivo.

"""

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision: str | None = "d4e8f2a1b7c3"
down_revision: str | None = "c9d41a7e2b55"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "uploaded_files" in inspector.get_table_names():
        return

    op.create_table(
        "uploaded_files",
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column(
            "created",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("path"),
    )


def downgrade() -> None:
    op.drop_table("uploaded_files")
