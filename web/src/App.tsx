import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Box,
  Divider,
  Link,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import SendIcon from "@mui/icons-material/Send";
import sosLogo from "./assets/logos/sos-logo.jpg";
import erasmusLogo from "./assets/logos/erasmus-logo.jpg";
import saiacLogo from "./assets/logos/saaic-logo.jpg";

const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" },
    background: { default: "#f0f4f8" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 12 },
});

const ODBORY = [
  "Mechanik elektrotechnik",
  "Mechanik počítačových sietí",
  "Technik energetických zariadení budov",
  "Mechanik nastavovač / mechanička nastavovačka",
  "Mechanik / mechanička strojov a zariadení",
];

interface FormData {
  name: string;
  dateOfBirth: string;
  trieda: string;
  odbor: string;
  address1: string;
  address2: string;
  address3: string;
  phone: string;
  email: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  dateOfBirth: "",
  trieda: "",
  odbor: "",
  address1: "",
  address2: "",
  address3: "",
  phone: "",
  email: "",
};

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        ...form,
        classField: `${form.trieda} – ${form.odbor}`,
      };
      const res = await fetch(`${API_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Odoslanie zlyhalo");
      }
      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              component="img"
              src={sosLogo}
              alt="SOŠ technológií a remesiel"
              sx={{ height: 70, mx: "auto", mb: 1, display: "block" }}
            />
            <Typography
              variant="body2"
              color="primary.main"
              sx={{ fontWeight: 500 }}
            >
              Stredná odborná škola technológií a remesiel
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ivanská cesta 21, 820 16 Bratislava
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 3,
                mt: 1.5,
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={erasmusLogo}
                alt="Erasmus+"
                sx={{ height: 40 }}
              />
              <Box
                component="img"
                src={saiacLogo}
                alt="SAAIC"
                sx={{ height: 40 }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Title */}
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
            }}
          >
            Prihláška do výberového konania na projekt Erasmus+
          </Typography>
          <Typography
            variant="subtitle2"
            align="center"
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            pre školský rok 2026/2027
          </Typography>
          <Typography
            variant="caption"
            align="center"
            color="text.disabled"
            sx={{ mb: 3, display: "block" }}
          >
            The Application for the Erasmus+ project in the 2026/2027 school
            year
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Prihláška bola úspešne odoslaná!
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              label="Meno a priezvisko / Name and surname"
              name="name"
              required
              fullWidth
              value={form.name}
              onChange={handleChange}
            />

            <TextField
              label="Dátum narodenia / Date of Birth"
              name="dateOfBirth"
              type="date"
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.dateOfBirth}
              onChange={handleChange}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Trieda / Class"
                name="trieda"
                required
                fullWidth
                placeholder="napr. 3.A"
                value={form.trieda}
                onChange={handleChange}
              />
              <TextField
                label="Odbor / Field of study"
                name="odbor"
                required
                fullWidth
                select
                value={form.odbor}
                onChange={handleChange}
              >
                {ODBORY.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Ulica a číslo / Street"
              name="address1"
              required
              fullWidth
              value={form.address1}
              onChange={handleChange}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="PSČ a mesto / ZIP & City"
                name="address2"
                fullWidth
                value={form.address2}
                onChange={handleChange}
              />
              <TextField
                label="Krajina / Country"
                name="address3"
                fullWidth
                value={form.address3}
                onChange={handleChange}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Telefón / Phone"
                name="phone"
                type="tel"
                required
                fullWidth
                value={form.phone}
                onChange={handleChange}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                required
                fullWidth
                value={form.email}
                onChange={handleChange}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              Svojím odoslaním potvrdzujem prihlášku do výberového konania na
              projekt Erasmus+.
              <br />
              <Typography
                component="span"
                variant="caption"
                color="text.disabled"
              >
                I confirm the application for the tender for the Erasmus+
                project.
              </Typography>
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ fontWeight: 600, display: "block" }}
              >
                Prílohy v anglickom jazyku / Attachments in English:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Životopis – Europass –{" "}
                <Link
                  href="https://europa.eu/europass/en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  europa.eu/europass
                </Link>
                <br />
                Motivačný list (predstavy a očakávania účastníka mobility)
                formou interview
              </Typography>
            </Paper>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              endIcon={
                submitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
              }}
            >
              {submitting ? "Odosiela sa..." : "Odoslať prihlášku"}
            </Button>
          </Box>

          <Typography
            variant="caption"
            align="center"
            color="text.disabled"
            sx={{ mt: 3, display: "block" }}
          >
            Uvedené informácie sú určené pre interné potreby školy
          </Typography>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
