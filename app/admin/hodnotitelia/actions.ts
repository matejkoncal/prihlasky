"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

export async function inviteReviewer(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email"); const displayName = formData.get("displayName"); const role = formData.get("role");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof displayName !== "string" || !displayName.trim() || displayName.length > 120) return { error: "Zadajte platný e-mail a meno hodnotiteľa" };
  const session = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(session as unknown as StaffAuthClient);
  if (user?.role !== "admin") return { error: "Nemáte oprávnenie správcu" };
  if (role !== "reviewer" && role !== "admin") return { error: "Vyberte rolu používateľa" };
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { data, error } = await createAdminSupabaseClient().auth.admin.inviteUserByEmail(email, { data: { display_name: displayName.trim() }, redirectTo: new URL("/accept-invite", origin).toString() });
  if (error) {
    console.error("Reviewer invitation failed:", error.message);
    return { error: error.message.includes("rate limit") ? "Supabase dočasne obmedzil odosielanie e-mailov. Skúste to o niekoľko minút." : "Pozvánku sa nepodarilo odoslať. Používateľ už možno existuje." };
  }
  if (!data.user) return { error: "Supabase nevrátil pozvaného používateľa." };
  const { error: roleError } = await createAdminSupabaseClient().from("profiles").update({ role }).eq("id", data.user.id);
  if (roleError) return { error: "Pozvánka odišla, ale rolu sa nepodarilo nastaviť." };
  revalidatePath("/admin/hodnotitelia");
  return {};
}

export async function deactivateStaff(formData: FormData): Promise<{ error?: string }> {
  const profileId = formData.get("profileId");
  if (typeof profileId !== "string" || !/^[0-9a-f-]{36}$/i.test(profileId)) return { error: "Neplatný používateľ" };
  const session = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(session as unknown as StaffAuthClient);
  if (user?.role !== "admin") return { error: "Nemáte oprávnenie správcu" };
  const { error } = await session.rpc("admin_deactivate_profile", { p_profile_id: profileId });
  if (error) return { error: error.message.includes("At least one") ? "Nie je možné deaktivovať posledného aktívneho admina." : "Používateľa sa nepodarilo deaktivovať." };
  revalidatePath("/admin/hodnotitelia");
  revalidatePath("/admin");
  return {};
}

export async function reactivateStaff(formData: FormData): Promise<{ error?: string }> {
  const profileId = formData.get("profileId");
  if (typeof profileId !== "string" || !/^[0-9a-f-]{36}$/i.test(profileId)) return { error: "Neplatný používateľ" };
  const session = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(session as unknown as StaffAuthClient);
  if (user?.role !== "admin") return { error: "Nemáte oprávnenie správcu" };
  const { error } = await session.rpc("admin_reactivate_profile", { p_profile_id: profileId });
  if (error) return { error: "Používateľa sa nepodarilo aktivovať." };
  revalidatePath("/admin/hodnotitelia");
  revalidatePath("/admin");
  return {};
}
