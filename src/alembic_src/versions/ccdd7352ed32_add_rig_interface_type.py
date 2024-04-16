"""add rig interface type

Revision ID: ccdd7352ed32
Revises: 44ec51a942f9
Create Date: 2024-04-16 08:57:36.695892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccdd7352ed32'
down_revision: Union[str, None] = '44ec51a942f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # currently accepted values are "flrig" and "rigctld"
    op.add_column("config", sa.Column("rig_if_type", sa.String, server_default="flrig"))


def downgrade() -> None:
    op.drop_column("config", "rig_if_type")
