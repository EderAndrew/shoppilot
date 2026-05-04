import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, YStack } from "tamagui";

import { useCreateProductMutation } from "../../../../features/products/product.queries";
import { ShoppingListItemForm } from "../../../../features/shopping-list-items/ShoppingListItemForm";
import { useAddShoppingListItemMutation } from "../../../../features/shopping-list-items/item.queries";

export default function NewShoppingListItemScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const addItem = useAddShoppingListItemMutation(listId);
  const createProduct = useCreateProductMutation();

  return (
    <ScrollView flex={1}>
      <YStack gap="$4" style={{ padding: 16 }}>
        <Text fontSize="$8" fontWeight="700">
          Add item
        </Text>
        <ShoppingListItemForm
          defaultValues={{ shoppingListId: listId }}
          error={addItem.error ?? createProduct.error}
          isSubmitting={addItem.isPending || createProduct.isPending}
          productNameRequired
          submitLabel="Add item"
          onSubmit={(values) =>
            createProduct.mutate(
              { name: values.productName ?? "Product" },
              {
                onSuccess: (product) =>
                  addItem.mutate(
                    {
                      productId: product.id,
                      quantity: values.quantity,
                      shoppingListId: listId,
                      unitPrice: values.unitPrice,
                    },
                    { onSuccess: () => router.replace(`/(app)/lists/${listId}` as Href) },
                  ),
              },
            )
          }
        />
      </YStack>
    </ScrollView>
  );
}
