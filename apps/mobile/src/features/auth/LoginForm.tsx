import { Controller, useForm } from "react-hook-form";
import { YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";
import { AppButton } from "@/shared/ui/AppButton";
import { AppInput } from "@/shared/ui/AppInput";
import { StatusState } from "@/shared/ui/StatusState";

import { loginSchema, type LoginFormValues } from "./auth.schemas";

export type LoginFormProps = {
  isSubmitting?: boolean;
  error?: unknown;
  onSubmit: (values: LoginFormValues) => void;
};

export function LoginForm({ error, isSubmitting = false, onSubmit }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
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
      {error ? <StatusState message={getSafeErrorMessage(error)} tone="error" /> : null}
      <AppButton
        fullWidth
        loading={isSubmitting}
        onPress={form.handleSubmit((values) => {
          const parsed = loginSchema.safeParse(values);
          if (parsed.success) onSubmit(parsed.data);
          else {
            for (const issue of parsed.error.issues) {
              const name = issue.path[0] as keyof LoginFormValues;
              form.setError(name, { message: issue.message });
            }
          }
        })}
      >
        Entrar
      </AppButton>
    </YStack>
  );
}
