import type { KeyboardTypeOptions } from 'react-native';
import { Input, Label, YStack } from 'tamagui';

import { colors, radius, spacing, typography } from '../design-system/tokens';
import { inputVariants } from '../design-system/variants';
import { InvalidFieldText } from './InvalidFieldText';

export type AppInputProps = {
  label?: string;
  id?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
  placeholder?: string;
};

export function AppInput({
  label,
  id,
  value,
  onChangeText,
  onBlur,
  error,
  helperText,
  disabled = false,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  accessibilityLabel,
  placeholder,
}: AppInputProps) {
  const variant = disabled ? 'disabled' : error ? 'invalid' : 'default';
  const variantStyle = inputVariants[variant];

  return (
    <YStack style={{ gap: spacing.formFieldGap }}>
      {label ? (
        <Label
          htmlFor={id}
          style={{
            fontSize: typography.fieldLabel.fontSize,
            fontWeight: typography.fieldLabel.fontWeight,
            color: colors.textPrimary,
          }}
        >
          {label}
        </Label>
      ) : null}
      <Input
        accessibilityLabel={accessibilityLabel ?? label}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        editable={!disabled}
        id={id}
        keyboardType={keyboardType}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        style={{
          borderColor: variantStyle.borderColor,
          backgroundColor: variantStyle.backgroundColor,
          borderRadius: radius.input,
          borderWidth: 1,
          minHeight: spacing.minTouchTarget,
        }}
      />
      {error ? <InvalidFieldText message={error} /> : null}
      {helperText && !error ? (
        <Label
          style={{
            fontSize: typography.caption.fontSize,
            color: colors.textSecondary,
          }}
        >
          {helperText}
        </Label>
      ) : null}
    </YStack>
  );
}
