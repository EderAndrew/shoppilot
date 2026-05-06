import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { colors, spacing, typography } from '../design-system/tokens';
import { listItemVariants, type ListItemVariant } from '../design-system/variants';

export type AppListItemProps = {
  title: string;
  subtitle?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: ListItemVariant;
  accessibilityLabel?: string;
  onPress?: () => void;
};

export function AppListItem({
  title,
  subtitle,
  value,
  leading,
  trailing,
  variant = 'default',
  accessibilityLabel,
  onPress,
}: AppListItemProps) {
  const variantStyle = listItemVariants[variant];

  const content = (
    <XStack
      style={{
        alignItems: 'center',
        gap: spacing.listItemGap,
        paddingVertical: spacing.listItemPaddingV,
        opacity: variantStyle.opacity,
        minHeight: spacing.minTouchTarget,
      }}
    >
      {leading ? leading : null}
      <YStack flex={1}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: typography.body.fontSize,
            fontWeight: typography.bodyStrong.fontWeight,
            color: variantStyle.titleColor,
            textDecorationLine: variantStyle.titleTextDecoration,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: typography.caption.fontSize,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {value ? (
        <Text
          style={{
            fontSize: typography.bodyStrong.fontSize,
            fontWeight: typography.bodyStrong.fontWeight,
            color: colors.textPrimary,
          }}
        >
          {value}
        </Text>
      ) : null}
      {trailing ? trailing : null}
    </XStack>
  );

  if (onPress) {
    return (
      <XStack
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {content}
      </XStack>
    );
  }

  return content;
}
