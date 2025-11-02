"""add pota ref

Revision ID: 6a57a9b8d650
Revises: af395801ad41
Create Date: 2025-07-09 22:40:11.584434

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a57a9b8d650'
down_revision: Union[str, None] = 'af395801ad41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("qsos", sa.Column("pota_ref", sa.String, nullable=True))
    op.add_column("qsos", sa.Column("sota_ref", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("qsos", "pota_ref")
    op.drop_column("qsos", "sota_ref")