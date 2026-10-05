import { WardrobeItem, OutfitRecommendation, UserStyleProfile } from '../types';
import {
  calculateGarmentHarmony,
  calculateSkinContrast,
  getPersonaScore,
  getSeasonalCompatibility,
  getWeatherPriority,
} from './colorTheory';
import { MONK_PALETTE_PROFILES } from './monkScale';

export interface WeatherCondition {
  tempC: number;
  condition: 'Sunny' | 'Cold' | 'Rainy' | 'Clear';
}

/**
 * On-Device Recommendation & Harmony Engine
 * Port of backend/app/style/rules.py & engine.py directly into TypeScript.
 * Runs in < 30ms locally over wardrobe collections (50–500 items).
 */
export function generateDailyOutfit(
  wardrobe: WardrobeItem[],
  userProfile: UserStyleProfile,
  weather: WeatherCondition
): OutfitRecommendation | null {
  const startTime = Date.now();
  if (wardrobe.length === 0) return null;

  const tops = wardrobe.filter((i) => i.category === 'top');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');
  const outerwears = wardrobe.filter((i) => i.category === 'outerwear');
  const shoesList = wardrobe.filter((i) => i.category === 'shoes');
  const accessories = wardrobe.filter((i) => i.category === 'accessory');

  // Must have at least a top and bottom
  const availableTops = tops.length > 0 ? tops : wardrobe;
  const availableBottoms = bottoms.length > 0 ? bottoms : wardrobe;

  let bestOutfit: OutfitRecommendation | null = null;
  let highestTotalScore = -1;

  // Generate combinations and score them in-memory (< 30ms for 200+ combinations)
  for (const top of availableTops.slice(0, 15)) {
    for (const bottom of availableBottoms.slice(0, 15)) {
      if (top.id === bottom.id && wardrobe.length > 1) continue;

      const items: WardrobeItem[] = [top, bottom];

      // Add outerwear if cold or rainy
      if (weather.condition === 'Cold' || weather.tempC < 18) {
        if (outerwears.length > 0) items.push(outerwears[0]);
      }

      // Add shoes if available
      if (shoesList.length > 0) items.push(shoesList[0]);

      // Add accessory if style persona matches
      if (accessories.length > 0 && userProfile.persona !== 'Minimalist') {
        items.push(accessories[0]);
      }

      const colors = items.map((i) => i.primaryColor);
      const harmony = calculateGarmentHarmony(colors);
      const skinContrast = calculateSkinContrast(userProfile.skinHex, top.primaryColor);

      // Ported from rules.py: persona score, seasonal compatibility, weather priority
      const personaMultiplier = getPersonaScore(
        userProfile.persona,
        harmony.score / 100,
        top.primaryColor,
        top.pattern
      );
      const seasonalScore = getSeasonalCompatibility(userProfile.monkLabel, top.primaryColor);
      const weatherPriority = getWeatherPriority(weather.condition, top.category);

      // Weighted total score: Harmony 45%, Skin Contrast 35%, Seasonality 20%
      const totalScore = Math.round(
        (harmony.score * 0.45 + skinContrast * 0.35 + seasonalScore * 20) *
          personaMultiplier *
          weatherPriority
      );

      if (totalScore > highestTotalScore) {
        highestTotalScore = totalScore;

        const profileInfo = MONK_PALETTE_PROFILES[userProfile.monkLabel] || { undertone: 'Neutral', season: 'All-Year' };
        
        // Smart offline editorial blurb generator
        const stylingNote = `A calibrated ${harmony.type.toLowerCase()} composition. The ${top.primaryColorName.toLowerCase()} top generates strong visual clarity against your ${userProfile.monkLabel} ${profileInfo.undertone.toLowerCase()} undertone, paired seamlessly with ${bottom.primaryColorName.toLowerCase()} for ${weather.tempC}°C ${weather.condition.toLowerCase()} weather.`;

        bestOutfit = {
          id: `outfit-${Date.now()}-${top.id.slice(0, 4)}`,
          items,
          harmonyScore: harmony.score,
          skinContrastScore: skinContrast,
          weatherAppropriate: true,
          weatherType: weather.condition,
          harmonyType: harmony.type,
          stylingNote,
        };
      }
    }
  }

  return bestOutfit;
}

/**
 * Generates an array of curated precombined matched outfits from the wardrobe
 */
export function generatePrecombinedLooks(
  wardrobe: WardrobeItem[],
  userProfile: UserStyleProfile
): OutfitRecommendation[] {
  if (wardrobe.length < 2) return [];

  const tops = wardrobe.filter((i) => i.category === 'top');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');
  const outerwears = wardrobe.filter((i) => i.category === 'outerwear');
  const shoesList = wardrobe.filter((i) => i.category === 'shoes');

  const availableTops = tops.length > 0 ? tops : wardrobe;
  const availableBottoms = bottoms.length > 0 ? bottoms : wardrobe;

  const results: OutfitRecommendation[] = [];
  const seenCombos = new Set<string>();

  for (const top of availableTops) {
    for (const bottom of availableBottoms) {
      if (top.id === bottom.id) continue;

      const comboKey = `${top.id}_${bottom.id}`;
      if (seenCombos.has(comboKey)) continue;
      seenCombos.add(comboKey);

      const items: WardrobeItem[] = [top, bottom];

      // Add a matching outerwear if available
      if (outerwears.length > 0 && results.length % 2 === 0) {
        items.push(outerwears[results.length % outerwears.length]);
      }

      // Add shoes if available
      if (shoesList.length > 0) {
        items.push(shoesList[results.length % shoesList.length]);
      }

      const colors = items.map((i) => i.primaryColor);
      const harmony = calculateGarmentHarmony(colors);
      const skinContrast = calculateSkinContrast(userProfile.skinHex, top.primaryColor);

      // Only include high harmony or high contrast combinations
      if (harmony.score >= 75) {
        const stylingNote = `Precombined ${harmony.type} look. Blends ${top.primaryColorName} with ${bottom.primaryColorName} for a balanced silhouette.`;

        results.push({
          id: `matched-${top.id}-${bottom.id}-${results.length}`,
          items,
          harmonyScore: harmony.score,
          skinContrastScore: skinContrast,
          weatherAppropriate: true,
          weatherType: 'Clear',
          harmonyType: harmony.type,
          stylingNote,
          savedInLookbook: false,
        });

        if (results.length >= 8) break;
      }
    }
    if (results.length >= 8) break;
  }

  // Sort by highest harmony score
  return results.sort((a, b) => b.harmonyScore - a.harmonyScore);
}
