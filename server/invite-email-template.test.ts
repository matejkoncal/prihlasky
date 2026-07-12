import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const templatePath = resolve(process.cwd(), "supabase/templates/invite.html");

describe("Supabase invite email template", () => {
	it("contains the branded Erasmus+ invitation and server verification link", () => {
		expect(existsSync(templatePath)).toBe(true);
		if (!existsSync(templatePath)) {
			return;
		}

		const html = readFileSync(templatePath, "utf8");
		const confirmationUrl = "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite";

		expect(html).toContain("Erasmus+");
		expect(html).toContain("systému na hodnotenie prihlášok");
		expect(html).toContain("Nastaviť heslo a vstúpiť do systému");
		expect(html.match(new RegExp(confirmationUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))).toHaveLength(2);
		expect(html).not.toContain("{{ .ConfirmationURL }}");
	});
});
