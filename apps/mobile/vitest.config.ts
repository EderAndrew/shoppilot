import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: true,
  },
  resolve: {
    alias: [
      {
        find: /^@shop-pilot\/shared\/(.*)$/,
        replacement: new URL("../../packages/shared/src/$1", import.meta.url).pathname,
      },
      {
        find: "@shop-pilot/shared",
        replacement: new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
      },
      {
        find: /^@shop-pilot\/config\/(.*)$/,
        replacement: new URL("../../packages/config/src/$1", import.meta.url).pathname,
      },
      {
        find: "@shop-pilot/config",
        replacement: new URL("../../packages/config/src/index.ts", import.meta.url).pathname,
      },
      {
        find: "@",
        replacement: new URL("./src", import.meta.url).pathname,
      },
    ],
  },
});
