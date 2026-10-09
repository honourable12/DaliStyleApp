import { WardrobeItem, PatternType, PatternScale } from '../types';
import { colord } from 'colord';
import { findNearestCoutureColor } from './couturePalette';

export interface PatternHarmonyResult {
  score: number; // 0 - 100
  multiplier: number; // 0.6 - 1.2
  mixCategory:
    | 'Solid-Minimal'
    | 'Grounded-Pattern'
    | 'Animal-Neutral-Grounding'
    | 'Editorial-Scale-Mixing'
    | 'Pattern-Clash-Penalty';
  rationale: string;
}

/**
 * Intelligent keyword-based pattern & scale classifier
 */
export function detectPatternFromKeywords(text?: string): {
  pattern: PatternType;
  scale: PatternScale;
} {
  if (!text) return { pattern: 'solid', scale: 'medium' };

  const lower = text.toLowerCase();

  // 1. Detect Scale
  let scale: PatternScale = 'medium';
  if (['micro', 'pinstripe', 'ditsy', 'fine', 'tiny', 'mini', 'pin-dot'].some((k) => lower.includes(k))) {
    scale = 'micro';
  } else if (['macro', 'bold', 'windowpane', 'large', 'giant', 'oversized', 'wide'].some((k) => lower.includes(k))) {
    scale = 'macro';
  }

  // 2. Detect Pattern Type
  if (['leopard', 'cheetah', 'zebra', 'snake', 'tiger', 'animal'].some((k) => lower.includes(k))) {
    return { pattern: 'animal print', scale };
  }
  if (['stripe', 'pinstripe', 'breton', 'striped'].some((k) => lower.includes(k))) {
    return { pattern: 'striped', scale };
  }
  if (['plaid', 'tartan', 'check', 'checkered', 'gingham', 'houndstooth', 'glen'].some((k) => lower.includes(k))) {
    return { pattern: 'plaid', scale };
  }
  if (['floral', 'flower', 'botanical', 'bloom', 'petal'].some((k) => lower.includes(k))) {
    return { pattern: 'floral', scale };
  }
  if (['polka', 'dot', 'polka dot', 'spotted'].some((k) => lower.includes(k))) {
    return { pattern: 'polka dot', scale };
  }
  if (['geometric', 'argyle', 'diamond', 'zigzag', 'chevron'].some((k) => lower.includes(k))) {
    return { pattern: 'geometric', scale };
  }
  if (['graphic', 'tee print', 'logo', 'illustration', 'slogan', 'band'].some((k) => lower.includes(k))) {
    return { pattern: 'graphic print', scale };
  }

  return { pattern: 'solid', scale: 'medium' };
}

/**
 * Evaluates pattern compatibility between two wardrobe items
 * based on high-fashion editorial print-mixing rules.
 */
export function calculatePatternHarmony(
  item1: WardrobeItem,
  item2: WardrobeItem
): PatternHarmonyResult {
  const p1: PatternType = item1.pattern || 'solid';
  const p2: PatternType = item2.pattern || 'solid';
  const s1: PatternScale = item1.patternScale || 'medium';
  const s2: PatternScale = item2.patternScale || 'medium';

  // RULE 1: Solid + Solid (Architectural Clean Baseline)
  if (p1 === 'solid' && p2 === 'solid') {
    return {
      score: 92,
      multiplier: 1.0,
      mixCategory: 'Solid-Minimal',
      rationale: 'Clean architectural solid pairing with uninterrupted silhouette drape.',
    };
  }

  // Identify pattern vs solid
  const hasPattern1 = p1 !== 'solid';
  const hasPattern2 = p2 !== 'solid';

  // RULE 2: Pattern + Solid (The Haute-Couture Grounding Rule)
  if ((hasPattern1 && !hasPattern2) || (!hasPattern1 && hasPattern2)) {
    const patterned = hasPattern1 ? item1 : item2;
    const solid = hasPattern1 ? item2 : item1;

    // Animal print treated as a textured warm neutral
    if (patterned.pattern === 'animal print') {
      const solidCouture = findNearestCoutureColor(solid.primaryColor);
      const isAnchorNeutral =
        [
          'Black',
          'Charcoal',
          'Cream',
          'Camel',
          'Tan',
          'Ivory',
          'Espresso',
          'Deep Burgundy',
          'Emerald Green',
          'Military Olive',
        ].includes(solidCouture.name) ||
        solidCouture.family === 'Neutral' ||
        solidCouture.family === 'Earth';

      return {
        score: isAnchorNeutral ? 97 : 91,
        multiplier: isAnchorNeutral ? 1.15 : 1.08,
        mixCategory: 'Animal-Neutral-Grounding',
        rationale: `Statement ${patterned.pattern} elevated by grounded ${solidCouture.name} solid foundation.`,
      };
    }

    // Color-grounding test: does the solid match the pattern's base or accent?
    const patternPrimary = findNearestCoutureColor(patterned.primaryColor);
    const solidColor = findNearestCoutureColor(solid.primaryColor);

    const matchesBase = patternPrimary.name === solidColor.name;
    const matchesAccent =
      patterned.accentColor &&
      findNearestCoutureColor(patterned.accentColor).name === solidColor.name;

    const isSolidNeutral = solidColor.family === 'Neutral' || solidColor.family === 'Earth';

    if (matchesBase || matchesAccent) {
      return {
        score: 98,
        multiplier: 1.18,
        mixCategory: 'Grounded-Pattern',
        rationale: `Harmonious color-grounding: solid ${solidColor.name} directly anchors the ${patterned.pattern} motif palette.`,
      };
    }

    if (isSolidNeutral) {
      return {
        score: 95,
        multiplier: 1.12,
        mixCategory: 'Grounded-Pattern',
        rationale: `Architectural neutral ${solidColor.name} frames the ${patterned.pattern} without visual conflict.`,
      };
    }

    return {
      score: 90,
      multiplier: 1.04,
      mixCategory: 'Grounded-Pattern',
      rationale: `Solid ${solidColor.name} provides clean rest against the active ${patterned.pattern}.`,
    };
  }

  // RULE 3: Pattern + Pattern (Print-on-Print Mixing)
  if (hasPattern1 && hasPattern2) {
    // Graphic prints cannot pair with another pattern
    if (p1 === 'graphic print' || p2 === 'graphic print') {
      return {
        score: 55,
        multiplier: 0.7,
        mixCategory: 'Pattern-Clash-Penalty',
        rationale: 'Graphic print requires solid canvas to avoid cognitive dissonance.',
      };
    }

    // Scale-Inversion Test: micro + macro or micro + medium works; macro + macro clashes
    const isScaleInverted =
      (s1 === 'micro' && s2 === 'macro') ||
      (s1 === 'macro' && s2 === 'micro') ||
      (s1 === 'micro' && s2 === 'medium') ||
      (s1 === 'medium' && s2 === 'micro');

    // Color Bridge Test: do the two patterns share a common color family or anchor?
    const c1 = findNearestCoutureColor(item1.primaryColor);
    const c2 = findNearestCoutureColor(item2.primaryColor);
    const sharesColorBridge =
      c1.name === c2.name ||
      c1.family === c2.family ||
      (c1.family === 'Neutral' && c2.family === 'Neutral');

    if (isScaleInverted && sharesColorBridge) {
      return {
        score: 96,
        multiplier: 1.16,
        mixCategory: 'Editorial-Scale-Mixing',
        rationale: `Masterful print-mixing: ${s1} ${p1} and ${s2} ${p2} unified by shared ${c1.family.toLowerCase()} color bridge with scale contrast.`,
      };
    }

    if (isScaleInverted) {
      return {
        score: 88,
        multiplier: 1.05,
        mixCategory: 'Editorial-Scale-Mixing',
        rationale: `Intentional scale contrast balances ${s1} ${p1} against ${s2} ${p2}.`,
      };
    }

    // Same pattern type in same scale (e.g. horizontal stripe with vertical stripe, or check with check)
    if (p1 === p2 && sharesColorBridge) {
      return {
        score: 86,
        multiplier: 1.0,
        mixCategory: 'Editorial-Scale-Mixing',
        rationale: `Tonal ${p1}-on-${p2} matching coordinates through shared color palette.`,
      };
    }

    // Two competing busy patterns of same scale without shared color bridge
    return {
      score: 58,
      multiplier: 0.72,
      mixCategory: 'Pattern-Clash-Penalty',
      rationale: `Visual clash: competing ${s1} ${p1} and ${s2} ${p2} lack scale inversion and unified color bridge.`,
    };
  }

  return {
    score: 85,
    multiplier: 1.0,
    mixCategory: 'Solid-Minimal',
    rationale: 'Balanced ensemble configuration.',
  };
}

/**
 * Evaluates pattern harmony for an entire outfit ensemble
 */
export function evaluateEnsemblePatternHarmony(items: WardrobeItem[]): {
  overallScore: number;
  multiplier: number;
  patternNote: string;
} {
  if (items.length <= 1) {
    return { overallScore: 95, multiplier: 1.0, patternNote: 'Monolithic single piece' };
  }

  let totalScore = 0;
  let totalMultiplier = 1.0;
  let comparisons = 0;
  let bestRationale = '';

  for (let i = 0; i < items.length - 1; i++) {
    for (let j = i + 1; j < items.length; j++) {
      // Prioritize primary garments (top/bottom or one-piece/layer) over small accessories
      const isCore = items[i].category !== 'accessory' && items[j].category !== 'accessory';
      const result = calculatePatternHarmony(items[i], items[j]);

      if (isCore) {
        totalScore += result.score * 1.5;
        totalMultiplier *= result.multiplier;
        comparisons += 1.5;
        if (!bestRationale || result.mixCategory === 'Editorial-Scale-Mixing' || result.mixCategory === 'Pattern-Clash-Penalty') {
          bestRationale = result.rationale;
        }
      } else {
        totalScore += result.score;
        comparisons += 1.0;
      }
    }
  }

  const overallScore = Math.round(totalScore / Math.max(1, comparisons));
  return {
    overallScore,
    multiplier: Math.max(0.65, Math.min(1.25, totalMultiplier)),
    patternNote: bestRationale || 'Cohesive garment texture and print harmony.',
  };
}
