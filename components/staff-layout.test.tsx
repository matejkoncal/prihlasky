import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaffLayout } from "./staff-layout";

describe("StaffLayout", () => {
  it("keeps the staff navigation sticky while content scrolls", () => {
    render(<StaffLayout role="admin"><div>Obsah</div></StaffLayout>);
    expect(screen.getByRole("banner")).toHaveStyle({ position: "sticky", top: "0px" });
  });
});
