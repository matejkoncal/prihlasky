import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
	createBrowserSupabaseClient: vi.fn(() => ({
		auth: { signInWithPassword: mocks.signInWithPassword },
	})),
}));

afterEach(cleanup);
beforeEach(() => {
	mocks.signInWithPassword.mockReset().mockResolvedValue({ error: { message: "invalid" } });
});

describe("LoginForm", () => {
	it("presents a shared Erasmus+ staff login with school branding", () => {
		render(<LoginForm />);

		expect(screen.getByRole("heading", { name: "Prihlásenie" })).toBeInTheDocument();
		expect(screen.getByText("Erasmus+ hodnotenie")).toBeInTheDocument();
		expect(screen.getByText(/správu a hodnotenie prihlášok/i)).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "SOŠ technológií a remesiel" })).toBeInTheDocument();
		expect(screen.queryByText(/Prihlásenie hodnotiteľa/i)).not.toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("autocomplete", "email");
		expect(screen.getByLabelText(/Heslo/)).toHaveAttribute("autocomplete", "current-password");
	});

	it("locks the form and shows progress while signing in", async () => {
		let resolveLogin!: (value: { error: { message: string } }) => void;
		mocks.signInWithPassword.mockImplementation(
			() =>
				new Promise(resolve => {
					resolveLogin = resolve;
				})
		);
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.type(screen.getByRole("textbox", { name: "E-mail" }), "admin@example.sk");
		await user.type(screen.getByLabelText(/Heslo/), "secret123");
		await user.click(screen.getByRole("button", { name: "Prihlásiť sa" }));

		await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1));
		expect(screen.getByRole("textbox", { name: "E-mail" })).toBeDisabled();
		expect(screen.getByLabelText(/Heslo/)).toBeDisabled();
		expect(screen.getByRole("button", { name: /prihlasujem/i })).toBeDisabled();
		expect(screen.getByRole("progressbar")).toBeInTheDocument();

		resolveLogin({ error: { message: "invalid" } });
		expect(await screen.findByRole("alert")).toHaveTextContent("Prihlásenie zlyhalo");
	});
});
