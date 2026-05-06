import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";
import { AppButton } from "@/shared/ui/AppButton";
import { AppInput } from "@/shared/ui/AppInput";
import { StatusState } from "@/shared/ui/StatusState";

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
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <AppInput
            accessibilityLabel="Nome do produto"
            error={fieldState.error?.message}
            id="name"
            label="Nome"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      <Controller
        control={form.control}
        name="brand"
        render={({ field }) => (
          <AppInput
            accessibilityLabel="Marca do produto"
            id="brand"
            label="Marca"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value ?? ""}
          />
        )}
      />
      <Controller
        control={form.control}
        name="barcode"
        render={({ field }) => (
          <AppInput
            accessibilityLabel="Código de barras do produto"
            id="barcode"
            label="Código de barras"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value ?? ""}
          />
        )}
      />
      <Controller
        control={form.control}
        name="unit"
        render={({ field }) => (
          <AppInput
            accessibilityLabel="Unidade do produto"
            id="unit"
            label="Unidade"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value ?? ""}
          />
        )}
      />
      <DuplicateProductNotice candidates={duplicateCandidates.data ?? []} />
      {error ? <StatusState message={getSafeErrorMessage(error)} tone="error" /> : null}
      <AppButton
        accessibilityLabel={submitLabel}
        fullWidth
        loading={isSubmitting}
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
      </AppButton>
    </YStack>
  );
}
