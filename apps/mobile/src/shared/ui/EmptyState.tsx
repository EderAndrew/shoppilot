import { Text, YStack } from 'tamagui';

import { colors, spacing, typography } from '../design-system/tokens';
import { AppButton } from './AppButton';

export type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <YStack
      style={{
        alignItems: 'center',
        padding: spacing.screenPadding,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontSize: typography.bodyStrong.fontSize,
          fontWeight: typography.bodyStrong.fontWeight,
          color: colors.textPrimary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            fontSize: typography.body.fontSize,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton variant="secondary" onPress={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
    </YStack>
  );
}
