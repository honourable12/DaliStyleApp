import { WardrobeItem, OutfitRecommendation, UserStyleProfile } from '../types';
import { calculateGarmentHarmony, calculateSkinContrast } from './colorTheory';
import { MONK_PALETTE_PROFILES } from './monkScale';

export interface WeatherCondition {
  tempC: number;
  condition: 'Sunny' | 'Cold' | 'Rainy' | 'Clear';
}

export function generateDailyOutfit(
  wardrobe: WardrobeItem[],
  userProfile: UserStyleProfile,
  weather: WeatherCondition
): OutfitRecommendation | null {
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

  // Generate combinations and score them in-memory (< 10ms for 200 combinations)
  for (const top of availableTops.slice(0, 10)) {
    for (const bottom of availableBottoms.slice(0, 10)) {
      if (top.id === bottom.id && wardrobe.length > 1) continue;

      const items: WardrobeItem[] = [top, bottom];

      // Add outerwear if cold or rainy
      if (weather.condition === 'Cold' || weather.tempC < 18) {
        if (outerwears.length > 0) items.push(outerwears[0]);
      }

      // Add shoes if available
      if (shoesList.length > 0) items.push(shoesList[0]);

      // Add accessory if minimalist / bold persona matches
      if (accessories.length > 0 && userProfile.persona !== 'Minimalist') {
        items.push(accessories[0]);
      }

      const colors = items.map((i) => i.primaryColor);
      const harmony = calculateGarmentHarmony(colors);
      const skinContrast = calculateSkinContrast(userProfile.skinHex, top.primaryColor);

      // Weighted total score: Harmony 60%, Skin Contrast 40%
      const totalScore = Math.round(harmony.score * 0.6 + skinContrast * 0.4);

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
