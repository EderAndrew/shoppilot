import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";

import { DuplicateProductNotice } from "./DuplicateProductNotice";
import { productSchema, type ProductFormValues } from "./product.schemas";
import { useDuplicateProductCandidatesQuery } from "./product.queries";

export type ProductFormProps = {
  defaultValues?: Partial<ProductFormValues>;
  error?: unknown;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ProductFormValues) => void;
};

export function ProductForm({
  defaultValues,
  error,
  isSubmitting = false,
  onSubmit,
  submitLabel = "Salvar produto",
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    defaultValues: {
      barcode: null,
      brand: null,
      name: "",
      unit: null,
      ...defaultValues,
    },
  });
  const watchedValues = form.watch();
  const duplicateCandidates = useDuplicateProductCandidatesQuery({
    barcode: watchedValues.barcode,
    brand: watchedValues.brand,
    name: watchedValues.name,
    unit: watchedValues.unit,
  });

  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <Label htmlFor="name">Nome</Label>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <>
              <Input
                id="name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
              {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
            </>
          )}
        />
      </YStack>
      <YStack gap="$2">
        <Label htmlFor="brand">Marca</Label>
        <Controller
          control={form.control}
          name="brand"
          render={({ field }) => (
            <Input
              id="brand"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />
      </YStack>
      <YStack gap="$2">
        <Label htmlFor="barcode">Código de barras</Label>
        <Controller
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <Input
              id="barcode"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />
      </YStack>
      <YStack gap="$2">
        <Label htmlFor="unit">Unidade</Label>
        <Controller
          control={form.control}
          name="unit"
          render={({ field }) => (
            <Input
              id="unit"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />
      </YStack>
      <DuplicateProductNotice candidates={duplicateCandidates.data ?? []} />
      {error ? <Text color="$red10">{getSafeErrorMessage(error)}</Text> : null}
      <Button
        disabled={isSubmitting}
        onPress={form.handleSubmit((values) => {
          const parsed = productSchema.safeParse(values);
          if (parsed.success) onSubmit(parsed.data);
          else {
            for (const issue of parsed.error.issues) {
              const name = issue.path[0] as keyof ProductFormValues;
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
