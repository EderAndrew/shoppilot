import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

import { useCreateProductMutation } from "../../../../features/products/product.queries";
import { ShoppingListItemForm } from "../../../../features/shopping-list-items/ShoppingListItemForm";
import { useAddShoppingListItemMutation } from "../../../../features/shopping-list-items/item.queries";

export default function NewShoppingListItemScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const addItem = useAddShoppingListItemMutation(listId);
  const createProduct = useCreateProductMutation();

  function addSelectedProductItem(values: Parameters<typeof addItem.mutate>[0]) {
    addItem.mutate(values, { onSuccess: () => router.replace(`/(app)/lists/${listId}` as Href) });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Novo item",
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView flex={1}>
        <YStack gap="$4" style={{ padding: 16 }}>
          <Text fontSize="$8" fontWeight="700">
            Adicionar Item
          </Text>
          <XStack>
            <Button onPress={() => router.push("/(app)/products/new" as Href)}>
              Criar produtos reutilizáveis
            </Button>
          </XStack>
          <ShoppingListItemForm
            defaultValues={{ shoppingListId: listId }}
            error={addItem.error ?? createProduct.error}
            isSubmitting={addItem.isPending || createProduct.isPending}
            productNameRequired
            submitLabel="Adicionar item"
            onSubmit={(values) => {
              if (values.productId) {
                addSelectedProductItem({
                  productId: values.productId,
                  quantity: values.quantity,
                  shoppingListId: listId,
                  unitPrice: values.unitPrice,
                });
                return;
              }

              createProduct.mutate(
                { name: values.productName ?? "Produto" },
                {
                  onSuccess: (product) =>
                    addSelectedProductItem({
                      productId: product.id,
                      quantity: values.quantity,
                      shoppingListId: listId,
                      unitPrice: values.unitPrice,
                    }),
                },
              );
            }}
          />
        </YStack>
      </ScrollView>
    </>
  );
}
