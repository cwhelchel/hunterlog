"""fix spot source

Revision ID: 922a7b854b71
Revises: dfc792b4b40b
Create Date: 2024-03-25 21:44:36.970584

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '922a7b854b71'
down_revision: Union[str, None] = 'dfc792b4b40b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("comments", "source", existing_type=sa.VARCHAR(10), type_=sa.VARCHAR)


def downgrade() -> None:
    op.alter_column("comments", "source", type_=sa.VARCHAR(10), existing_type=sa.VARCHAR)
