import { Progress, Text, XStack, YStack } from "tamagui";

import type { ShoppingListBudgetSummary } from "@/domain/services/budget";
import { formatMoney, formatPercentage } from "@/shared/formatters/money";

export function BudgetSummary({ summary }: { summary: ShoppingListBudgetSummary }) {
  const progressValue = Math.min(summary.usedPercentage, 100);

  return (
    <YStack gap="$3" style={{ borderRadius: 8, borderWidth: 1, padding: 16 }}>
      <XStack style={{ justifyContent: "space-between" }}>
        <YStack>
          <Text color="$gray10">Gasto</Text>
          <Text fontSize="$7" fontWeight="700">
            {formatMoney(summary.total)}
          </Text>
        </YStack>
        <YStack style={{ alignItems: "flex-end" }}>
          <Text color="$gray10">Restante</Text>
          <Text
            color={summary.remaining < 0 ? "$red10" : "$green10"}
            fontSize="$7"
            fontWeight="700"
          >
            {formatMoney(summary.remaining)}
          </Text>
        </YStack>
      </XStack>
      <Progress value={progressValue}>
        <Progress.Indicator
          style={{ backgroundColor: summary.isOverBudget ? "#dc2626" : "#16a34a" }}
        />
      </Progress>
      <XStack style={{ justifyContent: "space-between" }}>
        <Text>{formatPercentage(summary.usedPercentage)} usado</Text>
        <Text>Orçamento {formatMoney(summary.budget)}</Text>
      </XStack>
    </YStack>
  );
}
