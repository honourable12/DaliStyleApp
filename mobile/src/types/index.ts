export type ClothingCategory =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  primaryColor: string; // Hex
  primaryColorName: string;
  accentColor?: string;
  pattern?: string;
  imageUrl: string;
  season?: string[];
  cleanlinessScore?: number;
  syncPending?: boolean;
  createdAt: number;
}

export interface MonkTone {
  label: string; // 'MST-1' to 'MST-10'
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface UserStyleProfile {
  id: string;
  monkLabel: string;
  skinHex: string;
  skinName: string;
  persona: 'Minimalist' | 'Bold' | 'Fluid' | 'Classic';
  locationName?: string;
}

export interface OutfitRecommendation {
  id: string;
  items: WardrobeItem[];
  harmonyScore: number; // 0 - 100
  skinContrastScore: number; // 0 - 100
  weatherAppropriate: boolean;
  weatherType: 'Sunny' | 'Cold' | 'Rainy' | 'Clear';
  harmonyType: 'Complementary' | 'Triadic' | 'Monochrome' | 'Analogous' | 'Neutral Base';
  stylingNote: string;
  wornDate?: string;
  savedInLookbook?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  token?: string;
  isAuthenticated: boolean;
}

export type ThemeMode = 'alabaster' | 'editorial';
