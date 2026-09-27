import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme';
import { StyloraLogo } from '../components/StyloraLogo';
import { MONK_SCALE } from '../core/monkScale';
import { UserStyleProfile, MonkTone, WardrobeItem } from '../types';
import { GarmentVisual } from '../components/GarmentVisual';
import { calculateGarmentHarmony, calculateSkinContrast } from '../core/colorTheory';

interface OnboardingScreenProps {
  initialProfile: UserStyleProfile;
  seedWardrobe: WardrobeItem[];
  onComplete: (profile: UserStyleProfile) => void;
  onOpenSelfie?: () => void;
}

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  initialProfile,
  seedWardrobe,
  onComplete,
  onOpenSelfie,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedTone, setSelectedTone] = useState<MonkTone>(() => {
    return (
      MONK_SCALE.find((t: MonkTone) => t.label === initialProfile.monkLabel) ||
      MONK_SCALE[4]
    );
  });
  const [selectedPersona, setSelectedPersona] = useState<UserStyleProfile['persona']>(
    initialProfile.persona || 'Minimalist'
  );

  const personas: Array<{
    id: UserStyleProfile['persona'];
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      id: 'Minimalist',
      title: 'Minimalist',
      subtitle: 'Clean lines, monochromatic balance, and timeless functional cuts.',
      icon: 'cube-outline',
    },
    {
      id: 'Bold',
      title: 'Bold',
      subtitle: 'High chrominance contrast, statement pieces, and artistic drama.',
      icon: 'flash-outline',
    },
    {
      id: 'Fluid',
      title: 'Fluid',
      subtitle: 'Soft drapes, relaxed layering, and organic earthy color palettes.',
      icon: 'water-outline',
    },
    {
      id: 'Classic',
      title: 'Classic',
      subtitle: 'Structured tailoring, heritage coats, and quiet luxury foundations.',
      icon: 'ribbon-outline',
    },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const finishOnboarding = () => {
    const updatedProfile: UserStyleProfile = {
      ...initialProfile,
      monkLabel: selectedTone.label,
      skinHex: selectedTone.hex,
      skinName: selectedTone.name,
      persona: selectedPersona,
    };
    onComplete(updatedProfile);
  };

  // Preview look for Step 3
  const topItem = seedWardrobe.find((i) => i.category === 'top') || seedWardrobe[0];
  const bottomItem = seedWardrobe.find((i) => i.category === 'bottom') || seedWardrobe[1];
  const harmony = calculateGarmentHarmony([topItem?.primaryColor, bottomItem?.primaryColor].filter(Boolean) as string[]);
  const contrast = calculateSkinContrast(selectedTone.hex, topItem?.primaryColor || '#E8A830');

  return (
    <View style={styles.container}>
      {/* Top Bar with Step Indicators & Skip */}
      <View style={styles.topBar}>
        <View style={styles.stepPills}>
          {[1, 2, 3].map((step) => {
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <View
                key={step}
                style={[
                  styles.stepPill,
                  isActive && styles.stepPillActive,
                  isDone && styles.stepPillDone,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillText,
                    isActive && styles.stepPillTextActive,
                    isDone && styles.stepPillTextDone,
                  ]}
                >
                  {isDone ? '✓' : step}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <StyloraLogo
            size={68}
            containerStyle={styles.logoBadge}
          />
          <Text style={styles.brandHeading}>STYLORA ATELIER</Text>
          <Text style={styles.stepTitle}>
            {currentStep === 1 && 'STEP 1 · SKIN CALIBRATION'}
            {currentStep === 2 && 'STEP 2 · STYLE PERSONA'}
            {currentStep === 3 && 'STEP 3 · YOUR DIGITAL VAULT'}
          </Text>
        </View>

        {/* STEP 1: SKIN CALIBRATION */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Stylora uses the 10-tone Monk Skin Tone (MST) scale to calculate exact chromatic contrast for every outfit.
            </Text>

            {/* Selected Tone Preview */}
            <View style={styles.selectedToneCard}>
              <View style={[styles.largeToneOrb, { backgroundColor: selectedTone.hex }]} />
              <View style={styles.selectedToneMeta}>
                <Text style={styles.selectedToneLabel}>{selectedTone.label}</Text>
                <Text style={styles.selectedToneName}>{selectedTone.name}</Text>
                <Text style={styles.selectedToneHex}>{selectedTone.hex.toUpperCase()}</Text>
              </View>
            </View>

            {/* Selfie AI Calibration Option */}
            {onOpenSelfie && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenSelfie}
                style={styles.selfieActionBtn}
              >
                <Ionicons name="camera-outline" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
                <Text style={styles.selfieActionText}>Calibrate with Selfie Camera</Text>
              </TouchableOpacity>
            )}

            {/* 10-Tone Monk Grid */}
            <Text style={styles.gridSectionHeader}>OR SELECT YOUR TONE MANUALLY</Text>
            <View style={styles.toneGrid}>
              {MONK_SCALE.map((tone: MonkTone) => {
                const isSelected = selectedTone.label === tone.label;
                return (
                  <TouchableOpacity
                    key={tone.label}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTone(tone)}
                    style={[
                      styles.toneCell,
                      isSelected && styles.toneCellSelected,
                    ]}
                  >
                    <View style={[styles.toneDot, { backgroundColor: tone.hex }]} />
                    <Text style={[styles.toneCellCode, isSelected && styles.toneCellCodeSelected]}>
                      {tone.label.replace('MST-', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: STYLE PERSONA */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Select the design philosophy that guides your daily aesthetic and wardrobe composition.
            </Text>

            <View style={styles.personaList}>
              {personas.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPersona(p.id)}
                    style={[
                      styles.personaCard,
                      isSelected && styles.personaCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.personaIconWrap,
                        isSelected && styles.personaIconWrapSelected,
                      ]}
                    >
                      <Ionicons
                        name={p.icon}
                        size={22}
                        color={isSelected ? COLORS.background : COLORS.accent}
                      />
                    </View>
                    <View style={styles.personaTextWrap}>
                      <Text
                        style={[
                          styles.personaTitle,
                          isSelected && styles.personaTitleSelected,
                        ]}
                      >
                        {p.title}
                      </Text>
                      <Text style={styles.personaSubtitle}>{p.subtitle}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.accent}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: INITIAL DIGITAL VAULT */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Your bespoke atelier is calibrated! We have curated a foundational capsule vault tuned to your tone.
            </Text>

            {/* Generated First Look Preview */}
            <View style={styles.firstLookCard}>
              <View style={styles.lookHeader}>
                <Text style={styles.lookTag}>YOUR INAUGURAL LOOK</Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>HARMONY {harmony.score}%</Text>
                </View>
              </View>

              <View style={styles.lookItemsRow}>
                {topItem && (
                  <View style={styles.lookItemPreview}>
                    <GarmentVisual
                      imageUrl={topItem.imageUrl}
                      category={topItem.category}
                      primaryColor={topItem.primaryColor}
                      primaryColorName={topItem.primaryColorName}
                      name={topItem.name}
                      style={styles.lookItemImage}
                      iconSize={22}
                    />
                    <Text style={styles.lookItemName} numberOfLines={1}>{topItem.name}</Text>
                  </View>
                )}
                {bottomItem && (
                  <View style={styles.lookItemPreview}>
                    <GarmentVisual
                      imageUrl={bottomItem.imageUrl}
                      category={bottomItem.category}
                      primaryColor={bottomItem.primaryColor}
                      primaryColorName={bottomItem.primaryColorName}
                      name={bottomItem.name}
                      style={styles.lookItemImage}
                      iconSize={22}
                    />
                    <Text style={styles.lookItemName} numberOfLines={1}>{bottomItem.name}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.lookInsight}>
                Calculated for {selectedTone.label} undertone. Skin contrast rating of {contrast}% delivers effortless balance.
              </Text>
            </View>

            {/* Capsule summary */}
            <View style={styles.capsuleInfoRow}>
              <Ionicons name="sparkles" size={15} color={COLORS.accent} />
              <Text style={styles.capsuleInfoText}>
                {seedWardrobe.length} starter pieces initialized in your offline vault
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomBar}>
        {currentStep > 1 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
            <Text style={styles.backBtnText}>BACK</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === 3 ? 'ENTER VAULT' : 'CONTINUE'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  stepPills: {
    flexDirection: 'row',
    gap: 8,
  },
  stepPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  stepPillDone: {
    backgroundColor: COLORS.surfaceBorder,
    borderColor: COLORS.accent,
  },
  stepPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  stepPillTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  stepPillTextDone: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
    alignItems: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(232, 168, 48, 0.4)',
  },
  brandHeading: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
  },
  stepTitle: {
    color: COLORS.accent,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  stepCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  selectedToneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  largeToneOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  selectedToneMeta: {
    flex: 1,
  },
  selectedToneLabel: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  selectedToneName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  selectedToneHex: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  selfieActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    marginBottom: SPACING.lg,
  },
  selfieActionText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  gridSectionHeader: {
    color: COLORS.accentSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  toneCell: {
    alignItems: 'center',
    padding: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceRaised,
    width: (width - 100) / 5,
  },
  toneCellSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(232, 168, 48, 0.15)',
  },
  toneDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  toneCellCode: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  toneCellCodeSelected: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  personaList: {
    gap: 10,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  personaCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(232, 168, 48, 0.1)',
  },
  personaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  personaIconWrapSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  personaTextWrap: {
    flex: 1,
  },
  personaTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  personaTitleSelected: {
    color: COLORS.accent,
  },
  personaSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  firstLookCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lookTag: {
    color: COLORS.accent,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scorePill: {
    backgroundColor: 'rgba(232, 168, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  lookItemsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: SPACING.sm,
  },
  lookItemPreview: {
    flex: 1,
  },
  lookItemImage: {
    width: '100%',
    height: 120,
    borderRadius: RADIUS.sm,
  },
  lookItemName: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  lookInsight: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  capsuleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  capsuleInfoText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceRaised,
    gap: 4,
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  nextBtnText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
