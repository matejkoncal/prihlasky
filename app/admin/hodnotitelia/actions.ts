"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

export async function inviteReviewer(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email"); const displayName = formData.get("displayName");
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof displayName !== "string" || !displayName.trim() || displayName.length > 120) return { error: "Zadajte platný e-mail a meno hodnotiteľa" };
  const session = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(session as unknown as StaffAuthClient);
  if (user?.role !== "admin") return { error: "Nemáte oprávnenie správcu" };
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await createAdminSupabaseClient().auth.admin.inviteUserByEmail(email, { data: { display_name: displayName.trim() }, redirectTo: new URL("/auth/confirm", origin).toString() });
  if (error) {
    console.error("Reviewer invitation failed:", error.message);
    return { error: error.message.includes("rate limit") ? "Supabase dočasne obmedzil odosielanie e-mailov. Skúste to o niekoľko minút." : "Pozvánku sa nepodarilo odoslať. Používateľ už možno existuje." };
  }
  revalidatePath("/admin/hodnotitelia");
  return {};
}
