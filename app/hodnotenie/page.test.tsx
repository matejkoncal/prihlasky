import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	client: { kind: "server-client" },
	createServerSupabaseClient: vi.fn(),
	getVerifiedStaffUser: vi.fn(),
	getMyReviewAssignments: vi.fn(),
	redirect: vi.fn((path: string) => {
		throw new Error(`REDIRECT:${path}`);
	}),
}));

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));
vi.mock("@/server/staff-auth", () => ({ getVerifiedStaffUser: mocks.getVerifiedStaffUser }));
vi.mock("@/server/review-repository", () => ({ getMyReviewAssignments: mocks.getMyReviewAssignments }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { StaffLayout } from "@/components/staff-layout";
import ReviewerPage from "./page";

const assignment = {
	id: "11111111-1111-1111-1111-111111111111",
	applicantName: "Ján Žiak",
	categoryName: "Výsledky písomného testu z ANJ",
	categoryInstructions: "",
	categorySortOrder: 1,
	status: "pending" as const,
	score: null,
	comment: "",
	submittedAt: null,
};

describe("ReviewerPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.createServerSupabaseClient.mockResolvedValue(mocks.client);
		mocks.getMyReviewAssignments.mockResolvedValue([assignment]);
	});

	it("renders an administrator's own assignments with the admin staff layout", async () => {
		const user = { id: "admin-id", role: "admin", displayName: "Admin", email: "admin@example.sk" };
		mocks.getVerifiedStaffUser.mockResolvedValue(user);

		const page = await ReviewerPage();

		expect(page.type).toBe(StaffLayout);
		expect(page.props.user).toBe(user);
		expect(mocks.getMyReviewAssignments).toHaveBeenCalledWith(mocks.client);
		expect(mocks.redirect).not.toHaveBeenCalled();
	});

	it("redirects an unauthenticated visitor to login", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue(null);

		await expect(ReviewerPage()).rejects.toThrow("REDIRECT:/login");
	});
});
