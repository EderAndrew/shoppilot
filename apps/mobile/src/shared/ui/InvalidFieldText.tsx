import { Text } from 'tamagui';

import { colors, typography } from '../design-system/tokens';

export type InvalidFieldTextProps = {
  message: string;
};

export function InvalidFieldText({ message }: InvalidFieldTextProps) {
  return (
    <Text
      accessibilityRole="alert"
      style={{
        color: colors.danger,
        fontSize: typography.caption.fontSize,
        lineHeight: typography.caption.lineHeight,
      }}
    >
      {message}
    </Text>
  );
}
