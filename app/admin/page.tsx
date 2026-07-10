import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";
import { AdminDashboard, type AdminApplication, type AdminReviewer } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (!user) redirect("/login"); if (user.role !== "admin") redirect("/hodnotenie");
  const [{ data: applications, error: applicationsError }, { data: reviewers, error: reviewersError }] = await Promise.all([supabase.rpc("admin_list_applications"), supabase.rpc("admin_list_reviewers")]);
  if (applicationsError || reviewersError) throw new Error(applicationsError?.message || reviewersError?.message);
  return <AdminDashboard applications={(applications ?? []) as unknown as AdminApplication[]} reviewers={(reviewers ?? []) as unknown as AdminReviewer[]} />;
}
