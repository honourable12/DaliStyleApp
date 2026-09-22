import { MONK_SCALE, matchMonkScale } from '../core/monkScale';
import { MonkTone } from '../types';

export interface SkinDetectionResult extends MonkTone {
  confidence: number;
  detectedRgb: [number, number, number];
  undertoneCategory: 'Warm' | 'Cool' | 'Neutral';
  pixelCount: number;
}

/**
 * Converts RGB to HSV
 * R, G, B in [0, 255]
 * Returns H in [0, 180] (OpenCV convention), S in [0, 255], V in [0, 255]
 */
export function rgbToHsvOpenCV(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rf) {
      h = 60 * (((gf - bf) / delta) % 6);
    } else if (max === gf) {
      h = 60 * ((bf - rf) / delta + 2);
    } else {
      h = 60 * ((rf - gf) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  // Scale H to [0, 180] to match OpenCV
  const hOpenCV = Math.round(h / 2);
  const sOpenCV = max === 0 ? 0 : Math.round((delta / max) * 255);
  const vOpenCV = Math.round(max * 255);

  return [hOpenCV, sOpenCV, vOpenCV];
}

/**
 * Converts RGB to YCrCb (ITU-R BT.601 standard matching OpenCV)
 * Returns [Y, Cr, Cb] all in [0, 255]
 */
export function rgbToYCrCbOpenCV(r: number, g: number, b: number): [number, number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cr = (r - y) * 0.713 + 128;
  const cb = (b - y) * 0.564 + 128;

  return [
    Math.max(0, Math.min(255, Math.round(y))),
    Math.max(0, Math.min(255, Math.round(cr))),
    Math.max(0, Math.min(255, Math.round(cb))),
  ];
}

/**
 * Checks whether an RGB pixel falls within the biometric skin tone range
 * Exact mathematical port of _extract_skin_pixels in ai-service/skin_tone.py
 */
export function isSkinPixel(r: number, g: number, b: number): boolean {
  const [h, s, v] = rgbToHsvOpenCV(r, g, b);
  // HSV skin range: (0, 15, 50) to (25, 200, 255)
  const inHsv = h >= 0 && h <= 25 && s >= 15 && s <= 200 && v >= 50 && v <= 255;
  if (!inHsv) return false;

  const [, cr, cb] = rgbToYCrCbOpenCV(r, g, b);
  // YCrCb skin range: (0, 133, 77) to (255, 173, 127)
  const inYCrCb = cr >= 133 && cr <= 173 && cb >= 77 && cb <= 127;

  return inYCrCb;
}

/**
 * Analyzes pixel array from face/cheek patch to detect Monk Scale skin tone
 */
export function analyzeSkinPixels(pixels: Array<[number, number, number]>): SkinDetectionResult {
  if (!pixels || pixels.length === 0) {
    const fallback = MONK_SCALE[4]; // MST-5 default
    return {
      ...fallback,
      confidence: 0.85,
      detectedRgb: fallback.rgb,
      undertoneCategory: 'Neutral',
      pixelCount: 0,
    };
  }

  // 1. Filter skin pixels using combined HSV + YCrCb ranges
  const skinPixels = pixels.filter(([r, g, b]) => isSkinPixel(r, g, b));

  // If face mask had too few filtered pixels, use center crop fallback
  const sample = skinPixels.length >= 50 ? skinPixels : pixels;

  // 2. Compute median RGB to resist lighting anomalies & specular highlights
  const rSorted = sample.map((p) => p[0]).sort((a, b) => a - b);
  const gSorted = sample.map((p) => p[1]).sort((a, b) => a - b);
  const bSorted = sample.map((p) => p[2]).sort((a, b) => a - b);
  const mid = Math.floor(sample.length / 2);

  const medianRgb: [number, number, number] = [rSorted[mid], gSorted[mid], bSorted[mid]];

  // 3. Match against Monk Scale reference vectors
  const match = matchMonkScale(medianRgb);

  // 4. Determine undertone (Warm vs Cool based on Cr vs Cb)
  const [, cr, cb] = rgbToYCrCbOpenCV(medianRgb[0], medianRgb[1], medianRgb[2]);
  let undertoneCategory: 'Warm' | 'Cool' | 'Neutral' = 'Neutral';
  if (cr - cb > 15) {
    undertoneCategory = 'Warm';
  } else if (cr - cb < 5) {
    undertoneCategory = 'Cool';
  }

  return {
    ...match,
    detectedRgb: medianRgb,
    undertoneCategory,
    pixelCount: sample.length,
  };
}
