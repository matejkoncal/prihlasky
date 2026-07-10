"use client";

import { useState } from "react";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { inviteReviewer } from "@/app/admin/hodnotitelia/actions";
import type { AdminReviewer } from "@/components/admin-dashboard";

export function ReviewerAdmin({ reviewers }: { reviewers: AdminReviewer[] }) {
  const [error, setError] = useState("");
  return <Container maxWidth="md" sx={{ py: 4 }}><Typography variant="h4" gutterBottom>Hodnotitelia</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Paper sx={{ p: 3, mb: 3 }}><Box component="form" action={async (formData) => { try { const result = await inviteReviewer(formData); setError(result.error || ""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Pozvanie zlyhalo"); } }} sx={{ display: "grid", gap: 2 }}><TextField label="Meno hodnotiteľa" name="displayName" required /><TextField label="E-mail" name="email" type="email" required /><Button type="submit" variant="contained">Poslať pozvánku</Button></Box></Paper>{reviewers.map((reviewer) => <Paper key={reviewer.id} sx={{ p: 2, mb: 1 }}><Typography>{reviewer.display_name || reviewer.email}</Typography><Typography variant="body2" color="text.secondary">{reviewer.email} · čaká: {reviewer.pending_count} · hotovo: {reviewer.completed_count}</Typography></Paper>)}</Container>;
}
