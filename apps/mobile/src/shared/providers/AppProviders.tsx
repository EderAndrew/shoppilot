import { PropsWithChildren, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider } from "tamagui";

import { createAppQueryClient } from "../../application/query-keys/queryClient";
import { AuthSessionProvider } from "../../features/auth/useAuthSession";
import tamaguiConfig from "../../../tamagui.config";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createAppQueryClient);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
