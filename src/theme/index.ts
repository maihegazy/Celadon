export { colors, overlay } from './colors';
export { fonts, lh, tracking } from './typography';
export type { FontWeightToken } from './typography';

/** Corner radii used across the prototype. */
export const radius = {
  chip: 22,
  pill: 26,
  card: 16,
  cardLg: 18,
  tile: 14,
  tileSm: 13,
  thumb: 12,
  thumbSm: 10,
  check: 7,
  checkSq: 6,
  sheet: 24,
  full: 999,
} as const;

/** The tab bar floats over content; scrolling screens reserve this much room. */
export const TAB_BAR_CONTENT_INSET = 100;

export const shadow = {
  scanButton: {
    shadowColor: '#2f4a3c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#1d2620',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
} as const;
