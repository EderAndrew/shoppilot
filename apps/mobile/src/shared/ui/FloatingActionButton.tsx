import type { ReactNode } from 'react';
import { Button } from 'tamagui';

import { colors, radius, shadows, spacing } from '../design-system/tokens';

export type FloatingActionButtonProps = {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress: () => void;
};

export function FloatingActionButton({
  icon,
  accessibilityLabel,
  onPress,
}: FloatingActionButtonProps) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      circular
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: spacing.screenPadding + 16,
        right: spacing.screenPadding,
        width: 56,
        height: 56,
        minHeight: spacing.minTouchTarget,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.elevated,
      }}
    >
      {icon}
    </Button>
  );
}
