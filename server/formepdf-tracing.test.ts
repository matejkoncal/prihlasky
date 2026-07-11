import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("FormePDF server tracing", () => {
  it("ships the WASM runtime with both PDF-producing routes", () => {
    const includes = nextConfig.outputFileTracingIncludes ?? {};
    expect(includes["/api/submit"]).toContain("./node_modules/@formepdf/core/pkg/*.wasm");
    expect(includes["/admin/prihlasky/*/hodnotenie.pdf"]).toContain(
      "./node_modules/@formepdf/core/pkg/*.wasm",
    );
  });
});
