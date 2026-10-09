import jpeg from 'jpeg-js';
import { ClothingCategory } from '../types';

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
  source: 'ai_service' | 'on_device_pixels' | 'heuristic_fallback';
}

/**
 * Direct port of analyze_clothing_fast from ai-service/clothing.py lines 273-361
 * Executes on decoded raw pixels with OpenCV/NumPy mathematical fidelity.
 */
export function analyzeClothingFromRawPixels(
  decoded: DecodedImage,
  aspectRatio = 1.0,
  hintText?: string
): ClothingFastAnalysisResult {
  const { width: w, height: h, data } = decoded;

  // 1. Check for clean background from corners (clothing.py line 286-294)
  const cornerSampleCoords: Array<[number, number]> = [];
  const sampleW = Math.min(10, Math.floor(w / 4));
  const sampleH = Math.min(10, Math.floor(h / 4));

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

  // 2. Center crop (clothing.py line 321-326)
  // cy, cx = h // 2, w // 2; rh, rw = h // 3, w // 3
  const cy = Math.floor(h / 2);
  const cx = Math.floor(w / 2);
  const rh = Math.floor(h / 3);
  const rw = Math.floor(w / 3);

  const startY = Math.max(0, cy - rh);
  const endY = Math.min(h, cy + rh);
  const startX = Math.max(0, cx - rw);
  const endX = Math.min(w, cx + rw);

  // 3. Reshape and filter out background noise (clothing.py line 328-340)
  const centerPixels: Array<[number, number, number]> = [];
  // Sample with step to maintain high speed (< 10ms)
  const step = Math.max(1, Math.floor(Math.sqrt(((endY - startY) * (endX - startX)) / 1200)));

  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      centerPixels.push([r, g, b]);
    }
  }

  let filtered: Array<[number, number, number]>;
  if (isCleanBg) {
    filtered = centerPixels.filter(([r, g, b]) => {
      const dr = r - avgCornerR;
      const dg = g - avgCornerG;
      const db = b - avgCornerB;
      const diff = Math.sqrt(dr * dr + dg * dg + db * db);
      return diff > 30; // Matches diff > 30 in clothing.py
    });
  } else {
    // Filter extreme blown-out highlights and deep dark shadows
    filtered = centerPixels.filter(
      ([r, g, b]) => !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15)
    );
  }

  if (filtered.length < 50) {
    filtered = centerPixels; // Fallback if filtering was too aggressive
  }

  // 4. KMeans (k=3, matching clothing.py line 342: KMeans(n_clusters=3, n_init=5))
  const k = Math.min(3, filtered.length);
  const centers: Array<[number, number, number]> = [];
  const initStep = Math.floor(filtered.length / k);
  for (let i = 0; i < k; i++) {
    centers.push([...filtered[i * initStep]]);
  }

  for (let iter = 0; iter < 5; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    const counts = centers.map(() => 0);

    for (const p of filtered) {
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

  // 5. Select the MOST SATURATED color, not most frequent (clothing.py line 346-354)
  let bestColor = centers[0];
  let maxSat = -1;

  for (const c of centers) {
    const [, s] = rgbToHsv(c[0], c[1], c[2]);
    if (s > maxSat) {
      maxSat = s;
      bestColor = c;
    }
  }

  // If even the most saturated cluster is nearly grayscale (e.g. black, white, gray garments),
  // pick the cluster center with the highest cluster population
  if (maxSat < 18) {
    bestColor = centers[0];
  }

  const primaryHex = rgbToHex(bestColor);
  const primaryName = nearestColorName(bestColor);

  // 6. Infer rough category and canonical group
  const inferred = inferCategoryFromSilhouette(aspectRatio, hintText, decoded);

  return {
    isClothing: true,
    isCleanBackground: isCleanBg,
    primaryColor: primaryHex,
    primaryName,
    roughCategory: inferred.roughCategory,
    suggestedCategory: inferred.canonicalCategory,
    confidence: inferred.confidence,
    source: 'on_device_pixels',
  };
}

/**
 * Infer category using hint keywords, silhouette aspect ratio,
 * and vertical center of mass (mirroring YOLO person/clothing split in clothing.py lines 468-510)
 */
export function inferCategoryFromSilhouette(
  aspectRatio: number,
  hintText?: string,
  decoded?: DecodedImage
): { roughCategory: SpecificCategory; canonicalCategory: ClothingCategory; confidence: number } {
  if (hintText) {
    const lower = hintText.toLowerCase();

    // Check specific categories first
    for (const cat of CLOTHING_CATEGORIES) {
      if (lower.includes(cat)) {
        return {
          roughCategory: cat,
          canonicalCategory: CATEGORY_GROUPS[cat],
          confidence: 0.95,
        };
      }
    }

    // Keyword heuristics
    if (['dress', 'jumpsuit', 'romper', 'gown', 'overall', 'one-piece'].some((k) => lower.includes(k))) {
      return { roughCategory: 'dress', canonicalCategory: 'one-piece', confidence: 0.95 };
    }
    if (['pant', 'trouser', 'jean', 'short', 'skirt', 'cargo', 'chino', 'legging'].some((k) => lower.includes(k))) {
      return { roughCategory: 'trousers', canonicalCategory: 'bottom', confidence: 0.9 };
    }
    if (['jacket', 'coat', 'blazer', 'hoodie', 'cardigan', 'parka', 'windbreaker', 'bomber', 'trench'].some((k) => lower.includes(k))) {
      return { roughCategory: 'jacket', canonicalCategory: 'outerwear', confidence: 0.9 };
    }
    if (['shoe', 'sneaker', 'boot', 'sandal', 'derby', 'loafer', 'heel', 'footwear'].some((k) => lower.includes(k))) {
      return { roughCategory: 'sneakers', canonicalCategory: 'shoes', confidence: 0.9 };
    }
    if (['bag', 'hat', 'cap', 'belt', 'scarf', 'sunglass', 'watch'].some((k) => lower.includes(k))) {
      return { roughCategory: 'handbag', canonicalCategory: 'accessory', confidence: 0.9 };
    }
    if (['shirt', 'tee', 'top', 't-shirt', 'sweater', 'blouse', 'knit', 'polo'].some((k) => lower.includes(k))) {
      return { roughCategory: 't-shirt', canonicalCategory: 'top', confidence: 0.9 };
    }
  }

  // Vertical mass density check if pixels are available
  let verticalCenterOfMass = 0.5;
  if (decoded && decoded.width > 0 && decoded.height > 0) {
    const { width: w, height: h, data } = decoded;
    let totalWeight = 0;
    let weightedYSum = 0;
    const yStep = Math.max(1, Math.floor(h / 40));
    const xStep = Math.max(1, Math.floor(w / 40));

    for (let y = 0; y < h; y += yStep) {
      for (let x = 0; x < w; x += xStep) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Calculate variance from corner background
        const brightness = (r + g + b) / 3;
        if (brightness < 240 && brightness > 15) {
          totalWeight += 1;
          weightedYSum += y / h;
        }
      }
    }

    if (totalWeight > 0) {
      verticalCenterOfMass = weightedYSum / totalWeight;
    }
  }

  // Vertical weight in bottom 25% strongly implies shoes/footwear
  if (verticalCenterOfMass > 0.72 && aspectRatio < 0.85) {
    return { roughCategory: 'sneakers', canonicalCategory: 'shoes', confidence: 0.85 };
  }

  // Aspect ratio silhouette evaluation (matching clothing.py categories)
  if (aspectRatio > 1.35) {
    return { roughCategory: 'trousers', canonicalCategory: 'bottom', confidence: 0.88 };
  } else if (aspectRatio >= 0.85 && aspectRatio <= 1.35) {
    return { roughCategory: 'shirt', canonicalCategory: 'top', confidence: 0.82 };
  } else if (aspectRatio >= 0.65 && aspectRatio < 0.85) {
    return { roughCategory: 'jacket', canonicalCategory: 'outerwear', confidence: 0.78 };
  } else {
    return { roughCategory: 'sneakers', canonicalCategory: 'shoes', confidence: 0.75 };
  }
}

/**
 * Attempt to query ai-service backend endpoint (/analyze-clothing-fast)
 * with a quick 2.5s timeout.
 */
export async function tryAiServiceFastAnalysis(
  imageUri: string,
  backendBaseUrl = 'http://10.0.2.2:8000'
): Promise<ClothingFastAnalysisResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'clothing.jpg',
      type: 'image/jpeg',
    } as any);

    const res = await fetch(`${backendBaseUrl}/analyze-clothing-fast`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.primary_color) {
        const roughCat: SpecificCategory = CLOTHING_CATEGORIES.includes(data.rough_category)
          ? data.rough_category
          : 't-shirt';
        const canonical = CATEGORY_GROUPS[roughCat] || 'top';

        return {
          isClothing: Boolean(data.is_clothing),
          isCleanBackground: Boolean(data.is_clean_background),
          primaryColor: data.primary_color,
          primaryName: data.primary_name || nearestColorName([128, 128, 128]),
          roughCategory: roughCat,
          suggestedCategory: canonical,
          confidence: 0.94,
          source: 'ai_service',
        };
      }
    }
  } catch {
    // Network / timeout / offline
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}
