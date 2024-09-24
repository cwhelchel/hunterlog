"""add spot source

Revision ID: fd67dfff009a
Revises: f01009b22b92
Create Date: 2024-09-23 17:02:53.800362

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd67dfff009a'
down_revision: Union[str, None] = 'f01009b22b92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("spot_source", sa.String))


def downgrade() -> None:
    op.drop_column("spots", "spot_source")

