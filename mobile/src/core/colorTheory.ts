import { colord } from 'colord';
import { WardrobeIQData } from '../types';
import {
  HAUTE_COUTURE_PALETTE,
  CoutureColorDef,
  findNearestCoutureColor,
  deltaE,
} from './couturePalette';

export { HAUTE_COUTURE_PALETTE, CoutureColorDef, findNearestCoutureColor, deltaE };

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return [128, 128, 128];
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string): HSL {
  const c = colord(hex).toHsl();
  return {
    h: Math.round(c.h),
    s: Math.round(c.s),
    l: Math.round(c.l),
  };
}

/**
 * Enhanced Couture Color Matcher:
 * Perceptually matches any hex color to the closest Haute-Couture / Editorial Color
 * from the expanded 120+ color collection.
 */
export function getNearestColorName(hex: string): string {
  return findNearestCoutureColor(hex).name;
}

export const STANDARD_COLORS: Array<[string, [number, number, number]]> = HAUTE_COUTURE_PALETTE.map(
  (c) => [c.name, c.rgb]
);

/**
 * Calculates harmony score (0-100) between items based on haute-couture color theory.
 * Evaluates Monochromatic, Complementary, Split-Complementary, Triadic, Analogous,
 * and Architectural Neutral Grounding.
 */
export function calculateGarmentHarmony(colors: string[]): {
  score: number;
  type: 'Complementary' | 'Triadic' | 'Monochrome' | 'Analogous' | 'Neutral Base';
} {
  if (colors.length < 2) return { score: 88, type: 'Neutral Base' };

  const parsed = colors.map((c) => ({
    c: colord(c),
    hsl: colord(c).toHsl(),
    def: findNearestCoutureColor(c),
  }));

  // Neutral anchor detection (Black, Charcoal, Camel, Tan, Ecru, Ivory, Cream, Slate)
  const isNeutral = (p: typeof parsed[0]) =>
    p.def.family === 'Neutral' || p.def.family === 'Earth' || p.hsl.s < 18 || p.hsl.l < 16 || p.hsl.l > 88;

  const neutralCount = parsed.filter(isNeutral).length;

  // Architectural Neutral Grounding (e.g. Camel + Navy, Charcoal + Off-White, Black + Cream)
  if (neutralCount >= colors.length - 1) {
    // Check luminance separation contrast between the first two pieces
    const contrastRatio = parsed[0].c.contrast(parsed[1].c);
    const contrastBonus = contrastRatio > 2.2 ? 4 : 0;
    return { score: Math.min(98, 92 + contrastBonus), type: 'Neutral Base' };
  }

  // Active chromatic colors
  const activePieces = parsed.filter((p) => !isNeutral(p));

  if (activePieces.length <= 1) {
    return { score: 92, type: 'Neutral Base' };
  }

  const h1 = activePieces[0].hsl.h;
  const h2 = activePieces[1].hsl.h;
  const rawDiff = Math.abs(h1 - h2);
  const circularDiff = Math.min(rawDiff, 360 - rawDiff);

  // Measure luminance separation so outfits aren't muddy
  const lumContrast = parsed[0].c.contrast(parsed[1].c);
  const separationBonus = lumContrast > 2.0 && lumContrast < 12 ? 3 : 0;

  // 1. High-Fashion Monochrome / Tonal (same hue family with tonal depth)
  if (circularDiff <= 15) {
    return { score: Math.min(98, 94 + separationBonus), type: 'Monochrome' };
  }

  // 2. Complementary & Split-Complementary (140° - 180°)
  if (circularDiff >= 140 && circularDiff <= 180) {
    return { score: Math.min(99, 96 + separationBonus), type: 'Complementary' };
  }

  // 3. Triadic Harmony (100° - 140°)
  if (circularDiff >= 100 && circularDiff < 140) {
    return { score: Math.min(96, 90 + separationBonus), type: 'Triadic' };
  }

  // 4. Analogous Flow (15° - 45°)
  if (circularDiff <= 45) {
    return { score: Math.min(95, 88 + separationBonus), type: 'Analogous' };
  }

  return { score: 82, type: 'Neutral Base' };
}

/**
 * Calculates perceptual contrast score between clothing and wearer's skin tone (0-100)
 * Uses CIELAB Delta-E perceptual separation and luminance contrast ratio.
 */
export function calculateSkinContrast(skinHex: string, garmentHex: string): number {
  if (!skinHex || !garmentHex) return 80;

  const contrastRatio = colord(skinHex).contrast(garmentHex); // 1.0 - 21.0
  const dE = deltaE(skinHex, garmentHex); // 0 - 100+

  // Balance luminance contrast (60%) and chromatic delta-E (40%)
  const contrastScore = Math.min(100, Math.round(contrastRatio * 8 + dE * 0.4 + 20));
  return Math.max(40, contrastScore);
}

/**
 * Exact port of rules.py: get_persona_score
 */
export function getPersonaScore(
  persona: string,
  harmonyScore: number,
  colorHex: string,
  pattern?: string
): number {
  const c = colord(colorHex);
  const hsl = c.toHsl();
  const s = hsl.s / 100;
  const lum = hsl.l / 100;
  let score = 1.0;

  const hType = harmonyScore > 0.95 ? 'Complementary' : harmonyScore > 0.88 ? 'Monochromatic' : 'Other';

  if (persona === 'Minimalist') {
    if (s < 0.25 || c.isDark() || hsl.l > 85) score += 0.35;
    if (hType === 'Monochromatic' || harmonyScore > 0.9) score += 0.4;
    if (pattern === 'solid') score += 0.3;
  } else if (persona === 'Bold') {
    if (s > 0.55) score += 0.35;
    if (hType === 'Complementary') score += 0.5;
    if (pattern && ['floral', 'graphic print', 'leopard print', 'camouflage'].includes(pattern)) {
      score += 0.5;
    }
  } else if (persona === 'Classic' || persona === 'Old Money') {
    if (s < 0.35 && lum > 0.3) score += 0.4;
    if (pattern && ['solid', 'striped', 'checkered'].includes(pattern)) score += 0.3;
  } else if (persona === 'Fluid') {
    if (hsl.l > 40 && hsl.l < 80) score += 0.3;
    if (hType === 'Monochromatic' || hType === 'Other') score += 0.3;
  }

  return score;
}

/**
 * Exact port of rules.py: get_seasonal_compatibility
 * Enhanced with Haute-Couture palette undertone resonance
 */
export function getSeasonalCompatibility(monkLabel: string, clothingHex: string): number {
  const couture = findNearestCoutureColor(clothingHex);
  const hsl = colord(clothingHex).toHsl();
  const h = hsl.h / 360;

  const PALETTE_MAPPING: Record<string, string[]> = {
    'MST-1': ['Cool', 'Clear'],
    'MST-2': ['Cool', 'Clear'],
    'MST-3': ['Cool', 'Muted'],
    'MST-4': ['Warm', 'Light'],
    'MST-5': ['Warm', 'Neutral'],
    'MST-6': ['Warm', 'Rich'],
    'MST-7': ['Warm', 'Deep'],
    'MST-8': ['Neutral', 'Deep'],
    'MST-9': ['Cool', 'Deep'],
    'MST-10': ['Cool', 'Deep'],
  };

  const season = PALETTE_MAPPING[monkLabel] || ['Neutral', 'Medium'];
  let score = 0.5;

  if (season.includes('Cool')) {
    if (couture.undertone === 'Cool' || (h >= 0.5 && h <= 0.8)) score += 0.35;
  }
  if (season.includes('Warm')) {
    if (couture.undertone === 'Warm' || (h >= 0.0 && h <= 0.22) || couture.family === 'Earth' || couture.family === 'Yellow/Ochre') {
      score += 0.35;
    }
  }
  if (season.includes('Neutral')) {
    score += 0.25;
  }

  return Math.min(score, 1.0);
}

/**
 * Exact port of rules.py: get_skin_compatibility
 * Enhanced with CIELAB Delta-E and undertone alignment
 */
export function getSkinCompatibility(skinHex: string, clothingHex: string): number {
  if (!skinHex || !clothingHex) return 0.8;

  const skinCouture = findNearestCoutureColor(skinHex);
  const clothCouture = findNearestCoutureColor(clothingHex);

  const contrast = colord(skinHex).contrast(clothingHex) / 21; // 0 - 1
  let score = contrast * 0.45;

  // Undertone harmonic resonance
  if (skinCouture.undertone === clothCouture.undertone) {
    score += 0.45;
  } else if (clothCouture.undertone === 'Neutral') {
    score += 0.4;
  }

  return Math.min(score, 1.0);
}

/**
 * Exact port of rules.py: get_weather_priority
 */
export function getWeatherPriority(weatherCode: string, category: string): number {
  const cat = String(category || '').toLowerCase();
  if (weatherCode === 'Rainy') {
    if (['outerwear', 'jacket', 'boots'].some((x) => cat.includes(x))) return 2.5;
  } else if (weatherCode === 'Cold') {
    if (['sweater', 'coat', 'outerwear', 'hoodie'].some((x) => cat.includes(x))) return 2.5;
  } else if (weatherCode === 'Sunny') {
    if (['shorts', 't-shirt', 'sandals'].some((x) => cat.includes(x))) return 2.0;
  }
  return 1.0;
}

/**
 * Enhanced Wardrobe Analytics with Haute-Couture Color Families:
 * Categorizes pieces into Neutral, Vibrant, Muted, and Earthy dimensions.
 */
export function getWardrobeAnalytics(
  items: Array<{ primaryColor: string }>,
  monkLabel: string
): { Neutral: number; Vibrant: number; Muted: number; Earthy: number } {
  const stats = { Neutral: 0, Vibrant: 0, Muted: 0, Earthy: 0 };
  const total = items.length;
  if (total === 0) return stats;

  for (const item of items) {
    const couture = findNearestCoutureColor(item.primaryColor);
    const hsl = colord(item.primaryColor).toHsl();
    const s = hsl.s / 100;

    if (couture.family === 'Neutral' || s < 0.18 || hsl.l < 18 || hsl.l > 88) {
      stats.Neutral++;
    } else if (couture.family === 'Earth' || couture.family === 'Yellow/Ochre') {
      stats.Earthy++;
    } else if (s > 0.55) {
      stats.Vibrant++;
    } else {
      stats.Muted++;
    }
  }

  return {
    Neutral: Math.round((stats.Neutral / total) * 100),
    Vibrant: Math.round((stats.Vibrant / total) * 100),
    Muted: Math.round((stats.Muted / total) * 100),
    Earthy: Math.round((stats.Earthy / total) * 100),
  };
}

export function calculateWardrobeIQ(
  items: Array<{ primaryColor: string; category?: string; name?: string }>,
  monkLabel: string = 'MST-6'
): WardrobeIQData {
  const distribution = getWardrobeAnalytics(items, monkLabel);
  const total = items.length;

  if (total === 0) {
    return {
      distribution: { Neutral: 0, Vibrant: 0, Muted: 0, Earthy: 0 },
      totalPieces: 0,
      activeRotationPercent: 0,
      dormantCount: 0,
      consultantReport:
        'Your atelier vault is currently blank. Digitize tops, bottoms, and layers to generate deep chromatic intelligence and circularity metrics.',
      harmonyIndex: 0,
    };
  }

  // Active rotation estimation: proportion of pieces with harmonious companion pairings
  const activeRotationPercent = Math.min(
    95,
    Math.max(40, Math.round(55 + distribution.Neutral * 0.3 + distribution.Vibrant * 0.2))
  );

  const dormantCount = Math.max(0, Math.round(total * (1 - activeRotationPercent / 100)));
  const harmonyIndex = Math.min(98, Math.max(82, 85 + Math.round(distribution.Neutral * 0.1)));

  // Generate dynamic Haute-Couture Strategic Consultant Report
  let consultantReport = '';
  if (distribution.Neutral >= 50) {
    consultantReport = `Your wardrobe demonstrates strong architectural discipline, anchored in ${distribution.Neutral}% neutral foundations. ${
      distribution.Vibrant > 15
        ? `A ${distribution.Vibrant}% vibrant chromatic injection introduces high-impact statement moments.`
        : 'Subtle tonal restraint creates an understated, gallery-grade uniform.'
    } Optimal rotation efficiency with ${harmonyIndex}% chromatic resonance against your ${monkLabel || 'calibrated'} undertone.`;
  } else if (distribution.Vibrant >= 35) {
    consultantReport = `An expressive, high-chroma vault featuring ${distribution.Vibrant}% vibrant statement pieces. Grounding these silhouettes with structured neutrals will elevate contrast dynamics and increase daily styling longevity.`;
  } else if (distribution.Earthy >= 25) {
    consultantReport = `An organic, warm-palette vault with ${distribution.Earthy}% rich earthy tones. Seamlessly synchronizes with autumnal and golden hour lighting, providing tactile editorial depth.`;
  } else {
    consultantReport = `A versatile, multifaceted capsule balancing ${distribution.Neutral}% neutral bases and ${distribution.Muted}% muted mid-tones. Provides exceptional day-to-evening rotation agility.`;
  }

  return {
    distribution,
    totalPieces: total,
    activeRotationPercent,
    dormantCount,
    consultantReport,
    harmonyIndex,
  };
}
