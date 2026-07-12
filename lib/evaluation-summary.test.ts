import { describe, expect, it, vi } from "vitest";

type SummaryModule = typeof import("./evaluation-summary");

async function loadSummary(): Promise<SummaryModule | null> {
	return vi.importActual<SummaryModule>("./evaluation-summary").catch(() => null);
}

describe("getEvaluationSummary", () => {
	it("keeps a partial score below 35 pending", async () => {
		const summaryModule = await loadSummary();
		expect(summaryModule).not.toBeNull();
		if (!summaryModule) {
			return;
		}

		expect(
			summaryModule.getEvaluationSummary([
				{ status: "completed", score: 10 },
				{ status: "completed", score: 10 },
				{ status: "completed", score: 9 },
				{ status: "pending", score: null },
				{ status: null, score: null },
			])
		).toEqual({ totalScore: 29, maximumScore: 50, completedCount: 3, categoryCount: 5, isComplete: false, criterion: "pending" });
	});

	it("marks 35 points as meeting the criterion before completion", async () => {
		const summaryModule = await loadSummary();
		expect(summaryModule).not.toBeNull();
		if (!summaryModule) {
			return;
		}

		expect(
			summaryModule.getEvaluationSummary([
				{ status: "completed", score: 10 },
				{ status: "completed", score: 10 },
				{ status: "completed", score: 10 },
				{ status: "completed", score: 5 },
				{ status: "pending", score: null },
			]).criterion
		).toBe("met");
	});

	it("marks a completed 34 point result as not meeting the criterion", async () => {
		const summaryModule = await loadSummary();
		expect(summaryModule).not.toBeNull();
		if (!summaryModule) {
			return;
		}

		const summary = summaryModule.getEvaluationSummary([10, 8, 7, 5, 4].map(score => ({ status: "completed" as const, score })));
		expect(summary.criterion).toBe("not-met");
		expect(summary.isComplete).toBe(true);
	});

	it("marks a completed 35 point result as complete and meeting the criterion", async () => {
		const summaryModule = await loadSummary();
		expect(summaryModule).not.toBeNull();
		if (!summaryModule) {
			return;
		}

		const summary = summaryModule.getEvaluationSummary([10, 8, 7, 5, 5].map(score => ({ status: "completed" as const, score })));
		expect(summary).toEqual({ totalScore: 35, maximumScore: 50, completedCount: 5, categoryCount: 5, isComplete: true, criterion: "met" });
	});
});
