"use client";

import { useState } from "react";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import type { ReviewAssignment } from "@/server/review-repository";
import { submitEvaluation } from "@/app/hodnotenie/actions";

export function ReviewerDashboard({ assignments }: { assignments: ReviewAssignment[] }) {
	const [error, setError] = useState("");
	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Typography variant="h4" gutterBottom>
				Moje hodnotenia
			</Typography>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			{assignments.length === 0 && <Typography>Nemáte pridelené žiadne hodnotenia.</Typography>}
			{assignments.map(assignment => (
				<Paper key={assignment.id} sx={{ p: 3, mb: 2 }}>
					<Typography variant="h6">{assignment.applicantName}</Typography>
					<Typography sx={{ fontWeight: 700 }}>{assignment.categoryName}</Typography>
					{assignment.categoryInstructions && (
						<Typography color="text.secondary" sx={{ mb: 2 }}>
							{assignment.categoryInstructions}
						</Typography>
					)}
					{assignment.status === "completed" ? (
						<Box sx={{ mt: 2 }}>
							<Typography>Skóre: {assignment.score}/10</Typography>
							<Typography>Komentár: {assignment.comment || "—"}</Typography>
							<Typography variant="caption">
								Odoslané:{" "}
								{assignment.submittedAt
									? new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(assignment.submittedAt))
									: ""}
							</Typography>
						</Box>
					) : (
						<Box
							component="form"
							action={async formData => {
								if (!window.confirm("Po odoslaní už hodnotenie nebudete môcť upraviť.")) {
									return;
								}
								try {
									await submitEvaluation(formData);
								} catch (reason) {
									setError(reason instanceof Error ? reason.message : "Odoslanie zlyhalo");
								}
							}}
							sx={{ display: "grid", gap: 2, mt: 2 }}
						>
							<input type="hidden" name="assignmentId" value={assignment.id} />
							<TextField label="Skóre (0–10)" name="score" type="number" required slotProps={{ htmlInput: { min: 0, max: 10, step: 1 } }} />
							<TextField label="Komentár" name="comment" multiline minRows={3} />
							<Button type="submit" variant="contained">
								Odoslať hodnotenie
							</Button>
						</Box>
					)}
				</Paper>
			))}
		</Container>
	);
}
