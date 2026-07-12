// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	inviteUserByEmail: vi.fn(),
	profileUpdate: vi.fn(),
	profileEq: vi.fn(),
	rpc: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers({ origin: "https://prihlasky.koncal.sk" })),
}));
vi.mock("@/lib/supabase/server", () => ({
	createServerSupabaseClient: vi.fn(async () => ({ rpc: mocks.rpc })),
}));
vi.mock("@/server/staff-auth", () => ({
	getVerifiedStaffUser: vi.fn(async () => ({ id: "admin-id", role: "admin" })),
}));
vi.mock("@/lib/supabase/admin", () => ({
	createAdminSupabaseClient: vi.fn(() => ({
		auth: { admin: { inviteUserByEmail: mocks.inviteUserByEmail } },
		from: vi.fn(() => ({ update: mocks.profileUpdate })),
	})),
}));

import { inviteReviewer, reactivateStaff } from "./actions";

describe("inviteReviewer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.inviteUserByEmail.mockResolvedValue({
			data: { user: { id: "11111111-1111-1111-1111-111111111111" } },
			error: null,
		});
		mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
		mocks.profileEq.mockResolvedValue({ error: null });
		mocks.rpc.mockResolvedValue({ error: null });
	});

	it("sends the invite to the prefetch-safe acceptance page", async () => {
		const formData = new FormData();
		formData.set("email", "reviewer@example.sk");
		formData.set("displayName", "Reviewer");
		formData.set("role", "reviewer");

		await expect(inviteReviewer(formData)).resolves.toEqual({});
		expect(mocks.inviteUserByEmail).toHaveBeenCalledWith("reviewer@example.sk", {
			data: { display_name: "Reviewer" },
			redirectTo: "https://prihlasky.koncal.sk/accept-invite",
		});
	});

	it("reactivates a profile through the protected RPC", async () => {
		const formData = new FormData();
		formData.set("profileId", "11111111-1111-1111-1111-111111111111");

		await expect(reactivateStaff(formData)).resolves.toEqual({});
		expect(mocks.rpc).toHaveBeenCalledWith("admin_reactivate_profile", {
			p_profile_id: "11111111-1111-1111-1111-111111111111",
		});
		expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/hodnotitelia");
	});
});
