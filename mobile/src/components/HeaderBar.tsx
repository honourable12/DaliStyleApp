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
      <View style={styles.brandContainer}>
        <StyloraLogo size={40} />
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>Stylora</Text>
          <Text style={styles.dateSubtitle}>
            {currentDate} · {tempC}° {weatherCondition}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRight}>
        {onPressSync && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onPressSync}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.iconBtn}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'cloud-download-outline'}
              size={20}
              color={isSyncing ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onPressProfile}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    // nothing
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dateSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  skinToneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  monkCode: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
