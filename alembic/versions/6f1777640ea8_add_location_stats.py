"""add location stats

Revision ID: 6f1777640ea8
Revises: de225609f3b5
Create Date: 2024-03-04 15:36:28.763615

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f1777640ea8'
down_revision: Union[str, None] = 'de225609f3b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        # locations.json lowest lvl obj
        sa.Column('locationId', sa.Integer, primary_key=True),
        sa.Column('descriptor', sa.String),
        sa.Column('name', sa.String),
        sa.Column('latitude', sa.Float),
        sa.Column('longitude', sa.Float),
        sa.Column('parks', sa.Integer),
        # ancestor data
        sa.Column('entityId', sa.Integer),
        sa.Column('programId', sa.Integer),
    )


def downgrade() -> None:
    op.drop_table("locations")
