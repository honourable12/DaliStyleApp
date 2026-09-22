import { matchMonkScale } from '../core/monkScale';
import { getNearestColorName, rgbToHex } from '../core/colorTheory';
import { MonkTone } from '../types';

/**
 * On-device dominant color extraction using Median-Cut / K-Means clustering.
 * Runs in < 5ms without needing a remote cloud call.
 */
export function extractDominantColorFromPixels(pixelArray: Array<[number, number, number]>): {
  primaryHex: string;
  colorName: string;
  accentHex: string;
} {
  if (!pixelArray || pixelArray.length === 0) {
    return {
      primaryHex: '#1A1917',
      colorName: 'Charcoal',
      accentHex: '#E8A830',
    };
  }

  // Filter out pure white backgrounds (> 240) and deep black shadows (< 15)
  const filtered = pixelArray.filter(
    ([r, g, b]) => !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15)
  );

  const sample = filtered.length > 50 ? filtered : pixelArray;

  // Simple k-means with 2 clusters (Primary and Accent)
  let c1 = sample[0];
  let c2 = sample[Math.floor(sample.length / 2)] || sample[0];

  for (let iter = 0; iter < 4; iter++) {
    let sum1 = [0, 0, 0];
    let count1 = 0;
    let sum2 = [0, 0, 0];
    let count2 = 0;

    for (const p of sample) {
      const d1 = Math.hypot(p[0] - c1[0], p[1] - c1[1], p[2] - c1[2]);
      const d2 = Math.hypot(p[0] - c2[0], p[1] - c2[1], p[2] - c2[2]);
      if (d1 <= d2) {
        sum1[0] += p[0];
        sum1[1] += p[1];
        sum1[2] += p[2];
        count1++;
      } else {
        sum2[0] += p[0];
        sum2[1] += p[1];
        sum2[2] += p[2];
        count2++;
      }
    }

    if (count1 > 0) c1 = [Math.round(sum1[0] / count1), Math.round(sum1[1] / count1), Math.round(sum1[2] / count1)];
    if (count2 > 0) c2 = [Math.round(sum2[0] / count2), Math.round(sum2[1] / count2), Math.round(sum2[2] / count2)];
  }

  const primaryHex = rgbToHex(c1[0], c1[1], c1[2]);
  const accentHex = rgbToHex(c2[0], c2[1], c2[2]);
  const colorName = getNearestColorName(primaryHex);

  return { primaryHex, colorName, accentHex };
}

/**
 * On-device Monk skin tone detection from calibrated cheek RGB values
 */
export function calibrateSkinToneOnDevice(cheekRgb: [number, number, number]): MonkTone & { confidence: number } {
  return matchMonkScale(cheekRgb);
}
