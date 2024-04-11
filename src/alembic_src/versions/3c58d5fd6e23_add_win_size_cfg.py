"""add win size cfg

Revision ID: 3c58d5fd6e23
Revises: ac1e18c1148f
Create Date: 2024-04-10 13:25:32.699482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c58d5fd6e23'
down_revision: Union[str, None] = 'ac1e18c1148f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("config", sa.Column("size_x", sa.Integer, server_default=str(800)))
    op.add_column("config", sa.Column("size_y", sa.Integer, server_default=str(600)))
    op.add_column("config", sa.Column("is_max", sa.Boolean, server_default=str(0)))



def downgrade() -> None:
    op.drop_column("config", "size_x")
    op.drop_column("config", "size_y")
    op.drop_column("config", "is_max")
