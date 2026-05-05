import type { ProductRecord } from "@/application/ports/ProductRepository";
import { Check } from "@tamagui/lucide-icons-2";
import { useState } from "react";
import { Button, Input, Label, Text, XStack, YStack } from "tamagui";

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
      <Label htmlFor="productSearch">Produto</Label>
      <XStack gap="$2">
        <Input
          flex={1}
          id="productSearch"
          onChangeText={setSearchTerm}
          placeholder="Buscar produtos salvos"
          value={searchTerm}
        />
      </XStack>
      <YStack gap="$2">
        {(products.data ?? []).slice(0, 5).map((product) => (
          <Button
            icon={selectedProductId === product.id ? Check : undefined}
            key={product.id}
            onPress={() => onSelect(product)}
            style={{ justifyContent: "flex-start" }}
            theme={selectedProductId === product.id ? "green" : undefined}
          >
            {product.name}
            {product.brand ? `, ${product.brand}` : ""}
            {product.unit ? ` (${product.unit})` : ""}
          </Button>
        ))}
        {products.isSuccess && (products.data ?? []).length === 0 ? (
          <Text color="$gray10">Nenhum produto reutilizável encontrado.</Text>
        ) : null}
      </YStack>
    </YStack>
  );
}
