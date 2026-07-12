"use client";

import { useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Container,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Snackbar,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import { assignReviewer, deleteApplication, removeAssignment } from "@/app/admin/actions";
import { getEvaluationSummary } from "@/lib/evaluation-summary";
import { usePendingFormAction, type FormActionResult } from "@/components/use-pending-form-action";

export interface AdminReviewer {
	id: string;
	email: string;
	display_name: string | null;
	role: "admin" | "reviewer";
	is_active: boolean;
	pending_count: number;
	completed_count: number;
}

interface Category {
	id: string;
	name: string;
	assignment_id: string | null;
	reviewer_name: string | null;
	reviewer_email: string | null;
	status: "pending" | "completed" | null;
	score: number | null;
	comment: string | null;
	submitted_at: string | null;
}

export interface AdminApplication {
	id: string;
	applicant_name: string;
	class_name: string;
	field_of_study: string;
	submitted_at: string;
	attachments: Array<{
		kind: "cv" | "motivation_letter";
		original_filename: string;
	}>;
	categories: Category[];
}

type Feedback = { severity: "success" | "error"; message: string } | null;

function SummaryMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
	return (
		<Box sx={{ minWidth: 74, px: 1.4, py: 0.8, borderLeft: "1px solid", borderColor: "divider", "&:first-of-type": { borderLeft: 0 } }}>
			<Typography variant="caption" sx={{ display: "block", color: "text.secondary", lineHeight: 1.1, mb: 0.35 }}>
				{label}
			</Typography>
			<Typography sx={{ fontSize: 14, lineHeight: 1.2, fontWeight: 800, color: accent ? "primary.main" : "text.primary" }}>{value}</Typography>
		</Box>
	);
}

function AssignReviewerForm({
	applicationId,
	categoryId,
	reviewers,
	onResult,
}: {
	applicationId: string;
	categoryId: string;
	reviewers: AdminReviewer[];
	onResult: (result: FormActionResult) => void;
}) {
	const { pending, formAction } = usePendingFormAction(assignReviewer, onResult, "Priradenie sa nepodarilo vytvoriť");
	return (
		<Box component="form" action={formAction} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
			<input type="hidden" name="applicationId" value={applicationId} />
			<input type="hidden" name="categoryId" value={categoryId} />
			<Select name="reviewerId" size="small" required displayEmpty defaultValue="" disabled={pending} sx={{ minWidth: 220 }}>
				<MenuItem value="" disabled>
					Vyberte hodnotiteľa
				</MenuItem>
				{reviewers.map(reviewer => (
					<MenuItem key={reviewer.id} value={reviewer.id}>
						{reviewer.display_name || reviewer.email}
						{reviewer.role === "admin" ? " (admin)" : ""}
					</MenuItem>
				))}
			</Select>
			<Button
				type="submit"
				size="small"
				variant="contained"
				disabled={pending || reviewers.length === 0}
				startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
			>
				{pending ? "Priraďujem…" : "Priradiť"}
			</Button>
		</Box>
	);
}

function RemoveAssignmentForm({ assignmentId, onResult }: { assignmentId: string; onResult: (result: FormActionResult) => void }) {
	const { pending, formAction } = usePendingFormAction(removeAssignment, onResult, "Priradenie sa nepodarilo odstrániť");
	return (
		<Box component="form" action={formAction}>
			<input type="hidden" name="assignmentId" value={assignmentId} />
			<Button
				type="submit"
				size="small"
				color="error"
				disabled={pending}
				startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
			>
				{pending ? "Odoberám…" : "Odobrať"}
			</Button>
		</Box>
	);
}

function DeleteApplicationForm({
	applicationId,
	applicantName,
	onResult,
}: {
	applicationId: string;
	applicantName: string;
	onResult: (result: FormActionResult) => void;
}) {
	const { pending, formAction } = usePendingFormAction(deleteApplication, onResult, "Prihlášku sa nepodarilo zmazať");
	return (
		<Box
			component="form"
			action={formAction}
			onSubmit={event => {
				if (!window.confirm(`Naozaj chcete natrvalo zmazať prihlášku žiaka ${applicantName}? Zmažú sa aj všetky hodnotenia a prílohy.`)) {
					event.preventDefault();
				}
			}}
		>
			<input type="hidden" name="applicationId" value={applicationId} />
			<Button
				type="submit"
				size="small"
				color="error"
				variant="outlined"
				disabled={pending}
				aria-label={`Zmazať prihlášku ${applicantName}`}
				startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
			>
				{pending ? "Mažem…" : "Zmazať prihlášku"}
			</Button>
		</Box>
	);
}

export function AdminDashboard({ applications, reviewers }: { applications: AdminApplication[]; reviewers: AdminReviewer[] }) {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<Feedback>(null);
	const eligibleReviewers = useMemo(() => reviewers.filter(reviewer => reviewer.is_active), [reviewers]);

	const showResult = (result: { error?: string; success?: string }) => {
		if (result.error) {
			setFeedback({ severity: "error", message: result.error });
		} else if (result.success) {
			setFeedback({ severity: "success", message: result.success });
		}
	};

	return (
		<Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
			<Typography variant="h4" sx={{ fontWeight: 800 }}>
				Prihlášky
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Rozkliknite prihlášku a priraďte hodnotiteľov ku kategóriám.
			</Typography>

			{applications.length === 0 && (
				<Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
					<Typography>Zatiaľ nie sú žiadne prihlášky pripravené na hodnotenie.</Typography>
				</Paper>
			)}

			<Stack spacing={2}>
				{applications.map(application => {
					const summary = getEvaluationSummary(application.categories);
					const assigned = application.categories.filter(category => category.assignment_id).length;
					const expanded = expandedId === application.id;
					return (
						<Paper
							key={application.id}
							variant="outlined"
							sx={{
								borderRadius: 3,
								overflow: "hidden",
								borderColor: expanded ? "primary.main" : "#dfe7ef",
								boxShadow: expanded ? "0 10px 30px rgba(16,47,74,.08)" : "0 3px 14px rgba(16,47,74,.035)",
								transition: "border-color .2s, box-shadow .2s",
							}}
						>
							<Box
								sx={{
									p: { xs: 2, md: 2.25 },
									display: "grid",
									gridTemplateColumns: { xs: "minmax(0,1fr) auto", md: "minmax(260px,1.2fr) minmax(390px,auto) auto" },
									alignItems: "center",
									columnGap: { xs: 1.5, md: 2.5 },
									rowGap: 1.5,
								}}
							>
								<Box
									data-testid="application-identity"
									sx={{ minWidth: 0, gridColumn: 1, gridRow: 1, display: "flex", alignItems: "center", gap: 1.5 }}
								>
									<Box sx={{ minWidth: 0, flexGrow: 1 }}>
										<Typography variant="h6" noWrap sx={{ fontWeight: 750 }}>
											{application.applicant_name}
										</Typography>
										<Typography variant="body2" noWrap color="text.secondary" sx={{ mt: 0.15 }}>
											{[application.class_name, application.field_of_study].filter(Boolean).join(" · ") || "Trieda a odbor neuvedené"}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											Odoslané {new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium" }).format(new Date(application.submitted_at))}
										</Typography>
									</Box>
									{summary.isComplete && summary.categoryCount === 5 && (
										<Tooltip title="Exportovať hodnotenie PDF">
											<Button
												component="a"
												href={`/admin/prihlasky/${application.id}/hodnotenie.pdf`}
												color="success"
												variant="outlined"
												size="small"
												aria-label={`Exportovať hodnotenie PDF pre ${application.applicant_name}`}
												startIcon={<PictureAsPdfOutlinedIcon />}
												sx={{ flexShrink: 0, minWidth: 0 }}
											>
												PDF
											</Button>
										</Tooltip>
									)}
								</Box>
								<Box
									data-testid="application-metrics"
									sx={{
										display: "flex",
										flexDirection: "column",
										alignItems: { xs: "flex-start", md: "stretch" },
										justifySelf: { xs: "stretch", md: "end" },
										gridColumn: { xs: "1 / -1", md: 2 },
										gridRow: { xs: 2, md: 1 },
										minWidth: 0,
									}}
								>
									<Box
										sx={{
											display: "flex",
											flexShrink: 0,
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 2,
											bgcolor: "#f8fafc",
											overflow: "hidden",
										}}
									>
										<SummaryMetric label="Skóre" value={`${summary.totalScore}/${summary.maximumScore}`} />
										<SummaryMetric
											label="Pridelené"
											value={`${assigned}/${application.categories.length}`}
											accent={assigned === application.categories.length}
										/>
										<SummaryMetric label="Hotové" value={`${summary.completedCount}/${summary.categoryCount}`} accent={summary.isComplete} />
									</Box>
									<Box
										data-testid="application-result-status"
										sx={{ minHeight: 24, mt: 0.75, display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}
									>
										{summary.criterion === "met" && <Chip size="small" label="Kritérium splnené" color="success" sx={{ fontWeight: 700 }} />}
										{summary.criterion === "not-met" && <Chip size="small" label="Kritérium nesplnené" color="error" sx={{ fontWeight: 700 }} />}
									</Box>
								</Box>
								<Stack
									data-testid="application-actions"
									direction="row"
									spacing={0.5}
									sx={{ justifySelf: "end", gridColumn: { xs: 2, md: 3 }, gridRow: 1 }}
								>
									<Tooltip title={expanded ? "Skryť detail" : "Zobraziť detail"}>
										<IconButton
											color="primary"
											aria-label={`${expanded ? "Skryť" : "Zobraziť"} detail prihlášky ${application.applicant_name}`}
											aria-expanded={expanded}
											onClick={() => setExpandedId(expanded ? null : application.id)}
											sx={{
												border: "1px solid",
												borderColor: expanded ? "primary.main" : "divider",
												bgcolor: expanded ? "rgba(25, 118, 210, .08)" : "transparent",
											}}
										>
											<ExpandMoreIcon sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
										</IconButton>
									</Tooltip>
								</Stack>
							</Box>

							<Collapse in={expanded} unmountOnExit>
								<Box sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
									<Box
										data-testid="application-documents"
										sx={{
											mb: 2,
											p: 1.75,
											display: "flex",
											alignItems: { xs: "flex-start", sm: "center" },
											flexDirection: { xs: "column", sm: "row" },
											gap: 1.5,
											bgcolor: "rgba(22,114,196,.055)",
											border: "1px solid rgba(22,114,196,.14)",
											borderRadius: 2.5,
										}}
									>
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
												Dokumenty
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Životopis a motivačný list priložené k prihláške
											</Typography>
										</Box>
										{(application.attachments ?? []).length > 0 ? (
											<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
												{(application.attachments ?? []).map(attachment => (
													<Button
														key={attachment.kind}
														component="a"
														href={`/admin/prihlasky/${application.id}/prilohy/${attachment.kind}`}
														download
														variant="outlined"
														size="small"
														startIcon={<DescriptionOutlinedIcon />}
													>
														{attachment.kind === "cv" ? "Stiahnuť životopis" : "Stiahnuť motivačný list"}
													</Button>
												))}
											</Stack>
										) : (
											<Typography variant="body2" color="text.secondary">
												K tejto prihláške nie sú uložené žiadne prílohy.
											</Typography>
										)}
									</Box>
									<Box sx={{ overflow: "hidden", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
										{application.categories.map((category, index) => (
											<Box
												data-testid="category-row"
												key={category.id}
												sx={{
													px: { xs: 1.5, md: 2 },
													py: 1.25,
													minHeight: 96,
													display: "grid",
													gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.15fr) minmax(380px, .85fr)" },
													alignItems: "center",
													gap: { xs: 1.5, md: 3 },
													borderBottom: index === application.categories.length - 1 ? 0 : "1px solid",
													borderColor: "divider",
												}}
											>
												<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
													<Box
														data-testid="category-index"
														sx={{
															width: 30,
															height: 30,
															flexShrink: 0,
															display: "grid",
															placeItems: "center",
															borderRadius: "50%",
															bgcolor: "#e9f3fb",
															color: "primary.main",
															fontSize: 13,
															fontWeight: 850,
														}}
													>
														{index + 1}
													</Box>
													<Typography sx={{ fontWeight: 750, lineHeight: 1.35 }}>{category.name}</Typography>
												</Box>
												{category.status === "completed" ? (
													<Box sx={{ minWidth: 0 }}>
														<Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.45 }}>
															<Chip size="small" color="success" label="Hotovo" sx={{ height: 24 }} />
															<Typography sx={{ flexGrow: 1, minWidth: 0, fontWeight: 700 }} noWrap>
																{category.reviewer_name ?? category.reviewer_email}
															</Typography>
															<Typography sx={{ fontWeight: 850, color: "success.dark" }}>{`${category.score}/10`}</Typography>
														</Stack>
														<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
															{category.comment || "Bez slovného komentára"}
														</Typography>
													</Box>
												) : category.assignment_id ? (
													<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
														<Box sx={{ flexGrow: 1 }}>
															<Typography variant="caption" color="text.secondary">
																Čaká na hodnotenie
															</Typography>
															<Typography sx={{ fontWeight: 700 }}>{category.reviewer_name ?? category.reviewer_email}</Typography>
														</Box>
														<RemoveAssignmentForm assignmentId={category.assignment_id} onResult={showResult} />
													</Stack>
												) : (
													<AssignReviewerForm
														applicationId={application.id}
														categoryId={category.id}
														reviewers={eligibleReviewers}
														onResult={showResult}
													/>
												)}
											</Box>
										))}
									</Box>
									<Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
										<DeleteApplicationForm applicationId={application.id} applicantName={application.applicant_name} onResult={showResult} />
									</Box>
								</Box>
							</Collapse>
						</Paper>
					);
				})}
			</Stack>

			<Snackbar open={Boolean(feedback)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
				<Alert severity={feedback?.severity ?? "info"} onClose={() => setFeedback(null)} variant="filled" sx={{ minWidth: 300 }}>
					{feedback?.message}
				</Alert>
			</Snackbar>
		</Container>
	);
}
