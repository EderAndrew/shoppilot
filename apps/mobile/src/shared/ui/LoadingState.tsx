import { Spinner, Text, YStack } from 'tamagui';

import { colors, spacing, typography } from '../design-system/tokens';

export type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Carregando...' }: LoadingStateProps) {
  return (
    <YStack
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{ alignItems: 'center', padding: spacing.screenPadding, gap: 12 }}
    >
      <Spinner color={colors.primary} size="large" />
      <Text
        style={{
          fontSize: typography.body.fontSize,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </YStack>
  );
}
