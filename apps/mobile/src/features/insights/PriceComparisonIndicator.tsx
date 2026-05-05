import type { PriceInsight } from "@/domain/services/priceInsight";
import { formatMoney, formatSignedMoneyDifference } from "@/shared/formatters/money";
import { Text, YStack } from "tamagui";

const labels: Record<PriceInsight["status"], string> = {
  cheaper: "Mais barato que o último preço",
  more_expensive: "Mais caro que o último preço",
  no_history: "Ainda sem histórico de preço",
  unchanged: "Igual ao último preço",
};

function statusColor(status: PriceInsight["status"]) {
  if (status === "cheaper") return "$green10" as const;
  if (status === "more_expensive") return "$red10" as const;
  if (status === "unchanged") return "$blue10" as const;
  return "$gray10" as const;
}

export type PriceComparisonIndicatorProps = {
  insight?: PriceInsight | null;
};

export function PriceComparisonIndicator({ insight }: PriceComparisonIndicatorProps) {
  if (!insight) return null;

  return (
    <YStack
      accessibilityLabel={`Comparativo de preço: ${labels[insight.status]}`}
      gap="$1"
      style={{ borderColor: "#e5e7eb", borderRadius: 6, borderWidth: 1, padding: 12 }}
    >
      <Text color={statusColor(insight.status)} fontWeight="700">
        {labels[insight.status]}
      </Text>
      {insight.previousPrice !== null ? (
        <Text color="$gray11">
          Anterior {formatMoney(insight.previousPrice)}. Diferença{" "}
          {formatSignedMoneyDifference(insight.absoluteDifference ?? 0)} (
          {insight.percentageDifference?.toFixed(2)}%).
        </Text>
      ) : null}
    </YStack>
  );
}
