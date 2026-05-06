import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabasePublicConfig } from "@/shared/config/env";
import { supabaseSessionStorage, type SupabaseSessionStorage } from "./sessionStorage";
import type { Database } from "./database.types";

export type ShopPilotSupabaseClient = SupabaseClient<Database>;

export type CreateSupabaseClientOptions = {
  storage?: SupabaseSessionStorage;
};

export function createSupabaseClient(
  options: CreateSupabaseClientOptions = {},
): ShopPilotSupabaseClient {
  const storage = options.storage ?? supabaseSessionStorage;

  return createClient<Database>(supabasePublicConfig.url, supabasePublicConfig.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "implicit",
      persistSession: true,
      storage,
    },
  });
}

export const supabase = createSupabaseClient();
