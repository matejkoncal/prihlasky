// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	rpc: vi.fn(),
	getVerifiedStaffUser: vi.fn(),
	revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: mocks.rpc })) }));
vi.mock("@/server/staff-auth", () => ({ getVerifiedStaffUser: mocks.getVerifiedStaffUser }));

import { submitEvaluation } from "./actions";

function validEvaluation() {
	const formData = new FormData();
	formData.set("assignmentId", "11111111-1111-1111-1111-111111111111");
	formData.set("score", "8");
	formData.set("comment", "Dobré hodnotenie");
	return formData;
}

describe("submitEvaluation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.rpc.mockResolvedValue({ error: null });
	});

	it("allows an authenticated administrator to submit their assignment", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue({ id: "admin-id", role: "admin" });

		await expect(submitEvaluation(validEvaluation())).resolves.toBeUndefined();
		expect(mocks.rpc).toHaveBeenCalledWith("submit_evaluation", {
			p_assignment_id: "11111111-1111-1111-1111-111111111111",
			p_score: 8,
			p_comment: "Dobré hodnotenie",
		});
	});

	it("rejects an unauthenticated submission before calling the database", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue(null);

		await expect(submitEvaluation(validEvaluation())).rejects.toThrow("Nemáte oprávnenie hodnotiť");
		expect(mocks.rpc).not.toHaveBeenCalled();
	});
});
