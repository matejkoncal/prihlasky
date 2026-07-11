import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard, type AdminApplication, type AdminReviewer } from "./admin-dashboard";

vi.mock("@/app/admin/actions", () => ({
  assignReviewer: vi.fn(async () => ({ success: "Hodnotiteľ bol priradený" })),
  removeAssignment: vi.fn(async () => ({ success: "Priradenie bolo odstránené" })),
}));

afterEach(cleanup);

const applications: AdminApplication[] = [{
  id: "11111111-1111-1111-1111-111111111111",
  applicant_name: "Ján Žiak",
  submitted_at: "2026-07-10T12:00:00Z",
  categories: [{ id: "22222222-2222-2222-2222-222222222222", name: "Kategória 1", assignment_id: null, reviewer_name: null, reviewer_email: null, status: null, score: null, comment: null, submitted_at: null }],
}];

const reviewers: AdminReviewer[] = [
  { id: "33333333-3333-3333-3333-333333333333", email: "ucitel@example.sk", display_name: "Aktívny učiteľ", role: "reviewer", is_active: true, pending_count: 0, completed_count: 0 },
  { id: "44444444-4444-4444-4444-444444444444", email: "admin@example.sk", display_name: "Ďalší admin", role: "admin", is_active: true, pending_count: 0, completed_count: 0 },
  { id: "55555555-5555-5555-5555-555555555555", email: "stary@example.sk", display_name: "Neaktívny učiteľ", role: "reviewer", is_active: false, pending_count: 0, completed_count: 0 },
];

describe("AdminDashboard", () => {
  it("keeps assignment details collapsed until the application is opened", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);

    expect(screen.queryByText("Kategória 1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));
    expect(screen.getByText("Kategória 1")).toBeInTheDocument();
  });

  it("offers only active reviewers after expansion", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));
    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "Aktívny učiteľ" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Ďalší admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Neaktívny učiteľ" })).not.toBeInTheDocument();
  });

  it("shows action feedback in a viewport snackbar", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Aktívny učiteľ" }));
    await user.click(screen.getByRole("button", { name: "Priradiť" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Hodnotiteľ bol priradený");
  });
});
