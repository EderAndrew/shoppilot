import { CheckCircle, Plus } from "@tamagui/lucide-icons-2";
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { XStack, YStack } from "tamagui";

import { AsyncState } from "../../../shared/feedback/AsyncState";
import { AppButton } from "../../../shared/ui/AppButton";
import { ScreenContainer } from "../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { BudgetSummary } from "../../../features/shopping-list/BudgetSummary";
import { OverBudgetAlert } from "../../../features/shopping-list/OverBudgetAlert";
import {
  useCompleteShoppingListMutation,
  useShoppingListDetailsQuery,
} from "../../../features/shopping-list/shoppingList.queries";
import { useActiveListRealtime } from "../../../features/shopping-list/useActiveListRealtime";
import { ShoppingListItemRow } from "../../../features/shopping-list-items/ShoppingListItemRow";
import {
  useCheckShoppingListItemMutation,
  useRemoveShoppingListItemMutation,
} from "../../../features/shopping-list-items/item.queries";

const statusLabels = {
  active: "ativa",
  archived: "arquivada",
  completed: "concluída",
} as const;

export default function ShoppingListDetailsScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const details = useShoppingListDetailsQuery(listId);
  const completeList = useCompleteShoppingListMutation();
  const removeItem = useRemoveShoppingListItemMutation(listId);
  const checkItem = useCheckShoppingListItemMutation(listId);
  useActiveListRealtime(listId);

  const confirmCompleteList = () => {
    Alert.alert("Lista completa?", "Isso remove a lista da lista de compras ativas.", [
      { style: "cancel", text: "Cancelar" },
      {
        onPress: () => completeList.mutate(listId),
        text: "Completo",
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Compra do Mês" }} />
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
                subtitle={statusLabels[details.data.list.status]}
              />
              <XStack flexWrap="wrap" gap="$2">
                <AppButton
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/(app)/lists/${listId}/insights` as Href)}
                >
                  Comparativo
                </AppButton>
                {details.data.list.status === "active" ? (
                  <AppButton
                    icon={<CheckCircle size={16} />}
                    loading={completeList.isPending}
                    size="sm"
                    onPress={confirmCompleteList}
                  >
                    Completo
                  </AppButton>
                ) : null}
                <AppButton
                  icon={<Plus size={16} />}
                  size="sm"
                  onPress={() => router.push(`/(app)/lists/${listId}/item-new` as Href)}
                >
                  Item
                </AppButton>
              </XStack>
              <BudgetSummary summary={details.data.budgetSummary} />
              <OverBudgetAlert isOverBudget={details.data.budgetSummary.isOverBudget} />
              <AsyncState
                emptyActionLabel="Adicionar item"
                emptyMessage="Nenhum item na lista ainda."
                isEmpty={details.data.items.length === 0}
                onEmptyAction={() => router.push(`/(app)/lists/${listId}/item-new` as Href)}
              >
                <YStack>
                  {details.data.items.map((item) => (
                    <ShoppingListItemRow
                      item={item}
                      key={item.id}
                      onEdit={() =>
                        router.push(`/(app)/lists/${listId}/item-${item.id}` as Href)
                      }
                      onRemove={() =>
                        removeItem.mutate({ itemId: item.id, shoppingListId: listId })
                      }
                      onToggleBought={(bought) =>
                        checkItem.mutate({ bought, itemId: item.id, shoppingListId: listId })
                      }
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
