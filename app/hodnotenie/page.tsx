import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMyReviewAssignments, type ReviewSupabaseClient } from "@/server/review-repository";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";
import { ReviewerDashboard } from "@/components/reviewer-dashboard";
import { StaffLayout } from "@/components/staff-layout";

export const dynamic = "force-dynamic";

export default async function ReviewerPage() {
  const supabase = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (!user) redirect("/login");
  const assignments = await getMyReviewAssignments(supabase as unknown as ReviewSupabaseClient);
  return <StaffLayout role={user.role}><ReviewerDashboard assignments={assignments} /></StaffLayout>;
}
