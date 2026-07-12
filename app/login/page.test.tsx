import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	client: { kind: "server-client" },
	createServerSupabaseClient: vi.fn(),
	getVerifiedStaffUser: vi.fn(),
	redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("@/server/staff-auth", () => ({
	getVerifiedStaffUser: mocks.getVerifiedStaffUser,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { LoginForm } from "@/components/login-form";
import LoginPage from "./page";

describe("LoginPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.createServerSupabaseClient.mockResolvedValue(mocks.client);
	});

	it("redirects an authenticated admin to the admin dashboard", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue({ id: "admin-id", role: "admin" });

		await LoginPage();
		expect(mocks.redirect).toHaveBeenCalledWith("/admin");
	});

	it("redirects an authenticated reviewer to their evaluations", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue({ id: "reviewer-id", role: "reviewer" });

		await LoginPage();
		expect(mocks.redirect).toHaveBeenCalledWith("/hodnotenie");
	});

	it("renders the login form for an unauthenticated user", async () => {
		mocks.getVerifiedStaffUser.mockResolvedValue(null);

		const page = await LoginPage();

		expect(page.type).toBe(LoginForm);
		expect(mocks.redirect).not.toHaveBeenCalled();
	});
});
