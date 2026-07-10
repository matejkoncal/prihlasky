"use client";

import { useState } from "react";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setError("Heslo musí mať aspoň 8 znakov"); return; }
    setLoading(true); setError("");
    const { error: updateError } = await createBrowserSupabaseClient().auth.updateUser({ password });
    if (updateError) { setError("Heslo sa nepodarilo nastaviť"); setLoading(false); return; }
    window.location.assign("/auth/landing");
  }
  return <Container maxWidth="xs" sx={{ py: 8 }}><Paper sx={{ p: 4 }}><Typography variant="h5" gutterBottom>Nastavenie hesla</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}><TextField label="Nové heslo" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /><Button type="submit" variant="contained" disabled={loading}>{loading ? "Ukladanie..." : "Nastaviť heslo"}</Button></Box></Paper></Container>;
}
