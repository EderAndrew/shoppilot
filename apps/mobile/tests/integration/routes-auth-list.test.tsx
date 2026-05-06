import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const appRoot = join(process.cwd(), "src", "app");
const featuresRoot = join(process.cwd(), "src", "features");

async function routeSource(path: string): Promise<string> {
  return readFile(join(appRoot, path), "utf8");
}

async function featureSource(path: string): Promise<string> {
  return readFile(join(featuresRoot, path), "utf8");
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
    await expect(routeSource("(app)/lists/[listId]/item-new.tsx")).resolves.toContain(
      "ShoppingListItemForm",
    );
  });
});

describe("auth screens use shared UI foundation", () => {
  it("login screen uses ScreenContainer and shared typography tokens", async () => {
    const src = await routeSource("(auth)/login.tsx");
    expect(src).toContain("ScreenContainer");
    expect(src).toContain("typography");
  });

  it("register screen uses ScreenContainer", async () => {
    const src = await routeSource("(auth)/register.tsx");
    expect(src).toContain("ScreenContainer");
  });

  it("login form uses AppInput and AppButton instead of raw inputs", async () => {
    const src = await featureSource("auth/LoginForm.tsx");
    expect(src).toContain("AppInput");
    expect(src).toContain("AppButton");
    expect(src).not.toContain("import { Button,");
    expect(src).not.toContain("import { Input,");
  });

  it("register form uses AppInput and AppButton instead of raw inputs", async () => {
    const src = await featureSource("auth/RegisterForm.tsx");
    expect(src).toContain("AppInput");
    expect(src).toContain("AppButton");
    expect(src).not.toContain("import { Input,");
  });
});

describe("list overview screen uses shared UI foundation", () => {
  it("overview uses ScreenContainer and SectionHeader", async () => {
    const src = await routeSource("(app)/index.tsx");
    expect(src).toContain("ScreenContainer");
    expect(src).toContain("SectionHeader");
  });

  it("ShoppingListCard uses AppCard for consistent surface styling", async () => {
    const src = await featureSource("shopping-list/ShoppingListCard.tsx");
    expect(src).toContain("AppCard");
  });
});

describe("list detail screen uses shared UI foundation", () => {
  it("detail screen uses ScreenContainer and SectionHeader", async () => {
    const src = await routeSource("(app)/lists/[listId].tsx");
    expect(src).toContain("ScreenContainer");
    expect(src).toContain("SectionHeader");
  });

  it("detail screen uses AppButton for actions", async () => {
    const src = await routeSource("(app)/lists/[listId].tsx");
    expect(src).toContain("AppButton");
  });

  it("ShoppingListItemRow uses AppListItem for item rows", async () => {
    const src = await featureSource("shopping-list-items/ShoppingListItemRow.tsx");
    expect(src).toContain("AppListItem");
    expect(src).toContain("AppButton");
  });

  it("item form screens use ScreenContainer and SectionHeader", async () => {
    const newSrc = await routeSource("(app)/lists/[listId]/item-new.tsx");
    const editSrc = await routeSource("(app)/lists/[listId]/item-[itemId].tsx");
    expect(newSrc).toContain("ScreenContainer");
    expect(newSrc).toContain("SectionHeader");
    expect(editSrc).toContain("ScreenContainer");
    expect(editSrc).toContain("SectionHeader");
  });

  it("ShoppingListItemForm uses AppInput and AppButton", async () => {
    const src = await featureSource("shopping-list-items/ShoppingListItemForm.tsx");
    expect(src).toContain("AppInput");
    expect(src).toContain("AppButton");
  });
});

describe("navigation and behavior contracts are preserved", () => {
  it("list overview still navigates to list detail and new list", async () => {
    const src = await routeSource("(app)/index.tsx");
    expect(src).toContain("/(app)/lists/new");
    expect(src).toContain("/(app)/lists/${list.id}");
  });

  it("list detail still navigates to insights, item-new, and item-edit", async () => {
    const src = await routeSource("(app)/lists/[listId].tsx");
    expect(src).toContain("insights");
    expect(src).toContain("item-new");
    expect(src).toContain("item-${item.id}");
  });

  it("list detail still calls complete, check, and remove mutations", async () => {
    const src = await routeSource("(app)/lists/[listId].tsx");
    expect(src).toContain("completeList");
    expect(src).toContain("checkItem");
    expect(src).toContain("removeItem");
  });
});
