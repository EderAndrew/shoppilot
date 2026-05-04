import { type Href, useRouter } from "expo-router";
import { Button, Text, YStack } from "tamagui";

import { LoginForm } from "../../features/auth/LoginForm";
import { useLoginMutation } from "../../features/auth/auth.queries";

export default function LoginScreen() {
  const router = useRouter();
  const login = useLoginMutation();

  return (
    <YStack gap="$5" style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <YStack gap="$2">
        <Text fontSize="$9" fontWeight="700">
          ShopPilot
        </Text>
        <Text color="$gray10">Faça login nas suas listas de compras mensais.</Text>
      </YStack>
      <LoginForm
        error={login.error}
        isSubmitting={login.isPending}
        onSubmit={(values) =>
          login.mutate(values, { onSuccess: () => router.replace("/(app)" as Href) })
        }
      />
      <Button chromeless onPress={() => router.push("/(auth)/register" as Href)}>
        Criar Conta
      </Button>
    </YStack>
  );
}
