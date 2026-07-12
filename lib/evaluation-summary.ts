export interface ScoredCategory {
	status: "pending" | "completed" | null;
	score: number | null;
}

export interface EvaluationSummary {
	totalScore: number;
	maximumScore: number;
	completedCount: number;
	categoryCount: number;
	isComplete: boolean;
	criterion: "pending" | "met" | "not-met";
}

const REQUIRED_SCORE = 35;

export function getEvaluationSummary(categories: ScoredCategory[]): EvaluationSummary {
	const totalScore = categories.reduce((total, category) => total + (typeof category.score === "number" ? category.score : 0), 0);
	const completedCount = categories.filter(category => category.status === "completed").length;
	const categoryCount = categories.length;
	const isComplete = categoryCount > 0 && completedCount === categoryCount;
	const criterion = totalScore >= REQUIRED_SCORE ? "met" : isComplete ? "not-met" : "pending";

	return {
		totalScore,
		maximumScore: categoryCount * 10,
		completedCount,
		categoryCount,
		isComplete,
		criterion,
	};
}
