import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Text, YStack } from "tamagui";

import { RegisterForm } from "../../features/auth/RegisterForm";
import { useRegisterMutation } from "../../features/auth/auth.queries";
import { colors, typography } from "../../shared/design-system/tokens";
import { AppButton } from "../../shared/ui/AppButton";
import { SuccessState } from "../../shared/ui/StatusState";
import { ScreenContainer } from "../../shared/ui/ScreenContainer";

export default function RegisterScreen() {
  const router = useRouter();
  const register = useRegisterMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <ScreenContainer centered scrollable>
      <YStack gap="$2">
        <Text {...typography.screenTitle} color={colors.textPrimary}>Criar Conta</Text>
        <Text {...typography.body} color={colors.textSecondary}>
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
                  router.replace("/(app)/(tabs)/lists" as Href);
                  return;
                }
                setSuccessMessage("Conta criada. Confirme seu email antes de entrar.");
              },
            },
          )
        }
      />
      {successMessage ? <SuccessState message={successMessage} /> : null}
      <AppButton variant="subtle" onPress={() => router.push("/(auth)/login" as Href)}>
        Faça login
      </AppButton>
    </ScreenContainer>
  );
}
