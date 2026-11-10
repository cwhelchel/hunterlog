"""add import pota tble

Revision ID: 531f323c95ce
Revises: cff2b51192d0
Create Date: 2026-11-09 11:24:19.685851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '531f323c95ce'
down_revision: Union[str, None] = 'cff2b51192d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # had to move this here. the next alembic revision was squawking about it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # i think marshmallow is doing this for us.... wrap in a check
    if "import_pota_hunts" not in tables:
        op.create_table("import_pota_hunts",
            sa.Column("id", sa.NVARCHAR(50), primary_key=True),
            sa.Column("hunts", sa.INTEGER, server_default='0')
            )


def downgrade() -> None:
    op.drop_table("import_pota_hunts")
