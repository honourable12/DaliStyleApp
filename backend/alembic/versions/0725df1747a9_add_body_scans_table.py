"""Add body scans table

Revision ID: 0725df1747a9
Revises: ec6fd8f960a6
Create Date: 2026-06-03 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0725df1747a9'
down_revision: Union[str, Sequence[str], None] = 'ec6fd8f960a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('body_scans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('body_mapping', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('body_scans', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_body_scans_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('body_scans', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_body_scans_user_id'))
    op.drop_table('body_scans')
