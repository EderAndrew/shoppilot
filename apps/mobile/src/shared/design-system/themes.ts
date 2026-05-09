import { colors } from './tokens';

// Semantic light theme — stable role names for dark-mode readiness
export const lightTheme = {
  background: colors.background,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  surfaceSubtle: colors.surfaceSubtle,

  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textDisabled: colors.textDisabled,
  textOnPrimary: colors.textOnPrimary,
  textOnDanger: colors.textOnDanger,

  border: colors.border,
  borderFocus: colors.borderFocus,
  borderInvalid: colors.borderInvalid,

  primary: colors.primary,
  primaryHover: colors.primaryHover,
  primarySurface: colors.primarySurface,

  success: colors.success,
  successSurface: colors.successSurface,
  successBorder: colors.successBorder,

  warning: colors.warning,
  warningSurface: colors.warningSurface,

  danger: colors.danger,
  dangerHover: colors.dangerHover,
  dangerSurface: colors.dangerSurface,
  dangerBorder: colors.dangerBorder,
  dangerText: colors.dangerText,

  disabled: colors.disabled,
  disabledSurface: colors.disabledSurface,
} as const;

// New keys added to Tamagui's light theme (prefixed to avoid collision
// with existing Tamagui theme keys like background, color, borderColor…)
export const tamaguiThemeExtension = {
  appBackground: lightTheme.background,
  appSurface: lightTheme.surface,
  appSurfaceElevated: lightTheme.surfaceElevated,
  appSurfaceSubtle: lightTheme.surfaceSubtle,
  appTextPrimary: lightTheme.textPrimary,
  appTextSecondary: lightTheme.textSecondary,
  appTextDisabled: lightTheme.textDisabled,
  appBorder: lightTheme.border,
  appBorderFocus: lightTheme.borderFocus,
  appBorderInvalid: lightTheme.borderInvalid,
  appPrimary: lightTheme.primary,
  appPrimaryHover: lightTheme.primaryHover,
  appPrimarySurface: lightTheme.primarySurface,
  appSuccess: lightTheme.success,
  appSuccessSurface: lightTheme.successSurface,
  appWarning: lightTheme.warning,
  appWarningSurface: lightTheme.warningSurface,
  appDanger: lightTheme.danger,
  appDangerSurface: lightTheme.dangerSurface,
  appDangerBorder: lightTheme.dangerBorder,
  appDisabled: lightTheme.disabled,
  appDisabledSurface: lightTheme.disabledSurface,
} as const;

export type AppTheme = typeof lightTheme;
