"""add bearing

Revision ID: ac1e18c1148f
Revises: 922a7b854b71
Create Date: 2024-04-10 11:10:44.670763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac1e18c1148f'
down_revision: Union[str, None] = '922a7b854b71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("qsos", sa.Column("bearing", sa.Float, nullable=True))


def downgrade() -> None:
    op.drop_column("qsos", "bearing")
