import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260712100000_application_deletion_and_staff_reactivation.sql"), "utf8");

describe("application deletion and staff reactivation migration", () => {
	it("cascades application deletion into assignments", () => {
		expect(migration).toMatch(/foreign key \(application_id\)[\s\S]*references public\.applications\(id\) on delete cascade/i);
	});

	it("provides admin-only reactivation and deletion RPCs", () => {
		expect(migration).toMatch(/create function public\.admin_reactivate_profile\(p_profile_id uuid\)/i);
		expect(migration).toMatch(/update public\.profiles[\s\S]*is_active = true[\s\S]*deactivated_at = null/i);
		expect(migration).toMatch(/create function public\.admin_delete_application\(p_application_id uuid\)/i);
		expect(migration).toMatch(/delete from public\.applications where id = p_application_id/i);
		expect(migration).toMatch(/revoke all on function public\.admin_delete_application\(uuid\) from public/i);
	});
});
