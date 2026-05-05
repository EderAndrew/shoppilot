import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { PriceComparisonIndicator } from "@/features/insights/PriceComparisonIndicator";
import { ProductPicker } from "@/features/products/ProductPicker";
import { usePriceInsightQuery } from "@/features/price-history/priceHistory.queries";
import { getSafeErrorMessage } from "@/shared/errors/appError";

import { shoppingListItemSchema, type ShoppingListItemFormValues } from "./item.schemas";

const EMPTY_PRODUCT_ID = "00000000-0000-0000-0000-000000000000";

export type ShoppingListItemFormValuesWithProductName = ShoppingListItemFormValues & {
  productName?: string;
};

export type ShoppingListItemFormProps = {
  defaultValues: Partial<ShoppingListItemFormValuesWithProductName> & { shoppingListId: string };
  enableProductPicker?: boolean;
  error?: unknown;
  isSubmitting?: boolean;
  productNameRequired?: boolean;
  submitLabel?: string;
  onSubmit: (values: ShoppingListItemFormValuesWithProductName) => void;
};

export function ShoppingListItemForm({
  defaultValues,
  enableProductPicker = true,
  error,
  isSubmitting = false,
  onSubmit,
  productNameRequired = false,
  submitLabel = "Salvar item",
}: ShoppingListItemFormProps) {
  const form = useForm<ShoppingListItemFormValuesWithProductName>({
    defaultValues: {
      bought: false,
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      ...defaultValues,
    },
  });
  const selectedProductId = form.watch("productId");
  const unitPrice = Number(form.watch("unitPrice") || 0);
  const priceInsight = usePriceInsightQuery(selectedProductId, unitPrice);

  return (
    <YStack gap="$3">
      {enableProductPicker ? (
        <ProductPicker
          selectedProductId={selectedProductId}
          onSelect={(product) => {
            form.setValue("productId", product.id);
            form.clearErrors("productId");
          }}
        />
      ) : null}
      {productNameRequired ? (
        <YStack gap="$2">
          <Label htmlFor="productName">Nome do novo produto</Label>
          <Controller
            control={form.control}
            name="productName"
            render={({ field, fieldState }) => (
              <>
                <Input
                  id="productName"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  value={field.value ?? ""}
                />
                {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
              </>
            )}
          />
        </YStack>
      ) : null}
      <YStack gap="$2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Controller
          control={form.control}
          name="quantity"
          render={({ field, fieldState }) => (
            <>
              <Input
                id="quantity"
                keyboardType="decimal-pad"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={String(field.value || "")}
              />
              {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
            </>
          )}
        />
      </YStack>
      <YStack gap="$2">
        <Label htmlFor="unitPrice">Preço unitário</Label>
        <Controller
          control={form.control}
          name="unitPrice"
          render={({ field, fieldState }) => (
            <>
              <Input
                id="unitPrice"
                keyboardType="decimal-pad"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={String(field.value || "")}
              />
              {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
            </>
          )}
        />
      </YStack>
      {selectedProductId && unitPrice > 0 ? (
        <PriceComparisonIndicator insight={priceInsight.data} />
      ) : null}
      {error ? <Text color="$red10">{getSafeErrorMessage(error)}</Text> : null}
      <Button
        disabled={isSubmitting}
        onPress={form.handleSubmit((values) => {
          if (productNameRequired && !values.productId && !values.productName?.trim()) {
            form.setError("productName", { message: "O nome do produto é obrigatório." });
            return;
          }

          const parsed = shoppingListItemSchema.safeParse({
            ...values,
            productId: values.productId || EMPTY_PRODUCT_ID,
          });
          if (parsed.success)
            onSubmit({
              ...parsed.data,
              productId: values.productId || "",
              productName: values.productName,
            });
          else {
            for (const issue of parsed.error.issues) {
              const name = issue.path[0] as keyof ShoppingListItemFormValuesWithProductName;
              form.setError(name, { message: issue.message });
            }
          }
        })}
      >
        {submitLabel}
      </Button>
    </YStack>
  );
}
