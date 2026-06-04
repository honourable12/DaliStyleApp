"""Add digital vault fields to clothing items

Revision ID: ec6fd8f960a6
Revises: 4caf993d4e5f
Create Date: 2026-06-03 15:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec6fd8f960a6'
down_revision: Union[str, Sequence[str], None] = '4caf993d4e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('clothing_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('brand', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('material', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('sustainability_score', sa.Integer(), server_default='0', nullable=True))
        batch_op.add_column(sa.Column('season', sa.String(), server_default='All-Season', nullable=True))
        batch_op.add_column(sa.Column('occasion_tags', sa.JSON(), server_default='[]', nullable=True))
        batch_op.add_column(sa.Column('purchase_date', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('clothing_items', schema=None) as batch_op:
        batch_op.drop_column('purchase_date')
        batch_op.drop_column('occasion_tags')
        batch_op.drop_column('season')
        batch_op.drop_column('sustainability_score')
        batch_op.drop_column('material')
        batch_op.drop_column('brand')
