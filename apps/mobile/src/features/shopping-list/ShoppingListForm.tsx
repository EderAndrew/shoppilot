import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";

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
      <YStack gap="$2">
        <Label htmlFor="name">Nome da lista</Label>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <>
              <Input
                accessibilityLabel="Nome da lista"
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
        <Label htmlFor="budget">Orçamento</Label>
        <Controller
          control={form.control}
          name="budget"
          render={({ field, fieldState }) => (
            <>
              <Input
                accessibilityLabel="Orçamento"
                id="budget"
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
        accessibilityLabel="Criar lista"
        disabled={isSubmitting}
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
      </Button>
    </YStack>
  );
}
