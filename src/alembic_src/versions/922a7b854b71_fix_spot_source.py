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
    # cant use alter column bc SQLITE doesn't support modifying columns
    op.drop_column("comments", "source")
    op.add_column("comments", sa.Column("source", sa.String, nullable=True))


def downgrade() -> None:
    op.drop_column("comments", "source")
    op.add_column("comments", sa.Column("source", sa.String(10), nullable=True))
