import { Progress, Text, XStack, YStack } from "tamagui";

import type { ShoppingListBudgetSummary } from "@/domain/services/budget";
import { formatMoney, formatPercentage } from "@/shared/formatters/money";
import { AppCard } from "@/shared/ui/AppCard";
import { colors, typography } from "@/shared/design-system/tokens";

export function BudgetSummary({ summary }: { summary: ShoppingListBudgetSummary }) {
  const progressValue = Math.min(summary.usedPercentage, 100);
  const accessibilityLabel = `Resumo do orçamento. Gasto ${formatMoney(
    summary.total,
  )}. Restante ${formatMoney(summary.remaining)}. Orçamento ${formatMoney(summary.budget)}.`;

  return (
    <AppCard>
      <YStack
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="summary"
        gap="$3"
      >
        <XStack style={{ justifyContent: "space-between" }}>
          <YStack>
            <Text {...typography.caption} color={colors.textSecondary}>Gasto</Text>
            <Text {...typography.sectionTitle} color={colors.textPrimary}>
              {formatMoney(summary.total)}
            </Text>
          </YStack>
          <YStack style={{ alignItems: "flex-end" }}>
            <Text {...typography.caption} color={colors.textSecondary}>Restante</Text>
            <Text
              {...typography.sectionTitle}
              color={summary.remaining < 0 ? colors.danger : colors.success}
            >
              {formatMoney(summary.remaining)}
            </Text>
          </YStack>
        </XStack>
        <Progress
          accessibilityLabel={`Uso do orçamento: ${formatPercentage(summary.usedPercentage)}`}
          value={progressValue}
        >
          <Progress.Indicator
            style={{ backgroundColor: summary.isOverBudget ? colors.danger : colors.success }}
          />
        </Progress>
        <XStack style={{ justifyContent: "space-between" }}>
          <Text {...typography.caption} color={colors.textSecondary}>
            {formatPercentage(summary.usedPercentage)} usado
          </Text>
          <Text {...typography.caption} color={colors.textSecondary}>
            Orçamento {formatMoney(summary.budget)}
          </Text>
        </XStack>
      </YStack>
    </AppCard>
  );
}
