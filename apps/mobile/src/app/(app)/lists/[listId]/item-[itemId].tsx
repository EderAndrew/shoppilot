import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, YStack } from "tamagui";

import { AsyncState } from "../../../../shared/feedback/AsyncState";
import { useShoppingListDetailsQuery } from "../../../../features/shopping-list/shoppingList.queries";
import { ShoppingListItemForm } from "../../../../features/shopping-list-items/ShoppingListItemForm";
import { useUpdateShoppingListItemMutation } from "../../../../features/shopping-list-items/item.queries";

export default function EditShoppingListItemScreen() {
  const router = useRouter();
  const { itemId, listId } = useLocalSearchParams<{ itemId: string; listId: string }>();
  const details = useShoppingListDetailsQuery(listId);
  const updateItem = useUpdateShoppingListItemMutation(listId);
  const item = details.data?.items.find((currentItem) => currentItem.id === itemId);

  return (
    <ScrollView flex={1}>
      <YStack gap="$4" style={{ padding: 16 }}>
        <Text fontSize="$8" fontWeight="700">
          Editar item
        </Text>
        <AsyncState
          emptyMessage="Item não encontrado."
          error={details.error}
          isEmpty={details.isSuccess && !item}
          isLoading={details.isLoading}
          onRetry={() => details.refetch()}
        >
          {item ? (
            <ShoppingListItemForm
              defaultValues={{
                bought: item.bought,
                productId: item.productId,
                quantity: item.quantity,
                shoppingListId: listId,
                unitPrice: item.unitPrice,
              }}
              enableProductPicker={false}
              error={updateItem.error}
              isSubmitting={updateItem.isPending}
              onSubmit={(values) =>
                updateItem.mutate(
                  {
                    bought: values.bought,
                    itemId,
                    quantity: values.quantity,
                    shoppingListId: listId,
                    unitPrice: values.unitPrice,
                  },
                  { onSuccess: () => router.replace(`/(app)/lists/${listId}` as Href) },
                )
              }
            />
          ) : null}
        </AsyncState>
      </YStack>
    </ScrollView>
  );
}
