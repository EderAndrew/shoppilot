import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, YStack } from "tamagui";

import { RegisterForm } from "../../features/auth/RegisterForm";
import { useRegisterMutation } from "../../features/auth/auth.queries";

export default function RegisterScreen() {
  const router = useRouter();
  const register = useRegisterMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <YStack gap="$5" style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <YStack gap="$2">
        <Text fontSize="$9" fontWeight="700">
          Criar Conta
        </Text>
        <Text color="$gray10">
          Comece a fazer um orçamento mensal para as compras de supermercado.
        </Text>
      </YStack>
      <RegisterForm
        error={register.error}
        isSubmitting={register.isPending}
        onSubmit={(values) =>
          register.mutate(
            { email: values.email, password: values.password },
            {
              onSuccess: (session) => {
                if (session.user) {
                  router.replace("/(app)" as Href);
                  return;
                }

                setSuccessMessage("Conta criada. Confirme seu email antes de entrar.");
              },
            },
          )
        }
      />
      {successMessage ? <Text color="$green10">{successMessage}</Text> : null}
      <Button chromeless onPress={() => router.push("/(auth)/login" as Href)}>
        Faça login
      </Button>
    </YStack>
  );
}
