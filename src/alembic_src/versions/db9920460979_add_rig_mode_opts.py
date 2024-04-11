"""add rig mode opts

Revision ID: db9920460979
Revises: 3c58d5fd6e23
Create Date: 2024-04-11 12:45:55.107737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db9920460979'
down_revision: Union[str, None] = '3c58d5fd6e23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("config", sa.Column("cw_mode", sa.String, server_default="CW"))
    op.add_column("config", sa.Column("ftx_mode", sa.String, server_default="USB"))


def downgrade() -> None:
    op.drop_column("config", "cw_mode")
    op.drop_column("config", "ftx_mode")