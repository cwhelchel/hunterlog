"""add logger config

Revision ID: dfc792b4b40b
Revises: 53ee59dfaf8f
Create Date: 2024-03-16 18:35:12.835407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfc792b4b40b'
down_revision: Union[str, None] = '53ee59dfaf8f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("config", sa.Column("logger_type", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("config", "logger_type")
