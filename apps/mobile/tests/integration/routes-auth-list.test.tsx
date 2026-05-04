import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const appRoot = join(process.cwd(), "src", "app");

async function routeSource(path: string): Promise<string> {
  return readFile(join(appRoot, path), "utf8");
}

describe("auth and active-list routes", () => {
  it("keeps signed-out users on auth screens and exposes login/register routes", async () => {
    await expect(routeSource("(auth)/login.tsx")).resolves.toContain("LoginForm");
    await expect(routeSource("(auth)/register.tsx")).resolves.toContain("RegisterForm");
    await expect(routeSource("(auth)/_layout.tsx")).resolves.toContain("Redirect");
  });

  it("protects app routes and wires the active-list flow", async () => {
    await expect(routeSource("(app)/_layout.tsx")).resolves.toContain("/(auth)/login");
    await expect(routeSource("(app)/index.tsx")).resolves.toContain("ShoppingListCard");
    await expect(routeSource("(app)/lists/[listId].tsx")).resolves.toContain("BudgetSummary");
    await expect(routeSource("(app)/lists/[listId]/item-new.tsx")).resolves.toContain("ShoppingListItemForm");
  });
});
