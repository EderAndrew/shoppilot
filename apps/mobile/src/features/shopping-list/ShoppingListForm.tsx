import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";
import { AppButton } from "@/shared/ui/AppButton";
import { AppInput } from "@/shared/ui/AppInput";
import { StatusState } from "@/shared/ui/StatusState";

import { shoppingListSchema, type ShoppingListFormValues } from "./shoppingList.schemas";

export type ShoppingListFormProps = {
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: ShoppingListFormValues) => void;
};

export function ShoppingListForm({ error, isSubmitting = false, onSubmit }: ShoppingListFormProps) {
  const form = useForm<ShoppingListFormValues>({
    defaultValues: { budget: 0, name: "" },
  });

  return (
    <YStack gap="$3">
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <AppInput
            accessibilityLabel="Nome da lista"
            error={fieldState.error?.message}
            id="name"
            label="Nome da lista"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      <Controller
        control={form.control}
        name="budget"
        render={({ field, fieldState }) => (
          <AppInput
            accessibilityLabel="Orçamento"
            error={fieldState.error?.message}
            id="budget"
            keyboardType="decimal-pad"
            label="Orçamento"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={String(field.value || "")}
          />
        )}
      />
      {error ? <StatusState message={getSafeErrorMessage(error)} tone="error" /> : null}
      <AppButton
        accessibilityLabel="Criar lista"
        fullWidth
        loading={isSubmitting}
        onPress={form.handleSubmit((values) => {
          const parsed = shoppingListSchema.safeParse(values);
          if (parsed.success) onSubmit(parsed.data);
          else {
            for (const issue of parsed.error.issues) {
              const name = issue.path[0] as keyof ShoppingListFormValues;
              form.setError(name, { message: issue.message });
            }
          }
        })}
      >
        Criar lista
      </AppButton>
    </YStack>
  );
}
