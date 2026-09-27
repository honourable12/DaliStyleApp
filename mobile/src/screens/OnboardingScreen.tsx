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
    { id: 'Minimalist', title: 'Minimalist', subtitle: 'Clean lines, monochrome balance.', icon: 'cube-outline' },
    { id: 'Bold', title: 'Bold', subtitle: 'High contrast, statement pieces.', icon: 'flash-outline' },
    { id: 'Fluid', title: 'Fluid', subtitle: 'Soft drapes, relaxed layering.', icon: 'water-outline' },
    { id: 'Classic', title: 'Classic', subtitle: 'Structured tailoring, quiet luxury.', icon: 'ribbon-outline' },
  ];

  const handleNext = () => {
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
    else finishOnboarding();
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

  const topItem = seedWardrobe.find((i) => i.category === 'top') || seedWardrobe[0];
  const bottomItem = seedWardrobe.find((i) => i.category === 'bottom') || seedWardrobe[1];
  const harmony = calculateGarmentHarmony([topItem?.primaryColor, bottomItem?.primaryColor].filter(Boolean) as string[]);
  const contrast = calculateSkinContrast(selectedTone.hex, topItem?.primaryColor || '#E8A830');

  return (
    <View style={styles.container}>
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

        <TouchableOpacity onPress={finishOnboarding} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHero}>
          <StyloraLogo size={64} />
          <Text style={styles.brandHeading}>Stylora</Text>
          <Text style={styles.stepTitle}>
            {currentStep === 1 && 'Skin tone'}
            {currentStep === 2 && 'Style persona'}
            {currentStep === 3 && 'Your vault'}
          </Text>
        </View>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Pick your tone on the Monk scale to calibrate color contrast.
            </Text>

            <View style={styles.selectedToneCard}>
              <View style={[styles.largeToneOrb, { backgroundColor: selectedTone.hex }]} />
              <View style={styles.selectedToneMeta}>
                <Text style={styles.selectedToneLabel}>{selectedTone.label}</Text>
                <Text style={styles.selectedToneName}>{selectedTone.name}</Text>
              </View>
            </View>

            {onOpenSelfie && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenSelfie}
                style={styles.selfieActionBtn}
              >
                <Ionicons name="camera-outline" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
                <Text style={styles.selfieActionText}>Calibrate with selfie</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.gridSectionHeader}>or pick manually</Text>
            <View style={styles.toneGrid}>
              {MONK_SCALE.map((tone: MonkTone) => {
                const isSelected = selectedTone.label === tone.label;
                return (
                  <TouchableOpacity
                    key={tone.label}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTone(tone)}
                    style={[styles.toneCell, isSelected && styles.toneCellSelected]}
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

        {/* STEP 2 */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Choose the aesthetic that guides your daily looks.
            </Text>

            <View style={styles.personaList}>
              {personas.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPersona(p.id)}
                    style={[styles.personaCard, isSelected && styles.personaCardSelected]}
                  >
                    <View style={[styles.personaIconWrap, isSelected && styles.personaIconWrapSelected]}>
                      <Ionicons name={p.icon} size={22} color={isSelected ? COLORS.background : COLORS.accent} />
                    </View>
                    <View style={styles.personaTextWrap}>
                      <Text style={[styles.personaTitle, isSelected && styles.personaTitleSelected]}>
                        {p.title}
                      </Text>
                      <Text style={styles.personaSubtitle}>{p.subtitle}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepDescription}>
              Your vault is calibrated. Here's your first look.
            </Text>

            <View style={styles.firstLookCard}>
              <View style={styles.lookHeader}>
                <Text style={styles.lookTag}>First look</Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{harmony.score}% harmony</Text>
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
                {contrast}% skin contrast for {selectedTone.label}.
              </Text>
            </View>

            <View style={styles.capsuleInfoRow}>
              <Ionicons name="sparkles" size={15} color={COLORS.accent} />
              <Text style={styles.capsuleInfoText}>
                {seedWardrobe.length} starter pieces in your vault
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {currentStep > 1 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
            <Text style={styles.backBtnText}>Back</Text>
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
            {currentStep === 3 ? 'Enter' : 'Continue'}
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: COLORS.accent,
  },
  stepPillDone: {
    backgroundColor: COLORS.accentMuted,
  },
  stepPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
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
  skipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
  brandHeading: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  stepTitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  stepCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  selectedToneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  largeToneOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedToneMeta: {
    flex: 1,
  },
  selectedToneLabel: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  selectedToneName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  selfieActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    marginBottom: SPACING.lg,
  },
  selfieActionText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  gridSectionHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surfaceRaised,
    width: (width - 120) / 5,
  },
  toneCellSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentMuted,
  },
  toneDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 5,
  },
  toneCellCode: {
    color: COLORS.textSecondary,
    fontSize: 11,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  personaCardSelected: {
    backgroundColor: COLORS.accentMuted,
  },
  personaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personaIconWrapSelected: {
    backgroundColor: COLORS.accent,
  },
  personaTextWrap: {
    flex: 1,
  },
  personaTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  personaTitleSelected: {
    color: COLORS.accent,
  },
  personaSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  firstLookCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lookTag: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  scorePill: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  scoreText: {
    color: COLORS.accent,
    fontSize: 11,
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
    height: 130,
    borderRadius: RADIUS.md,
  },
  lookItemName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  lookInsight: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
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
    fontSize: 12,
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
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceRaised,
    gap: 6,
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  nextBtnText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
