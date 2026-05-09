import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const supabaseImportRestrictions = {
  paths: [
    {
      name: "@supabase/supabase-js",
      message:
        "Use repository ports and infrastructure adapters instead of importing Supabase in UI code.",
    },
  ],
  patterns: [
    {
      group: [
        "@/infrastructure/supabase",
        "@/infrastructure/supabase/*",
        "../infrastructure/supabase",
        "../infrastructure/supabase/*",
      ],
      message:
        "Supabase access belongs in infrastructure adapters, not route or feature UI modules.",
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "build/",
      "coverage/",
      "web-build/",
      "expo-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/shared/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": ["error", supabaseImportRestrictions],
    },
  },
  eslintConfigPrettier,
);
