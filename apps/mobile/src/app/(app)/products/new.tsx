import { type Href, Stack, useRouter } from "expo-router";

import { ProductForm } from "../../../features/products/ProductForm";
import { useCreateProductMutation } from "../../../features/products/product.queries";
import { ScreenContainer } from "../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../shared/ui/SectionHeader";

export default function NewProductScreen() {
  const router = useRouter();
  const createProduct = useCreateProductMutation();

  return (
    <>
      <Stack.Screen options={{ title: "Novo produto" }} />
      <ScreenContainer scrollable>
        <SectionHeader title="Novo produto" />
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
      </ScreenContainer>
    </>
  );
}
