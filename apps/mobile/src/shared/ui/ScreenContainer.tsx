import type { PropsWithChildren } from 'react';
import { ScrollView, YStack } from 'tamagui';

import { spacing } from '../design-system/tokens';

export type ScreenContainerProps = PropsWithChildren<{
  scrollable?: boolean;
  centered?: boolean;
}>;

export function ScreenContainer({
  children,
  centered = false,
  scrollable = false,
}: ScreenContainerProps) {
  if (scrollable) {
    return (
      <ScrollView flex={1}>
        <YStack gap="$4" style={{ padding: spacing.screenPadding }}>
          {children}
        </YStack>
      </ScrollView>
    );
  }

  return (
    <YStack
      flex={1}
      gap="$4"
      style={{
        padding: spacing.screenPadding,
        ...(centered && { justifyContent: 'center' }),
      }}
    >
      {children}
    </YStack>
  );
}
