import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewerAdmin } from "./reviewer-admin";
import type { AdminReviewer } from "./admin-dashboard";

const actions = vi.hoisted(() => ({ inviteReviewer: vi.fn(), deactivateStaff: vi.fn() }));

vi.mock("@/app/admin/hodnotitelia/actions", () => actions);

const reviewers: AdminReviewer[] = [
  { id: "11111111-1111-1111-1111-111111111111", email: "prvy@example.sk", display_name: "Prvý hodnotiteľ", role: "reviewer", is_active: true, pending_count: 1, completed_count: 0 },
  { id: "22222222-2222-2222-2222-222222222222", email: "druhy@example.sk", display_name: "Druhý hodnotiteľ", role: "reviewer", is_active: true, pending_count: 0, completed_count: 1 },
];

afterEach(cleanup);
beforeEach(() => {
  actions.inviteReviewer.mockReset().mockResolvedValue({});
  actions.deactivateStaff.mockReset().mockResolvedValue({});
});

describe("ReviewerAdmin pending actions", () => {
  it("disables the invitation form and shows progress while sending", async () => {
    let resolveInvite!: (result: Record<string, never>) => void;
    actions.inviteReviewer.mockImplementation(() => new Promise((resolve) => { resolveInvite = resolve; }));
    const user = userEvent.setup();
    render(<ReviewerAdmin reviewers={reviewers} />);

    await user.type(screen.getByRole("textbox", { name: "Meno" }), "Nový hodnotiteľ");
    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "novy@example.sk");
    await user.click(screen.getByRole("button", { name: "Poslať pozvánku" }));
    await waitFor(() => expect(actions.inviteReviewer).toHaveBeenCalledTimes(1));

    expect(screen.getByRole("textbox", { name: "Meno" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /odosielam/i })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    resolveInvite({});
    await waitFor(() => expect(screen.getByRole("button", { name: "Poslať pozvánku" })).toBeEnabled());
  });

  it("locks only the staff row being deactivated", async () => {
    let resolveDeactivate!: (result: Record<string, never>) => void;
    actions.deactivateStaff.mockImplementation(() => new Promise((resolve) => { resolveDeactivate = resolve; }));
    const user = userEvent.setup();
    render(<ReviewerAdmin reviewers={reviewers} />);

    const deactivateButtons = screen.getAllByRole("button", { name: "Deaktivovať prístup" });
    await user.click(deactivateButtons[0]);
    await waitFor(() => expect(actions.deactivateStaff).toHaveBeenCalledTimes(1));

    expect(screen.getByRole("button", { name: /deaktivujem/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deaktivovať prístup" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Poslať pozvánku" })).toBeEnabled();

    resolveDeactivate({});
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Deaktivovať prístup" })).toHaveLength(2));
  });
});
