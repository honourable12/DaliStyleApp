import { ClothingCategory } from '../types';

export interface CleanlinessAnalysis {
  cleanlinessScore: number; // 0 - 1
  isCleanBackground: boolean;
  backgroundRgb: [number, number, number];
  isWhiteBackground: boolean;
}

/**
 * Calculates a score (0 - 1) indicating how clean or studio-like an image is.
 * Port of calculate_cleanliness_score from ai-service/clothing.py
 */
export function analyzeBackgroundCleanliness(
  cornerPixels: Array<[number, number, number]>,
  meanBrightnessRatio: number // 0.0 - 1.0
): CleanlinessAnalysis {
  if (!cornerPixels || cornerPixels.length === 0) {
    return {
      cleanlinessScore: 0.5,
      isCleanBackground: false,
      backgroundRgb: [240, 240, 240],
      isWhiteBackground: true,
    };
  }

  // Calculate average corner RGB
  let sumR = 0, sumG = 0, sumB = 0;
  for (const [r, g, b] of cornerPixels) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  const avgR = sumR / cornerPixels.length;
  const avgG = sumG / cornerPixels.length;
  const avgB = sumB / cornerPixels.length;

  // Standard deviation between corner samples
  let varSum = 0;
  for (const [r, g, b] of cornerPixels) {
    const diff = Math.hypot(r - avgR, g - avgG, b - avgB);
    varSum += diff * diff;
  }
  const cornerStd = Math.sqrt(varSum / cornerPixels.length);

  // Low standard deviation across corners indicates uniform solid background
  const bgScore = Math.max(0, 1.0 - Math.min(1.0, cornerStd / 50.0));

  // Professional lighting brightness target is 0.8 (approx 204/255)
  const brightnessScore = Math.max(0, 1.0 - Math.abs(0.8 - meanBrightnessRatio));

  // White studio background bonus
  const isWhiteBg = avgR > 235 && avgG > 235 && avgB > 235;
  const isBlackBg = avgR < 20 && avgG < 20 && avgB < 20;
  const isCleanBg = isWhiteBg || isBlackBg || bgScore > 0.85;

  const whiteBgBonus = isWhiteBg ? 0.2 : 0.0;
  const cleanlinessScore = Math.min(1.0, bgScore * 0.6 + brightnessScore * 0.4 + whiteBgBonus);

  return {
    cleanlinessScore: Math.round(cleanlinessScore * 100) / 100,
    isCleanBackground: isCleanBg,
    backgroundRgb: [Math.round(avgR), Math.round(avgG), Math.round(avgB)],
    isWhiteBackground: isWhiteBg,
  };
}

/**
 * Predicts rough clothing category based on bounding box aspect ratio and geometry
 */
export function estimateCategoryFromGeometry(aspectRatio: number): ClothingCategory {
  // aspectRatio = Height / Width
  if (aspectRatio > 1.4) {
    // Tall elongated silhouettes are almost always trousers, jeans, or maxi coats
    return 'bottom';
  } else if (aspectRatio >= 0.85 && aspectRatio <= 1.4) {
    // Square to medium-tall are tops, shirts, and sweaters
    return 'top';
  } else if (aspectRatio >= 0.65 && aspectRatio < 0.85) {
    // Wider than tall silhouettes
    return 'outerwear';
  } else {
    // Very wide items are typically footwear or accessories (belts, bags)
    return 'shoes';
  }
}
