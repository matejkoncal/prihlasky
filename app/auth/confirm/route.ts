import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface InviteAuthClient {
	auth: {
		verifyOtp(args: { token_hash: string; type: "invite" }): Promise<{ error: { message: string } | null }>;
	};
}

export async function confirmInvite(request: NextRequest, tokenHash: string | null, supabase: InviteAuthClient, status?: number) {
	if (!tokenHash) {
		return NextResponse.redirect(new URL("/login?error=invite", request.url), status);
	}

	const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
	return NextResponse.redirect(new URL(error ? "/login?error=invite" : "/set-password", request.url), status);
}

export async function GET(request: NextRequest) {
	const supabase = await createServerSupabaseClient();
	return confirmInvite(request, request.nextUrl.searchParams.get("token_hash"), supabase as unknown as InviteAuthClient);
}

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const value = formData.get("token_hash");
	const tokenHash = typeof value === "string" ? value : null;
	const supabase = await createServerSupabaseClient();
	return confirmInvite(request, tokenHash, supabase as unknown as InviteAuthClient, 303);
}
