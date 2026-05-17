import type { ReactNode } from 'react';
import { Text, XStack } from 'tamagui';

import { colors, radius, spacing, typography } from '../design-system/tokens';
import { stateToneStyles } from '../design-system/variants';

export type StatusTone = 'success' | 'warning' | 'error' | 'info';

export type StatusStateProps = {
  message: string;
  tone: StatusTone;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

export function StatusState({ message, tone, icon, accessibilityLabel }: StatusStateProps) {
  const toneStyle = stateToneStyles[tone];

  return (
    <XStack
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityRole="alert"
      style={{
        backgroundColor: toneStyle.backgroundColor,
        borderColor: toneStyle.borderColor,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: spacing.cardPadding,
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon ? icon : null}
      <Text
        flex={1}
        style={{
          fontSize: typography.body.fontSize,
          color: toneStyle.textColor,
        }}
      >
        {message}
      </Text>
    </XStack>
  );
}

// Convenience aliases for common tones
export function SuccessState({ message, icon }: { message: string; icon?: ReactNode }) {
  return <StatusState icon={icon} message={message} tone="success" />;
}

export function WarningState({ message, icon }: { message: string; icon?: ReactNode }) {
  return <StatusState icon={icon} message={message} tone="warning" />;
}

export function InfoState({ message, icon }: { message: string; icon?: ReactNode }) {
  return <StatusState icon={icon} message={message} tone="info" />;
}

// Colored text for inline status messages (lighter than StatusState container)
export function StatusText({ message, tone }: { message: string; tone: StatusTone }) {
  const toneStyle = stateToneStyles[tone];
  return (
    <Text style={{ fontSize: typography.body.fontSize, color: toneStyle.textColor }}>
      {message}
    </Text>
  );
}

// Subtle text-only confirmation (e.g. post-register)
export function ConfirmationText({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: typography.body.fontSize,
        color: colors.success,
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );
}
