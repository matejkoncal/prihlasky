export type StaffRole = "admin" | "reviewer";

export interface VerifiedStaffUser {
	id: string;
	role: StaffRole;
	displayName: string | null;
	email: string;
}

interface ProfileResult {
	data: {
		id: string;
		role: StaffRole;
		is_active: boolean;
		display_name: string | null;
		email: string;
	} | null;
	error: { message: string } | null;
}

export interface StaffAuthClient {
	auth: {
		getClaims(): Promise<{
			data: { claims: { sub?: unknown } | null } | null;
			error: { message: string } | null;
		}>;
	};
	from(table: "profiles"): {
		select(columns: "id, role, is_active, display_name, email"): {
			eq(column: "id", value: string): { single(): Promise<ProfileResult> };
		};
	};
}

export async function getVerifiedStaffUser(supabase: StaffAuthClient): Promise<VerifiedStaffUser | null> {
	const { data, error } = await supabase.auth.getClaims();
	if (error) {
		throw new Error(error.message);
	}
	const userId = data?.claims?.sub;
	if (typeof userId !== "string") {
		return null;
	}

	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("id, role, is_active, display_name, email")
		.eq("id", userId)
		.single();
	if (profileError) {
		throw new Error(profileError.message);
	}
	if (!profile?.is_active) {
		return null;
	}
	return {
		id: profile.id,
		role: profile.role,
		displayName: profile.display_name,
		email: profile.email,
	};
}
