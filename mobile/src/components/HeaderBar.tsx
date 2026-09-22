import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { UserStyleProfile } from '../types';

interface HeaderBarProps {
  profile: UserStyleProfile;
  tempC?: number;
  weatherCondition?: string;
  onPressProfile?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  tempC = 24,
  weatherCondition = 'Clear',
  onPressProfile,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      {/* Brand & Date */}
      <View>
        <Text style={styles.brandTitle}>STYLORA</Text>
        <Text style={styles.dateSubtitle}>
          {currentDate} · {tempC}°C {weatherCondition}
        </Text>
      </View>

      {/* Monk Skin Calibration Pill */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressProfile}
        style={styles.profilePill}
      >
        <View style={[styles.skinToneDot, { backgroundColor: profile.skinHex }]} />
        <Text style={styles.monkCode}>{profile.monkLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  dateSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  skinToneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  monkCode: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
