export type StaffRole = "admin" | "reviewer";

export interface VerifiedStaffUser {
  id: string;
  role: StaffRole;
}

interface ProfileResult {
  data: { id: string; role: StaffRole } | null;
  error: { message: string } | null;
}

export interface StaffAuthClient {
  auth: {
    getClaims(): Promise<{
      data: { claims: { sub?: unknown } | null };
      error: { message: string } | null;
    }>;
  };
  from(table: "profiles"): {
    select(columns: "id, role"): {
      eq(column: "id", value: string): { single(): Promise<ProfileResult> };
    };
  };
}

export async function getVerifiedStaffUser(
  supabase: StaffAuthClient,
): Promise<VerifiedStaffUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error) throw new Error(error.message);
  const userId = data.claims?.sub;
  if (typeof userId !== "string") return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();
  if (profileError) throw new Error(profileError.message);
  return profile;
}
