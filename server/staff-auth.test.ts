import { describe, expect, it, vi } from "vitest";
import { getVerifiedStaffUser } from "./staff-auth";

function clientFor(role: "admin" | "reviewer" | null, isActive = true) {
	const single = vi.fn(async () => ({
		data: role
			? {
					id: "user-id",
					role,
					is_active: isActive,
					display_name: "Matej Koncal",
					email: "matej@koncal.sk",
				}
			: null,
		error: null,
	}));
	const eq = vi.fn(() => ({ single }));
	const select = vi.fn(() => ({ eq }));
	return {
		auth: { getClaims: vi.fn(async () => ({ data: { claims: { sub: "user-id" } }, error: null })) },
		from: vi.fn(() => ({ select })),
	};
}

describe("getVerifiedStaffUser", () => {
	it("returns the stored role for a verified Supabase claim", async () => {
		await expect(getVerifiedStaffUser(clientFor("admin"))).resolves.toEqual({
			id: "user-id",
			role: "admin",
			displayName: "Matej Koncal",
			email: "matej@koncal.sk",
		});
	});

	it("returns null when the access token has no user claim", async () => {
		const client = clientFor("reviewer");
		client.auth.getClaims.mockResolvedValueOnce({ data: { claims: null }, error: null });

		await expect(getVerifiedStaffUser(client)).resolves.toBeNull();
	});

	it("returns null when Supabase has no authenticated claims payload", async () => {
		const client = clientFor("reviewer");
		client.auth.getClaims.mockResolvedValueOnce({ data: null, error: null });

		await expect(getVerifiedStaffUser(client)).resolves.toBeNull();
	});

	it("returns null when the Auth user has no profile", async () => {
		await expect(getVerifiedStaffUser(clientFor(null))).resolves.toBeNull();
	});

	it("returns null for a deactivated profile", async () => {
		await expect(getVerifiedStaffUser(clientFor("reviewer", false))).resolves.toBeNull();
	});
});
