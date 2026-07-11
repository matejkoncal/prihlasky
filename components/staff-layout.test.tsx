import { cleanup, render, screen } from "@testing-library/react";
import { AppBar } from "@mui/material";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StaffLayout } from "./staff-layout";

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
    render(<StaffLayout role="admin"><div>Obsah</div></StaffLayout>);
    expect(screen.getByRole("banner")).toHaveStyle({ position: "sticky", top: "0px" });
  });

  it("does not pass a non-serializable style callback from the server layout", () => {
    const layout = StaffLayout({ role: "admin", children: <div>Obsah</div> });
    const appBar = findElement(layout, AppBar);

    expect(appBar).not.toBeNull();
    expect((appBar?.props as { sx?: { zIndex?: unknown } }).sx?.zIndex).not.toBeTypeOf("function");
  });

  it("shows administrator destinations only to administrators", () => {
    const { rerender } = render(<StaffLayout role="admin"><div>Obsah</div></StaffLayout>);
    expect(screen.getByRole("link", { name: "Prihlášky" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Používatelia" })).toBeInTheDocument();

    rerender(<StaffLayout role="reviewer"><div>Obsah</div></StaffLayout>);
    expect(screen.queryByRole("link", { name: "Prihlášky" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Používatelia" })).not.toBeInTheDocument();
  });
});
