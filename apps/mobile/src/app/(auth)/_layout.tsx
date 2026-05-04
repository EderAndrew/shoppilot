import { Redirect, Stack, type Href } from "expo-router";

import { useAuthSession } from "../../features/auth/useAuthSession";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthSession();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href={"/(app)" as Href} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
