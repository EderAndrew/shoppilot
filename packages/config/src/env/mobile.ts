import { z } from "zod";

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;

export function parseMobileEnv(input: Record<string, string | undefined>): MobileEnv {
  return mobileEnvSchema.parse({
    EXPO_PUBLIC_SUPABASE_ANON_KEY: input.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_URL: input.EXPO_PUBLIC_SUPABASE_URL,
  });
}

export function getMobileEnv(): MobileEnv {
  return parseMobileEnv(process.env);
}
