import { Stack, useLocalSearchParams } from "expo-router";
import { Text, YStack } from "tamagui";

import { PriceComparisonIndicator } from "../../../../../features/insights/PriceComparisonIndicator";
import { usePriceInsightQuery } from "../../../../../features/price-history/priceHistory.queries";
import { useShoppingListDetailsQuery } from "../../../../../features/shopping-list/shoppingList.queries";
import { AsyncState } from "../../../../../shared/feedback/AsyncState";
import { colors, typography } from "../../../../../shared/design-system/tokens";
import { ScreenContainer } from "../../../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../../../shared/ui/SectionHeader";

function ItemInsight({ productId, unitPrice }: { productId: string; unitPrice: number }) {
  const insight = usePriceInsightQuery(productId, unitPrice);
  return <PriceComparisonIndicator insight={insight.data} />;
}

export default function ShoppingListInsightsScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const details = useShoppingListDetailsQuery(listId);

  return (
    <>
      <Stack.Screen options={{ title: "Comparativo", headerBackTitle: "Voltar" }} />
      <ScreenContainer scrollable>
        <SectionHeader title="Comparativo de preços" />
        <AsyncState
          emptyMessage="Nenhum item para comparar ainda."
          error={details.error}
          isEmpty={details.isSuccess && (details.data?.items.length ?? 0) === 0}
          isLoading={details.isLoading}
          onRetry={() => details.refetch()}
        >
          <YStack gap="$3">
            {(details.data?.items ?? []).map((item) => (
              <YStack gap="$2" key={item.id}>
                <Text {...typography.bodyStrong} color={colors.textPrimary}>
                  {item.productName ?? `Produto ${item.productId.slice(0, 8)}`}
                </Text>
                <ItemInsight productId={item.productId} unitPrice={item.unitPrice} />
              </YStack>
            ))}
          </YStack>
        </AsyncState>
      </ScreenContainer>
    </>
  );
}
