// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

type RouteModule = typeof import("./route");

async function loadRoute(): Promise<RouteModule | null> {
  return vi.importActual<RouteModule>("./route").catch(() => null);
}

const applicationId = "11111111-1111-1111-1111-111111111111";
const admin = { id: "admin-id", role: "admin" as const, displayName: "Admin", email: "admin@example.sk" };

function context(kind = "cv", id = applicationId) {
  return { params: Promise.resolve({ applicationId: id, kind }) };
}

function dependencies(user: typeof admin | null = admin) {
  return {
    getUser: vi.fn(async () => user),
    findAttachment: vi.fn(async () => ({
      original_filename: "Životopis žiaka.pdf",
      mime_type: "application/pdf",
      size_bytes: 7,
      storage_path: `${applicationId}/private.pdf`,
    })),
    download: vi.fn(async () => new Blob(["pdfdata"], { type: "application/pdf" })),
  };
}

describe("admin attachment download route", () => {
  it("rejects unauthenticated and non-admin users", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;

    const anonymous = route.createAttachmentDownloadRoute(dependencies(null));
    expect((await anonymous(new Request("https://example.test"), context())).status).toBe(401);

    const reviewerDeps = dependencies({ ...admin, role: "reviewer" as never });
    const reviewer = route.createAttachmentDownloadRoute(reviewerDeps);
    expect((await reviewer(new Request("https://example.test"), context())).status).toBe(403);
    expect(reviewerDeps.findAttachment).not.toHaveBeenCalled();
  });

  it("validates application id and attachment kind", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;
    const deps = dependencies();
    const handler = route.createAttachmentDownloadRoute(deps);

    expect((await handler(new Request("https://example.test"), context("cv", "invalid"))).status).toBe(400);
    expect((await handler(new Request("https://example.test"), context("other"))).status).toBe(400);
    expect(deps.findAttachment).not.toHaveBeenCalled();
  });

  it("returns 404 when metadata or the private object is missing", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;
    const missingMetadata = dependencies();
    missingMetadata.findAttachment.mockResolvedValueOnce(null as never);
    expect((await route.createAttachmentDownloadRoute(missingMetadata)(new Request("https://example.test"), context())).status).toBe(404);

    const missingObject = dependencies();
    missingObject.download.mockResolvedValueOnce(null as never);
    expect((await route.createAttachmentDownloadRoute(missingObject)(new Request("https://example.test"), context())).status).toBe(404);
  });

  it("streams the private file with safe download headers", async () => {
    const route = await loadRoute();
    expect(route).not.toBeNull();
    if (!route) return;
    const deps = dependencies();
    const response = await route.createAttachmentDownloadRoute(deps)(
      new Request("https://example.test"),
      context(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-length")).toBe("7");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''%C5%BDivotopis%20%C5%BEiaka.pdf");
    await expect(response.text()).resolves.toBe("pdfdata");
    expect(deps.download).toHaveBeenCalledWith(`${applicationId}/private.pdf`);
  });
});
