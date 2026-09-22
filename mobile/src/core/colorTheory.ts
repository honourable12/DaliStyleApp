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
  ['Black', [20, 20, 20]],
  ['White', [245, 245, 245]],
  ['Charcoal', [54, 69, 79]],
  ['Navy', [20, 30, 70]],
  ['Blue', [30, 80, 160]],
  ['Light Blue', [135, 206, 235]],
  ['Beige', [215, 195, 160]],
  ['Cream', [240, 235, 215]],
  ['Brown', [100, 60, 30]],
  ['Olive', [85, 107, 47]],
  ['Forest Green', [34, 85, 34]],
  ['Burgundy', [128, 0, 32]],
  ['Rust / Turmeric', [180, 75, 25]],
  ['Gray', [140, 140, 140]],
];

export function getNearestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  let bestName = 'Neutral';
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
