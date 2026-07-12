// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, revalidatePath, storageFrom, storageRemove } = vi.hoisted(() => ({
	rpc: vi.fn(),
	revalidatePath: vi.fn(),
	storageFrom: vi.fn(),
	storageRemove: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
	createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));
vi.mock("@/server/staff-auth", () => ({
	getVerifiedStaffUser: vi.fn(async () => ({ id: "admin-id", role: "admin" })),
}));
vi.mock("@/lib/supabase/admin", () => ({
	createAdminSupabaseClient: vi.fn(() => ({ storage: { from: storageFrom } })),
}));

import { assignReviewer, deleteApplication, removeAssignment } from "./actions";

const applicationId = "11111111-1111-1111-1111-111111111111";
const categoryId = "22222222-2222-2222-2222-222222222222";
const reviewerId = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
	rpc.mockReset();
	revalidatePath.mockReset();
	storageFrom.mockReset().mockReturnValue({ remove: storageRemove });
	storageRemove.mockReset().mockResolvedValue({ error: null });
});

describe("deleteApplication", () => {
	it("deletes related database records and then removes returned attachment objects", async () => {
		rpc.mockResolvedValueOnce({ data: ["application-id/cv.pdf", "application-id/motivation.docx"], error: null });
		const formData = new FormData();
		formData.set("applicationId", applicationId);

		await expect(deleteApplication(formData)).resolves.toEqual({ success: "Prihláška bola zmazaná" });
		expect(rpc).toHaveBeenCalledWith("admin_delete_application", { p_application_id: applicationId });
		expect(storageFrom).toHaveBeenCalledWith("application-attachments");
		expect(storageRemove).toHaveBeenCalledWith(["application-id/cv.pdf", "application-id/motivation.docx"]);
		expect(revalidatePath).toHaveBeenCalledWith("/admin");
	});

	it("does not remove storage objects when database deletion fails", async () => {
		rpc.mockResolvedValueOnce({ data: null, error: { message: "failure" } });
		const formData = new FormData();
		formData.set("applicationId", applicationId);

		await expect(deleteApplication(formData)).resolves.toEqual({ error: "Prihlášku sa nepodarilo zmazať" });
		expect(storageRemove).not.toHaveBeenCalled();
	});
});

describe("admin assignment actions", () => {
	it("returns a validation error instead of throwing", async () => {
		await expect(assignReviewer(new FormData())).resolves.toEqual({
			error: "Neplatné priradenie",
		});
	});

	it("returns an RPC error for failed assignment", async () => {
		rpc.mockResolvedValueOnce({ error: { message: "database failure" } });
		const formData = new FormData();
		formData.set("applicationId", applicationId);
		formData.set("categoryId", categoryId);
		formData.set("reviewerId", reviewerId);

		await expect(assignReviewer(formData)).resolves.toEqual({
			error: "Priradenie sa nepodarilo vytvoriť",
		});
	});

	it("returns success after removing an assignment", async () => {
		rpc.mockResolvedValueOnce({ error: null });
		const formData = new FormData();
		formData.set("assignmentId", applicationId);

		await expect(removeAssignment(formData)).resolves.toEqual({
			success: "Priradenie bolo odstránené",
		});
		expect(revalidatePath).toHaveBeenCalledWith("/admin");
	});
});
