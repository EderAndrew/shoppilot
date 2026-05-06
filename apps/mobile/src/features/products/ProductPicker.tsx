import type { ProductRecord } from "@/application/ports/ProductRepository";
import { Check } from "@tamagui/lucide-icons-2";
import { useState } from "react";
import { YStack } from "tamagui";

import { colors } from "@/shared/design-system/tokens";
import { AppInput } from "@/shared/ui/AppInput";
import { AppListItem } from "@/shared/ui/AppListItem";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";

import { useProductsQuery } from "./product.queries";

export type ProductPickerProps = {
  selectedProductId?: string;
  onSelect: (product: ProductRecord) => void;
};

export function ProductPicker({ onSelect, selectedProductId }: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const products = useProductsQuery(searchTerm);

  return (
    <YStack gap="$2">
      <AppInput
        accessibilityLabel="Buscar produtos salvos"
        id="productSearch"
        label="Produto"
        placeholder="Buscar produtos salvos"
        onChangeText={setSearchTerm}
        value={searchTerm}
      />
      {products.isLoading ? (
        <LoadingState label="Buscando produtos..." />
      ) : null}
      {!products.isLoading ? (
        <YStack>
          {(products.data ?? []).slice(0, 5).map((product) => (
            <AppListItem
              accessibilityLabel={`Selecionar produto ${product.name}`}
              key={product.id}
              title={`${product.name}${product.brand ? `, ${product.brand}` : ""}${product.unit ? ` (${product.unit})` : ""}`}
              trailing={
                selectedProductId === product.id ? (
                  <Check color={colors.success} size={18} />
                ) : null
              }
              onPress={() => onSelect(product)}
            />
          ))}
          {products.isSuccess && (products.data ?? []).length === 0 ? (
            <EmptyState title="Nenhum produto reutilizável encontrado." />
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
