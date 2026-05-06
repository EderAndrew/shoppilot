import { type Href, useRouter } from "expo-router";
import { Text, YStack } from "tamagui";

import { LoginForm } from "../../features/auth/LoginForm";
import { useLoginMutation } from "../../features/auth/auth.queries";
import { colors, typography } from "../../shared/design-system/tokens";
import { AppButton } from "../../shared/ui/AppButton";
import { ScreenContainer } from "../../shared/ui/ScreenContainer";

export default function LoginScreen() {
  const router = useRouter();
  const login = useLoginMutation();

  return (
    <ScreenContainer centered>
      <YStack gap="$2">
        <Text {...typography.screenTitle} color={colors.textPrimary}>ShopPilot</Text>
        <Text {...typography.body} color={colors.textSecondary}>
          Faça login nas suas listas de compras mensais.
        </Text>
      </YStack>
      <LoginForm
        error={login.error}
        isSubmitting={login.isPending}
        onSubmit={(values) =>
          login.mutate(values, { onSuccess: () => router.replace("/(app)" as Href) })
        }
      />
      <AppButton variant="subtle" onPress={() => router.push("/(auth)/register" as Href)}>
        Criar Conta
      </AppButton>
    </ScreenContainer>
  );
}
