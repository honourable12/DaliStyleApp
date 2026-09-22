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
    Alert.alert(
      'Delete Garment',
      `Are you sure you want to permanently remove "${item.name}" from your vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(item.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
              <Text style={styles.title}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Large Visual Preview */}
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

          {/* Metadata Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>PRIMARY COLOR</Text>
              <View style={styles.colorValRow}>
                <View style={[styles.swatchDot, { backgroundColor: item.primaryColor }]} />
                <Text style={styles.metaValue}>{item.primaryColorName}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>HEX CODE</Text>
              <Text style={styles.metaValue}>{item.primaryColor.toUpperCase()}</Text>
            </View>

            {item.pattern && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>PATTERN</Text>
                <Text style={styles.metaValue}>{item.pattern.toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STORAGE</Text>
              <Text style={styles.metaValue}>Local Vault ✓</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onAddToWorkbench(item);
                onClose();
              }}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Ionicons name="construct-outline" size={17} color={COLORS.background} style={styles.btnIcon} />
              <Text style={styles.btnPrimaryText}>Add to Workbench</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDeleteConfirm}
              style={[styles.btn, styles.btnDestructive]}
            >
              <Ionicons name="trash-outline" size={17} color={COLORS.destructive} style={styles.btnIcon} />
              <Text style={styles.btnDestructiveText}>Delete Piece</Text>
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
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    color: COLORS.accent,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginVertical: SPACING.sm,
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 12,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metaItem: {
    width: '46%',
  },
  metaLabel: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  colorValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actions: {
    gap: 8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
  btnDestructive: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: 'rgba(192, 82, 74, 0.4)',
  },
  btnDestructiveText: {
    color: COLORS.destructive,
    fontSize: 12,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
});
