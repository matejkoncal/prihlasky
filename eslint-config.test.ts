// @vitest-environment node

import { expect, it } from "vitest";
import config from "./eslint.config.mjs";

it("excludes nested worktrees and generated legacy outputs from linting", () => {
	expect(config.at(-1)?.ignores).toEqual(expect.arrayContaining([".worktrees/**", "functions/**", "web/**", "supabase/.temp/**"]));
	expect(config.at(-1)?.ignores).not.toContain("lib/**");
});
