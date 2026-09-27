import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStyleProfile, WardrobeItem, AuthUser } from '../types';
import { COLORS, RADIUS, SPACING } from '../theme';
import { MONK_PALETTE_PROFILES } from '../core/monkScale';
import { StyloraLogo } from '../components/StyloraLogo';

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
}) => {
  const [backendIp, setBackendIp] = useState('10.0.2.2:8000');

  const personas: Array<UserStyleProfile['persona']> = ['Minimalist', 'Bold', 'Fluid', 'Classic'];

  const monkProfile = MONK_PALETTE_PROFILES[profile.monkLabel] || {
    season: 'All-Year',
    undertone: 'Neutral',
    recommendedAccents: ['#E8A830', '#1A1917', '#F2EDE6'],
  };

  // Metrics
  const tops = wardrobe.filter((i) => i.category === 'top').length;
  const bottoms = wardrobe.filter((i) => i.category === 'bottom').length;
  const outer = wardrobe.filter((i) => i.category === 'outerwear').length;
  const shoes = wardrobe.filter((i) => i.category === 'shoes').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>STYLE PROFILE & VAULT</Text>
      <Text style={styles.subHeading}>Personal calibration and wardrobe diagnostics</Text>

      {/* Monk Tone Calibration Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>SKIN TONE CALIBRATION</Text>
          <TouchableOpacity onPress={onOpenMonkList}>
            <Text style={styles.linkText}>Browse Scale →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toneHero}>
          <View style={[styles.skinColorOrb, { backgroundColor: profile.skinHex }]} />
          <View style={styles.toneHeroText}>
            <Text style={styles.toneTitle}>
              {profile.monkLabel} · {profile.skinName}
            </Text>
            <Text style={styles.toneSubtitle}>
              {monkProfile.undertone} Undertone · {monkProfile.season} Palette
            </Text>
          </View>
        </View>

        {/* Recommended Accents */}
        <Text style={styles.subLabel}>COMPATIBLE COLOR ACCENTS:</Text>
        <View style={styles.swatchRow}>
          {monkProfile.recommendedAccents.map((hex, idx) => (
            <View key={idx} style={[styles.swatchBox, { backgroundColor: hex }]} />
          ))}
        </View>

        {/* Retake Selfie Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenSelfieCalibration}
          style={styles.selfieActionBtn}
        >
          <Ionicons name="camera-reverse-outline" size={16} color={COLORS.background} style={styles.btnIcon} />
          <Text style={styles.selfieBtnText}>Retake Style Selfie</Text>
        </TouchableOpacity>
      </View>

      {/* Style Persona Selector */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>STYLE PERSONA</Text>
        <Text style={styles.sectionDesc}>Shapes how aggressive or subtle DRAPE curates outfits.</Text>

        <View style={styles.personaRow}>
          {personas.map((p) => {
            const isActive = profile.persona === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
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

      {/* Wardrobe Diagnostics */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>WARDROBE DIAGNOSTICS</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{wardrobe.length}</Text>
            <Text style={styles.metricLabel}>TOTAL PIECES</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{tops}</Text>
            <Text style={styles.metricLabel}>TOPS</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{bottoms}</Text>
            <Text style={styles.metricLabel}>BOTTOMS</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{outer + shoes}</Text>
            <Text style={styles.metricLabel}>LAYERS & SHOES</Text>
          </View>
        </View>
      </View>

      {/* Account & Atelier Access */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>ATELIER ACCOUNT & SESSION</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: currentUser?.isAuthenticated ? COLORS.success : COLORS.accent }]} />
            <Text style={styles.statusText}>
              {currentUser?.isAuthenticated ? 'ONLINE SYNC' : 'OFFLINE VAULT'}
            </Text>
          </View>
        </View>

        <Text style={styles.accountEmailText}>
          {currentUser?.email ? currentUser.email : 'Local Guest Atelier (Zero-Cloud)'}
        </Text>

        <View style={styles.accountActionRow}>
          {onOpenAuth && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenAuth}
              style={styles.accountBtn}
            >
              <Ionicons name="key-outline" size={15} color={COLORS.accent} style={{ marginRight: 6 }} />
              <Text style={styles.accountBtnText}>
                {currentUser?.isAuthenticated ? 'Switch Account' : 'Sign In / Register'}
              </Text>
            </TouchableOpacity>
          )}

          {currentUser?.isAuthenticated && onLogout && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onLogout}
              style={[styles.accountBtn, { borderColor: COLORS.destructive }]}
            >
              <Ionicons name="log-out-outline" size={15} color={COLORS.destructive} style={{ marginRight: 6 }} />
              <Text style={[styles.accountBtnText, { color: COLORS.destructive }]}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Relaunch Onboarding Tour */}
        {onRelaunchOnboarding && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRelaunchOnboarding}
            style={styles.onboardingRelaunchBtn}
          >
            <Ionicons name="compass-outline" size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.onboardingRelaunchText}>Relaunch Onboarding Tour</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Server & Connectivity Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>BACKEND SERVER CONNECTIVITY</Text>
        <Text style={styles.sectionDesc}>
          Set your computer's IP address if testing on a physical phone on the same Wi-Fi.
        </Text>

        <View style={styles.ipInputRow}>
          <TextInput
            style={styles.ipInput}
            value={backendIp}
            onChangeText={setBackendIp}
            placeholder="e.g. 192.168.1.100:8000"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Saved Host', `FastAPI backend target set to: http://${backendIp}`)}
            style={styles.saveIpBtn}
          >
            <Text style={styles.saveIpBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Brand Footer */}
      <View style={styles.brandFooter}>
        <StyloraLogo size={64} containerStyle={styles.footerLogo} />
        <Text style={styles.footerBrandName}>STYLORA</Text>
        <Text style={styles.footerVersion}>DRAPE AI PERSONAL STYLING ENGINE · v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  heading: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  linkText: {
    color: COLORS.accentSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  toneHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  skinColorOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  toneHeroText: {
    flex: 1,
  },
  toneTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  toneSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  subLabel: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 6,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  swatchBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selfieActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  selfieBtnText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },
  btnIcon: {
    marginRight: 6,
  },
  personaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  personaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  personaPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  personaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  personaTextActive: {
    color: COLORS.background,
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
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: COLORS.accent,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  ipInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ipInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  saveIpBtn: {
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIpBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accountEmailText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  accountBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  onboardingRelaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 48, 0.4)',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  onboardingRelaunchText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  brandFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerLogo: {
    marginBottom: 8,
  },
  footerBrandName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  footerVersion: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
