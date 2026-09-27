import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme';
import { UserStyleProfile } from '../types';
import { StyloraLogo } from './StyloraLogo';

interface HeaderBarProps {
  profile: UserStyleProfile;
  tempC?: number;
  weatherCondition?: string;
  onPressProfile?: () => void;
  onPressSync?: () => void;
  isSyncing?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  tempC = 24,
  weatherCondition = 'Clear',
  onPressProfile,
  onPressSync,
  isSyncing = false,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      {/* Brand & Date */}
      <View style={styles.brandContainer}>
        <StyloraLogo size={42} containerStyle={styles.brandLogo} />
        <View>
          <Text style={styles.brandTitle}>STYLORA</Text>
          <Text style={styles.dateSubtitle}>
            {currentDate} · {tempC}°C {weatherCondition}
          </Text>
        </View>
      </View>

      {/* Action Controls */}
      <View style={styles.actionsRight}>
        {/* Live Backend Sync Button */}
        {onPressSync && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPressSync}
            style={styles.iconBtn}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'cloud-download-outline'}
              size={18}
              color={isSyncing ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dateSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
