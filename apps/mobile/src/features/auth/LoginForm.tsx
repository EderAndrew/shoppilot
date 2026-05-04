import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";

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
      <YStack gap="$2">
        <Label htmlFor="email">Email</Label>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <>
              <Input
                autoCapitalize="none"
                id="email"
                keyboardType="email-address"
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
        <Label htmlFor="password">Password</Label>
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <>
              <Input
                id="password"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                secureTextEntry
                value={field.value}
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
        Sign in
      </Button>
    </YStack>
  );
}
