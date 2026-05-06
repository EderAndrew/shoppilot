import type { PropsWithChildren } from 'react';
import { YStack } from 'tamagui';

import { cardBaseStyle, cardVariants, type CardVariant } from '../design-system/variants';
import { shadows } from '../design-system/tokens';

export type AppCardProps = PropsWithChildren<{
  variant?: CardVariant;
  elevated?: boolean;
  onPress?: () => void;
}>;

export function AppCard({
  children,
  variant = 'default',
  elevated = false,
  onPress,
}: AppCardProps) {
  const variantStyle = cardVariants[variant];
  const shadowStyle = elevated ? shadows.card : shadows.subtle;

  if (onPress) {
    return (
      <YStack
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

  return (
    <YStack
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
