"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (user?.role !== "admin") throw new Error("Nemáte oprávnenie správcu");
  return supabase;
}

export async function assignReviewer(formData: FormData): Promise<{ error?: string; success?: string }> {
  const applicationId = formData.get("applicationId"); const categoryId = formData.get("categoryId"); const reviewerId = formData.get("reviewerId");
  if (![applicationId, categoryId, reviewerId].every((value) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value))) return { error: "Neplatné priradenie" };
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_create_assignment", { p_application_id: applicationId, p_category_id: categoryId, p_reviewer_id: reviewerId });
  if (error) return { error: "Priradenie sa nepodarilo vytvoriť" };
  revalidatePath("/admin");
  return { success: "Hodnotiteľ bol priradený" };
}

export async function removeAssignment(formData: FormData): Promise<{ error?: string; success?: string }> {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !/^[0-9a-f-]{36}$/i.test(assignmentId)) return { error: "Neplatné priradenie" };
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_remove_assignment", { p_assignment_id: assignmentId });
  if (error) return { error: "Priradenie sa nedá odstrániť" };
  revalidatePath("/admin");
  return { success: "Priradenie bolo odstránené" };
}
