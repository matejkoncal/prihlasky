import { describe, expect, it, vi } from "vitest";
import { getMyReviewAssignments } from "./review-repository";

describe("getMyReviewAssignments", () => {
	it("maps only the limited reviewer-task RPC result", async () => {
		const rpc = vi.fn(async () => ({
			data: [
				{
					id: "a",
					applicant_name: "Ján Žiak",
					category_name: "Kategória 1",
					category_instructions: "",
					category_sort_order: 1,
					status: "pending",
					score: null,
					comment: "",
					assigned_at: "2026-07-10T12:00:00Z",
					submitted_at: null,
				},
			],
			error: null,
		}));
		await expect(getMyReviewAssignments({ rpc })).resolves.toEqual([
			{
				id: "a",
				applicantName: "Ján Žiak",
				categoryName: "Kategória 1",
				categoryInstructions: "",
				categorySortOrder: 1,
				status: "pending",
				score: null,
				comment: "",
				submittedAt: null,
			},
		]);
		expect(rpc).toHaveBeenCalledWith("get_my_review_assignments");
	});
});
