import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type PdfModule = typeof import("./evaluation-pdf");

async function loadPdf(): Promise<PdfModule | null> {
	return vi.importActual<PdfModule>("./evaluation-pdf").catch(() => null);
}

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

function data(scores = [10, 8, 7, 5, 5]) {
	return {
		applicantName: "Ján Žiak",
		className: "3.A",
		fieldOfStudy: "Mechanik elektrotechnik",
		categories: scores.map((score, index) => ({
			categoryName: `Kategória ${index + 1}`,
			reviewerName: `Hodnotiteľ ${index + 1}`,
			score,
			comment: `Komentár ku kategórii ${index + 1}`,
		})),
	};
}

describe("EvaluationPdf", () => {
	it("renders student data and all five detailed evaluations", async () => {
		const pdfModule = await loadPdf();
		expect(pdfModule).not.toBeNull();
		if (!pdfModule) {
			return;
		}

		const text = collectText(pdfModule.EvaluationPdf({ data: data() }));
		expect(text).toContain("Ján Žiak");
		expect(text).toContain("3.A");
		expect(text).toContain("Mechanik elektrotechnik");
		for (let index = 1; index <= 5; index += 1) {
			expect(text).toContain(`Kategória ${index}`);
			expect(text).toContain(`Hodnotiteľ ${index}`);
			expect(text).toContain(`Komentár ku kategórii ${index}`);
		}
		expect(text).toContain("35/50");
		expect(text).toContain("Kritérium splnené");
	});

	it("marks a total below 35 as not meeting the criterion", async () => {
		const pdfModule = await loadPdf();
		expect(pdfModule).not.toBeNull();
		if (!pdfModule) {
			return;
		}

		const text = collectText(pdfModule.EvaluationPdf({ data: data([8, 7, 6, 5, 4]) }));
		expect(text).toContain("30/50");
		expect(text).toContain("Kritérium nesplnené");
	});
});
