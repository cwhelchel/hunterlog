"""add config qthmsg

Revision ID: 44ec51a942f9
Revises: db9920460979
Create Date: 2024-04-15 14:11:31.707574

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44ec51a942f9'
down_revision: Union[str, None] = 'db9920460979'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("config", sa.Column("qth_string", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("config", "qth_string")
