"""new cfg table

Revision ID: 164284e1be4e
Revises: 5a64e92a7d0c
Create Date: 2025-09-02 17:30:51.751563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '164284e1be4e'
down_revision: Union[str, None] = '5a64e92a7d0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # had to move this here. the next alembic revision was squawking about it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # i think marshmallow is doing this for us.... wrap in a check
    if "config_ver2" not in tables:
        op.create_table(
            "config_ver2",
            sa.Column("id", sa.INTEGER, primary_key=True),
            sa.Column("key", sa.NVARCHAR(200), nullable=False),
            sa.Column("val", sa.NVARCHAR, nullable=False),
            sa.Column("type", sa.NVARCHAR(50), nullable=False),
            sa.Column("enabled", sa.BOOLEAN, server_default='1'),
            sa.Column("editable", sa.BOOLEAN, server_default='1'),
            sa.Column("description", sa.NVARCHAR(200), nullable=True),
            sa.Column("group", sa.NVARCHAR(50), nullable=True)
        )

def downgrade() -> None:
    op.drop_table("config_ver2")
