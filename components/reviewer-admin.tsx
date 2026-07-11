"use client";

import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Container, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { deactivateStaff, inviteReviewer } from "@/app/admin/hodnotitelia/actions";
import type { AdminReviewer } from "@/components/admin-dashboard";
import { usePendingFormAction, type FormActionResult } from "@/components/use-pending-form-action";

function InvitationForm({ onResult }: { onResult: (result: FormActionResult) => void }) {
  const { pending, formAction } = usePendingFormAction(inviteReviewer, onResult, "Pozvanie zlyhalo");
  return (
    <Box component="form" action={formAction} sx={{ display: "grid", gap: 2 }}>
      <TextField label="Meno" name="displayName" required disabled={pending} />
      <TextField label="E-mail" name="email" type="email" required disabled={pending} />
      <Select name="role" defaultValue="reviewer" disabled={pending}>
        <MenuItem value="reviewer">Hodnotiteľ</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </Select>
      <Button type="submit" variant="contained" disabled={pending} startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}>
        {pending ? "Odosielam…" : "Poslať pozvánku"}
      </Button>
    </Box>
  );
}

function StaffRow({ reviewer, onResult }: { reviewer: AdminReviewer; onResult: (result: FormActionResult) => void }) {
  const { pending, formAction } = usePendingFormAction(deactivateStaff, onResult, "Deaktivácia zlyhala");
  return (
    <Paper sx={{ p: 2, mb: 1, borderRadius: 2, opacity: reviewer.is_active ? 1 : .6 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700 }}>{reviewer.display_name || reviewer.email}</Typography>
        <Chip size="small" label={reviewer.role === "admin" ? "Admin" : "Hodnotiteľ"} color={reviewer.role === "admin" ? "secondary" : "primary"} />
        <Chip size="small" label={reviewer.is_active ? "Aktívny" : "Deaktivovaný"} color={reviewer.is_active ? "success" : "default"} />
      </Box>
      <Typography variant="body2" color="text.secondary">{reviewer.email} · čaká: {reviewer.pending_count} · hotovo: {reviewer.completed_count}</Typography>
      {reviewer.is_active && (
        <Box component="form" action={formAction} sx={{ mt: 1 }}>
          <input type="hidden" name="profileId" value={reviewer.id} />
          <Button type="submit" size="small" color="error" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {pending ? "Deaktivujem…" : "Deaktivovať prístup"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export function ReviewerAdmin({ reviewers }: { reviewers: AdminReviewer[] }) {
  const [error, setError] = useState("");
  const handleResult = (result: FormActionResult) => setError(result.error || "");

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Správa používateľov</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Pozývaj hodnotiteľov alebo ďalších adminov a spravuj ich prístup.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Nová pozvánka</Typography>
        <InvitationForm onResult={handleResult} />
      </Paper>
      {reviewers.map((reviewer) => <StaffRow key={reviewer.id} reviewer={reviewer} onResult={handleResult} />)}
    </Container>
  );
}
