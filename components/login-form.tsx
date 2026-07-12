"use client";

import Image from "next/image";
import { useState } from "react";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: signInError } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Prihlásenie zlyhalo. Skontrolujte e-mail a heslo.");
      setLoading(false);
      return;
    }
    window.location.assign("/auth/landing");
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        background: "radial-gradient(circle at 8% 12%, rgba(73,181,207,.16), transparent 28%), linear-gradient(145deg, #eef4f9 0%, #f8fafc 55%, #eaf2f8 100%)",
        py: { xs: 3, sm: 5 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, .9fr) minmax(0, 1.1fr)" },
            overflow: "hidden",
            borderRadius: { xs: 3, sm: 4 },
            border: "1px solid rgba(15, 47, 74, .1)",
            boxShadow: "0 24px 70px rgba(15, 47, 74, .14)",
          }}
        >
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: { xs: 190, md: 520 },
              p: { xs: 3, sm: 4, md: 5 },
              color: "common.white",
              background: "linear-gradient(150deg, #0d2f4a 0%, #124b70 58%, #167296 100%)",
            }}
          >
            <Box aria-hidden sx={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", right: -120, top: -115 }} />
            <Box aria-hidden sx={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", bgcolor: "rgba(85,214,222,.1)", left: -75, bottom: -80 }} />

            <Stack direction="row" spacing={1.75} sx={{ position: "relative", alignItems: "center" }}>
              <Box sx={{ width: 58, height: 58, display: "grid", placeItems: "center", bgcolor: "common.white", borderRadius: 2.25, boxShadow: "0 8px 25px rgba(0,0,0,.18)", overflow: "hidden" }}>
                <Image src="/logos/sos-logo.jpg" alt="SOŠ technológií a remesiel" width={52} height={52} priority />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 19, fontWeight: 850, lineHeight: 1.2 }}>Erasmus+ hodnotenie</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,.68)", mt: .35 }}>SOŠ technológií a remesiel</Typography>
              </Box>
            </Stack>

            <Box sx={{ position: "relative", mt: { xs: 4, md: 8 }, maxWidth: 330 }}>
              <Typography variant="overline" sx={{ color: "#78d9e2", fontWeight: 800, letterSpacing: ".14em" }}>Erasmus+</Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 800, lineHeight: 1.18, mt: .5 }}>
                Hodnotenie prihlášok prehľadne na jednom mieste
              </Typography>
              <Typography sx={{ display: { xs: "none", sm: "block" }, color: "rgba(255,255,255,.7)", lineHeight: 1.65, mt: 2 }}>
                Systém pre správu a hodnotenie prihlášok do programu Erasmus+.
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ display: { xs: "none", md: "block" }, position: "relative", color: "rgba(255,255,255,.52)", mt: 6 }}>
              Bezpečný prístup pre administrátorov a hodnotiteľov
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", p: { xs: 3, sm: 5, md: 6 }, bgcolor: "common.white" }}>
            <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, letterSpacing: ".12em" }}>Vitajte</Typography>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 850, color: "#102f4a", mt: .35 }}>
              Prihlásenie
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3.5, lineHeight: 1.6 }}>
              Prihláste sa pomocou svojho používateľského účtu.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2.25 }}>
              <TextField
                label="E-mail"
                type="email"
                autoComplete="email"
                required
                fullWidth
                disabled={loading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><EmailOutlinedIcon color="action" fontSize="small" /></InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Heslo"
                type="password"
                autoComplete="current-password"
                required
                fullWidth
                disabled={loading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon color="action" fontSize="small" /></InputAdornment>,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={loading ? undefined : <LoginRoundedIcon />}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ mt: .5, minHeight: 50, borderRadius: 2, fontWeight: 800, boxShadow: "0 8px 20px rgba(25,118,210,.22)" }}
              >
                {loading ? "Prihlasujem…" : "Prihlásiť sa"}
              </Button>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 3.5, color: "text.secondary", alignItems: "center" }}>
              <LockOutlinedIcon sx={{ fontSize: 17 }} />
              <Typography variant="caption">Prístup je určený iba pre poverených používateľov.</Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
