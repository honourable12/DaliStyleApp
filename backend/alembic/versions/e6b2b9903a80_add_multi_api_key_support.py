"""Add multi-api-key support

Revision ID: e6b2b9903a80
Revises: 1269d7c13f7c
Create Date: 2026-05-23 20:21:02.090572

"""
from typing import Sequence, Union
import hashlib

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'e6b2b9903a80'
down_revision: Union[str, Sequence[str], None] = '1269d7c13f7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Create partner_api_keys table
    if 'partner_api_keys' not in tables:
        op.create_table('partner_api_keys',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('partner_id', sa.UUID(), nullable=True),
            sa.Column('key_hash', sa.String(), nullable=False),
            sa.Column('key_prefix', sa.String(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['partner_id'], ['partners.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_partner_api_key_hash'), 'partner_api_keys', ['key_hash'], unique=True)
        op.create_index(op.f('ix_partner_api_key_partner_id'), 'partner_api_keys', ['partner_id'], unique=False)

    # 2. Add api_key_id to api_usage
    columns = [c['name'] for c in inspector.get_columns('api_usage')]
    if 'api_key_id' not in columns:
        with op.batch_alter_table('api_usage', schema=None) as batch_op:
            batch_op.add_column(sa.Column('api_key_id', sa.UUID(), nullable=True))
            batch_op.create_foreign_key('fk_api_usage_api_key_id', 'partner_api_keys', ['api_key_id'], ['id'])
            batch_op.create_index(op.f('ix_api_usage_api_key_id'), ['api_key_id'], unique=False)

    # 3. Data Migration: Move existing api_keys to the new table
    # This is complex because we want to hash them.
    # We'll use SHA256.
    partners = conn.execute(sa.text("SELECT id, api_key FROM partners WHERE api_key IS NOT NULL")).fetchall()
    for p_id, p_key in partners:
        if p_key:
            # Hash the key
            key_hash = hashlib.sha256(p_key.encode()).hexdigest()
            # Prefix is usually ds_live_ (first 8 chars)
            prefix = p_key[:8] if len(p_key) > 8 else "ds_live_"
            
            # Check if already migrated
            existing = conn.execute(sa.text("SELECT id FROM partner_api_keys WHERE key_hash = :h"), {"h": key_hash}).fetchone()
            if not existing:
                import uuid
                key_id = str(uuid.uuid4())
                conn.execute(sa.text(
                    "INSERT INTO partner_api_keys (id, partner_id, key_hash, key_prefix, name, type, is_active) "
                    "VALUES (:id, :p_id, :h, :pre, :name, :type, :active)"
                ), {
                    "id": key_id,
                    "p_id": p_id,
                    "h": key_hash,
                    "pre": prefix,
                    "name": "Default Key",
                    "type": "production",
                    "active": True
                })


def downgrade() -> None:
    # Remove index and column from api_usage
    op.drop_index(op.f('ix_api_usage_api_key_id'), table_name='api_usage')
    op.drop_constraint('fk_api_usage_api_key_id', 'api_usage', type_='foreignkey')
    op.drop_column('api_usage', 'api_key_id')

    # Drop partner_api_keys table
    op.drop_index(op.f('ix_partner_api_key_partner_id'), table_name='partner_api_keys')
    op.drop_index(op.f('ix_partner_api_key_hash'), table_name='partner_api_keys')
    op.drop_table('partner_api_keys')
