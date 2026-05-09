import { getMobileEnv } from "@shop-pilot/config/env/mobile";

export const mobileEnv = getMobileEnv();

export const supabasePublicConfig = {
  anonKey: mobileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  url: mobileEnv.EXPO_PUBLIC_SUPABASE_URL,
} as const;
