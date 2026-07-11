import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (user?.role === "admin") return redirect("/admin");
  if (user) return redirect("/hodnotenie");
  return <LoginForm />;
}
