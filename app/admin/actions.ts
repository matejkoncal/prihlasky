"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

async function requireAdmin() {
	const supabase = await createServerSupabaseClient();
	const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
	if (user?.role !== "admin") {
		throw new Error("Nemáte oprávnenie správcu");
	}
	return supabase;
}

export async function assignReviewer(formData: FormData): Promise<{ error?: string; success?: string }> {
	const applicationId = formData.get("applicationId");
	const categoryId = formData.get("categoryId");
	const reviewerId = formData.get("reviewerId");
	if (![applicationId, categoryId, reviewerId].every(value => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value))) {
		return { error: "Neplatné priradenie" };
	}
	const supabase = await requireAdmin();
	const { error } = await supabase.rpc("admin_create_assignment", {
		p_application_id: applicationId,
		p_category_id: categoryId,
		p_reviewer_id: reviewerId,
	});
	if (error) {
		return { error: "Priradenie sa nepodarilo vytvoriť" };
	}
	revalidatePath("/admin");
	return { success: "Hodnotiteľ bol priradený" };
}

export async function removeAssignment(formData: FormData): Promise<{ error?: string; success?: string }> {
	const assignmentId = formData.get("assignmentId");
	if (typeof assignmentId !== "string" || !/^[0-9a-f-]{36}$/i.test(assignmentId)) {
		return { error: "Neplatné priradenie" };
	}
	const supabase = await requireAdmin();
	const { error } = await supabase.rpc("admin_remove_assignment", { p_assignment_id: assignmentId });
	if (error) {
		return { error: "Priradenie sa nedá odstrániť" };
	}
	revalidatePath("/admin");
	return { success: "Priradenie bolo odstránené" };
}

export async function deleteApplication(formData: FormData): Promise<{ error?: string; success?: string }> {
	const applicationId = formData.get("applicationId");
	if (typeof applicationId !== "string" || !/^[0-9a-f-]{36}$/i.test(applicationId)) {
		return { error: "Neplatná prihláška" };
	}

	const supabase = await requireAdmin();
	const { data: attachmentPaths, error } = await supabase.rpc("admin_delete_application", {
		p_application_id: applicationId,
	});
	if (error) {
		return { error: "Prihlášku sa nepodarilo zmazať" };
	}

	if (Array.isArray(attachmentPaths) && attachmentPaths.length > 0) {
		const { error: storageError } = await createAdminSupabaseClient().storage.from("application-attachments").remove(attachmentPaths);
		if (storageError) {
			console.error("Deleted application, but attachment cleanup failed:", storageError.message);
		}
	}

	revalidatePath("/admin");
	return { success: "Prihláška bola zmazaná" };
}
