import { getMobileEnv, type MobileEnv } from "@shop-pilot/config/env/mobile";

let _env: MobileEnv | null = null;
export let envInitError: Error | null = null;

try {
  _env = getMobileEnv();
} catch (e) {
  envInitError = e instanceof Error ? e : new Error(String(e));
}

export const mobileEnv = _env as MobileEnv;

export const supabasePublicConfig = {
  anonKey: _env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  url: _env?.EXPO_PUBLIC_SUPABASE_URL ?? "",
} as const;
