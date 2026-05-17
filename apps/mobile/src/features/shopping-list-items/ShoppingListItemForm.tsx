import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";

import { PriceComparisonIndicator } from "@/features/insights/PriceComparisonIndicator";
import { ProductPicker } from "@/features/products/ProductPicker";
import { usePriceInsightQuery } from "@/features/price-history/priceHistory.queries";
import { getSafeErrorMessage } from "@/shared/errors/appError";
import { AppButton } from "@/shared/ui/AppButton";
import { AppInput } from "@/shared/ui/AppInput";
import { StatusState } from "@/shared/ui/StatusState";

import { shoppingListItemSchema, type ShoppingListItemFormValues } from "./item.schemas";

const EMPTY_PRODUCT_ID = "00000000-0000-0000-0000-000000000000";

export type ShoppingListItemFormValuesWithProductName = ShoppingListItemFormValues & {
  productName?: string;
  productBrand?: string;
};

export type ShoppingListItemFormProps = {
  defaultValues: Partial<ShoppingListItemFormValuesWithProductName> & { shoppingListId: string };
  enableProductPicker?: boolean;
  error?: unknown;
  isSubmitting?: boolean;
  productNameRequired?: boolean;
  showBrandField?: boolean;
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
  showBrandField = false,
  submitLabel = "Salvar item",
}: ShoppingListItemFormProps) {
  const form = useForm<ShoppingListItemFormValuesWithProductName>({
    defaultValues: {
      bought: false,
      productBrand: "",
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
        <Controller
          control={form.control}
          name="productName"
          render={({ field, fieldState }) => (
            <AppInput
              accessibilityLabel="Nome do novo produto"
              error={fieldState.error?.message}
              id="productName"
              label="Nome do novo produto"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />
      ) : null}
      {productNameRequired || showBrandField ? (
        <Controller
          control={form.control}
          name="productBrand"
          render={({ field, fieldState }) => (
            <AppInput
              accessibilityLabel="Marca (opcional)"
              error={fieldState.error?.message}
              id="productBrand"
              label="Marca (opcional)"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />
      ) : null}
      <Controller
        control={form.control}
        name="quantity"
        render={({ field, fieldState }) => (
          <AppInput
            accessibilityLabel="Quantidade"
            error={fieldState.error?.message}
            id="quantity"
            keyboardType="decimal-pad"
            label="Quantidade"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={String(field.value || "")}
          />
        )}
      />
      <Controller
        control={form.control}
        name="unitPrice"
        render={({ field, fieldState }) => (
          <AppInput
            accessibilityLabel="Preço unitário"
            error={fieldState.error?.message}
            id="unitPrice"
            keyboardType="decimal-pad"
            label="Preço unitário"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={String(field.value || "")}
          />
        )}
      />
      {selectedProductId && unitPrice > 0 ? (
        <PriceComparisonIndicator insight={priceInsight.data} />
      ) : null}
      {error ? <StatusState message={getSafeErrorMessage(error)} tone="error" /> : null}
      <AppButton
        accessibilityLabel={submitLabel}
        fullWidth
        loading={isSubmitting}
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
              productBrand: values.productBrand,
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
      </AppButton>
    </YStack>
  );
}
