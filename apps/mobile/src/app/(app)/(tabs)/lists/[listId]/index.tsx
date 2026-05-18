import { CheckCircle, Plus, Sparkles } from "@tamagui/lucide-icons-2";
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { AsyncState } from "../../../../../shared/feedback/AsyncState";
import { AppButton } from "../../../../../shared/ui/AppButton";
import { ScreenContainer } from "../../../../../shared/ui/ScreenContainer";
import { StatusState } from "../../../../../shared/ui/StatusState";
import { colors, typography } from "../../../../../shared/design-system/tokens";
import { BudgetSummary } from "../../../../../features/shopping-list/BudgetSummary";
import { OverBudgetAlert } from "../../../../../features/shopping-list/OverBudgetAlert";
import {
  useCompleteShoppingListMutation,
  useHydrateListFromRemote,
  useShoppingListDetailsQuery,
} from "../../../../../features/shopping-list/shoppingList.queries";
import { useActiveListRealtime } from "../../../../../features/shopping-list/useActiveListRealtime";
import { ShoppingListItemRow } from "../../../../../features/shopping-list-items/ShoppingListItemRow";
import {
  useCheckShoppingListItemMutation,
  usePendingSyncCountQuery,
  useRemoveShoppingListItemMutation,
} from "../../../../../features/shopping-list-items/item.queries";
import { AISuggestionSheet } from "../../../../../features/ai-assistant/AISuggestionSheet";
import { useUiStore } from "../../../../../shared/state/uiStore";
import { useAuthSession } from "../../../../../features/auth/useAuthSession";

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
  const { setAIAssistantOpen } = useUiStore();
  const { hydrateList } = useHydrateListFromRemote(listId);
  const { user } = useAuthSession();
  const pendingSync = usePendingSyncCountQuery(user?.id ?? "");
  useActiveListRealtime(listId);

  useEffect(() => {
    hydrateList();
  }, [listId]); // hydrateList (TanStack Query mutate) is stable across renders

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
              <XStack style={{ alignItems: "center", justifyContent: "space-between", gap: 8 }}>
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
                    {details.data.list.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: typography.caption.fontSize,
                      color: colors.textSecondary,
                    }}
                  >
                    {statusLabels[details.data.list.status]}
                  </Text>
                </YStack>
                {details.data.list.status === "active" ? (
                  <AppButton
                    accessibilityLabel="Sugestões de IA"
                    icon={<Sparkles size={16} />}
                    size="sm"
                    variant="ai"
                    onPress={() => setAIAssistantOpen(true)}
                  >
                    IA
                  </AppButton>
                ) : null}
              </XStack>
              <XStack gap="$2">
                <YStack flex={1}>
                  <AppButton
                    fullWidth
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                      router.push(`/(app)/(tabs)/lists/${listId}/insights` as Href)
                    }
                  >
                    Comparativo
                  </AppButton>
                </YStack>
                {details.data.list.status === "active" ? (
                  <YStack flex={1}>
                    <AppButton
                      fullWidth
                      icon={<CheckCircle size={16} />}
                      loading={completeList.isPending}
                      size="sm"
                      onPress={confirmCompleteList}
                    >
                      Completo
                    </AppButton>
                  </YStack>
                ) : null}
                {details.data.list.status === "active" ? (
                  <YStack flex={1}>
                    <AppButton
                      fullWidth
                      icon={<Plus size={16} />}
                      size="sm"
                      onPress={() =>
                        router.push(`/(app)/(tabs)/lists/${listId}/item-new` as Href)
                      }
                    >
                      Item
                    </AppButton>
                  </YStack>
                ) : null}
              </XStack>
              <BudgetSummary summary={details.data.budgetSummary} />
              <OverBudgetAlert isOverBudget={details.data.budgetSummary.isOverBudget} />
              {(pendingSync.data ?? 0) > 0 ? (
                <Text
                  style={{
                    fontSize: typography.caption.fontSize,
                    color: colors.textSecondary,
                  }}
                >
                  {pendingSync.data} {pendingSync.data === 1 ? "item pendente" : "itens pendentes"} de sincronização
                </Text>
              ) : null}
              {details.data.list.status === "archived" ? (
                <StatusState message="Esta lista está arquivada e é somente leitura." tone="error" />
              ) : null}
              <AsyncState
                emptyActionLabel="Adicionar item"
                emptyMessage="Nenhum item na lista ainda."
                isEmpty={details.data.items.length === 0}
                onEmptyAction={() =>
                  router.push(`/(app)/(tabs)/lists/${listId}/item-new` as Href)
                }
              >
                <YStack>
                  {details.data.items.map((item) => (
                    <ShoppingListItemRow
                      item={item}
                      isReadOnly={details.data.list.status === "archived"}
                      key={item.id}
                      onEdit={() =>
                        router.push(
                          `/(app)/(tabs)/lists/${listId}/item-${item.id}` as Href,
                        )
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
      {details.data?.list.status === "active" ? (
        <AISuggestionSheet
          listId={listId}
          listName={details.data.list.name}
          existingItemNames={details.data.items
            .map((item) => item.productName)
            .filter((name): name is string => name != null)}
        />
      ) : null}
    </>
  );
}
