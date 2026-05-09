import type { PropsWithChildren } from 'react';
import { YStack } from 'tamagui';

import { cardBaseStyle, cardVariants, type CardVariant } from '../design-system/variants';
import { shadows } from '../design-system/tokens';

export type AppCardProps = PropsWithChildren<{
  variant?: CardVariant;
  elevated?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void;
}>;

export function AppCard({
  children,
  variant = 'default',
  elevated = false,
  accessibilityLabel,
  onPress,
}: AppCardProps) {
  const variantStyle = cardVariants[variant];
  const shadowStyle = elevated ? shadows.card : shadows.subtle;

  return (
    <YStack
      accessibilityLabel={onPress ? accessibilityLabel : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[
        cardBaseStyle,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
        },
        shadowStyle,
      ]}
    >
      {children}
    </YStack>
  );
}
