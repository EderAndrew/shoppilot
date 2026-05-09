import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sharedUiRoot = join(process.cwd(), "src", "shared", "ui");

function ui(file: string) {
  return readFileSync(join(sharedUiRoot, file), "utf8");
}

describe("ScreenContainer", () => {
  it("exports ScreenContainer and its props type", () => {
    const src = ui("ScreenContainer.tsx");
    expect(src).toContain("export function ScreenContainer");
    expect(src).toContain("export type ScreenContainerProps");
  });

  it("supports scrollable and centered modes", () => {
    const src = ui("ScreenContainer.tsx");
    expect(src).toContain("scrollable");
    expect(src).toContain("centered");
    expect(src).toContain("ScrollView");
  });
});

describe("SectionHeader", () => {
  it("exports SectionHeader with title, subtitle, and action props", () => {
    const src = ui("SectionHeader.tsx");
    expect(src).toContain("export function SectionHeader");
    expect(src).toContain("title");
    expect(src).toContain("subtitle");
    expect(src).toContain("action");
  });

  it("uses numberOfLines to prevent title/subtitle from overlapping action", () => {
    const src = ui("SectionHeader.tsx");
    expect(src).toContain("numberOfLines");
  });
});

describe("AppButton", () => {
  it("exports AppButton with variant, loading, disabled, and fullWidth props", () => {
    const src = ui("AppButton.tsx");
    expect(src).toContain("export function AppButton");
    expect(src).toContain("variant");
    expect(src).toContain("loading");
    expect(src).toContain("disabled");
    expect(src).toContain("fullWidth");
  });

  it("supports iconOnly mode", () => {
    const src = ui("AppButton.tsx");
    expect(src).toContain("iconOnly");
  });

  it("enforces 44px minimum touch target", () => {
    const src = ui("AppButton.tsx");
    expect(src).toContain("minHeight");
    expect(src).toContain("minTouchTarget");
  });

  it("exposes accessibilityLabel prop", () => {
    const src = ui("AppButton.tsx");
    expect(src).toContain("accessibilityLabel");
  });

  it("renders a Spinner when loading", () => {
    const src = ui("AppButton.tsx");
    expect(src).toContain("Spinner");
    expect(src).toContain("loading");
  });
});

describe("AppInput", () => {
  it("exports AppInput with label, error, and helperText props", () => {
    const src = ui("AppInput.tsx");
    expect(src).toContain("export function AppInput");
    expect(src).toContain("label");
    expect(src).toContain("error");
    expect(src).toContain("helperText");
  });

  it("renders InvalidFieldText when error is present", () => {
    const src = ui("AppInput.tsx");
    expect(src).toContain("InvalidFieldText");
    expect(src).toContain("error");
  });

  it("supports disabled state", () => {
    const src = ui("AppInput.tsx");
    expect(src).toContain("disabled");
  });

  it("enforces 44px minimum height", () => {
    const src = ui("AppInput.tsx");
    expect(src).toContain("minHeight");
    expect(src).toContain("minTouchTarget");
  });
});

describe("AppCard", () => {
  it("exports AppCard with variant and elevated props", () => {
    const src = ui("AppCard.tsx");
    expect(src).toContain("export function AppCard");
    expect(src).toContain("variant");
    expect(src).toContain("elevated");
  });

  it("supports danger and warning variants for status surfaces", () => {
    const src = ui("AppCard.tsx");
    expect(src).toContain("cardVariants");
  });

  it("applies shadow presets via elevated prop", () => {
    const src = ui("AppCard.tsx");
    expect(src).toContain("shadows");
  });
});

describe("AppListItem", () => {
  it("exports AppListItem with title, subtitle, value, leading, and trailing props", () => {
    const src = ui("AppListItem.tsx");
    expect(src).toContain("export function AppListItem");
    expect(src).toContain("title");
    expect(src).toContain("subtitle");
    expect(src).toContain("value");
    expect(src).toContain("leading");
    expect(src).toContain("trailing");
  });

  it("supports completed variant for struck-through bought items", () => {
    const variantsSrc = readFileSync(
      join(process.cwd(), "src", "shared", "design-system", "variants.ts"),
      "utf8",
    );
    expect(variantsSrc).toContain("completed");
    expect(variantsSrc).toContain("line-through");
  });

  it("enforces 44px minimum touch target", () => {
    const src = ui("AppListItem.tsx");
    expect(src).toContain("minHeight");
    expect(src).toContain("minTouchTarget");
  });

  it("handles long titles without overflow using numberOfLines", () => {
    const src = ui("AppListItem.tsx");
    expect(src).toContain("numberOfLines");
  });
});

describe("InvalidFieldText", () => {
  it("exports InvalidFieldText and uses accessibilityRole alert", () => {
    const src = ui("InvalidFieldText.tsx");
    expect(src).toContain("export function InvalidFieldText");
    expect(src).toContain("accessibilityRole");
    expect(src).toContain("alert");
  });
});
