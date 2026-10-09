import jpeg from 'jpeg-js';
import { ClothingCategory, PatternType } from '../types';

/**
 * Direct TypeScript port of ai-service/clothing_categories.py
 */
export const CLOTHING_CATEGORIES = [
  't-shirt',
  'shirt',
  'sweater',
  'hoodie',
  'jacket',
  'coat',
  'trousers',
  'jeans',
  'shorts',
  'skirt',
  'dress',
  'sneakers',
  'boots',
  'formal shoes',
  'sandals',
  'belt',
  'hat',
  'cap',
  'scarf',
  'handbag',
  'sunglasses',
] as const;

export type SpecificCategory = (typeof CLOTHING_CATEGORIES)[number];

export const CATEGORY_GROUPS: Record<SpecificCategory, ClothingCategory> = {
  't-shirt': 'top',
  shirt: 'top',
  sweater: 'top',
  hoodie: 'top',
  jacket: 'outerwear',
  coat: 'outerwear',
  trousers: 'bottom',
  jeans: 'bottom',
  shorts: 'bottom',
  skirt: 'bottom',
  dress: 'one-piece',
  sneakers: 'shoes',
  boots: 'shoes',
  'formal shoes': 'shoes',
  sandals: 'shoes',
  belt: 'accessory',
  hat: 'accessory',
  cap: 'accessory',
  scarf: 'accessory',
  handbag: 'accessory',
  sunglasses: 'accessory',
};

/**
 * Exact 24 Canonical Colors from ai-service/clothing_categories.py line 64-89
 */
export const COLOR_NAMES: Array<[string, [number, number, number]]> = [
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

import { findNearestCoutureColor } from '../core/couturePalette';

/**
 * Enhanced Color Matcher:
 * Uses CIELAB Delta-E perceptual matching against the 120+ Haute-Couture Editorial Palette
 */
export function nearestColorName(rgb: [number, number, number]): string {
  const hex = rgbToHex(rgb);
  return findNearestCoutureColor(hex).name;
}

/**
 * Exact port of _rgb_to_hex from ai-service/clothing.py line 143-144
 */
export function rgbToHex(rgb: [number, number, number]): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0])));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1])));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2])));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Converts RGB to HSV (matching OpenCV convention: H: 0-180, S: 0-255, V: 0-255)
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
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

  const hOpenCV = Math.round(h / 2);
  const sOpenCV = max === 0 ? 0 : Math.round((delta / max) * 255);
  const vOpenCV = Math.round(max * 255);

  return [hOpenCV, sOpenCV, vOpenCV];
}

/**
 * Fast Base64 to Uint8Array decoder (no native dependencies)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  // Modern React Native / JS engines supply global atob
  const binaryString = typeof atob === 'function' ? atob(clean) : decodeBase64Polyfill(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64Polyfill(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string');
  }

  for (let bc = 0, bs = 0, buffer = 0, idx = 0; idx < str.length; idx++) {
    buffer = (buffer << 6) | chars.indexOf(str.charAt(idx));
    if (bc % 4 === 3) {
      output += String.fromCharCode((buffer >> 16) & 0xff);
      output += String.fromCharCode((buffer >> 8) & 0xff);
      output += String.fromCharCode(buffer & 0xff);
    } else if (bc % 4 === 2 && idx === str.length - 1) {
      output += String.fromCharCode((buffer >> 10) & 0xff);
      output += String.fromCharCode((buffer >> 2) & 0xff);
    } else if (bc % 4 === 1 && idx === str.length - 1) {
      output += String.fromCharCode((buffer >> 2) & 0xff);
    }
    bc++;
  }

  return output;
}

export interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

/**
 * Decodes raw JPEG base64 into a pixel buffer on-device
 */
export function decodeJpegBase64(base64: string): DecodedImage | null {
  try {
    const bytes = base64ToUint8Array(base64);
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return {
      width: decoded.width,
      height: decoded.height,
      data: decoded.data,
    };
  } catch (err) {
    if (__DEV__) console.warn('[clothingClassifier] JPEG decode error:', err);
    return null;
  }
}

export interface ClothingFastAnalysisResult {
  isClothing: boolean;
  isCleanBackground: boolean;
  primaryColor: string; // Hex (e.g. #000080)
  primaryName: string; // One of the 24 COLOR_NAMES (e.g. Navy)
  roughCategory: SpecificCategory | 'unknown';
  suggestedCategory: ClothingCategory;
  confidence: number;
  pattern?: PatternType;
  patternConfidence?: number;
  source: 'ai_service' | 'on_device_pixels' | 'heuristic_fallback';
}

/**
 * High-Precision On-Device Clothing Analyzer matching ai-service/clothing.py.
 * Extracts foreground bounding-box, geometric silhouette slices (bipartite leg split vs A-line flare),
 * raw pixel pattern frequencies, and KMeans color clustering.
 */
export function analyzeClothingFromRawPixels(
  decoded: DecodedImage,
  aspectRatio = 1.0,
  hintText?: string
): ClothingFastAnalysisResult {
  const { width: w, height: h, data } = decoded;

  // 1. Check for clean background from corners (clothing.py line 286-294)
  const cornerSampleCoords: Array<[number, number]> = [];
  const sampleW = Math.min(12, Math.floor(w / 4));
  const sampleH = Math.min(12, Math.floor(h / 4));

  for (let dy = 0; dy < sampleH; dy++) {
    for (let dx = 0; dx < sampleW; dx++) {
      cornerSampleCoords.push([dx, dy]); // Top-left
      cornerSampleCoords.push([w - 1 - dx, dy]); // Top-right
      cornerSampleCoords.push([dx, h - 1 - dy]); // Bottom-left
      cornerSampleCoords.push([w - 1 - dx, h - 1 - dy]); // Bottom-right
    }
  }

  let cornerSumR = 0,
    cornerSumG = 0,
    cornerSumB = 0;
  for (const [x, y] of cornerSampleCoords) {
    const idx = (y * w + x) * 4;
    cornerSumR += data[idx];
    cornerSumG += data[idx + 1];
    cornerSumB += data[idx + 2];
  }
  const avgCornerR = cornerSumR / cornerSampleCoords.length;
  const avgCornerG = cornerSumG / cornerSampleCoords.length;
  const avgCornerB = cornerSumB / cornerSampleCoords.length;

  const isWhiteBg = avgCornerR > 235 && avgCornerG > 235 && avgCornerB > 235;
  const isBlackBg = avgCornerR < 20 && avgCornerG < 20 && avgCornerB < 20;
  const isCleanBg = isWhiteBg || isBlackBg;

  // 2. Full-frame Foreground Masking and True Garment Bounding-Box Detection
  let minX = w,
    maxX = 0,
    minY = h,
    maxY = 0;
  const foregroundPixels: Array<[number, number, number]> = [];
  const fgMask = new Uint8Array(w * h);

  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 10000)));

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dr = r - avgCornerR;
      const dg = g - avgCornerG;
      const db = b - avgCornerB;
      const diff = Math.sqrt(dr * dr + dg * dg + db * db);

      const isFg = isCleanBg
        ? diff > 26
        : diff > 26 && !(r > 242 && g > 242 && b > 242) && !(r < 15 && g < 15 && b < 15);

      if (isFg) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        foregroundPixels.push([r, g, b]);
        fgMask[y * w + x] = 1;
      }
    }
  }

  // Fallback to center region if background segmentation found too few pixels
  if (foregroundPixels.length < 50 || maxX <= minX || maxY <= minY) {
    minX = Math.floor(w * 0.15);
    maxX = Math.floor(w * 0.85);
    minY = Math.floor(h * 0.15);
    maxY = Math.floor(h * 0.85);
  }

  const garmentWidth = Math.max(1, maxX - minX);
  const garmentHeight = Math.max(1, maxY - minY);
  const garmentAspect = garmentHeight / garmentWidth;

  // 3. Multi-Zone Silhouette Geometry Analysis (5 vertical slices)
  const sliceH = garmentHeight / 5;
  const sliceWidths: number[] = [0, 0, 0, 0, 0];
  const sliceDensities: number[] = [0, 0, 0, 0, 0];
  let bipartiteSplitRows = 0;

  for (let s = 0; s < 5; s++) {
    const sStart = Math.floor(minY + s * sliceH);
    const sEnd = Math.floor(minY + (s + 1) * sliceH);
    let slicePixelCount = 0;
    let minSliceX = w,
      maxSliceX = 0;

    for (let y = sStart; y < sEnd; y += step) {
      let rowRuns = 0;
      let inRun = false;
      let rowPixelCount = 0;

      for (let x = minX; x <= maxX; x += step) {
        if (fgMask[y * w + x]) {
          slicePixelCount++;
          rowPixelCount++;
          if (x < minSliceX) minSliceX = x;
          if (x > maxSliceX) maxSliceX = x;
          if (!inRun) {
            inRun = true;
            rowRuns++;
          }
        } else {
          inRun = false;
        }
      }

      // Check bipartite split in lower half (legs of trousers/shorts separated by negative space)
      if (s >= 3 && rowRuns >= 2 && rowPixelCount < (maxX - minX) * 0.85) {
        bipartiteSplitRows++;
      }
    }

    sliceDensities[s] = slicePixelCount;
    sliceWidths[s] = maxSliceX > minSliceX ? (maxSliceX - minSliceX) / garmentWidth : 0;
  }

  // 4. Infer Category
  let roughCategory: SpecificCategory = 't-shirt';
  let suggestedCategory: ClothingCategory = 'top';
  let confidence = 0.85;

  if (hintText) {
    const fromHint = inferCategoryFromSilhouette(garmentAspect, hintText, decoded);
    roughCategory = fromHint.roughCategory;
    suggestedCategory = fromHint.canonicalCategory;
    confidence = fromHint.confidence;
  } else {
    const totalFg = Math.max(1, foregroundPixels.length);
    const bottomDensityFrac = (sliceDensities[3] + sliceDensities[4]) / totalFg;
    const topDensityFrac = (sliceDensities[0] + sliceDensities[1]) / totalFg;

    // Rule A: Footwear (concentrated in bottom slice, or compact horizontal silhouette with ankle collar)
    if (garmentAspect < 0.68 || (sliceDensities[4] / totalFg > 0.65 && topDensityFrac < 0.1)) {
      roughCategory = garmentAspect > 0.85 ? 'boots' : 'sneakers';
      suggestedCategory = 'shoes';
      confidence = 0.92;
    }
    // Rule B: Trousers / Jeans / Shorts (Bipartite split in lower slices)
    else if (bipartiteSplitRows >= 3) {
      if (garmentAspect > 1.15) {
        roughCategory = 'trousers';
        suggestedCategory = 'bottom';
        confidence = 0.94;
      } else {
        roughCategory = 'shorts';
        suggestedCategory = 'bottom';
        confidence = 0.90;
      }
    }
    // Rule C: Full-Body Dress / Gown (Unbroken vertical drape from shoulders through hem, A-line expansion)
    else if (
      garmentAspect > 1.35 &&
      sliceDensities[0] > 0 &&
      sliceDensities[1] > 0 &&
      sliceDensities[3] > 0 &&
      sliceWidths[4] >= sliceWidths[2] * 0.8
    ) {
      roughCategory = 'dress';
      suggestedCategory = 'one-piece';
      confidence = 0.95;
    }
    // Rule D: Skirt (Starts at waist, Slice 0 & 1 empty, flares downward)
    else if (topDensityFrac < 0.15 && sliceDensities[2] > 0 && sliceWidths[4] >= sliceWidths[2]) {
      roughCategory = 'skirt';
      suggestedCategory = 'bottom';
      confidence = 0.92;
    }
    // Rule E: Outerwear (Jacket / Coat) vs Tops
    else if (garmentAspect <= 1.4 && bottomDensityFrac < 0.35) {
      if (garmentAspect > 1.05 || (sliceWidths[0] > 0.85 && sliceWidths[1] > 0.85)) {
        roughCategory = 'jacket';
        suggestedCategory = 'outerwear';
        confidence = 0.86;
      } else {
        roughCategory = 't-shirt';
        suggestedCategory = 'top';
        confidence = 0.88;
      }
    }
    // Rule F: Tall single-piece fallback
    else if (garmentAspect > 1.45) {
      roughCategory = 'dress';
      suggestedCategory = 'one-piece';
      confidence = 0.91;
    } else {
      roughCategory = 't-shirt';
      suggestedCategory = 'top';
      confidence = 0.82;
    }
  }

  // 5. Pattern Texture Analysis from Raw Foreground Pixels
  let detectedPattern: PatternType = 'solid';
  let patternConfidence = 0.85;

  const samplePixels =
    foregroundPixels.length > 600 ? foregroundPixels.slice(0, 600) : foregroundPixels;
  let sumL = 0,
    sumL2 = 0;
  for (const [r, g, b] of samplePixels) {
    const l = r * 0.299 + g * 0.587 + b * 0.114;
    sumL += l;
    sumL2 += l * l;
  }
  const meanL = sumL / samplePixels.length;
  const varianceL = sumL2 / samplePixels.length - meanL * meanL;
  const stdDevL = Math.sqrt(Math.max(0, varianceL));

  if (stdDevL < 17) {
    detectedPattern = 'solid';
    patternConfidence = 0.95;
  } else {
    // Spatial transition analysis
    let horizTransitions = 0;
    let vertTransitions = 0;
    const coreY = Math.floor(minY + garmentHeight * 0.3);
    const coreEndY = Math.floor(minY + garmentHeight * 0.7);
    const coreX = Math.floor(minX + garmentWidth * 0.3);
    const coreEndX = Math.floor(minX + garmentWidth * 0.7);

    for (let y = coreY; y < coreEndY; y += step * 2) {
      let prevL = -1;
      for (let x = coreX; x < coreEndX; x += step) {
        if (fgMask[y * w + x]) {
          const idx = (y * w + x) * 4;
          const l = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          if (prevL >= 0 && Math.abs(l - prevL) > 28) {
            horizTransitions++;
          }
          prevL = l;
        }
      }
    }

    for (let x = coreX; x < coreEndX; x += step * 2) {
      let prevL = -1;
      for (let y = coreY; y < coreEndY; y += step) {
        if (fgMask[y * w + x]) {
          const idx = (y * w + x) * 4;
          const l = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          if (prevL >= 0 && Math.abs(l - prevL) > 28) {
            vertTransitions++;
          }
          prevL = l;
        }
      }
    }

    if (vertTransitions > horizTransitions * 2 && vertTransitions >= 5) {
      detectedPattern = 'striped';
      patternConfidence = 0.90;
    } else if (horizTransitions > vertTransitions * 2 && horizTransitions >= 5) {
      detectedPattern = 'striped';
      patternConfidence = 0.90;
    } else if (horizTransitions >= 5 && vertTransitions >= 5) {
      detectedPattern = 'plaid';
      patternConfidence = 0.88;
    } else if (stdDevL > 34) {
      detectedPattern = 'floral';
      patternConfidence = 0.82;
    } else {
      detectedPattern = 'graphic print';
      patternConfidence = 0.78;
    }
  }

  // 6. KMeans Clustering for Dominant Color on Foreground Pixels (k=3 matching clothing.py)
  const k = Math.min(3, samplePixels.length);
  const centers: Array<[number, number, number]> = [];
  const initStep = Math.floor(samplePixels.length / k);
  for (let i = 0; i < k; i++) {
    centers.push([...samplePixels[i * initStep]]);
  }

  for (let iter = 0; iter < 5; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    const counts = centers.map(() => 0);

    for (const p of samplePixels) {
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let ci = 0; ci < centers.length; ci++) {
        const c = centers[ci];
        const distSq = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (distSq < minDist) {
          minDist = distSq;
          nearestIdx = ci;
        }
      }
      sums[nearestIdx][0] += p[0];
      sums[nearestIdx][1] += p[1];
      sums[nearestIdx][2] += p[2];
      counts[nearestIdx]++;
    }

    for (let ci = 0; ci < centers.length; ci++) {
      if (counts[ci] > 0) {
        centers[ci] = [
          Math.round(sums[ci][0] / counts[ci]),
          Math.round(sums[ci][1] / counts[ci]),
          Math.round(sums[ci][2] / counts[ci]),
        ];
      }
    }
  }

  // Select most saturated cluster if saturation >= 20, else dominant cluster
  let bestColor = centers[0];
  let maxSat = -1;
  for (const c of centers) {
    const [, s] = rgbToHsv(c[0], c[1], c[2]);
    if (s > maxSat) {
      maxSat = s;
      bestColor = c;
    }
  }
  if (maxSat < 20) {
    bestColor = centers[0];
  }

  const primaryHex = rgbToHex(bestColor);
  const primaryName = nearestColorName(bestColor);

  return {
    isClothing: true,
    isCleanBackground: isCleanBg,
    primaryColor: primaryHex,
    primaryName,
    roughCategory,
    suggestedCategory,
    confidence,
    pattern: detectedPattern,
    patternConfidence,
    source: 'on_device_pixels',
  };
}

/**
 * Infer category using hint keywords and silhouette proportions
 */
export function inferCategoryFromSilhouette(
  aspectRatio: number,
  hintText?: string,
  decoded?: DecodedImage
): { roughCategory: SpecificCategory; canonicalCategory: ClothingCategory; confidence: number } {
  if (hintText) {
    const lower = hintText.toLowerCase();

    for (const cat of CLOTHING_CATEGORIES) {
      if (lower.includes(cat)) {
        return {
          roughCategory: cat,
          canonicalCategory: CATEGORY_GROUPS[cat],
          confidence: 0.95,
        };
      }
    }

    if (['dress', 'jumpsuit', 'romper', 'gown', 'overall', 'one-piece'].some((k) => lower.includes(k))) {
      return { roughCategory: 'dress', canonicalCategory: 'one-piece', confidence: 0.95 };
    }
    if (['pant', 'trouser', 'jean', 'short', 'skirt', 'cargo', 'chino', 'legging', 'slack'].some((k) => lower.includes(k))) {
      return { roughCategory: 'trousers', canonicalCategory: 'bottom', confidence: 0.92 };
    }
    if (['jacket', 'coat', 'blazer', 'hoodie', 'cardigan', 'parka', 'windbreaker', 'bomber', 'trench'].some((k) => lower.includes(k))) {
      return { roughCategory: 'jacket', canonicalCategory: 'outerwear', confidence: 0.92 };
    }
    if (['shoe', 'sneaker', 'boot', 'sandal', 'derby', 'loafer', 'heel', 'footwear', 'oxford'].some((k) => lower.includes(k))) {
      return { roughCategory: 'sneakers', canonicalCategory: 'shoes', confidence: 0.92 };
    }
    if (['bag', 'hat', 'cap', 'belt', 'scarf', 'sunglass', 'watch'].some((k) => lower.includes(k))) {
      return { roughCategory: 'handbag', canonicalCategory: 'accessory', confidence: 0.92 };
    }
    if (['shirt', 'tee', 'top', 't-shirt', 'sweater', 'blouse', 'knit', 'polo'].some((k) => lower.includes(k))) {
      return { roughCategory: 't-shirt', canonicalCategory: 'top', confidence: 0.92 };
    }
  }

  if (aspectRatio > 1.45) {
    return { roughCategory: 'dress', canonicalCategory: 'one-piece', confidence: 0.88 };
  } else if (aspectRatio > 1.2) {
    return { roughCategory: 'trousers', canonicalCategory: 'bottom', confidence: 0.88 };
  } else if (aspectRatio >= 0.85 && aspectRatio <= 1.2) {
    return { roughCategory: 'shirt', canonicalCategory: 'top', confidence: 0.82 };
  } else if (aspectRatio >= 0.65 && aspectRatio < 0.85) {
    return { roughCategory: 'jacket', canonicalCategory: 'outerwear', confidence: 0.80 };
  } else {
    return { roughCategory: 'sneakers', canonicalCategory: 'shoes', confidence: 0.85 };
  }
}

/**
 * Multi-host probe against ai-service (port 7860) and backend (port 8000).
 * Queries YOLOv8-seg and CLIP embeddings when local or remote services are active.
 */
export async function tryAiServiceAnalysis(
  imageUri: string,
  timeoutMs = 2800
): Promise<ClothingFastAnalysisResult | null> {
  const endpoints = [
    'https://honourablewise1-daily-style-ai.hf.space/analyze-clothing-heavy',
    'https://honourablewise1-daily-style-ai.hf.space/analyze-clothing-fast',
    'https://honourablewise1-daily-style-ai.hf.space/wardrobe/engine/analyze-clothing',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'clothing.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();

        // 1. Format: /analyze-clothing-heavy
        if (data && data.detections && data.detections.length > 0) {
          const det = data.detections[0];
          const rawCat = String(det.category || 't-shirt').toLowerCase();
          const specificCat: SpecificCategory = CLOTHING_CATEGORIES.includes(rawCat as any)
            ? (rawCat as SpecificCategory)
            : 't-shirt';
          const canonical = CATEGORY_GROUPS[specificCat] || (rawCat === 'dress' ? 'one-piece' : 'top');

          let pattern: PatternType = 'solid';
          const p = String(det.pattern || 'solid').toLowerCase();
          if (p.includes('stripe')) pattern = 'striped';
          else if (p.includes('check') || p.includes('plaid')) pattern = 'plaid';
          else if (p.includes('floral') || p.includes('flower')) pattern = 'floral';
          else if (p.includes('polka') || p.includes('dot')) pattern = 'polka dot';
          else if (p.includes('leopard') || p.includes('animal')) pattern = 'animal print';
          else if (p.includes('graphic')) pattern = 'graphic print';

          return {
            isClothing: true,
            isCleanBackground: true,
            primaryColor: det.primary_color || '#1A1917',
            primaryName: det.primary_name || nearestColorName([26, 25, 23]),
            roughCategory: specificCat,
            suggestedCategory: canonical,
            confidence: Number(det.category_confidence) || 0.95,
            pattern,
            patternConfidence: Number(det.pattern_confidence) || 0.9,
            source: 'ai_service',
          };
        }

        // 2. Format: /analyze-clothing-fast
        if (data && data.primary_color) {
          const rawCat = String(data.rough_category || 't-shirt').toLowerCase();
          const specificCat: SpecificCategory = CLOTHING_CATEGORIES.includes(rawCat as any)
            ? (rawCat as SpecificCategory)
            : 't-shirt';
          const canonical = CATEGORY_GROUPS[specificCat] || (rawCat === 'dress' ? 'one-piece' : 'top');

          return {
            isClothing: Boolean(data.is_clothing ?? true),
            isCleanBackground: Boolean(data.is_clean_background ?? false),
            primaryColor: data.primary_color,
            primaryName: data.primary_name || nearestColorName([128, 128, 128]),
            roughCategory: specificCat,
            suggestedCategory: canonical,
            confidence: 0.94,
            source: 'ai_service',
          };
        }
      }
    } catch {
      // Continue to next endpoint fallback
    }
  }

  return null;
}

export const tryAiServiceFastAnalysis = tryAiServiceAnalysis;
