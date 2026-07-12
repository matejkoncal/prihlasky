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

import * as route from "./route";

describe("GET /auth/confirm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.verifyOtp.mockResolvedValue({ error: null });
	});

	it("verifies an invite token hash and redirects to password setup", async () => {
		const response = await route.GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm?token_hash=invite-hash&type=invite"));

		expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "invite-hash", type: "invite" });
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/set-password");
	});

	it("rejects a request without an invite token hash", async () => {
		const response = await route.GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm"));

		expect(mocks.verifyOtp).not.toHaveBeenCalled();
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
	});

	it("redirects an invalid or expired invite to login", async () => {
		mocks.verifyOtp.mockResolvedValue({ error: { message: "Token expired" } });

		const response = await route.GET(new NextRequest("https://prihlasky.koncal.sk/auth/confirm?token_hash=expired&type=invite"));

		expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "expired", type: "invite" });
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
	});
});

describe("POST /auth/confirm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.verifyOtp.mockResolvedValue({ error: null });
	});

	function createPostRequest(tokenHash?: string) {
		const formData = new FormData();
		if (tokenHash) {
			formData.set("token_hash", tokenHash);
		}
		return new NextRequest("https://prihlasky.koncal.sk/auth/confirm", {
			method: "POST",
			body: formData,
		});
	}

	it("consumes the invite only after an explicit form submission", async () => {
		expect(route.POST).toBeTypeOf("function");
		const response = await route.POST(createPostRequest("post-token"));

		expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "post-token", type: "invite" });
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/set-password");
	});

	it("redirects a missing token to the invite error", async () => {
		expect(route.POST).toBeTypeOf("function");
		const response = await route.POST(createPostRequest());

		expect(mocks.verifyOtp).not.toHaveBeenCalled();
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
	});

	it("redirects an expired submitted token to the invite error", async () => {
		expect(route.POST).toBeTypeOf("function");
		mocks.verifyOtp.mockResolvedValue({ error: { message: "Token expired" } });

		const response = await route.POST(createPostRequest("expired"));

		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("https://prihlasky.koncal.sk/login?error=invite");
	});
});
