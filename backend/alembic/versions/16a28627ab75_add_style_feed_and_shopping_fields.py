"""Add style feed and shopping fields

Revision ID: 16a28627ab75
Revises: 0725df1747a9
Create Date: 2026-06-04 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '16a28627ab75'
down_revision: Union[str, Sequence[str], None] = '0725df1747a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add fields to clothing_items
    with op.batch_alter_table('clothing_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_shoppable', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        batch_op.add_column(sa.Column('purchase_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('price', sa.Integer(), nullable=True))

    # 2. Create feed_posts table
    op.create_table('feed_posts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('outfit_id', sa.UUID(), nullable=True),
        sa.Column('item_id', sa.Integer(), nullable=True),
        sa.Column('caption', sa.String(), nullable=True),
        sa.Column('post_type', sa.String(), server_default='outfit', nullable=True),
        sa.Column('is_featured', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['clothing_items.id'], ),
        sa.ForeignKeyConstraint(['outfit_id'], ['outfits.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('feed_posts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_feed_posts_user_id'), ['user_id'], unique=False)

    # 3. Create likes table
    op.create_table('likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('post_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['feed_posts.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_likes_post_id'), ['post_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_likes_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_likes_user_id'))
        batch_op.drop_index(batch_op.f('ix_likes_post_id'))
    op.drop_table('likes')
    
    with op.batch_alter_table('feed_posts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_feed_posts_user_id'))
    op.drop_table('feed_posts')

    with op.batch_alter_table('clothing_items', schema=None) as batch_op:
        batch_op.drop_column('price')
        batch_op.drop_column('purchase_url')
        batch_op.drop_column('is_shoppable')
