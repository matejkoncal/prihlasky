import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260711210000_application_attachments_and_exports.sql",
);

describe("application attachments and exports migration", () => {
  it("creates private attachment storage with protected metadata", () => {
    expect(existsSync(migrationPath)).toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/create table public\.application_attachments/i);
    expect(sql).toMatch(/unique\s*\(application_id,\s*kind\)/i);
    expect(sql).toMatch(/kind\s+text[\s\S]*cv[\s\S]*motivation_letter/i);
    expect(sql).toMatch(/alter table public\.application_attachments enable row level security/i);
    expect(sql).toMatch(/insert into storage\.buckets[\s\S]*application-attachments[\s\S]*false/i);
  });

  it("exposes safe admin list metadata and a five-review export RPC", () => {
    expect(existsSync(migrationPath)).toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain("admin_list_applications");
    expect(sql).toContain("class_name");
    expect(sql).toContain("field_of_study");
    expect(sql).toContain("original_filename");
    expect(sql).toContain("admin_get_application_export");
    expect(sql).toMatch(/perform\s+public\.require_admin\(\)/i);
    expect(sql).toMatch(/completed_count\s*<>\s*5/i);
    expect(sql).toContain("grant execute on function public.admin_get_application_export(uuid) to authenticated");
  });
});
