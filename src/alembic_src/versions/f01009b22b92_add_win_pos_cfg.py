"""add_win_pos_cfg

Revision ID: f01009b22b92
Revises: ccdd7352ed32
Create Date: 2024-04-29 19:53:08.433752

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f01009b22b92'
down_revision: Union[str, None] = 'ccdd7352ed32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("config", sa.Column("pos_x", sa.Integer))
    op.add_column("config", sa.Column("pos_y", sa.Integer))


def downgrade() -> None:
    op.drop_column("config", "pos_x")
    op.drop_column("config", "pos_y")
