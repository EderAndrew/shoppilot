import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const scannedRoots = [join(process.cwd(), "src", "app"), join(process.cwd(), "src", "features")];

function collectRouteAndComponentFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectRouteAndComponentFiles(path);
    if (!/\.(ts|tsx)$/.test(entry)) return [];
    if (entry.endsWith(".queries.ts") || entry.endsWith(".schemas.ts")) return [];
    if (entry.startsWith("use") && entry.endsWith(".ts")) return [];

    return [path];
  });
}

describe("UI Supabase import boundary", () => {
  it("prevents route and component files from importing Supabase clients", () => {
    const offenders = scannedRoots
      .flatMap(collectRouteAndComponentFiles)
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /from\s+["'](@supabase\/supabase-js|.*infrastructure\/supabase.*)["']/.test(source);
      })
      .map((path) => relative(process.cwd(), path));

    expect(offenders).toEqual([]);
  });
});
