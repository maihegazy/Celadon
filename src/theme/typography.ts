/**
 * Type system. The prototype uses two families:
 *   Albert Sans 400/500/600/700 — UI and body
 *   Lora 500/600               — display headings
 *
 * React Native resolves weights by font family name rather than by
 * `fontWeight`, so every weight is its own family constant.
 */
export const fonts = {
  regular: 'AlbertSans_400Regular',
  medium: 'AlbertSans_500Medium',
  semibold: 'AlbertSans_600SemiBold',
  bold: 'AlbertSans_700Bold',
  serif: 'Lora_500Medium',
  serifSemibold: 'Lora_600SemiBold',
  mono: undefined, // resolved per-platform in Text.tsx
} as const;

export type FontWeightToken = 'regular' | 'medium' | 'semibold' | 'bold' | 'serif' | 'serifSemibold';

/** CSS `line-height: <ratio>` → an explicit pixel value for RN. */
export const lh = (size: number, ratio: number) => Math.round(size * ratio);

/**
 * CSS letter-spacing is expressed in `em`; RN wants points.
 * The prototype's uppercase labels use .06em–.08em.
 */
export const tracking = (size: number, em: number) => Number((size * em).toFixed(2));
