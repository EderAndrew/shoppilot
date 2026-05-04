import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "../shared/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Slot />
    </AppProviders>
  );
}
