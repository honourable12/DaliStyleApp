// ───────────────────────────────────────────────────────────────────────────
// Stylora Design System — "Refined Dark"
// Warm Void base, turmeric accent, cream ink. Calm, spacious, low-border.
// ───────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // Base surfaces — warm dark, layered by lightness (no harsh borders needed)
  background: '#0E0D0C',      // Warm Void
  surface: '#161412',         // Ash — one step up from bg
  surfaceRaised: '#211E1A',   // Linen Dark — cards sit here
  surfaceHigh: '#2A2622',     // hover / pressed
  // Borders are now whisper-thin semi-transparent cream — never a hard line
  surfaceBorder: 'rgba(242, 237, 230, 0.08)',
  surfaceBorderStrong: 'rgba(242, 237, 230, 0.14)',

  // Brand
  accent: '#E8A830',          // Turmeric
  accentSoft: '#F5E9C8',      // Pale Sand
  accentMuted: 'rgba(232, 168, 48, 0.16)',
  destructive: '#C0524A',     // Dried Rose

  // Ink
  textPrimary: '#F2EDE6',     // Cream
  textSecondary: '#A8A29A',   // Stone (lifted for readability)
  textMuted: '#726E68',

  // Status
  tagBg: 'rgba(242, 237, 230, 0.06)',
  tagText: '#D6CFC7',
  success: '#4E9F76',
};

// More generous, calmer rhythm
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Smoother, rounder corners — cards default to 20
export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 9999,
};

// Type scale — larger, calmer. No more 9px labels.
export const TYPOGRAPHY = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: '700' as const },
  h3: { fontSize: 15, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  micro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.4 },
  // Section overline — used sparingly, not shouted everywhere
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4 },
};

// Soft elevation — replaces heavy borders
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
};
