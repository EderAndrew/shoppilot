import { PropsWithChildren, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PortalProvider } from "@tamagui/portal";
import { TamaguiProvider } from "tamagui";

import { createAppQueryClient } from "../../application/query-keys/queryClient";
import { AuthSessionProvider } from "../../features/auth/useAuthSession";
import { SessionRestorer } from "../../features/auth/SessionRestorer";
import tamaguiConfig from "../../../tamagui.config";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createAppQueryClient);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PortalProvider shouldAddRootHost>
        <QueryClientProvider client={queryClient}>
          <AuthSessionProvider initialState="loading">
            <SessionRestorer />
            {children}
          </AuthSessionProvider>
        </QueryClientProvider>
      </PortalProvider>
    </TamaguiProvider>
  );
}
