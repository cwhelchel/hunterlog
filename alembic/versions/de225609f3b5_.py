"""empty message

Revision ID: de225609f3b5
Revises: 
Create Date: 2024-03-02 18:47:24.752899

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de225609f3b5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('spots', sa.Column('is_qrt', sa.Boolean))
    pass


def downgrade() -> None:
    op.drop_column('spots', sa.Column('is_qrt', sa.Boolean))
    pass
