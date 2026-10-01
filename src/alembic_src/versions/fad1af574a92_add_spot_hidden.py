"""add spot hidden

Revision ID: fad1af574a92
Revises: 1b8efa0b1c91
Create Date: 2025-12-17 13:28:06.120542

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'fad1af574a92'
down_revision: Union[str, None] = '1b8efa0b1c91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("is_hidden", sa.Boolean, server_default=str(0)))

    # had to move this here. the next alembic revision was squawking about it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # i think marshmallow is doing this for us.... wrap in a check
    if "hidden_spots" not in tables:
        op.create_table(
            "hidden_spots",
            sa.Column("id", sa.INTEGER, primary_key=True),
            sa.Column("activator", sa.NVARCHAR, nullable=False),
            sa.Column("reference", sa.NVARCHAR, nullable=False),
            sa.Column("created_on", sa.TIMESTAMP, nullable=False),
            sa.Column("expires_on", sa.TIMESTAMP, nullable=False),
            sa.Column("enabled", sa.BOOLEAN, server_default='1'),
        )


def downgrade() -> None:
    op.drop_column("spots", "is_hidden")
    op.drop_table('hidden_spots')
