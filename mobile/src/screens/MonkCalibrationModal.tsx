import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONK_SCALE, MONK_PALETTE_PROFILES } from '../core/monkScale';
import { COLORS, RADIUS, SPACING } from '../theme';
import { MonkTone } from '../types';

interface MonkCalibrationModalProps {
  visible: boolean;
  selectedLabel: string;
  onClose: () => void;
  onSelectTone: (tone: MonkTone) => void;
}

export const MonkCalibrationModal: React.FC<MonkCalibrationModalProps> = ({
  visible,
  selectedLabel,
  onClose,
  onSelectTone,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Skin tone scale</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {MONK_SCALE.map((tone) => {
              const isSelected = selectedLabel === tone.label;
              const profile = MONK_PALETTE_PROFILES[tone.label];

              return (
                <TouchableOpacity
                  key={tone.label}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectTone(tone);
                    onClose();
                  }}
                  style={[styles.toneRow, isSelected && styles.toneRowSelected]}
                >
                  <View style={[styles.toneCircle, { backgroundColor: tone.hex }]} />
                  <View style={styles.toneInfo}>
                    <Text style={styles.toneLabel}>
                      {tone.label} · {tone.name}
                    </Text>
                    <Text style={styles.toneMeta}>
                      {profile?.undertone} · {profile?.season}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    paddingBottom: SPACING.md,
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
  },
  toneRowSelected: {
    backgroundColor: COLORS.accentMuted,
  },
  toneCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  toneInfo: {
    flex: 1,
  },
  toneLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  toneMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
