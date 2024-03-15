"""more spot data

Revision ID: 53ee59dfaf8f
Revises: 5daac9aa5d91
Create Date: 2024-03-13 19:15:22.059262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53ee59dfaf8f'
down_revision: Union[str, None] = '5daac9aa5d91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("act_cmts", sa.String, nullable=True))
    op.add_column("spots", sa.Column("cw_wpm", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("spots", "act_cmts")
    op.drop_column("spots", "cw_wpm")
