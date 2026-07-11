import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("next/navigation", () => ({ redirect: navigation.redirect }));

import AcceptInvitePage from "./page";

describe("AcceptInvitePage", () => {
  it("renders a non-consuming POST acceptance form for a valid token", async () => {
    const page = await AcceptInvitePage({ searchParams: Promise.resolve({ token_hash: "safe-token-hash" }) });
    const { container } = render(page);
    const form = container.querySelector("form");

    expect(screen.getByText(/pozvánka do systému/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prijať pozvánku a nastaviť heslo" })).toBeInTheDocument();
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/auth/confirm");
    expect(container.querySelector('input[name="token_hash"]')).toHaveValue("safe-token-hash");
  });

  it("redirects a request without a token hash", async () => {
    await expect(AcceptInvitePage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login?error=invite");
  });
});
