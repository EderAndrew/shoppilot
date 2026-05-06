import { Text, YStack } from 'tamagui';

import { colors, radius, spacing, typography } from '../design-system/tokens';
import { cardVariants } from '../design-system/variants';
import { AppButton } from './AppButton';

export type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  message,
  retryLabel = 'Tentar novamente',
  onRetry,
}: ErrorStateProps) {
  const style = cardVariants.danger;

  return (
    <YStack
      accessibilityRole="alert"
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderRadius: radius.md,
        padding: spacing.cardPadding,
        gap: 12,
      }}
    >
      {title ? (
        <Text
          style={{
            fontSize: typography.bodyStrong.fontSize,
            fontWeight: typography.bodyStrong.fontWeight,
            color: colors.dangerText,
          }}
        >
          {title}
        </Text>
      ) : null}
      <Text
        style={{
          fontSize: typography.body.fontSize,
          color: colors.dangerText,
        }}
      >
        {message}
      </Text>
      {onRetry ? (
        <AppButton variant="secondary" onPress={onRetry}>
          {retryLabel}
        </AppButton>
      ) : null}
    </YStack>
  );
}
