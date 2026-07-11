import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "supabase/migrations/20260711110000_rename_evaluation_categories.sql");

const categories = [
  ["category-1", "Výsledky písomného testu z ANJ"],
  ["category-2", "Schopnosť komunikácie v anglickom jazyku – interview"],
  ["category-3", "Odborné predmety – hodnotenie"],
  ["category-4", "Vyjadrenie triedneho učiteľa – správanie / integrácia / inklúzia / spoľahlivosť"],
  ["category-5", "Vyjadrenie majstra odbornej výchovy"],
] as const;

describe("evaluation category rename migration", () => {
  it("updates the five stable category slugs without replacing rows", () => {
    expect(existsSync(migrationPath)).toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/update\s+public\.evaluation_categories/i);
    for (const [slug, name] of categories) {
      expect(sql.split(slug)).toHaveLength(2);
      expect(sql).toContain(name);
    }
    expect(sql).not.toMatch(/\b(delete|truncate|insert)\b/i);
  });
});
