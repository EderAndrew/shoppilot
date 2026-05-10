import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { AsyncState } from "../../../../../shared/feedback/AsyncState";
import { useShoppingListDetailsQuery } from "../../../../../features/shopping-list/shoppingList.queries";
import { ShoppingListItemForm } from "../../../../../features/shopping-list-items/ShoppingListItemForm";
import { useUpdateShoppingListItemMutation } from "../../../../../features/shopping-list-items/item.queries";
import { ScreenContainer } from "../../../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../../../shared/ui/SectionHeader";

export default function EditShoppingListItemScreen() {
  const router = useRouter();
  const { itemId, listId } = useLocalSearchParams<{ itemId: string; listId: string }>();
  const details = useShoppingListDetailsQuery(listId);
  const updateItem = useUpdateShoppingListItemMutation(listId);
  const item = details.data?.items.find((currentItem) => currentItem.id === itemId);

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Editar item" />
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
                {
                  onSuccess: () =>
                    router.replace(`/(app)/(tabs)/lists/${listId}` as Href),
                },
              )
            }
          />
        ) : null}
      </AsyncState>
    </ScreenContainer>
  );
}
