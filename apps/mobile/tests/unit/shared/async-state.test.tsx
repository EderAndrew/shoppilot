import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const feedbackRoot = join(process.cwd(), "src", "shared", "feedback");

function feedback(file: string) {
  return readFileSync(join(feedbackRoot, file), "utf8");
}

describe("AsyncState public API", () => {
  it("exports AsyncState function and AsyncStateProps type", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("export function AsyncState");
    expect(src).toContain("export type AsyncStateProps");
  });

  it("preserves all original props: isLoading, error, isEmpty, emptyMessage, onRetry, retryLabel, loadingLabel, fallback", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("isLoading");
    expect(src).toContain("error");
    expect(src).toContain("isEmpty");
    expect(src).toContain("emptyMessage");
    expect(src).toContain("onRetry");
    expect(src).toContain("retryLabel");
    expect(src).toContain("loadingLabel");
    expect(src).toContain("fallback");
  });

  it("still accepts children for the success / content state", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("children");
  });
});

describe("AsyncState delegates to shared state components", () => {
  it("uses LoadingState for the loading branch", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("LoadingState");
    expect(src).toContain("isLoading");
  });

  it("uses ErrorState for the error branch", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("ErrorState");
    expect(src).toContain("error");
  });

  it("uses EmptyState for the empty branch when no fallback is supplied", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("EmptyState");
    expect(src).toContain("fallback");
  });

  it("calls getSafeErrorMessage to avoid raw error objects in the UI", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("getSafeErrorMessage");
  });
});

describe("AsyncState fallback passthrough", () => {
  it("preserves the fallback prop for custom empty states", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("fallback");
  });
});

describe("AsyncState empty state action support", () => {
  it("supports emptyActionLabel and onEmptyAction props for create-first-item flows", () => {
    const src = feedback("AsyncState.tsx");
    expect(src).toContain("emptyActionLabel");
    expect(src).toContain("onEmptyAction");
  });
});
