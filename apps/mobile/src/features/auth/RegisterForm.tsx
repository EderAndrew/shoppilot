import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";
import { AppButton } from "@/shared/ui/AppButton";
import { AppInput } from "@/shared/ui/AppInput";
import { StatusState } from "@/shared/ui/StatusState";

import { registerSchema, type RegisterFormValues } from "./auth.schemas";

export type RegisterFormProps = {
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: RegisterFormValues) => void;
};

export function RegisterForm({ error, isSubmitting = false, onSubmit }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    defaultValues: { confirmPassword: "", email: "", password: "" },
  });

  return (
    <YStack gap="$3">
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            error={fieldState.error?.message}
            id="email"
            keyboardType="email-address"
            label="Email"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <AppInput
            error={fieldState.error?.message}
            id="password"
            label="Senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <AppInput
            error={fieldState.error?.message}
            id="confirmPassword"
            label="Confirmar senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      {error ? <StatusState message={getSafeErrorMessage(error)} tone="error" /> : null}
      <AppButton
        fullWidth
        loading={isSubmitting}
        onPress={form.handleSubmit((values) => {
          const parsed = registerSchema.safeParse(values);
          if (parsed.success) onSubmit(parsed.data);
          else {
            for (const issue of parsed.error.issues) {
              const name = issue.path[0] as keyof RegisterFormValues;
              form.setError(name, { message: issue.message });
            }
          }
        })}
      >
        Criar conta
      </AppButton>
    </YStack>
  );
}
