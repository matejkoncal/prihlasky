import { cleanup, render, screen } from "@testing-library/react";
import { AppBar } from "@mui/material";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StaffLayout } from "./staff-layout";

const admin = { id: "admin-id", role: "admin" as const, displayName: "Matej Koncal", email: "matej@koncal.sk" };
const reviewer = { id: "reviewer-id", role: "reviewer" as const, displayName: null, email: "ucitel@example.sk" };

afterEach(cleanup);

function findElement(node: ReactNode, type: ReactElement["type"]): ReactElement | null {
  if (!isValidElement(node)) return null;
  if (node.type === type) return node;

  let match: ReactElement | null = null;
  Children.forEach((node.props as { children?: ReactNode }).children, (child) => {
    match ??= findElement(child, type);
  });
  return match;
}

describe("StaffLayout", () => {
  it("keeps the staff navigation sticky while content scrolls", () => {
    render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);
    expect(screen.getByRole("banner")).toHaveStyle({ position: "sticky", top: "0px" });
  });

  it("does not pass a non-serializable style callback from the server layout", () => {
    const layout = StaffLayout({ user: admin, children: <div>Obsah</div> });
    const appBar = findElement(layout, AppBar);

    expect(appBar).not.toBeNull();
    expect((appBar?.props as { sx?: { zIndex?: unknown } }).sx?.zIndex).not.toBeTypeOf("function");
  });

  it("shows administrator destinations only to administrators", () => {
    const { rerender } = render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);
    expect(screen.getByRole("link", { name: "Prihlášky" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Používatelia" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Moje hodnotenia" })).toBeInTheDocument();

    rerender(<StaffLayout user={reviewer}><div>Obsah</div></StaffLayout>);
    expect(screen.queryByRole("link", { name: "Prihlášky" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Používatelia" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Moje hodnotenia" })).not.toBeInTheDocument();
  });

  it("shows the school logo and current user identity", () => {
    const { rerender } = render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);

    expect(screen.getByRole("img", { name: "SOŠTaR" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "SOŠTaR" })).toHaveAttribute("width", "36");
    expect(screen.getByText("MK")).toBeInTheDocument();
    expect(screen.getByText("Matej Koncal")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Odhlásiť sa" })).toBeInTheDocument();
    expect(screen.queryByText("Odhlásiť sa")).not.toBeInTheDocument();

    rerender(<StaffLayout user={reviewer}><div>Obsah</div></StaffLayout>);
    expect(screen.getByText("ucitel@example.sk")).toBeInTheDocument();
    expect(screen.getByText("Hodnotiteľ")).toBeInTheDocument();
  });

  it("keeps admin navigation in a horizontally scrollable responsive row", () => {
    render(<StaffLayout user={admin}><div>Obsah</div></StaffLayout>);

    expect(screen.getByTestId("staff-navigation-row")).toHaveStyle({
      overflowX: "auto",
    });
  });
});
