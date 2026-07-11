import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StaffLayout } from "./staff-layout";

const admin = { id: "admin-id", role: "admin" as const, displayName: "Admin", email: "admin@example.sk" };

const navigation = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

afterEach(cleanup);

describe("administrator navigation", () => {
  it("marks applications as the current section", () => {
    navigation.pathname = "/admin";
    render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);

    expect(screen.getByRole("link", { name: "Prihlášky" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Používatelia" })).not.toHaveAttribute("aria-current");
  });

  it("marks users as the current section", () => {
    navigation.pathname = "/admin/hodnotitelia";
    render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);

    expect(screen.getByRole("link", { name: "Používatelia" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Prihlášky" })).not.toHaveAttribute("aria-current");
  });

  it("marks the administrator's own evaluations as the current section", () => {
    navigation.pathname = "/hodnotenie";
    render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);

    expect(screen.getByRole("link", { name: "Moje hodnotenia" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Prihlášky" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Používatelia" })).not.toHaveAttribute("aria-current");
  });
});
