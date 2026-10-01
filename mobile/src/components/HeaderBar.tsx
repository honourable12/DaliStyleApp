import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, useTheme } from '../theme';
import { UserStyleProfile } from '../types';
import { StyloraLogo } from './StyloraLogo';

interface HeaderBarProps {
  profile: UserStyleProfile;
  tempC?: number;
  weatherCondition?: string;
  isWeatherLoaded?: boolean;
  onPressProfile?: () => void;
  onPressLocation?: () => void;
  onPressSync?: () => void;
  isSyncing?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  tempC = 24,
  weatherCondition = 'Clear',
  isWeatherLoaded = false,
  onPressProfile,
  onPressLocation,
  onPressSync,
  isSyncing = false,
}) => {
  const { colors } = useTheme();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const hasLocation = Boolean(profile.locationName);
  const isCalibrated = Boolean(profile.skinHex);

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.brandContainer}>
        <StyloraLogo size={40} />
        <View style={styles.brandText}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Stylora</Text>
          {hasLocation && isWeatherLoaded ? (
            <TouchableOpacity onPress={onPressLocation} activeOpacity={0.7} style={styles.weatherRow}>
              <Ionicons name="location-sharp" size={11} color={colors.accent} />
              <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
                {profile.locationName} · {tempC}° {weatherCondition}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onPressLocation}
              activeOpacity={0.7}
              style={styles.weatherRow}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
            >
              <Ionicons name="location-outline" size={12} color={colors.accent} />
              <Text style={[styles.dateSubtitle, { color: colors.accent, fontWeight: '700' }]}>
                Enable Weather
              </Text>
              <Text style={[styles.dateSubtitle, { color: colors.textMuted }]}>
                · {currentDate}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actionsRight}>
        {/* Backend sync button commented out for offline test launch
        {onPressSync && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onPressSync}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceRaised }]}
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'cloud-download-outline'}
              size={20}
              color={isSyncing ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        */}

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onPressProfile}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={[styles.profilePill, { backgroundColor: colors.surfaceRaised }]}
        >
          {isCalibrated ? (
            <>
              <View
                style={[
                  styles.skinToneDot,
                  { backgroundColor: profile.skinHex, borderColor: colors.surfaceBorderStrong },
                ]}
              />
              <Text style={[styles.monkCode, { color: colors.textPrimary }]}>
                {profile.monkLabel}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="scan-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.monkCode, { color: colors.accent, fontWeight: '800' }]}>
                Scan Tone
              </Text>
            </>
          )}
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
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
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
