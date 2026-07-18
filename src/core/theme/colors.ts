export const Colors = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#8B7CF6',
  primaryDark: '#5A4CD1',

  // Accent
  accent: '#00D2D3',
  accentLight: '#26E9EA',

  // Backgrounds
  background: '#0A0A1A',
  surface: '#1A1A2E',
  surfaceElevated: '#16213E',
  surfaceHigh: '#0F3460',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B3C8',
  textMuted: '#6B6F8A',
  textDisabled: '#404060',

  // Semantic
  error: '#FF6B6B',
  errorLight: '#FF8F8F',
  warning: '#FFC107',
  success: '#51CF66',
  successDark: '#3DAD52',
  info: '#74B9FF',

  // Borders & Dividers
  border: 'rgba(108, 92, 231, 0.3)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // Glassmorphism
  glassFill: 'rgba(26, 26, 46, 0.7)',
  glassBorder: 'rgba(108, 92, 231, 0.25)',
  glassOverlay: 'rgba(10, 10, 26, 0.4)',

  // bKash brand
  bkash: '#E2136E',

  // Rocket brand
  rocket: '#8C3494',

  // Nagad brand
  nagad: '#F6921E',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
