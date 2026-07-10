// @vitest-environment node

import { expect, it } from "vitest";
import config from "./eslint.config.mjs";

it("excludes nested worktrees from linting", () => {
  expect(config.at(-1)?.ignores).toEqual(
    expect.arrayContaining([
      ".worktrees/**",
      "functions/**",
      "web/**",
      "lib/**",
    ]),
  );
});
