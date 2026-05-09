import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const routeAndFeatureRoots = [
  join(process.cwd(), "src", "app"),
  join(process.cwd(), "src", "features"),
];

const sharedUiRoot = join(process.cwd(), "src", "shared", "ui");

function collectSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectSourceFiles(path);
    if (!/\.(ts|tsx)$/.test(entry)) return [];
    if (entry.endsWith(".queries.ts") || entry.endsWith(".schemas.ts")) return [];
    if (entry.startsWith("use") && entry.endsWith(".ts")) return [];

    return [path];
  });
}

describe("UI Supabase import boundary", () => {
  it("prevents route and component files from importing Supabase clients", () => {
    const offenders = routeAndFeatureRoots
      .flatMap(collectSourceFiles)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /from\s+["'](@supabase\/supabase-js|.*infrastructure\/supabase.*)["']/.test(source);
      })
      .map((path) => relative(process.cwd(), path));

    expect(offenders).toEqual([]);
  });
});

describe("Shared UI import boundary", () => {
  it("prevents shared/ui components from importing Supabase clients or repositories", () => {
    const offenders = collectSourceFiles(sharedUiRoot)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /from\s+["'](@supabase\/supabase-js|.*infrastructure\/supabase.*|.*infrastructure\/repositories.*)["']/.test(
          source,
        );
      })
      .map((path) => relative(process.cwd(), path));

    expect(offenders).toEqual([]);
  });

  it("prevents shared/ui components from importing domain services or application use-cases", () => {
    const offenders = collectSourceFiles(sharedUiRoot)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /from\s+["'](.*domain\/services.*|.*application\/use-cases.*|.*application\/ports.*)["']/.test(
          source,
        );
      })
      .map((path) => relative(process.cwd(), path));

    expect(offenders).toEqual([]);
  });

  it("prevents shared/ui components from importing query hooks", () => {
    const offenders = collectSourceFiles(sharedUiRoot)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /from\s+["'](.*\.queries|.*features\/.*)["']/.test(source);
      })
      .map((path) => relative(process.cwd(), path));

    expect(offenders).toEqual([]);
  });
});
