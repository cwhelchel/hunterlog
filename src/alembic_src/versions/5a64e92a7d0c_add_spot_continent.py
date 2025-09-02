"""add spot continent

Revision ID: 5a64e92a7d0c
Revises: 6a57a9b8d650
Create Date: 2025-09-01 11:20:51.233399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a64e92a7d0c'
down_revision: Union[str, None] = '6a57a9b8d650'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("continent", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("spots", "continent")
