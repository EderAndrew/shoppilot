import { colors, radius, spacing } from './tokens';

// Button variant style props (compatible with Tamagui Button props + inline style)
export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'ai';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const buttonVariants: Record<ButtonVariant, {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  color: string;
}> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 0,
    color: colors.textOnPrimary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.textPrimary,
  },
  subtle: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: 'transparent',
    borderWidth: 0,
    color: colors.textPrimary,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    borderWidth: 0,
    color: colors.textOnDanger,
  },
  ai: {
    backgroundColor: '#D4622A',
    borderColor: '#D4622A',
    borderWidth: 0,
    color: '#FFFFFF',
  },
} as const;

export const buttonDisabledStyle = {
  backgroundColor: colors.disabledSurface,
  borderColor: 'transparent',
  borderWidth: 0,
  color: colors.disabled,
  opacity: 0.7,
} as const;

export const buttonSizes: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 14 },
  md: { height: 44, paddingHorizontal: spacing.controlPaddingH, fontSize: 16 },
  lg: { height: 52, paddingHorizontal: 20, fontSize: 18 },
} as const;

// Input variant styles
export type InputVariant = 'default' | 'invalid' | 'disabled';

export const inputVariants: Record<InputVariant, {
  borderColor: string;
  backgroundColor: string;
}> = {
  default: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  invalid: {
    borderColor: colors.borderInvalid,
    backgroundColor: colors.surfaceElevated,
  },
  disabled: {
    borderColor: colors.border,
    backgroundColor: colors.disabledSurface,
  },
} as const;

// Card variant styles
export type CardVariant = 'default' | 'elevated' | 'subtle' | 'actionable' | 'danger' | 'warning' | 'success';

export const cardVariants: Record<CardVariant, {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}> = {
  default: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderColor: 'transparent',
    borderWidth: 0,
  },
  subtle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  actionable: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warning,
    borderWidth: 1,
  },
  success: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
    borderWidth: 1,
  },
} as const;

export const cardBaseStyle = {
  borderRadius: radius.card,
  padding: spacing.cardPadding,
} as const;

// List item variant styles
export type ListItemVariant = 'default' | 'completed' | 'actionable';

export const listItemVariants: Record<ListItemVariant, {
  opacity: number;
  titleTextDecoration: 'none' | 'line-through';
  titleColor: string;
}> = {
  default: {
    opacity: 1,
    titleTextDecoration: 'none',
    titleColor: colors.textPrimary,
  },
  completed: {
    opacity: 0.7,
    titleTextDecoration: 'line-through',
    titleColor: colors.textSecondary,
  },
  actionable: {
    opacity: 1,
    titleTextDecoration: 'none',
    titleColor: colors.textPrimary,
  },
} as const;

// Status/state tone styles
export type StateTone = 'loading' | 'empty' | 'error' | 'success' | 'warning' | 'info';

export const stateToneStyles: Record<Exclude<StateTone, 'loading' | 'empty'>, {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}> = {
  error: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    textColor: colors.dangerText,
  },
  success: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
    textColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warning,
    textColor: colors.warning,
  },
  info: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryBorder,
    textColor: colors.primary,
  },
} as const;
