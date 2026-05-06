import { LogOut } from "@tamagui/lucide-icons-2";
import { Redirect, Stack, type Href } from "expo-router";
import { Button } from "tamagui";

import { useAuthSession } from "../../features/auth/useAuthSession";
import { useLogoutMutation } from "../../features/auth/auth.queries";

export default function ProtectedAppLayout() {
  const { isAuthenticated, isLoading } = useAuthSession();
  const logout = useLogoutMutation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href={"/(auth)/login" as Href} />;

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <Button
            accessibilityLabel="Sair"
            chromeless
            icon={LogOut}
            onPress={() => logout.mutate()}
          />
        ),
      }}
    />
  );
}
