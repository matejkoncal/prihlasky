import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import packageJson from "../package.json";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(process.cwd(), "scripts/deploy-production.sh");

describe("production deployment", () => {
  it("uses Vercel project secrets without empty CLI overrides", () => {
    expect(existsSync(scriptPath)).toBe(true);
    if (!existsSync(scriptPath)) return;

    const script = readFileSync(scriptPath, "utf8");
    expect(script).toMatch(/npx vercel --prod --yes/);
    expect(script).not.toMatch(/RESEND_API_KEY|--env|(?:^|\s)-e(?:\s|$)|--build-env|(?:^|\s)-b(?:\s|$)/m);
    expect(packageJson.scripts["deploy:production" as keyof typeof packageJson.scripts]).toBe(
      "bash scripts/deploy-production.sh",
    );
  });
});
