import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WardrobeItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { GarmentVisual } from './GarmentVisual';
import { showAtelierConfirm } from '../context/ToastContext';

interface ItemDetailsModalProps {
  item: WardrobeItem | null;
  visible: boolean;
  onClose: () => void;
  onAddToWorkbench: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  visible,
  onClose,
  onAddToWorkbench,
  onDelete,
}) => {
  if (!item) return null;

  const handleDeleteConfirm = () => {
    showAtelierConfirm({
      title: 'Remove Piece',
      message: `Permanently remove "${item.name}" from your atelier vault?`,
      confirmText: 'Remove',
      cancelText: 'Keep',
      destructive: true,
      icon: 'trash-outline',
      onConfirm: () => {
        onDelete(item.id);
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryBadge}>{item.category}</Text>
              <Text style={styles.title}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.imageWrap}>
            <GarmentVisual
              imageUrl={item.imageUrl}
              category={item.category}
              primaryColor={item.primaryColor}
              primaryColorName={item.primaryColorName}
              name={item.name}
              style={styles.garmentImage}
              iconSize={48}
            />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Color</Text>
              <View style={styles.colorValRow}>
                <View style={[styles.swatchDot, { backgroundColor: item.primaryColor }]} />
                <Text style={styles.metaValue}>{item.primaryColorName}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Hex</Text>
              <Text style={styles.metaValue}>{item.primaryColor.toUpperCase()}</Text>
            </View>

            {item.pattern && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Pattern</Text>
                <Text style={styles.metaValue}>{item.pattern}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onAddToWorkbench(item);
                onClose();
              }}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.background} style={styles.btnIcon} />
              <Text style={styles.btnPrimaryText}>Add to Workbench</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDeleteConfirm}
              style={[styles.btn, styles.btnDestructive]}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.destructive} style={styles.btnIcon} />
              <Text style={styles.btnDestructiveText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 16,
    marginBottom: SPACING.md,
  },
  metaItem: {
    width: '46%',
  },
  metaLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  colorValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actions: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },
  btnDestructive: {
    backgroundColor: COLORS.surfaceRaised,
  },
  btnDestructiveText: {
    color: COLORS.destructive,
    fontSize: 14,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 8,
  },
});
