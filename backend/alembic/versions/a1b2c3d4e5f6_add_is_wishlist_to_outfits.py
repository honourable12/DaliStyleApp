"""Add is_wishlist to outfits

Revision ID: a1b2c3d4e5f6
Revises: 0725df1747a9
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0725df1747a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('outfits', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_wishlist', sa.Boolean(), nullable=True, server_default=sa.text('false')))
        batch_op.create_index(batch_op.f('ix_outfits_is_wishlist'), ['is_wishlist'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('outfits', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_outfits_is_wishlist'))
        batch_op.drop_column('is_wishlist')
