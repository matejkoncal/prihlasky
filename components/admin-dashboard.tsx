"use client";

import { useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { assignReviewer, removeAssignment } from "@/app/admin/actions";
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
  submitted_at: string;
  categories: Category[];
}

type Feedback = { severity: "success" | "error"; message: string } | null;

function AssignReviewerForm({ applicationId, categoryId, reviewers, onResult }: {
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
        <MenuItem value="" disabled>Vyberte hodnotiteľa</MenuItem>
        {reviewers.map((reviewer) => <MenuItem key={reviewer.id} value={reviewer.id}>{reviewer.display_name || reviewer.email}{reviewer.role === "admin" ? " (admin)" : ""}</MenuItem>)}
      </Select>
      <Button type="submit" size="small" variant="contained" disabled={pending || reviewers.length === 0} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}>
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
      <Button type="submit" size="small" color="error" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}>
        {pending ? "Odoberám…" : "Odobrať"}
      </Button>
    </Box>
  );
}

export function AdminDashboard({ applications, reviewers }: { applications: AdminApplication[]; reviewers: AdminReviewer[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const eligibleReviewers = useMemo(
    () => reviewers.filter((reviewer) => reviewer.is_active),
    [reviewers],
  );

  const showResult = (result: { error?: string; success?: string }) => {
    if (result.error) setFeedback({ severity: "error", message: result.error });
    else if (result.success) setFeedback({ severity: "success", message: result.success });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>Prihlášky</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Rozkliknite prihlášku a priraďte hodnotiteľov ku kategóriám.</Typography>

      {applications.length === 0 && <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}><Typography>Zatiaľ nie sú žiadne prihlášky pripravené na hodnotenie.</Typography></Paper>}

      <Stack spacing={2}>
        {applications.map((application) => {
          const summary = getEvaluationSummary(application.categories);
          const assigned = application.categories.filter((category) => category.assignment_id).length;
          const expanded = expandedId === application.id;
          return (
            <Paper key={application.id} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", borderColor: expanded ? "primary.main" : "divider" }}>
              <Box sx={{ p: { xs: 2, md: 2.5 }, display: "flex", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>{application.applicant_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Odoslané {new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium" }).format(new Date(application.submitted_at))}</Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip size="small" label={`Skóre ${summary.totalScore}/${summary.maximumScore}`} variant="outlined" />
                  {summary.criterion === "met" && <Chip size="small" label="Kritérium splnené" color="success" />}
                  {summary.criterion === "not-met" && <Chip size="small" label="Kritérium nesplnené" color="error" />}
                  <Chip size="small" label={`Pridelené ${assigned}/${application.categories.length}`} color={assigned === application.categories.length ? "primary" : "default"} />
                  <Chip size="small" label={summary.isComplete ? "Hodnotenie dokončené" : `Hotové ${summary.completedCount}/${summary.categoryCount}`} color={summary.isComplete ? "success" : "default"} />
                </Stack>
                <Button
                  variant={expanded ? "contained" : "outlined"}
                  endIcon={<ExpandMoreIcon sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : application.id)}
                  sx={{ alignSelf: { xs: "stretch", md: "center" } }}
                >
                  {expanded ? "Skryť detail" : "Zobraziť detail"}
                </Button>
              </Box>

              <Collapse in={expanded} unmountOnExit>
                <Box sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 1, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
                  {application.categories.map((category) => (
                    <Box data-testid="category-row" key={category.id} sx={{ py: 1.5, minHeight: 104, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.35fr) minmax(360px, .65fr)" }, alignItems: "center", gap: { xs: 1.5, md: 3 }, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography sx={{ fontWeight: 700, pr: { md: 2 } }}>{category.name}</Typography>
                      {category.status === "completed" ? (
                        <Box><Chip size="small" color="success" label="Hotovo" sx={{ mr: 1 }} /><Typography component="span">{category.reviewer_name ?? category.reviewer_email}, {category.score}/10 — {category.comment || "bez komentára"}</Typography></Box>
                      ) : category.assignment_id ? (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                          <Typography sx={{ flexGrow: 1 }}>Čaká na: {category.reviewer_name ?? category.reviewer_email}</Typography>
                          <RemoveAssignmentForm assignmentId={category.assignment_id} onResult={showResult} />
                        </Stack>
                      ) : (
                        <AssignReviewerForm applicationId={application.id} categoryId={category.id} reviewers={eligibleReviewers} onResult={showResult} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      <Snackbar open={Boolean(feedback)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={feedback?.severity ?? "info"} onClose={() => setFeedback(null)} variant="filled" sx={{ minWidth: 300 }}>{feedback?.message}</Alert>
      </Snackbar>
    </Container>
  );
}
