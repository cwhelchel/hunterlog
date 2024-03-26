"""add loc total col

Revision ID: 5daac9aa5d91
Revises: d087ce5d50a6
Create Date: 2024-03-06 15:16:32.199996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5daac9aa5d91'
down_revision: Union[str, None] = 'd087ce5d50a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("loc_total", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("spots", "loc_total")    
