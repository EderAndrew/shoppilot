import type { ProductRecord } from "@/application/ports/ProductRepository";
import { useRef, useState } from "react";
import { Text, YStack } from "tamagui";

import { colors } from "@/shared/design-system/tokens";
import { AppInput } from "@/shared/ui/AppInput";
import { AppListItem } from "@/shared/ui/AppListItem";

import { useProductsQuery } from "./product.queries";

export type ProductPickerProps = {
  selectedProductId?: string;
  onSelect: (product: ProductRecord) => void;
};

export function ProductPicker({ onSelect }: ProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const products = useProductsQuery(debouncedSearch);

  function handleChangeText(text: string) {
    setSearchTerm(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
  }

  const hasQuery = searchTerm.trim().length > 0;
  const firstProduct = products.data?.[0];
  const showSuggestion = hasQuery && !products.isLoading && Boolean(firstProduct);
  const showNotFound =
    hasQuery && !products.isLoading && products.isSuccess && (products.data ?? []).length === 0;

  return (
    <YStack gap="$2">
      <AppInput
        accessibilityLabel="Buscar produtos salvos"
        id="productSearch"
        label="Produto"
        placeholder="Buscar produtos salvos"
        onChangeText={handleChangeText}
        value={searchTerm}
      />
      {showSuggestion && firstProduct ? (
        <AppListItem
          accessibilityLabel={`Usar produto ${firstProduct.name}`}
          title={`Usar: ${firstProduct.name}${firstProduct.brand ? `, ${firstProduct.brand}` : ""}${firstProduct.unit ? ` (${firstProduct.unit})` : ""}`}
          onPress={() => {
            onSelect(firstProduct);
            setSearchTerm(firstProduct.name);
            setDebouncedSearch(firstProduct.name);
          }}
        />
      ) : null}
      {showNotFound ? (
        <Text color={colors.textSecondary} fontSize="$3">
          Nenhum produto reutilizável encontrado
        </Text>
      ) : null}
    </YStack>
  );
}
