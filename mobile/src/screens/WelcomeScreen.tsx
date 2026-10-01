import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, useTheme } from '../theme';
import { StyloraLogo } from '../components/StyloraLogo';

interface WelcomeScreenProps {
  onStart: () => void;
  onSignIn?: () => void;
}

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onSignIn }) => {
  const { colors, mode } = useTheme();

  const isLight = mode === 'alabaster';
  // Use Atelier Alabaster palette as showcased in the editorial design spec
  const bg = isLight ? '#F9F7F2' : colors.background;
  const cardBg = isLight ? '#FFFFFF' : colors.surfaceRaised;
  const elevatedBg = isLight ? '#F5F1E8' : colors.surface;
  const borderCol = isLight ? '#E8E2D5' : colors.surfaceBorder;
  const textDark = isLight ? '#191715' : colors.textPrimary;
  const textMuted = isLight ? '#78726A' : colors.textSecondary;
  const accentGold = '#D89622';

  const pillars = [
    {
      icon: 'color-palette-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Monk Skin Tone Calibration',
      tag: '10-MST',
      description:
        '10-shade ethical machine vision matching your authentic undertone with daylight fidelity.',
    },
    {
      icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
      title: 'The Morning Drape',
      tag: '5200K LUX',
      description:
        'One tailored daily ensemble synchronized with ambient temperature, humidity, and calendar context.',
    },
    {
      icon: 'infinite-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Wardrobe IQ & Circularity',
      tag: '+74% ACTIVE',
      description:
        'Revive dormant gems and optimize rotations without repetitive consumption cycles.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Atelier Bar */}
        <View style={styles.topHeader}>
          <View style={styles.brandCol}>
            <View style={styles.brandTitleRow}>
              <StyloraLogo size={26} />
              <Text style={[styles.brandLogoText, { color: textDark }]}>STYLORA</Text>
            </View>
            <Text style={[styles.brandSubtitle, { color: textMuted }]}>
              ATELIER CHROMATICS
            </Text>
          </View>

          <View style={[styles.syncedPill, { backgroundColor: elevatedBg, borderColor: borderCol }]}>
            <View style={styles.syncedDot} />
            <Text style={[styles.syncedText, { color: textDark }]}>MST-06 SYNCED</Text>
          </View>
        </View>

        {/* Edition Kicker */}
        <View style={styles.kickerWrap}>
          <View style={styles.kickerPill}>
            <Text style={styles.kickerText}>EST. ATELIER EDITION · MONK CHROMATICS</Text>
          </View>
        </View>

        {/* Editorial Headline with Italic Ochre Accent */}
        <View style={styles.headlineWrap}>
          <Text style={[styles.headline, { color: textDark }]}>
            Getting dressed{' '}
            <Text style={[styles.headlineItalic, { color: accentGold }]}>with someone</Text>
            {'\n'}who knows you.
          </Text>
          <Text style={[styles.subcopy, { color: textMuted }]}>
            STYLORA calibrates your daily wardrobe ritual to your natural skin undertones, tactile silhouette, and climate warmth. No styling questionnaires. Just pure chromatic intuition.
          </Text>
        </View>

        {/* Editorial Card with Drape Muse */}
        <View style={[styles.editorialCard, { borderColor: borderCol }]}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.editorialImage}
            resizeMode="cover"
          />

          {/* Top Overlaid Badges */}
          <View style={styles.imageTopOverlay}>
            <View style={styles.glassTonePill}>
              <View style={styles.swatchCircle} />
              <Text style={styles.glassToneText}>MST-06 · WARM GOLDEN</Text>
            </View>

            <View style={styles.glassSeasonPill}>
              <Text style={styles.glassSeasonText}>AUTUMN / 2026</Text>
            </View>
          </View>

          {/* Bottom Overlaid Fabric Composition Glass Card */}
          <View style={styles.fabricGlassCard}>
            <View style={styles.fabricHeaderRow}>
              <Text style={styles.fabricLabel}>FABRIC COMPOSITION</Text>
              <Text style={styles.fabricResonance}>98% Resonance</Text>
            </View>

            {/* Segmented Color Spectrum Bar */}
            <View style={styles.spectrumBar}>
              <View style={[styles.spectrumSegment, { flex: 0.55, backgroundColor: '#D89622' }]} />
              <View style={[styles.spectrumSegment, { flex: 0.25, backgroundColor: '#E8E2D5' }]} />
              <View style={[styles.spectrumSegment, { flex: 0.2, backgroundColor: '#78563A' }]} />
            </View>

            <View style={styles.fabricSubRow}>
              <Text style={styles.fabricItemName}>Raw Unbleached Linen</Text>
              <Text style={styles.fabricItemName}>Raw Silk Drapes</Text>
            </View>
          </View>
        </View>

        {/* 3 Pillar Feature Cards */}
        <View style={styles.pillarsContainer}>
          {pillars.map((item, index) => (
            <View
              key={index}
              style={[
                styles.pillarCard,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <View style={[styles.pillarIconWrap, { backgroundColor: elevatedBg }]}>
                <Ionicons name={item.icon} size={20} color={accentGold} />
              </View>

              <View style={styles.pillarContent}>
                <View style={styles.pillarHeaderRow}>
                  <Text style={[styles.pillarTitle, { color: textDark }]}>{item.title}</Text>
                  <Text style={styles.pillarTag}>{item.tag}</Text>
                </View>
                <Text style={[styles.pillarDescription, { color: textMuted }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Carousel Dots & Sartorial Sub-Kicker */}
        <View style={styles.paginationSection}>
          <View style={styles.dotsRow}>
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>
          <Text style={[styles.actKicker, { color: textMuted }]}>
            ACT I · SARTORIAL PRELUDE
          </Text>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onStart}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Calibrate My Tone & Begin</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Sign In Prompt */}
        <View style={styles.signInRow}>
          <Text style={[styles.signInPrompt, { color: textMuted }]}>
            Already have an Atelier archive?{' '}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSignIn || onStart}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Monograph Micro-Print Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>
            MONK SKIN TONE SCALE © GOOGLE & DR. ELLIS MONK · ATELIER EDITION
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingTop: 4,
  },
  brandCol: {
    gap: 2,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  brandSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginLeft: 34,
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  syncedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D89622',
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  kickerWrap: {
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  kickerPill: {
    backgroundColor: 'rgba(216, 150, 34, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xs,
  },
  kickerText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#B57A18',
  },
  headlineWrap: {
    marginBottom: SPACING.lg,
  },
  headline: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  },
  headlineItalic: {
    fontStyle: 'italic',
    fontWeight: '700',
  },
  subcopy: {
    fontSize: 13,
    lineHeight: 19.5,
  },
  editorialCard: {
    width: '100%',
    height: 350,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  editorialImage: {
    width: '100%',
    height: '100%',
  },
  imageTopOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassTonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
  },
  swatchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A07850',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  glassToneText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#26221E',
  },
  glassSeasonPill: {
    backgroundColor: 'rgba(25, 23, 21, 0.78)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  glassSeasonText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#F5F2EB',
  },
  fabricGlassCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  fabricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fabricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#524C44',
  },
  fabricResonance: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D89622',
  },
  spectrumBar: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    gap: 3,
  },
  spectrumSegment: {
    height: '100%',
    borderRadius: 2,
  },
  fabricSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fabricItemName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38332E',
  },
  pillarsContainer: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  pillarIconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pillarContent: {
    flex: 1,
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillarTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pillarTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#A07850',
  },
  pillarDescription: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  paginationSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D89622',
  },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5CFC5',
  },
  actKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D89622',
    height: 54,
    borderRadius: 12,
    gap: 8,
    marginBottom: SPACING.md,
    shadowColor: '#D89622',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signInPrompt: {
    fontSize: 12,
  },
  signInLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#191715',
    textDecorationLine: 'underline',
  },
  footerWrap: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  footerText: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#A0998F',
    textAlign: 'center',
  },
});
