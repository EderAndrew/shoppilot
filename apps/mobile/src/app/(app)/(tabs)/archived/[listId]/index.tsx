import { Stack, useLocalSearchParams } from "expo-router";
import { YStack } from "tamagui";

import { AsyncState } from "../../../../../shared/feedback/AsyncState";
import { ScreenContainer } from "../../../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../../../shared/ui/SectionHeader";
import { BudgetSummary } from "../../../../../features/shopping-list/BudgetSummary";
import { useShoppingListDetailsQuery } from "../../../../../features/shopping-list/shoppingList.queries";
import { AppListItem } from "../../../../../shared/ui/AppListItem";
import { formatMoney } from "../../../../../shared/formatters/money";

export default function ArchivedListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const details = useShoppingListDetailsQuery(listId);

  return (
    <>
      <Stack.Screen options={{ title: "Lista Arquivada" }} />
      <ScreenContainer scrollable>
        <AsyncState
          error={details.error}
          isLoading={details.isLoading}
          onRetry={() => details.refetch()}
        >
          {details.data ? (
            <>
              <SectionHeader
                title={details.data.list.name}
                subtitle="arquivada"
              />
              <BudgetSummary summary={details.data.budgetSummary} />
              <AsyncState
                emptyMessage="Nenhum item nesta lista."
                isEmpty={details.data.items.length === 0}
              >
                <YStack>
                  {details.data.items.map((item) => (
                    <AppListItem
                      key={item.id}
                      accessibilityLabel={item.productName ?? "Item da lista"}
                      subtitle={`${item.quantity} × ${formatMoney(item.unitPrice)}`}
                      title={item.productName ?? `Produto ${item.productId.slice(0, 8)}`}
                      value={formatMoney(item.totalPrice)}
                      variant={item.bought ? "completed" : "default"}
                    />
                  ))}
                </YStack>
              </AsyncState>
            </>
          ) : null}
        </AsyncState>
      </ScreenContainer>
    </>
  );
}
