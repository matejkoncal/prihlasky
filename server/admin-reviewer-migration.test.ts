import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "supabase/migrations/20260711130000_allow_admin_review_assignments.sql");

describe("admin reviewer assignment migration", () => {
  it("allows any active staff profile while preserving assignment guards", () => {
    expect(existsSync(migrationPath)).toBe(true);
    if (!existsSync(migrationPath)) return;

    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain("admin_create_assignment");
    expect(sql).toContain("admin_reassign_assignment");
    expect(sql).toMatch(/perform\s+public\.require_admin\(\)/i);
    expect(sql).toMatch(/delivery_status\s*=\s*'sent'/i);
    expect(sql).toMatch(/evaluation_categories[\s\S]*is_active/i);
    expect(sql).toMatch(/profiles[\s\S]*id\s*=\s*p_reviewer_id\s+and\s+is_active/i);
    expect(sql).toMatch(/status\s*=\s*'pending'/i);
    expect(sql).not.toMatch(/role\s*=\s*'reviewer'/i);
    expect(sql).toContain("grant execute on function public.admin_create_assignment(uuid, uuid, uuid) to authenticated");
    expect(sql).toContain("grant execute on function public.admin_reassign_assignment(uuid, uuid) to authenticated");
  });
});
