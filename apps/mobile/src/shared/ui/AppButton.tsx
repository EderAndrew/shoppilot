import type { ReactNode } from 'react';
import { Button, Spinner } from 'tamagui';

import {
  buttonDisabledStyle,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from '../design-system/variants';
import { radius, spacing } from '../design-system/tokens';

export type AppButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
};

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconOnly = false,
  icon,
  accessibilityLabel,
  children,
  onPress,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = isDisabled ? buttonDisabledStyle : buttonVariants[variant];
  const sizeStyle = buttonSizes[size];

  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        borderColor: variantStyle.borderColor,
        borderWidth: variantStyle.borderWidth,
        borderRadius: radius.button,
        height: sizeStyle.height,
        minHeight: spacing.minTouchTarget,
        paddingHorizontal: iconOnly ? 0 : sizeStyle.paddingHorizontal,
        minWidth: iconOnly ? spacing.minTouchTarget : undefined,
        alignSelf: fullWidth ? 'stretch' : 'auto',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {loading ? (
        <Spinner color={variantStyle.color} size="small" />
      ) : (
        <>
          {icon ? icon : null}
          {children ? (
            <Button.Text
              style={{
                color: variantStyle.color,
                fontSize: sizeStyle.fontSize,
                fontWeight: '600',
              }}
            >
              {children}
            </Button.Text>
          ) : null}
        </>
      )}
    </Button>
  );
}
