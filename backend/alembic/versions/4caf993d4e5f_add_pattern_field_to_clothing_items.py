"""add pattern field to clothing items

Revision ID: 4caf993d4e5f
Revises: e6b2b9903a80
Create Date: 2026-05-29 12:00:29.721691

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4caf993d4e5f"
down_revision: Union[str, Sequence[str], None] = "e6b2b9903a80"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("clothing_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("pattern", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("clothing_items", schema=None) as batch_op:
        batch_op.drop_column("pattern")
