"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

export async function submitEvaluation(formData: FormData) {
	const assignmentId = formData.get("assignmentId");
	const score = Number(formData.get("score"));
	const comment = formData.get("comment");
	if (typeof assignmentId !== "string" || !/^[0-9a-f-]{36}$/i.test(assignmentId)) {
		throw new Error("Neplatné hodnotenie");
	}
	if (!Number.isInteger(score) || score < 0 || score > 10) {
		throw new Error("Skóre musí byť celé číslo od 0 do 10");
	}
	if (typeof comment !== "string") {
		throw new Error("Neplatný komentár");
	}
	const supabase = await createServerSupabaseClient();
	const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
	if (!user) {
		throw new Error("Nemáte oprávnenie hodnotiť");
	}
	const { error } = await supabase.rpc("submit_evaluation", {
		p_assignment_id: assignmentId,
		p_score: score,
		p_comment: comment,
	});
	if (error) {
		throw new Error("Toto hodnotenie už bolo odoslané alebo vám nepatrí.");
	}
	revalidatePath("/hodnotenie");
}
