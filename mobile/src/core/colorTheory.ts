import { WardrobeIQData } from '../types';

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
  const [rRaw, gRaw, bRaw] = hexToRgb(hex);
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export const STANDARD_COLORS: Array<[string, [number, number, number]]> = [
  ['Black', [0, 0, 0]],
  ['White', [255, 255, 255]],
  ['Gray', [128, 128, 128]],
  ['Red', [255, 0, 0]],
  ['Maroon', [128, 0, 0]],
  ['Yellow', [255, 255, 0]],
  ['Olive', [128, 128, 0]],
  ['Lime', [0, 255, 0]],
  ['Green', [0, 128, 0]],
  ['Aqua', [0, 255, 255]],
  ['Teal', [0, 128, 128]],
  ['Blue', [0, 0, 255]],
  ['Navy', [0, 0, 128]],
  ['Fuchsia', [255, 0, 255]],
  ['Purple', [128, 0, 128]],
  ['Orange', [255, 165, 0]],
  ['Brown', [165, 42, 42]],
  ['Tan', [210, 180, 140]],
  ['Pink', [255, 192, 203]],
  ['Gold', [255, 215, 0]],
  ['Beige', [245, 245, 220]],
  ['Ivory', [255, 255, 240]],
  ['Khaki', [240, 230, 140]],
  ['Lavender', [230, 230, 250]],
];

export function getNearestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  let bestName = 'Black';
  let minDistance = Infinity;

  for (const [name, targetRgb] of STANDARD_COLORS) {
    const d = Math.sqrt(
      Math.pow(rgb[0] - targetRgb[0], 2) +
      Math.pow(rgb[1] - targetRgb[1], 2) +
      Math.pow(rgb[2] - targetRgb[2], 2)
    );
    if (d < minDistance) {
      minDistance = d;
      bestName = name;
    }
  }

  return bestName;
}

/**
 * Calculates harmony score (0-100) between items based on HSL color wheel
 */
export function calculateGarmentHarmony(colors: string[]): {
  score: number;
  type: 'Complementary' | 'Triadic' | 'Monochrome' | 'Analogous' | 'Neutral Base';
} {
  if (colors.length < 2) return { score: 85, type: 'Neutral Base' };

  const hslList = colors.map(hexToHsl);

  // Check for neutral dominant bases (black, white, grey, beige)
  const isNeutral = (hsl: HSL) => hsl.s < 18 || hsl.l < 15 || hsl.l > 90;
  const neutralCount = hslList.filter(isNeutral).length;

  if (neutralCount >= colors.length - 1) {
    return { score: 92, type: 'Neutral Base' };
  }

  // Active chromatic colors
  const activeHues = hslList.filter((c) => !isNeutral(c)).map((c) => c.h);

  if (activeHues.length <= 1) {
    return { score: 90, type: 'Monochrome' };
  }

  const hueDiff = Math.abs(activeHues[0] - activeHues[1]);
  const circularDiff = Math.min(hueDiff, 360 - hueDiff);

  // 180° Complementary (150° - 180°)
  if (circularDiff >= 140 && circularDiff <= 180) {
    return { score: 96, type: 'Complementary' };
  }

  // 120° Triadic (100° - 140°)
  if (circularDiff >= 100 && circularDiff < 140) {
    return { score: 88, type: 'Triadic' };
  }

  // 30° Analogous (15° - 45°)
  if (circularDiff <= 45) {
    return { score: 86, type: 'Analogous' };
  }

  return { score: 78, type: 'Neutral Base' };
}

/**
 * Calculates contrast score between clothing and wearer's skin tone (0-100)
 */
export function calculateSkinContrast(skinHex: string, garmentHex: string): number {
  const skin = hexToHsl(skinHex);
  const garment = hexToHsl(garmentHex);

  const lightnessDiff = Math.abs(skin.l - garment.l); // 0 - 100
  return Math.min(100, Math.round(lightnessDiff * 1.1 + 10));
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
  const hsl = hexToHsl(colorHex);
  const s = hsl.s / 100;
  const lum = hsl.l / 100;
  let score = 1.0;

  const hType = harmonyScore > 0.95 ? 'Complementary' : harmonyScore > 0.85 ? 'Monochromatic' : 'Other';

  if (persona === 'Minimalist') {
    if (s < 0.2) score += 0.3;
    if (hType === 'Monochromatic') score += 0.4;
    if (pattern === 'solid') score += 0.3;
  } else if (persona === 'Bold') {
    if (s > 0.6) score += 0.3;
    if (hType === 'Complementary') score += 0.5;
    if (pattern && ['floral', 'graphic print', 'leopard print', 'camouflage'].includes(pattern)) {
      score += 0.5;
    }
  } else if (persona === 'Classic' || persona === 'Old Money') {
    if (s < 0.3 && lum > 0.4) score += 0.4;
    if (pattern && ['solid', 'striped', 'checkered'].includes(pattern)) score += 0.3;
  }

  return score;
}

/**
 * Exact port of rules.py: get_seasonal_compatibility
 */
export function getSeasonalCompatibility(monkLabel: string, clothingHex: string): number {
  const hsl = hexToHsl(clothingHex);
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
  if (season.includes('Cool') && h >= 0.5 && h <= 0.8) score += 0.3;
  if (season.includes('Warm') && h >= 0.0 && h <= 0.2) score += 0.3;
  return Math.min(score, 1.0);
}

/**
 * Exact port of rules.py: get_skin_compatibility
 */
export function getSkinCompatibility(skinHex: string, clothingHex: string): number {
  const shsl = hexToHsl(skinHex);
  const chsl = hexToHsl(clothingHex);

  const contrast = Math.abs(shsl.l / 100 - chsl.l / 100);
  let score = contrast * 0.5;

  const isSkinWarm = (shsl.h / 360 >= 0.0 && shsl.h / 360 <= 0.18);
  const isColorWarm =
    (chsl.h / 360 >= 0.0 && chsl.h / 360 <= 0.18) ||
    (chsl.h / 360 >= 0.8 && chsl.h / 360 <= 1.0);

  if (isSkinWarm === isColorWarm) score += 0.5;
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
 * Exact port of rules.py: get_wardrobe_analytics
 */
export function getWardrobeAnalytics(
  items: Array<{ primaryColor: string }>,
  monkLabel: string
): { Neutral: number; Vibrant: number; Muted: number; Earthy: number } {
  const stats = { Neutral: 0, Vibrant: 0, Muted: 0, Earthy: 0 };
  const total = items.length;
  if (total === 0) return stats;

  for (const item of items) {
    const hsl = hexToHsl(item.primaryColor);
    const h = hsl.h / 360;
    const s = hsl.s / 100;

    if (s < 0.15) stats.Neutral++;
    else if (s > 0.6) stats.Vibrant++;
    else if (h >= 0.1 && h <= 0.2) stats.Earthy++;
    else stats.Muted++;
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
    Math.max(40, Math.round(55 + (distribution.Neutral * 0.3) + (distribution.Vibrant * 0.2)))
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

