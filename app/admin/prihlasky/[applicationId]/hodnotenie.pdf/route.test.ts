// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

type RouteModule = typeof import("./route");

async function loadRoute(): Promise<RouteModule | null> {
  return vi.importActual<RouteModule>("./route").catch(() => null);
}

const applicationId = "11111111-1111-1111-1111-111111111111";
const admin = { id: "admin-id", role: "admin" as const, displayName: "Admin", email: "admin@example.sk" };
const exportData = {
  applicantName: "Ján Žiak",
  className: "3.A",
  fieldOfStudy: "Mechanik elektrotechnik",
  categories: Array.from({ length: 5 }, (_, index) => ({
    categoryName: `Kategória ${index + 1}`,
    reviewerName: `Hodnotiteľ ${index + 1}`,
    score: 7,
    comment: "Komentár",
  })),
};

function context(id = applicationId) {
  return { params: Promise.resolve({ applicationId: id }) };
}

function dependencies(user: typeof admin | null = admin) {
  return {
    getUser: vi.fn(async () => user),
    getExport: vi.fn(async () => ({ status: "ok" as const, data: exportData })),
    render: vi.fn(async () => new Uint8Array(Buffer.from("evaluation-pdf"))),
  };
}

describe("admin evaluation PDF route", () => {
  it("enforces active admin authorization and valid ids", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;

    expect((await route.createEvaluationExportRoute(dependencies(null))(new Request("https://example.test"), context())).status).toBe(401);
    expect((await route.createEvaluationExportRoute(dependencies({ ...admin, role: "reviewer" as never }))(new Request("https://example.test"), context())).status).toBe(403);
    expect((await route.createEvaluationExportRoute(dependencies())(new Request("https://example.test"), context("invalid"))).status).toBe(400);
  });

  it("maps missing and incomplete applications to controlled responses", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;

    const missing = dependencies();
    missing.getExport.mockResolvedValueOnce({ status: "not_found" } as never);
    expect((await route.createEvaluationExportRoute(missing)(new Request("https://example.test"), context())).status).toBe(404);

    const incomplete = dependencies();
    incomplete.getExport.mockResolvedValueOnce({ status: "incomplete" } as never);
    expect((await route.createEvaluationExportRoute(incomplete)(new Request("https://example.test"), context())).status).toBe(409);
    expect(incomplete.render).not.toHaveBeenCalled();
  });

  it("returns a generated PDF with download headers", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;
    const deps = dependencies();

    const response = await route.createEvaluationExportRoute(deps)(
      new Request("https://example.test"),
      context(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("hodnotenie-Jan-Ziak.pdf");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.text()).resolves.toBe("evaluation-pdf");
    expect(deps.render).toHaveBeenCalledWith(exportData);
  });
});
