// Raw palette — never import these directly outside this file
const palette = {
  // Teal (primary)
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal600: '#0d9488',
  teal700: '#0f766e',
  // Amber (secondary)
  amber50: '#fffbeb',
  amber600: '#d97706',
  // Neutrals
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray900: '#111827',
  // Red (danger)
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red600: '#dc2626',
  red700: '#b91c1c',
  // Green (success)
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green600: '#16a34a',
  green700: '#15803d',
  // Blue (info)
  blue50: '#eff6ff',
  blue600: '#2563eb',
} as const;

// Semantic color tokens — light theme values
export const colors = {
  // Backgrounds
  background: palette.white,
  surface: palette.gray50,
  surfaceElevated: palette.white,
  surfaceSubtle: palette.gray100,
  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray500,
  textDisabled: palette.gray400,
  textOnPrimary: palette.white,
  textOnDanger: palette.white,
  // Borders
  border: palette.gray200,
  borderFocus: palette.teal600,
  borderInvalid: palette.red600,
  // Primary (teal)
  primary: palette.teal600,
  primaryHover: palette.teal700,
  primarySurface: palette.teal50,
  primaryBorder: palette.teal100,
  // Secondary (amber)
  secondary: palette.amber600,
  secondarySurface: palette.amber50,
  // Success
  success: palette.green600,
  successHover: palette.green700,
  successSurface: palette.green50,
  successBorder: palette.green100,
  // Warning
  warning: palette.amber600,
  warningSurface: palette.amber50,
  // Danger
  danger: palette.red600,
  dangerHover: palette.red700,
  dangerSurface: palette.red50,
  dangerBorder: palette.red100,
  dangerText: palette.red700,
  // Disabled
  disabled: palette.gray400,
  disabledSurface: palette.gray100,
} as const;

// Spacing scale (in pixels)
export const spacing = {
  screenPadding: 16,
  screenGap: 24,
  sectionGap: 16,
  cardPadding: 16,
  cardGap: 12,
  formFieldGap: 6,
  formSectionGap: 16,
  listItemPaddingV: 12,
  listItemGap: 8,
  controlPaddingH: 14,
  controlPaddingV: 11,
  minTouchTarget: 44,
} as const;

// Radius scale (in pixels)
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  card: 10,
  input: 8,
  button: 8,
} as const;

// Shadow presets (React Native compatible)
export const shadows = {
  none: {},
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Typography role definitions
export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  screenTitle: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  sectionTitle: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  fieldLabel: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
