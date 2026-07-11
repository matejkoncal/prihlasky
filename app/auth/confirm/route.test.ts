import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp,
    },
  })),
}));

import { GET } from "./route";

describe("GET /auth/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyOtp.mockResolvedValue({ error: null });
  });

  it("verifies an invite token hash and redirects to password setup", async () => {
    const response = await GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm?token_hash=invite-hash&type=invite"));

    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "invite-hash", type: "invite" });
    expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/set-password");
  });

  it("rejects a request without an invite token hash", async () => {
    const response = await GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm"));

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
  });

  it("redirects an invalid or expired invite to login", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: { message: "Token expired" } });

    const response = await GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm?token_hash=expired&type=invite"));

    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "expired", type: "invite" });
    expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
  });
});
