import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";

import { shoppingListItemSchema, type ShoppingListItemFormValues } from "./item.schemas";

export type ShoppingListItemFormValuesWithProductName = ShoppingListItemFormValues & {
  productName?: string;
};

export type ShoppingListItemFormProps = {
  defaultValues: Partial<ShoppingListItemFormValuesWithProductName> & { shoppingListId: string };
  error?: unknown;
  isSubmitting?: boolean;
  productNameRequired?: boolean;
  submitLabel?: string;
  onSubmit: (values: ShoppingListItemFormValuesWithProductName) => void;
};

export function ShoppingListItemForm({
  defaultValues,
  error,
  isSubmitting = false,
  onSubmit,
  productNameRequired = false,
  submitLabel = "Save item",
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

  return (
    <YStack gap="$3">
      {productNameRequired ? (
        <YStack gap="$2">
          <Label htmlFor="productName">Product name</Label>
          <Controller
            control={form.control}
            name="productName"
            render={({ field, fieldState }) => (
              <>
                <Input id="productName" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value ?? ""} />
                {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
              </>
            )}
          />
        </YStack>
      ) : null}
      <YStack gap="$2">
        <Label htmlFor="quantity">Quantity</Label>
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
        <Label htmlFor="unitPrice">Unit price</Label>
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
      {error ? <Text color="$red10">{getSafeErrorMessage(error)}</Text> : null}
      <Button
        disabled={isSubmitting}
        onPress={form.handleSubmit((values) => {
          if (productNameRequired && !values.productName?.trim()) {
            form.setError("productName", { message: "Product name is required." });
            return;
          }

          const parsed = shoppingListItemSchema.safeParse({
            ...values,
            productId: values.productId || "00000000-0000-0000-0000-000000000000",
          });
          if (parsed.success) onSubmit({ ...parsed.data, productName: values.productName });
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
