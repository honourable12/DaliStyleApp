import { MonkTone } from '../types';

export const MONK_SCALE: MonkTone[] = [
  { label: 'MST-1', name: 'Very Light', hex: '#f6ede4', rgb: [246, 237, 228] },
  { label: 'MST-2', name: 'Light', hex: '#f3e7db', rgb: [243, 231, 219] },
  { label: 'MST-3', name: 'Light Medium', hex: '#f7ead0', rgb: [247, 234, 208] },
  { label: 'MST-4', name: 'Medium Light', hex: '#eadaba', rgb: [234, 218, 186] },
  { label: 'MST-5', name: 'Medium', hex: '#d7bd96', rgb: [215, 189, 150] },
  { label: 'MST-6', name: 'Medium Dark', hex: '#a07850', rgb: [160, 120, 80] },
  { label: 'MST-7', name: 'Dark Medium', hex: '#825c43', rgb: [130, 92, 67] },
  { label: 'MST-8', name: 'Dark', hex: '#604134', rgb: [96, 65, 52] },
  { label: 'MST-9', name: 'Very Dark', hex: '#3a312a', rgb: [58, 49, 42] },
  { label: 'MST-10', name: 'Deepest', hex: '#292420', rgb: [41, 36, 32] },
];

/**
 * Matches an RGB color tuple to the nearest Monk Skin Tone scale entry
 * using Euclidean RGB distance in 0ms on-device.
 */
export function matchMonkScale(rgb: [number, number, number]): MonkTone & { confidence: number } {
  let minDistance = Infinity;
  let bestMatch = MONK_SCALE[4]; // Default to MST-5

  for (const tone of MONK_SCALE) {
    const d = Math.sqrt(
      Math.pow(rgb[0] - tone.rgb[0], 2) +
      Math.pow(rgb[1] - tone.rgb[1], 2) +
      Math.pow(rgb[2] - tone.rgb[2], 2)
    );
    if (d < minDistance) {
      minDistance = d;
      bestMatch = tone;
    }
  }

  // Max possible RGB distance in 3D is sqrt(255^2 * 3) = 441.67
  const confidence = Math.max(0, Math.min(1, 1 - minDistance / 441.7));

  return {
    ...bestMatch,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Seasonal and undertone palette compatibility mapping based on Monk Scale
 */
export const MONK_PALETTE_PROFILES: Record<string, { season: string; undertone: 'Warm' | 'Cool' | 'Neutral'; recommendedAccents: string[] }> = {
  'MST-1': { season: 'Winter / Summer', undertone: 'Cool', recommendedAccents: ['#1F2937', '#991B1B', '#1E40AF', '#047857'] },
  'MST-2': { season: 'Summer', undertone: 'Cool', recommendedAccents: ['#374151', '#7C2D12', '#1D4ED8', '#065F46'] },
  'MST-3': { season: 'Summer / Spring', undertone: 'Cool', recommendedAccents: ['#4B5563', '#9A3412', '#2563EB', '#0D9488'] },
  'MST-4': { season: 'Spring', undertone: 'Warm', recommendedAccents: ['#E8A830', '#B45309', '#0F766E', '#1E293B'] },
  'MST-5': { season: 'Autumn', undertone: 'Warm', recommendedAccents: ['#E8A830', '#92400E', '#065F46', '#1E3A8A'] },
  'MST-6': { season: 'Autumn', undertone: 'Warm', recommendedAccents: ['#F59E0B', '#B91C1C', '#047857', '#F5E9C8'] },
  'MST-7': { season: 'Autumn / Winter', undertone: 'Warm', recommendedAccents: ['#FBBF24', '#DC2626', '#10B981', '#F8FAFC'] },
  'MST-8': { season: 'Winter', undertone: 'Neutral', recommendedAccents: ['#FDE047', '#E11D48', '#38BDF8', '#FFFFFF'] },
  'MST-9': { season: 'Winter', undertone: 'Cool', recommendedAccents: ['#FACC15', '#F43F5E', '#38BDF8', '#FFFFFF'] },
  'MST-10': { season: 'Winter', undertone: 'Cool', recommendedAccents: ['#FACC15', '#FB7185', '#60A5FA', '#FFFFFF'] },
};
