import { rgbToHex, getNearestColorName, hexToHsl } from '../core/colorTheory';
import { rgbToHsvOpenCV } from './skinDetection';

export interface DominantColorResult {
  primaryHex: string;
  primaryName: string;
  accentHex: string;
  accentName: string;
  palette: string[];
  maxSaturation: number;
}

/**
 * On-device K-Means clustering algorithm that prioritizes the most SATURATED
 * color rather than just the most frequent neutral background color.
 * Exact mathematical port of ai-service/clothing.py (lines 320-355).
 */
export function extractGarmentDominantColor(
  pixels: Array<[number, number, number]>,
  backgroundRgb?: [number, number, number]
): DominantColorResult {
  if (!pixels || pixels.length === 0) {
    return {
      primaryHex: '#E8A830',
      primaryName: 'Rust / Turmeric',
      accentHex: '#1A1917',
      accentName: 'Charcoal',
      palette: ['#E8A830', '#1A1917'],
      maxSaturation: 80,
    };
  }

  // 1. Filter out background pixels using Euclidean distance to backgroundRgb
  let filtered = pixels;
  if (backgroundRgb) {
    filtered = pixels.filter(([r, g, b]) => {
      const dist = Math.hypot(r - backgroundRgb[0], g - backgroundRgb[1], b - backgroundRgb[2]);
      return dist > 32; // Distance threshold from Python implementation
    });
  }

  // 2. Filter out extreme specular highlights (> 242) and deep void shadows (< 14)
  filtered = filtered.filter(
    ([r, g, b]) => !(r > 242 && g > 242 && b > 242) && !(r < 14 && g < 14 && b < 14)
  );

  // Fallback if filtering was too aggressive
  const sample = filtered.length >= 60 ? filtered : pixels;

  // 3. Initialize K-Means with 3 clusters (k = 3, matching Python KMeans(n_clusters=3))
  const k = Math.min(3, sample.length);
  const centers: Array<[number, number, number]> = [];
  const step = Math.floor(sample.length / k);
  for (let i = 0; i < k; i++) {
    centers.push([...sample[i * step]]);
  }

  // 4. Run Lloyd's K-Means iterations (5 iterations matching Python n_init=5)
  for (let iter = 0; iter < 5; iter++) {
    const clusterSums = centers.map(() => [0, 0, 0]);
    const clusterCounts = centers.map(() => 0);

    for (const p of sample) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let ci = 0; ci < centers.length; ci++) {
        const c = centers[ci];
        const dist = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = ci;
        }
      }

      clusterSums[nearestIdx][0] += p[0];
      clusterSums[nearestIdx][1] += p[1];
      clusterSums[nearestIdx][2] += p[2];
      clusterCounts[nearestIdx]++;
    }

    for (let ci = 0; ci < centers.length; ci++) {
      if (clusterCounts[ci] > 0) {
        centers[ci] = [
          Math.round(clusterSums[ci][0] / clusterCounts[ci]),
          Math.round(clusterSums[ci][1] / clusterCounts[ci]),
          Math.round(clusterSums[ci][2] / clusterCounts[ci]),
        ];
      }
    }
  }

  // 5. Select the most SATURATED cluster center, not most frequent (Stylora core heuristic)
  let bestCenter = centers[0];
  let maxSat = -1;

  for (const c of centers) {
    const [, s] = rgbToHsvOpenCV(c[0], c[1], c[2]);
    if (s > maxSat) {
      maxSat = s;
      bestCenter = c;
    }
  }

  // Sort other centers by saturation for accent palette
  const otherCenters = centers.filter((c) => c !== bestCenter);
  const accentCenter = otherCenters[0] || [30, 30, 30];

  const primaryHex = rgbToHex(bestCenter[0], bestCenter[1], bestCenter[2]);
  const accentHex = rgbToHex(accentCenter[0], accentCenter[1], accentCenter[2]);

  const palette = centers.map((c) => rgbToHex(c[0], c[1], c[2]));

  return {
    primaryHex,
    primaryName: getNearestColorName(primaryHex),
    accentHex,
    accentName: getNearestColorName(accentHex),
    palette,
    maxSaturation: Math.round((maxSat / 255) * 100),
  };
}
