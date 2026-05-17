import { Redirect, Stack, type Href } from "expo-router";

import { useAuthSession } from "../../features/auth/useAuthSession";

export default function ProtectedAppLayout() {
  const { isAuthenticated, isLoading } = useAuthSession();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href={"/(auth)/login" as Href} />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="products/new" options={{ presentation: "modal" }} />
    </Stack>
  );
}
