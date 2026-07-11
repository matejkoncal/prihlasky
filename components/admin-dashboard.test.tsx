import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard, type AdminApplication, type AdminReviewer } from "./admin-dashboard";

const actions = vi.hoisted(() => ({ assignReviewer: vi.fn(), removeAssignment: vi.fn() }));

vi.mock("@/app/admin/actions", () => actions);

afterEach(cleanup);
beforeEach(() => {
  actions.assignReviewer.mockReset().mockResolvedValue({ success: "Hodnotiteľ bol priradený" });
  actions.removeAssignment.mockReset().mockResolvedValue({ success: "Priradenie bolo odstránené" });
});

const applications: AdminApplication[] = [{
  id: "11111111-1111-1111-1111-111111111111",
  applicant_name: "Ján Žiak",
  class_name: "3.A",
  field_of_study: "Mechanik elektrotechnik",
  submitted_at: "2026-07-10T12:00:00Z",
  attachments: [
    { kind: "cv", original_filename: "zivotopis.pdf" },
    { kind: "motivation_letter", original_filename: "motivacny-list.docx" },
  ],
  categories: [{ id: "22222222-2222-2222-2222-222222222222", name: "Kategória 1", assignment_id: null, reviewer_name: null, reviewer_email: null, status: null, score: null, comment: null, submitted_at: null }],
}];

function evaluatedApplication(scores: Array<number | null>, completedCount: number): AdminApplication {
  return {
    id: "66666666-6666-6666-6666-666666666666",
    applicant_name: "Eva Hodnotená",
    class_name: "4.B",
    field_of_study: "Autoopravár - mechanik",
    submitted_at: "2026-07-10T12:00:00Z",
    attachments: [],
    categories: scores.map((score, index) => ({
      id: `77777777-7777-7777-7777-${String(index).padStart(12, "0")}`,
      name: `Kategória ${index + 1}`,
      assignment_id: `88888888-8888-8888-8888-${String(index).padStart(12, "0")}`,
      reviewer_name: `Hodnotiteľ ${index + 1}`,
      reviewer_email: null,
      status: index < completedCount ? "completed" : "pending",
      score,
      comment: "",
      submitted_at: index < completedCount ? "2026-07-11T08:00:00Z" : null,
    })),
  };
}

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

  it("offers all active staff including clearly labelled admins", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));
    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "Aktívny učiteľ" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ďalší admin (admin)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Neaktívny učiteľ" })).not.toBeInTheDocument();
  });

  it("gives category rows a consistent desktop-friendly layout", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));

    expect(screen.getByTestId("category-row")).toHaveStyle({ minHeight: "104px", alignItems: "center" });
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

  it("shows the final score, met criterion, and completed evaluation", () => {
    render(<AdminDashboard applications={[evaluatedApplication([10, 8, 7, 5, 5], 5)]} reviewers={reviewers} />);

    expect(screen.getByText("Skóre 35/50")).toBeInTheDocument();
    expect(screen.getByText("Kritérium splnené")).toBeInTheDocument();
    expect(screen.getByText("Hodnotenie dokončené")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exportovať hodnotenie PDF" })).toHaveAttribute(
      "href",
      "/admin/prihlasky/66666666-6666-6666-6666-666666666666/hodnotenie.pdf",
    );
  });

  it("shows stored application documents only inside the expanded detail", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);

    expect(screen.queryByRole("link", { name: "Stiahnuť životopis" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));

    expect(screen.getByText("Dokumenty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Stiahnuť životopis" })).toHaveAttribute(
      "href",
      "/admin/prihlasky/11111111-1111-1111-1111-111111111111/prilohy/cv",
    );
    expect(screen.getByRole("link", { name: "Stiahnuť motivačný list" })).toHaveAttribute(
      "href",
      "/admin/prihlasky/11111111-1111-1111-1111-111111111111/prilohy/motivation_letter",
    );
  });

  it("does not offer an evaluation PDF unless exactly five reviews are complete", () => {
    render(<AdminDashboard applications={[
      evaluatedApplication([10, 10, 10, 10], 4),
      evaluatedApplication([8, 7, 6, null, null], 3),
    ]} reviewers={reviewers} />);

    expect(screen.queryByRole("link", { name: "Exportovať hodnotenie PDF" })).not.toBeInTheDocument();
  });

  it("shows partial progress without marking an unfinished result as failed", () => {
    render(<AdminDashboard applications={[evaluatedApplication([8, 7, 6, null, null], 3)]} reviewers={reviewers} />);

    expect(screen.getByText("Skóre 21/50")).toBeInTheDocument();
    expect(screen.getByText("Hotové 3/5")).toBeInTheDocument();
    expect(screen.queryByText("Kritérium nesplnené")).not.toBeInTheDocument();
  });

  it("locks one assignment form and shows progress while it is submitting", async () => {
    let resolveAction!: (result: { success: string }) => void;
    actions.assignReviewer.mockImplementation(() => new Promise((resolve) => { resolveAction = resolve; }));
    const user = userEvent.setup();
    render(<AdminDashboard applications={applications} reviewers={reviewers} />);
    await user.click(screen.getByRole("button", { name: /zobraziť detail/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Aktívny učiteľ" }));

    const submit = screen.getByRole("button", { name: "Priradiť" });
    await user.click(submit);
    await waitFor(() => expect(actions.assignReviewer).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(screen.getByRole("button", { name: /priraďujem/i })).toBeDisabled());
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(actions.assignReviewer).toHaveBeenCalledTimes(1);

    resolveAction({ success: "Hodnotiteľ bol priradený" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Hodnotiteľ bol priradený");
  });
});
