import { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PortalProvider } from "@tamagui/portal";
import { SQLiteProvider } from "expo-sqlite";
import { TamaguiProvider } from "tamagui";

import { queryClient } from "../../application/query-keys/queryClientInstance";
import { AuthSessionProvider } from "../../features/auth/useAuthSession";
import { SessionRestorer } from "../../features/auth/SessionRestorer";
import { initDatabase } from "../../lib/db/database";
import tamaguiConfig from "../../../tamagui.config";

export function AppProviders({ children }: PropsWithChildren) {

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PortalProvider shouldAddRootHost>
        <SQLiteProvider databaseName="shoppilot.db" onInit={initDatabase}>
          <QueryClientProvider client={queryClient}>
            <AuthSessionProvider initialState="loading">
              <SessionRestorer />
              {children}
            </AuthSessionProvider>
          </QueryClientProvider>
        </SQLiteProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}
