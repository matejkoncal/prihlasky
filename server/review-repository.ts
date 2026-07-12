export interface ReviewAssignment {
	id: string;
	applicantName: string;
	categoryName: string;
	categoryInstructions: string;
	categorySortOrder: number;
	status: "pending" | "completed";
	score: number | null;
	comment: string;
	submittedAt: string | null;
}

interface ReviewAssignmentRow {
	id: string;
	applicant_name: string;
	category_name: string;
	category_instructions: string;
	category_sort_order: number;
	status: "pending" | "completed";
	score: number | null;
	comment: string;
	submitted_at: string | null;
}

export interface ReviewSupabaseClient {
	rpc(name: "get_my_review_assignments"): Promise<{
		data: ReviewAssignmentRow[] | null;
		error: { message: string } | null;
	}>;
}

export async function getMyReviewAssignments(supabase: ReviewSupabaseClient): Promise<ReviewAssignment[]> {
	const { data, error } = await supabase.rpc("get_my_review_assignments");
	if (error) {
		throw new Error(error.message);
	}
	return (data ?? []).map(row => ({
		id: row.id,
		applicantName: row.applicant_name,
		categoryName: row.category_name,
		categoryInstructions: row.category_instructions,
		categorySortOrder: row.category_sort_order,
		status: row.status,
		score: row.score,
		comment: row.comment,
		submittedAt: row.submitted_at,
	}));
}
