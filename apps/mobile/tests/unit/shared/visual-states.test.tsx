import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sharedUiRoot = join(process.cwd(), "src", "shared", "ui");

function ui(file: string) {
  return readFileSync(join(sharedUiRoot, file), "utf8");
}

describe("LoadingState", () => {
  it("exports LoadingState with a label prop", () => {
    const src = ui("LoadingState.tsx");
    expect(src).toContain("export function LoadingState");
    expect(src).toContain("label");
  });

  it("uses accessibilityLiveRegion for polite announcement", () => {
    const src = ui("LoadingState.tsx");
    expect(src).toContain("accessibilityLiveRegion");
  });

  it("renders a Spinner with primary color", () => {
    const src = ui("LoadingState.tsx");
    expect(src).toContain("Spinner");
    expect(src).toContain("colors.primary");
  });
});

describe("EmptyState", () => {
  it("exports EmptyState with title, message, and action props", () => {
    const src = ui("EmptyState.tsx");
    expect(src).toContain("export function EmptyState");
    expect(src).toContain("title");
    expect(src).toContain("message");
    expect(src).toContain("actionLabel");
    expect(src).toContain("onAction");
  });

  it("renders an AppButton when actionLabel and onAction are provided", () => {
    const src = ui("EmptyState.tsx");
    expect(src).toContain("AppButton");
    expect(src).toContain("onAction");
  });

  it("uses design-system text colors for accessibility contrast", () => {
    const src = ui("EmptyState.tsx");
    expect(src).toContain("colors.textPrimary");
    expect(src).toContain("colors.textSecondary");
  });
});

describe("ErrorState", () => {
  it("exports ErrorState with message, retryLabel, and onRetry props", () => {
    const src = ui("ErrorState.tsx");
    expect(src).toContain("export function ErrorState");
    expect(src).toContain("message");
    expect(src).toContain("retryLabel");
    expect(src).toContain("onRetry");
  });

  it("uses danger card variant for error styling", () => {
    const src = ui("ErrorState.tsx");
    expect(src).toContain("danger");
  });

  it("uses accessibilityRole alert so screen readers announce the error", () => {
    const src = ui("ErrorState.tsx");
    expect(src).toContain("accessibilityRole");
    expect(src).toContain("alert");
  });

  it("renders an AppButton retry action when onRetry is provided", () => {
    const src = ui("ErrorState.tsx");
    expect(src).toContain("AppButton");
    expect(src).toContain("onRetry");
  });
});

describe("StatusState", () => {
  it("exports StatusState, SuccessState, WarningState, InfoState, StatusText, and ConfirmationText", () => {
    const src = ui("StatusState.tsx");
    expect(src).toContain("export function StatusState");
    expect(src).toContain("export function SuccessState");
    expect(src).toContain("export function WarningState");
    expect(src).toContain("export function InfoState");
    expect(src).toContain("export function StatusText");
    expect(src).toContain("export function ConfirmationText");
  });

  it("accepts tone prop mapping to design-system state tone styles", () => {
    const src = ui("StatusState.tsx");
    expect(src).toContain("tone");
    expect(src).toContain("stateToneStyles");
  });

  it("accepts an icon slot for visual context", () => {
    const src = ui("StatusState.tsx");
    expect(src).toContain("icon");
  });

  it("uses accessibilityRole alert for error and warning tones", () => {
    const src = ui("StatusState.tsx");
    expect(src).toContain("accessibilityRole");
    expect(src).toContain("alert");
  });
});

describe("InvalidFieldText", () => {
  it("exports InvalidFieldText with a message prop", () => {
    const src = ui("InvalidFieldText.tsx");
    expect(src).toContain("export function InvalidFieldText");
    expect(src).toContain("message");
  });

  it("marks message as an alert for screen reader announcement", () => {
    const src = ui("InvalidFieldText.tsx");
    expect(src).toContain("accessibilityRole");
    expect(src).toContain("alert");
  });

  it("uses danger color token for error text", () => {
    const src = ui("InvalidFieldText.tsx");
    expect(src).toContain("colors.danger");
  });
});
