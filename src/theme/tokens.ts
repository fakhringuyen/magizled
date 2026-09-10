/**
 * MagizLED design tokens. Colours are sampled from the MAGIZ wordmark:
 * a blue -> violet -> magenta gradient on near-black.
 */

export const Palette = {
  bg: '#07070C',
  bgElevated: '#0F0F17',
  surface: '#15151F',
  surfaceHigh: '#1E1E2B',
  border: '#282838',
  borderStrong: '#3A3A50',

  text: '#F4F4F8',
  textMuted: '#9A9AB4',
  textFaint: '#63637C',

  blue: '#4890F0',
  violet: '#9078D8',
  magenta: '#F048C0',

  online: '#3DDC97',
  warn: '#FFB020',
  danger: '#FF5C6C',
} as const;

export const BrandGradient = [Palette.blue, Palette.violet, Palette.magenta] as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const Type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
} as const;

/** Minimum touch target. The original app used 30sp text buttons. */
export const HitSize = 48;
