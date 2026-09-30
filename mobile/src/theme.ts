import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StatusBarStyle } from 'react-native';
import { ThemeMode } from './types';

// ───────────────────────────────────────────────────────────────────────────
// Stylora Dual Companion Design Systems
//
// Atelier Alabaster (Primary Inverted Light Theme)
// Visual Identity: Tactile raw linen parchment, gallery-grade minimalism, museum editorial catalog.
// Surface Palette:
//   Background Base: #F9F7F2 (Warm Alabaster Linen)
//   Card & Container Lowest: #FFFFFF (Porcelain Bright)
//   Elevated Container / Secondary: #ECE7DE / #F4F0E8
// Text & Glyph Hierarchy:
//   Primary Headlines: #191715 (Smoked Charcoal / Deep Espresso)
//   Secondary Metadata: #78726A (Warm Taupe / Stone)
//   Signature Accent: #D89622 (Turmeric Amber Ochre) for buttons, calibration rings, and active tags.
//
// Atelier Editorial (Dark Mode Luxury Void)
// Visual Identity: Nocturnal luxury atelier, golden-hour candlelight, deep archival depth.
// Surface Palette:
//   Background Base: #141312 (Obsidian Void)
//   Card Containers: #1D1B1A / #23211F
// Text Hierarchy:
//   Headlines & Body: #F5F2EB (Warm Cream)
//   Metadata & Dividers: #8E877E / #3B3937
//   Signature Accent: #E8A830 (Radiant Turmeric Gold)
// ───────────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  // Surface Palette
  background: string;
  cardLowest: string;
  surface: string;
  surfaceRaised: string;
  surfaceSecondary: string;
  surfaceHigh: string;
  surfaceBorder: string;
  surfaceBorderStrong: string;
  divider: string;

  // Text & Glyph Hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Signature Accent
  accent: string;
  accentSoft: string;
  accentMuted: string;
  accentContrastText: string;
  calibrationRing: string;

  // Tags & Status
  tagBg: string;
  tagText: string;
  tagActiveBg: string;
  tagActiveText: string;
  destructive: string;
  success: string;

  // Mobile Status Bar
  statusBar: StatusBarStyle;
}

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  float: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glow: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeDefinition {
  id: ThemeMode;
  name: string;
  subtitle: string;
  visualIdentity: string;
  isDark: boolean;
  colors: ThemeColors;
  shadows: ThemeShadows;
}

// ───────────────────────────────────────────────────────────────────────────
// Atelier Alabaster (Primary Inverted Light Theme)
// ───────────────────────────────────────────────────────────────────────────
export const ALABASTER_COLORS: ThemeColors = {
  // Surface Palette
  background: '#F9F7F2',           // Warm Alabaster Linen
  cardLowest: '#FFFFFF',           // Porcelain Bright
  surface: '#FFFFFF',              // Lowest Container / Card Surface
  surfaceRaised: '#ECE7DE',        // Elevated Container
  surfaceSecondary: '#F4F0E8',     // Secondary Elevated Container
  surfaceHigh: '#E5DFD4',          // Interactive / pressed state
  surfaceBorder: 'rgba(25, 23, 21, 0.08)',
  surfaceBorderStrong: 'rgba(25, 23, 21, 0.16)',
  divider: '#ECE7DE',

  // Text & Glyph Hierarchy
  textPrimary: '#191715',          // Smoked Charcoal / Deep Espresso
  textSecondary: '#78726A',        // Warm Taupe / Stone
  textMuted: '#9E978E',

  // Signature Accent
  accent: '#D89622',               // Turmeric Amber Ochre
  accentSoft: '#FBF3E3',
  accentMuted: 'rgba(216, 150, 34, 0.14)',
  accentContrastText: '#FFFFFF',
  calibrationRing: '#D89622',

  // Tags & Status
  tagBg: '#F4F0E8',
  tagText: '#191715',
  tagActiveBg: 'rgba(216, 150, 34, 0.14)',
  tagActiveText: '#D89622',
  destructive: '#B8473E',          // Architectural red
  success: '#2E7D55',              // Deep botanical green

  // Status Bar
  statusBar: 'dark-content',
};

export const ALABASTER_SHADOWS: ThemeShadows = {
  card: {
    shadowColor: '#191715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  float: {
    shadowColor: '#191715',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
  },
  glow: {
    shadowColor: '#D89622',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const ATELIER_ALABASTER: ThemeDefinition = {
  id: 'alabaster',
  name: 'Atelier Alabaster',
  subtitle: 'Primary Inverted Light Theme',
  visualIdentity: 'Tactile raw linen parchment, gallery-grade minimalism, museum editorial catalog.',
  isDark: false,
  colors: ALABASTER_COLORS,
  shadows: ALABASTER_SHADOWS,
};

// ───────────────────────────────────────────────────────────────────────────
// 5.2 Atelier Editorial (Dark Mode Luxury Void)
// ───────────────────────────────────────────────────────────────────────────
export const EDITORIAL_COLORS: ThemeColors = {
  // Surface Palette
  background: '#141312',           // Obsidian Void
  cardLowest: '#1D1B1A',           // Card Container 1
  surface: '#1D1B1A',              // Card Containers lowest
  surfaceRaised: '#23211F',        // Card Container 2 (Elevated)
  surfaceSecondary: '#23211F',     // Secondary elevated surface
  surfaceHigh: '#2C2926',          // Interactive / pressed state
  surfaceBorder: 'rgba(245, 242, 235, 0.08)',
  surfaceBorderStrong: '#3B3937',
  divider: '#3B3937',              // Metadata & Dividers

  // Text Hierarchy
  textPrimary: '#F5F2EB',          // Warm Cream Headlines & Body
  textSecondary: '#8E877E',        // Metadata (Warm Taupe / Stone)
  textMuted: '#68635C',

  // Signature Accent
  accent: '#E8A830',               // Radiant Turmeric Gold
  accentSoft: '#FCEECC',
  accentMuted: 'rgba(232, 168, 48, 0.18)',
  accentContrastText: '#141312',
  calibrationRing: '#E8A830',

  // Tags & Status
  tagBg: 'rgba(245, 242, 235, 0.06)',
  tagText: '#D8D2C7',
  tagActiveBg: 'rgba(232, 168, 48, 0.20)',
  tagActiveText: '#E8A830',
  destructive: '#C0524A',
  success: '#4E9F76',

  // Status Bar
  statusBar: 'light-content',
};

export const EDITORIAL_SHADOWS: ThemeShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 6,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: {
    shadowColor: '#E8A830',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const ATELIER_EDITORIAL: ThemeDefinition = {
  id: 'editorial',
  name: 'Atelier Editorial',
  subtitle: 'Dark Mode Luxury Void',
  visualIdentity: 'Nocturnal luxury atelier, golden-hour candlelight, deep archival depth.',
  isDark: true,
  colors: EDITORIAL_COLORS,
  shadows: EDITORIAL_SHADOWS,
};

// ───────────────────────────────────────────────────────────────────────────
// Theme Registry
// ───────────────────────────────────────────────────────────────────────────
export const THEMES: Record<ThemeMode, ThemeDefinition> = {
  alabaster: ATELIER_ALABASTER,
  editorial: ATELIER_EDITORIAL,
};

// Module-level reactive theme state
let currentThemeMode: ThemeMode = 'editorial';
const listeners = new Set<(mode: ThemeMode) => void>();

export function getActiveThemeMode(): ThemeMode {
  return currentThemeMode;
}

export function setActiveThemeMode(mode: ThemeMode): void {
  if (currentThemeMode !== mode) {
    currentThemeMode = mode;
    listeners.forEach((listener) => listener(mode));
  }
}

export function subscribeToThemeChanges(listener: (mode: ThemeMode) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Backward-compatible dynamic COLORS & SHADOWS exports
// These evaluate to Atelier Editorial by default (Dark Mode Luxury Void)
// and dynamically track active mode for dynamic property lookups.
// ───────────────────────────────────────────────────────────────────────────
export const COLORS: ThemeColors = new Proxy(EDITORIAL_COLORS, {
  get(_target, prop: keyof ThemeColors) {
    const active = THEMES[currentThemeMode]?.colors || EDITORIAL_COLORS;
    return active[prop] ?? EDITORIAL_COLORS[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(THEMES[currentThemeMode]?.colors || EDITORIAL_COLORS);
  },
  getOwnPropertyDescriptor(_target, prop: keyof ThemeColors) {
    const active = THEMES[currentThemeMode]?.colors || EDITORIAL_COLORS;
    return {
      value: active[prop],
      enumerable: true,
      configurable: true,
      writable: false,
    };
  },
});

export const SHADOWS: ThemeShadows = new Proxy(EDITORIAL_SHADOWS, {
  get(_target, prop: keyof ThemeShadows) {
    const active = THEMES[currentThemeMode]?.shadows || EDITORIAL_SHADOWS;
    return active[prop] ?? EDITORIAL_SHADOWS[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(THEMES[currentThemeMode]?.shadows || EDITORIAL_SHADOWS);
  },
  getOwnPropertyDescriptor(_target, prop: keyof ThemeShadows) {
    const active = THEMES[currentThemeMode]?.shadows || EDITORIAL_SHADOWS;
    return {
      value: active[prop],
      enumerable: true,
      configurable: true,
      writable: false,
    };
  },
});

// ───────────────────────────────────────────────────────────────────────────
// Shared Spatial & Typographic Foundation
// ───────────────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const TYPOGRAPHY = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: '700' as const },
  h3: { fontSize: 15, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  micro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.4 },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4 },
};

// ───────────────────────────────────────────────────────────────────────────
// React Context & Hook for Dynamic Dual Companion Theming
// ───────────────────────────────────────────────────────────────────────────
export interface ThemeContextValue {
  mode: ThemeMode;
  theme: ThemeDefinition;
  colors: ThemeColors;
  shadows: ThemeShadows;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'editorial',
  theme: ATELIER_EDITORIAL,
  colors: EDITORIAL_COLORS,
  shadows: EDITORIAL_SHADOWS,
  isDark: true,
  setMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{
  initialMode?: ThemeMode;
  children: React.ReactNode;
}> = ({ initialMode = 'editorial', children }) => {

  const [mode, setModeState] = useState<ThemeMode>(() => {
    setActiveThemeMode(initialMode);
    return initialMode;
  });

  const setMode = useCallback((newMode: ThemeMode) => {
    setActiveThemeMode(newMode);
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = mode === 'alabaster' ? 'editorial' : 'alabaster';
    setMode(next);
  }, [mode, setMode]);

  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges((newMode) => {
      setModeState(newMode);
    });
    return unsubscribe;
  }, []);

  const currentTheme = THEMES[mode] || ATELIER_ALABASTER;

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    theme: currentTheme,
    colors: currentTheme.colors,
    shadows: currentTheme.shadows,
    isDark: currentTheme.isDark,
    setMode,
    toggleTheme,
  }), [mode, currentTheme, setMode, toggleTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
