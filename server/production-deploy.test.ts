import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import packageJson from "../package.json";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(process.cwd(), "scripts/deploy-production.sh");
const environmentPath = resolve(process.cwd(), "server/production-environment.ts");
const nextConfigPath = resolve(process.cwd(), "next.config.ts");

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

describe("production email environment", () => {
  it("guards production builds against a missing Resend secret", () => {
    expect(existsSync(environmentPath)).toBe(true);
    if (!existsSync(environmentPath)) return;

    const environmentSource = readFileSync(environmentPath, "utf8");
    const configSource = readFileSync(nextConfigPath, "utf8");
    expect(environmentSource).toContain("VERCEL_ENV === \"production\"");
    expect(environmentSource).toContain("Missing RESEND_API_KEY in Vercel Production environment");
    expect(configSource).toContain("assertProductionEnvironment({");
    expect(configSource).toContain("RESEND_API_KEY: process.env.RESEND_API_KEY");
  });
});
