import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVerifiedStaffUser, type StaffAuthClient } from "@/server/staff-auth";

export async function GET(request: Request) {
  const user = await getVerifiedStaffUser((await createServerSupabaseClient()) as unknown as StaffAuthClient);
  return NextResponse.redirect(new URL(user?.role === "admin" ? "/admin" : user ? "/hodnotenie" : "/login", request.url));
}
