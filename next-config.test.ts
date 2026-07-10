// @vitest-environment node

import { expect, it } from "vitest";
import nextConfig from "./next.config";

it("includes the FormePDF WASM runtime in the submit function trace", () => {
  expect(nextConfig.outputFileTracingIncludes?.["/api/submit"]).toContain(
    "./node_modules/@formepdf/core/pkg/*.wasm",
  );
});
