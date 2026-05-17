import { LogOut } from "@tamagui/lucide-icons-2";
import { Stack } from "expo-router";
import { Text, YStack } from "tamagui";

import { useAuthSession } from "../../../../features/auth/useAuthSession";
import { useLogoutMutation } from "../../../../features/auth/auth.queries";
import { ScreenContainer } from "../../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../../shared/ui/SectionHeader";
import { AppButton } from "../../../../shared/ui/AppButton";
import { colors, typography } from "../../../../shared/design-system/tokens";
import { getAppVersion } from "../../../../shared/utils/appVersion";

export default function UserScreen() {
  const { user } = useAuthSession();
  const logout = useLogoutMutation();

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Usuário" }} />
      <SectionHeader title="Conta" />
      <YStack gap="$4">
        <Text {...typography.caption} color={colors.textSecondary}>
          {user?.email ?? "—"}
        </Text>
        <AppButton
          accessibilityLabel="Sair da conta"
          icon={<LogOut size={18} />}
          disabled={logout.isPending}
          onPress={() => logout.mutate()}
          variant="danger"
        >
          {logout.isPending ? "Saindo…" : "Sair"}
        </AppButton>
        <Text {...typography.caption} color={colors.textSecondary}>
          Versão {getAppVersion()}
        </Text>
      </YStack>
    </ScreenContainer>
  );
}
