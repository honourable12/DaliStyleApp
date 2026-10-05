import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStyleProfile, WardrobeItem, AuthUser } from '../types';
import { COLORS, RADIUS, SPACING, useTheme } from '../theme';
import { MONK_PALETTE_PROFILES } from '../core/monkScale';
import { StyloraLogo } from '../components/StyloraLogo';
import { wardrobeStore } from '../db/storage';
import { calculateWardrobeIQ } from '../core/colorTheory';
import { requestAndFetchLocationWeather } from '../services/weatherService';
import { showAtelierToast } from '../context/ToastContext';

interface ProfileScreenProps {
  profile: UserStyleProfile;
  wardrobe: WardrobeItem[];
  currentUser?: AuthUser | null;
  onUpdatePersona: (persona: UserStyleProfile['persona']) => void;
  onOpenSelfieCalibration: () => void;
  onOpenMonkList: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onRelaunchOnboarding?: () => void;
  onLocationUpdated?: (locationName: string, tempC: number, condition: 'Sunny' | 'Cold' | 'Rainy' | 'Clear') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  wardrobe,
  currentUser,
  onUpdatePersona,
  onOpenSelfieCalibration,
  onOpenMonkList,
  onOpenAuth,
  onLogout,
  onRelaunchOnboarding,
  onLocationUpdated,
}) => {
  const [backendIp, setBackendIp] = useState('10.0.2.2:8000');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { mode, setMode, colors } = useTheme();

  const isCalibrated = Boolean(profile.skinHex);
  const wardrobeIQ = calculateWardrobeIQ(wardrobe, profile.monkLabel);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const weather = await requestAndFetchLocationWeather();
      if (weather) {
        if (onLocationUpdated) {
          onLocationUpdated(weather.locationName, weather.tempC, weather.condition);
        }
        showAtelierToast({
          title: 'WEATHER SYNCHRONIZED',
          message: `${weather.locationName} (${weather.tempC}°C, ${weather.condition})`,
          type: 'success',
          icon: 'partly-sunny',
        });
      } else {
        showAtelierToast({
          title: 'LOCATION REQUIRED',
          message: 'Could not detect live coordinates. Please enable device location.',
          type: 'warning',
        });
      }
    } catch (e: any) {
      showAtelierToast({
        title: 'LOCATION ERROR',
        message: e.message || 'Could not fetch weather telemetry.',
        type: 'error',
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const personas: Array<UserStyleProfile['persona']> = ['Minimalist', 'Bold', 'Fluid', 'Classic'];

  const monkProfile = MONK_PALETTE_PROFILES[profile.monkLabel] || {
    season: 'All-Year',
    undertone: 'Neutral',
    recommendedAccents: ['#E8A830', '#1A1917', '#F2EDE6'],
  };

  const tops = wardrobe.filter((i) => i.category === 'top').length;
  const bottoms = wardrobe.filter((i) => i.category === 'bottom').length;
  const outer = wardrobe.filter((i) => i.category === 'outerwear').length;
  const shoes = wardrobe.filter((i) => i.category === 'shoes').length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Skin tone */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Skin tone</Text>
          <TouchableOpacity onPress={onOpenMonkList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
            <Text style={styles.linkText}>Scale</Text>
          </TouchableOpacity>
        </View>

        {isCalibrated ? (
          <>
            <View style={styles.toneHero}>
              <View style={[styles.skinColorOrb, { backgroundColor: profile.skinHex }]} />
              <View style={styles.toneHeroText}>
                <Text style={styles.toneTitle}>
                  {profile.monkLabel} · {profile.skinName}
                </Text>
                <Text style={styles.toneSubtitle}>
                  {monkProfile.undertone} · {monkProfile.season}
                </Text>
              </View>
            </View>

            <View style={styles.swatchRow}>
              {monkProfile.recommendedAccents.map((hex, idx) => (
                <View key={idx} style={[styles.swatchBox, { backgroundColor: hex }]} />
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenSelfieCalibration}
              style={styles.selfieActionBtn}
            >
              <Ionicons name="camera-reverse-outline" size={17} color={COLORS.background} style={styles.btnIcon} />
              <Text style={styles.selfieBtnText}>Recalibrate with selfie</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: SPACING.md }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.surfaceRaised,
                borderWidth: 2,
                borderColor: colors.accent,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="scan-outline" size={28} color={colors.accent} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>
              Awaiting Biometric Calibration
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, marginBottom: 14 }}>
              Scan your cheek tone with our on-device AI to calibrate precision color contrast.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenSelfieCalibration}
              style={[styles.selfieActionBtn, { width: '100%', backgroundColor: colors.accent }]}
            >
              <Ionicons name="camera" size={18} color={COLORS.background} style={styles.btnIcon} />
              <Text style={[styles.selfieBtnText, { color: COLORS.background, fontWeight: '800' }]}>
                Take Selfie to Calibrate
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Persona */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Persona</Text>
        <View style={styles.personaRow}>
          {personas.map((p) => {
            const isActive = profile.persona === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.7}
                onPress={() => onUpdatePersona(p)}
                style={[styles.personaPill, isActive && styles.personaPillActive]}
              >
                <Text style={[styles.personaText, isActive && styles.personaTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Theme Switch */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <Text style={styles.themeCurrentLabel}>
            {mode === 'editorial' ? 'Editorial' : 'Alabaster'}
          </Text>
        </View>

        <View style={styles.themeSwitchRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setMode('editorial');
              wardrobeStore.setThemeMode('editorial');
            }}
            style={[styles.themePill, mode === 'editorial' && styles.themePillActive]}
          >
            <Ionicons
              name="moon"
              size={14}
              color={mode === 'editorial' ? '#141312' : COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.themePillText, mode === 'editorial' && styles.themePillTextActive]}>
              Editorial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setMode('alabaster');
              wardrobeStore.setThemeMode('alabaster');
            }}
            style={[styles.themePill, mode === 'alabaster' && styles.themePillActive]}
          >
            <Ionicons
              name="sunny"
              size={14}
              color={mode === 'alabaster' ? '#141312' : COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.themePillText, mode === 'alabaster' && styles.themePillTextActive]}>
              Alabaster
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wardrobe IQ & Circularity */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="analytics" size={18} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Wardrobe IQ & Circularity</Text>
          </View>
          <View style={[styles.iqBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[styles.iqBadgeText, { color: colors.accent }]}>{wardrobeIQ.harmonyIndex}% Harmony</Text>
          </View>
        </View>

        {wardrobe.length === 0 ? (
          <View style={styles.emptyIqBox}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyIqText, { color: colors.textSecondary }]}>
              Add garments to your digital closet to unlock algorithmic color distribution, circularity metrics, and your strategic consultant report.
            </Text>
          </View>
        ) : (
          <>
            {/* Circularity and vault metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{wardrobeIQ.totalPieces}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Pieces</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{wardrobeIQ.activeRotationPercent}%</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Active Rotation</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{wardrobeIQ.dormantCount}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Dormant</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.accent }]}>{wardrobeIQ.harmonyIndex}%</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Harmony Index</Text>
              </View>
            </View>

            {/* Distribution bars */}
            <View style={styles.distributionContainer}>
              <Text style={[styles.distributionSectionTitle, { color: colors.textMuted }]}>
                CHROMATIC DISTRIBUTION
              </Text>
              {[
                { label: 'Neutral', percent: wardrobeIQ.distribution.Neutral, barColor: mode === 'alabaster' ? '#2B2927' : '#E8E5DF' },
                { label: 'Vibrant', percent: wardrobeIQ.distribution.Vibrant, barColor: '#D89622' },
                { label: 'Muted', percent: wardrobeIQ.distribution.Muted, barColor: '#536B78' },
                { label: 'Earthy', percent: wardrobeIQ.distribution.Earthy, barColor: '#A0633C' },
              ].map((item) => (
                <View key={item.label} style={styles.distRow}>
                  <View style={styles.distHeaderRow}>
                    <Text style={[styles.distLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.distPercent, { color: colors.textSecondary }]}>{item.percent}%</Text>
                  </View>
                  <View style={[styles.distTrack, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.distFill,
                        {
                          width: `${Math.max(item.percent, 2)}%`,
                          backgroundColor: item.barColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Strategic Consultant Report Quote Card */}
            <View style={[styles.consultantCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.consultantHeader}>
                <Ionicons name="sparkles" size={14} color={colors.accent} />
                <Text style={[styles.consultantTitle, { color: colors.accent }]}>
                  STRATEGIC CONSULTANT REPORT
                </Text>
              </View>
              <Text style={[styles.consultantQuote, { color: colors.textPrimary }]}>
                "{wardrobeIQ.consultantReport}"
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Climate & Location */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surfaceRaised }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="location-outline" size={18} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Climate & Location</Text>
          </View>
          {profile.locationName ? (
            <View style={styles.statusPill}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          ) : (
            <View style={styles.statusPill}>
              <Ionicons name="alert-circle-outline" size={12} color={colors.accent} />
              <Text style={[styles.statusText, { color: colors.accent }]}>Unset</Text>
            </View>
          )}
        </View>

        <Text style={[styles.locationDetailText, { color: colors.textSecondary }]}>
          {profile.locationName
            ? `Synchronized to ${profile.locationName}. Used to contextualize weather-adaptive outfit recommendations with live Open-Meteo telemetry.`
            : 'No location configured. Daily styling recommendations are operating in ambient fallback mode without live weather adaptation.'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDetectLocation}
          disabled={detectingLocation}
          style={[styles.locationDetectBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          {detectingLocation ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="navigate-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.locationDetectBtnText, { color: colors.textPrimary }]}>
            {detectingLocation
              ? 'Detecting Location & Weather...'
              : profile.locationName
              ? 'Refresh Location & Weather'
              : 'Detect Live Location & Weather'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: currentUser?.isAuthenticated ? COLORS.success : COLORS.accent }]} />
            <Text style={styles.statusText}>
              {currentUser?.isAuthenticated ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <Text style={styles.accountEmailText}>
          {currentUser?.email || 'Local guest'}
        </Text>

        <View style={styles.accountActionRow}>
          {onOpenAuth && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenAuth}
              style={styles.accountBtn}
            >
              <Ionicons name="key-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.accountBtnText}>
                {currentUser?.isAuthenticated ? 'Switch' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          )}

          {currentUser?.isAuthenticated && onLogout && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onLogout}
              style={[styles.accountBtn, { borderColor: COLORS.destructive }]}
            >
              <Ionicons name="log-out-outline" size={16} color={COLORS.destructive} style={{ marginRight: 8 }} />
              <Text style={[styles.accountBtnText, { color: COLORS.destructive }]}>Sign out</Text>
            </TouchableOpacity>
          )}
        </View>

        {onRelaunchOnboarding && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRelaunchOnboarding}
            style={styles.onboardingRelaunchBtn}
          >
            <Ionicons name="compass-outline" size={16} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.onboardingRelaunchText}>Redo onboarding</Text>
          </TouchableOpacity>
        )}
      </View>

        {/* Backend card commented out for offline testing launch
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Backend</Text>
          <View style={styles.ipInputRow}>
            <TextInput
              style={styles.ipInput}
              value={backendIp}
              onChangeText={setBackendIp}
              placeholder="192.168.1.100:8000"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => showAtelierToast('Saved', `Backend set to http://${backendIp}`, 'success')}
              style={styles.saveIpBtn}
            >
              <Text style={styles.saveIpBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
        */}

      {/* Brand footer */}
      <View style={styles.brandFooter}>
        <StyloraLogo size={56} />
        <Text style={styles.footerBrandName}>Stylora</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  toneHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  skinColorOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  toneHeroText: {
    flex: 1,
  },
  toneTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  toneSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  swatchBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  selfieActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  selfieBtnText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },
  btnIcon: {
    marginRight: 8,
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
  },
  personaPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  personaPillActive: {
    backgroundColor: COLORS.accent,
  },
  personaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  personaTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  accountEmailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  accountActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  accountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  accountBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  onboardingRelaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorderStrong,
  },
  onboardingRelaunchText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  ipInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.sm,
  },
  ipInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  saveIpBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIpBtnText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  brandFooter: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  footerBrandName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  footerVersion: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  themeCurrentLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  themeSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.xs,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  themePillActive: {
    backgroundColor: COLORS.accent,
  },
  themePillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  themePillTextActive: {
    color: '#141312',
    fontWeight: '800',
  },
  iqBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  iqBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyIqBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: 8,
  },
  emptyIqText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  distributionContainer: {
    marginTop: SPACING.md,
    gap: 10,
  },
  distributionSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  distRow: {
    gap: 4,
  },
  distHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  distPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  distTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 3,
  },
  consultantCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  consultantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  consultantTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  consultantQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  locationDetailText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  locationDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
  },
  locationDetectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
