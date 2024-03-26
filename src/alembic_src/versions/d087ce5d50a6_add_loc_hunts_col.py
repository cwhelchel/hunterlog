"""add loc_hunts col

Revision ID: d087ce5d50a6
Revises: 6f1777640ea8
Create Date: 2024-03-05 21:46:31.654161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd087ce5d50a6'
down_revision: Union[str, None] = '6f1777640ea8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("loc_hunts", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("spots", "loc_hunts")
