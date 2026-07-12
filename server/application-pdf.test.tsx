import { isValidElement, type ReactNode } from "react";
import { expect, it } from "vitest";
import { ApplicationPdf } from "./application-pdf";

function collectText(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}
	if (Array.isArray(node)) {
		return node.map(collectText).join(" ");
	}
	if (isValidElement<{ children?: ReactNode }>(node)) {
		return collectText(node.props.children);
	}
	return "";
}

function collectImageSources(node: ReactNode): string[] {
	if (Array.isArray(node)) {
		return node.flatMap(collectImageSources);
	}
	if (isValidElement<{ children?: ReactNode; src?: unknown }>(node)) {
		const own = typeof node.props.src === "string" ? [node.props.src] : [];
		return [...own, ...collectImageSources(node.props.children)];
	}
	return [];
}

it("renders applicant details, situation, consent, and official logos", () => {
	const document = ApplicationPdf({
		data: {
			name: "Ján Žiak",
			dateOfBirth: "2008-01-01",
			classField: "3.A – Mechanik elektrotechnik",
			address1: "Školská 1",
			address2: "821 01 Bratislava",
			address3: "Slovensko",
			phone: "+421900000000",
			email: "jan@example.com",
			date: "10.7.2026",
			studentSituation: "Žiak so zdravotným znevýhodnením",
			personalDataConsent: true,
		},
	});
	const text = collectText(document);
	expect(text).toContain("Ján Žiak");
	expect(text).toContain("Žiak so zdravotným znevýhodnením");
	expect(text).toContain("Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.");
	expect(text).toContain("Súhlas udelený: Áno");
	expect(collectImageSources(document).some(source => source.startsWith("data:image/png;base64,"))).toBe(true);
});
