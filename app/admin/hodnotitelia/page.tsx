import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";
import { ReviewerAdmin } from "@/components/reviewer-admin";
import type { AdminReviewer } from "@/components/admin-dashboard";
import { StaffLayout } from "@/components/staff-layout";

export const dynamic = "force-dynamic";
export default async function ReviewerAdminPage() {
  const supabase = await createServerSupabaseClient(); const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (!user) redirect("/login"); if (user.role !== "admin") redirect("/hodnotenie");
  const { data, error } = await supabase.rpc("admin_list_reviewers"); if (error) throw new Error(error.message);
  return <StaffLayout user={user}><ReviewerAdmin reviewers={(data ?? []) as unknown as AdminReviewer[]} /></StaffLayout>;
}
