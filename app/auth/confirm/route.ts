import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface InviteAuthClient {
  auth: {
    verifyOtp(args: {
      token_hash: string;
      type: "invite";
    }): Promise<{ error: { message: string } | null }>;
  };
}

export async function confirmInvite(request: NextRequest, supabase: InviteAuthClient) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) return NextResponse.redirect(new URL("/login?error=invite", request.url));

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
  return NextResponse.redirect(new URL(error ? "/login?error=invite" : "/set-password", request.url));
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  return confirmInvite(request, supabase as unknown as InviteAuthClient);
}
