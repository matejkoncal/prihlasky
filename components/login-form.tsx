"use client";

import { useState } from "react";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const { error: signInError } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password });
    if (signInError) { setError("Prihlásenie zlyhalo"); setLoading(false); return; }
    window.location.assign("/auth/landing");
  }
  return <Container maxWidth="xs" sx={{ py: 8 }}><Paper sx={{ p: 4 }}><Typography variant="h5" gutterBottom>Prihlásenie hodnotiteľa</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}><TextField label="E-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><TextField label="Heslo" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /><Button type="submit" variant="contained" disabled={loading}>{loading ? "Prihlasovanie..." : "Prihlásiť sa"}</Button></Box></Paper></Container>;
}
