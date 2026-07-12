export interface EvaluationExportCategory {
	categoryName: string;
	reviewerName: string;
	score: number;
	comment: string;
}

export interface EvaluationExportData {
	applicantName: string;
	className: string;
	fieldOfStudy: string;
	categories: EvaluationExportCategory[];
}
