// @vitest-environment node

import { expect, it } from "vitest";
import config from "./vitest.config";

it("excludes nested worktrees from test discovery", () => {
  expect(config.test?.exclude).toContain(".worktrees/**");
});
