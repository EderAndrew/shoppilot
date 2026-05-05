import { type Href, useRouter } from "expo-router";
import { ScrollView, Text, YStack } from "tamagui";

import { ProductForm } from "../../../features/products/ProductForm";
import { useCreateProductMutation } from "../../../features/products/product.queries";

export default function NewProductScreen() {
  const router = useRouter();
  const createProduct = useCreateProductMutation();

  return (
    <ScrollView flex={1}>
      <YStack gap="$4" style={{ padding: 16 }}>
        <Text fontSize="$8" fontWeight="700">
          Novo produto
        </Text>
        <ProductForm
          error={createProduct.error}
          isSubmitting={createProduct.isPending}
          submitLabel="Criar produto"
          onSubmit={(values) =>
            createProduct.mutate(values, {
              onSuccess: () => router.replace("/(app)" as Href),
            })
          }
        />
      </YStack>
    </ScrollView>
  );
}
