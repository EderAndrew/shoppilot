import { Controller, useForm } from "react-hook-form";
import { Button, Input, Label, Text, YStack } from "tamagui";

import { getSafeErrorMessage } from "@/shared/errors/appError";

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
      {(["email", "password", "confirmPassword"] as const).map((name) => (
        <YStack gap="$2" key={name}>
          <Label htmlFor={name}>
            {name === "confirmPassword" ? "Confirmar senha" : name === "email" ? "Email" : "Senha"}
          </Label>
          <Controller
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <>
                <Input
                  autoCapitalize={name === "email" ? "none" : undefined}
                  id={name}
                  keyboardType={name === "email" ? "email-address" : undefined}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  secureTextEntry={name !== "email"}
                  value={field.value}
                />
                {fieldState.error ? <Text color="$red10">{fieldState.error.message}</Text> : null}
              </>
            )}
          />
        </YStack>
      ))}
      {error ? <Text color="$red10">{getSafeErrorMessage(error)}</Text> : null}
      <Button
        disabled={isSubmitting}
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
      </Button>
    </YStack>
  );
}
