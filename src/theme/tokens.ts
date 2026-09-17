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
  // The outline that identifies a control needs 3:1. This measures 3.16:1 on
  // surfaceHigh, where the old borderStrong measured 1.14:1.
  outline: '#6A6A88',

  text: '#F4F4F8',
  textMuted: '#9A9AB4',
  // Was #63637C, which measured 2.83:1 on surfaceHigh. Every use is 12px or
  // 13px text, so it needs 4.5:1. This measures 4.90:1 there and 5.39:1 on
  // surface.
  textFaint: '#8A8AA4',

  blue: '#4890F0',
  violet: '#9078D8',
  magenta: '#F048C0',

  /** Text and icons that sit on a brand fill. White measured 2.93:1 on blue. */
  onBrand: '#07070C',

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
