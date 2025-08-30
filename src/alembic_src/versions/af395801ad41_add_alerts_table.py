"""add alerts table

Revision ID: af395801ad41
Revises: fd67dfff009a
Create Date: 2025-02-01 19:41:34.415807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'af395801ad41'
down_revision: Union[str, None] = 'fd67dfff009a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# add alert table to hold the parks
def upgrade() -> None:
    
    # had to move this here. the next alembic revision was squawking about it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # i think marshmallow is doing this for us.... wrap in a check
    if "alerts" not in tables:
        op.create_table("alerts",
            sa.Column("id", sa.INTEGER, primary_key=True),
            sa.Column("enabled", sa.BOOLEAN, server_default='1'),
            sa.Column("new_only", sa.BOOLEAN, server_default='1'),
            sa.Column("name", sa.NVARCHAR(50), nullable=True),
            sa.Column("loc_search", sa.NVARCHAR(12), nullable=True),
            sa.Column("exclude_modes", sa.NVARCHAR(200), nullable=True),
            sa.Column("last_triggered", sa.TIMESTAMP, nullable=True),
            sa.Column("dismissed_until", sa.TIMESTAMP, nullable=True),
            sa.Column("dismissed_callsigns", sa.NVARCHAR(200), nullable=True)
            )


def downgrade() -> None:
    op.drop_table("alerts")
