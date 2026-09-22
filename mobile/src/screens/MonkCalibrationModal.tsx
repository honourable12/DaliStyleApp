import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
            <View>
              <Text style={styles.title}>MONK SKIN TONE SCALE</Text>
              <Text style={styles.subtitle}>Select or calibrate your skin undertone profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {MONK_SCALE.map((tone) => {
              const isSelected = selectedLabel === tone.label;
              const profile = MONK_PALETTE_PROFILES[tone.label];

              return (
                <TouchableOpacity
                  key={tone.label}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectTone(tone);
                    onClose();
                  }}
                  style={[styles.toneRow, isSelected && styles.toneRowSelected]}
                >
                  <View style={[styles.toneCircle, { backgroundColor: tone.hex }]} />
                  <View style={styles.toneInfo}>
                    <Text style={styles.toneLabel}>
                      {tone.label} — {tone.name}
                    </Text>
                    <Text style={styles.toneMeta}>
                      {profile?.undertone} undertone · {profile?.season}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.activeCheck}>✓ Active</Text>}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  title: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  list: {
    paddingBottom: SPACING.md,
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  toneRowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(232, 168, 48, 0.08)',
  },
  toneCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  toneInfo: {
    flex: 1,
  },
  toneLabel: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  toneMeta: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  activeCheck: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
  },
});
