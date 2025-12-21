"""update alerts

Revision ID: 1b8efa0b1c91
Revises: 589bf7e6b857
Create Date: 2025-11-17 22:33:13.785667

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b8efa0b1c91'
down_revision: Union[str, None] = '589bf7e6b857'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("alerts", sa.Column("call_search", sa.String, nullable=True))
    op.add_column("alerts", sa.Column("excl_band_above", sa.String, nullable=True))
    op.add_column("alerts", sa.Column("excl_band_below", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("alerts", "call_search")
    op.drop_column("alerts", "excl_band_above")
    op.drop_column("alerts", "excl_band_below")
