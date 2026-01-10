"""add polo notes

Revision ID: cff2b51192d0
Revises: fad1af574a92
Create Date: 2026-01-09 08:10:15.999088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'cff2b51192d0'
down_revision: Union[str, None] = 'fad1af574a92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # had to move this here. the next alembic revision was squawking about it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # i think marshmallow is doing this for us.... wrap in a check
    if "callsign_notes" not in tables:
        op.create_table(
            "callsign_notes",
            sa.Column("id", sa.INTEGER, primary_key=True),
            sa.Column("name", sa.NVARCHAR, nullable=False),
            sa.Column("path", sa.NVARCHAR, nullable=False),
            sa.Column("order", sa.INTEGER),
            sa.Column("last_download", sa.TIMESTAMP(
                timezone=True), nullable=True),
            sa.Column("enabled", sa.BOOLEAN, server_default='1'),
        )


def downgrade() -> None:
    op.drop_table('callsign_notes')
