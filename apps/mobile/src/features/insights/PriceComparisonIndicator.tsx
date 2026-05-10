import type { PriceInsight } from "@/domain/services/priceInsight";
import { formatMoney, formatSignedMoneyDifference } from "@/shared/formatters/money";
import { Text, YStack } from "tamagui";

import { colors, typography } from "@/shared/design-system/tokens";
import { AppCard } from "@/shared/ui/AppCard";
import type { CardVariant } from "@/shared/design-system/variants";

const labels: Record<PriceInsight["status"], string> = {
  cheaper: "Mais barato que o último preço",
  more_expensive: "Mais caro que o último preço",
  no_history: "Ainda sem histórico de preço",
  unchanged: "Igual ao último preço",
};

function statusVariant(status: PriceInsight["status"]): CardVariant {
  if (status === "cheaper") return "success";
  if (status === "more_expensive") return "danger";
  return "default";
}

function statusTextColor(status: PriceInsight["status"]): string {
  if (status === "cheaper") return colors.success;
  if (status === "more_expensive") return colors.danger;
  if (status === "unchanged") return colors.primary;
  return colors.textSecondary;
}

export type PriceComparisonIndicatorProps = {
  insight?: PriceInsight | null;
};

export function PriceComparisonIndicator({ insight }: PriceComparisonIndicatorProps) {
  if (!insight) return null;

  return (
    <AppCard variant={statusVariant(insight.status)}>
      <YStack
        accessibilityLabel={`Comparativo de preço: ${labels[insight.status]}`}
        gap="$1"
      >
        <Text {...typography.bodyStrong} color={statusTextColor(insight.status)}>
          {labels[insight.status]}
        </Text>
        {insight.previousPrice !== null ? (
          <Text {...typography.caption} color={colors.textSecondary}>
            Anterior {formatMoney(insight.previousPrice)}. Diferença{" "}
            {formatSignedMoneyDifference(insight.absoluteDifference ?? 0)} (
            {insight.percentageDifference?.toFixed(2)}%).
          </Text>
        ) : null}
      </YStack>
    </AppCard>
  );
}
