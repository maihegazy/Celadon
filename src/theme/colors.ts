/**
 * Celadon palette — lifted verbatim from the approved design
 * (`project/Celadon App.dc.html`). Every hex here appears in the prototype;
 * nothing has been "improved" on the way across.
 */
export const colors = {
  /* surfaces */
  bg: '#f7f5f0', // screen background
  surface: '#ffffff', // cards, inputs
  sunken: '#f0ede5', // neutral fill / inner separators
  line: '#e8e4da', // card hairline border
  border: '#ddd8cc', // outlined-button border
  borderSoft: '#e0dcd0', // onboarding progress track
  chevron: '#c9c3b6', // disclosure chevrons, × buttons

  /* ink */
  ink: '#22302a', // primary text
  inkSoft: '#4a5a50', // body copy inside cards
  muted: '#6b7a70', // secondary text
  faint: '#9aa79e', // tertiary text / labels

  /* celadon greens */
  green: '#3c7a5a', // primary action
  greenDeep: '#2f4a3c', // dark cards, selected chips
  greenLight: '#e9f1ea', // tinted surfaces
  greenMid: '#7fa88f', // "balanced" marker
  greenText: '#5d8a70', // "balanced" label text
  greenPale: '#a9c4b3', // text on greenDeep
  greenSoft: '#c5d8cb', // decorative marks
  greenHatchA: '#e9f1ea', // photo-placeholder stripe A
  greenHatchB: '#f0f5f0', // photo-placeholder stripe B

  /* amber — flags and cautions */
  amber: '#b07c2f',
  amberLight: '#f7ecd9',
  amberDeep: '#7a5620',
  amberBar: '#e3c48f', // flare bars in the trend chart

  /* red — destructive, "limit" */
  red: '#b0503c',
  redLight: '#f6e5e0',

  /* camera surfaces */
  cameraBg: '#1d2620',
  cameraHatchA: '#2a362e',
  cameraHatchB: '#243029',

  /* water tracking */
  water: '#dcebf3',
  waterBorder: '#7fa3b8',

  /* explore category dots */
  plum: '#8a7cb0',
  wheat: '#a58a5a',
  berry: '#b0637c',

  /* trend chart mid band */
  trendMid: '#a8c7b3',

  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const overlay = {
  scrim: 'rgba(29,38,32,0.45)', // swap sheet backdrop
  dialogScrim: 'rgba(29,38,32,0.5)', // camera-permission backdrop
  tabBar: 'rgba(247,245,240,0.92)', // blurred tab bar tint
  onDark: 'rgba(255,255,255,0.12)', // camera-screen buttons
  onDarkText: 'rgba(255,255,255,0.75)',
  onDarkFaint: 'rgba(255,255,255,0.6)',
  onDarkFrame: 'rgba(255,255,255,0.35)',
  onDarkMono: 'rgba(255,255,255,0.55)',
  sheetHandle: '#ddd8cc',
} as const;
