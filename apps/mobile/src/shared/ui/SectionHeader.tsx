import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { colors, typography } from '../design-system/tokens';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <YStack flex={1} gap="$1">
        <Text
          numberOfLines={2}
          style={{
            fontSize: typography.sectionTitle.fontSize,
            fontWeight: typography.sectionTitle.fontWeight,
            lineHeight: typography.sectionTitle.lineHeight,
            color: colors.textPrimary,
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
      {action ? action : null}
    </XStack>
  );
}
