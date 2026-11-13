"""add county column

Revision ID: d5f0a4dc515c
Revises: 531f323c95ce
Create Date: 2026-11-12 12:52:50.594035

"""
from typing import Sequence, Union
from sqlalchemy.engine.reflection import Inspector
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5f0a4dc515c'
down_revision: Union[str, None] = '531f323c95ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns

def upgrade() -> None:
    op.add_column("spots", sa.Column("county", sa.String, nullable=True))
    op.add_column("qsos", sa.Column("county", sa.String, nullable=True))


def downgrade() -> None:
    try:
        if column_exists("spots", "county"):
            op.drop_column("spots", "county")
        if column_exists("qsos", "county"):
            op.drop_column("qsos", "county")
    except Exception as e:
        print(f"Error occurred while dropping columns: {e}")