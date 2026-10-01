"""add wwff_ref

Revision ID: 589bf7e6b857
Revises: 164284e1be4e
Create Date: 2025-11-10 19:44:50.855517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '589bf7e6b857'
down_revision: Union[str, None] = '164284e1be4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("qsos", sa.Column("wwff_ref", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("qsos", "wwff_ref")
