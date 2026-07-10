"use client";

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
  CircularProgress,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const sosLogo = "/logos/sos-logo.jpg";
const erasmusLogo = "/logos/erasmus-logo.jpg";
const saiacLogo = "/logos/saaic-logo.jpg";
const euCoFundedLogo = "/logos/eu-co-funded-sk.png";
const MAX_ATTACHMENTS_SIZE = 3 * 1024 * 1024;

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
  studentSituation: string;
  personalDataConsent: boolean;
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
  studentSituation: "",
  personalDataConsent: false,
};

function ApplicationForm() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [cv, setCv] = useState<File | null>(null);
  const [motivationLetter, setMotivationLetter] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      if ((cv?.size ?? 0) + (motivationLetter?.size ?? 0) > MAX_ATTACHMENTS_SIZE) {
        throw new Error("Prílohy môžu mať spolu maximálne 3 MB");
      }

      const payload: Record<string, unknown> = {
        ...form,
        classField: `${form.trieda} – ${form.odbor}`,
      };
      if (cv) {
        payload.cv = { name: cv.name, content: await fileToBase64(cv) };
      }
      if (motivationLetter) {
        payload.motivationLetter = {
          name: motivationLetter.name,
          content: await fileToBase64(motivationLetter),
        };
      }
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Odoslanie zlyhalo");
      }
      setConfirmationEmail(form.email);
      setSuccess(true);
      setForm(INITIAL_FORM);
      setCv(null);
      setMotivationLetter(null);
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

            <Box
              component="img"
              src={euCoFundedLogo}
              alt="Spolufinancované Európskou úniou"
              sx={{
                width: 220,
                maxWidth: "75%",
                mx: "auto",
                mb: 2,
                display: "block",
              }}
            />
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

          {success ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, textAlign: "center", bgcolor: "success.50" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Prihláška bola úspešne odoslaná.
              </Typography>
              <Typography color="text.secondary">
                Potvrdenie sme odoslali na e-mailovú adresu {confirmationEmail}.
              </Typography>
            </Paper>
          ) : (
            <>
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

            <FormControl required>
              <FormLabel id="student-situation-label">
                Vyberte možnosť, ktorá najlepšie vystihuje Vašu situáciu:
              </FormLabel>
              <RadioGroup
                aria-labelledby="student-situation-label"
                name="studentSituation"
                value={form.studentSituation}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="Žiak so zdravotným znevýhodnením"
                  control={
                    <Radio
                      required
                      slotProps={{
                        input: {
                          "aria-label": "Žiak so zdravotným znevýhodnením",
                        },
                      }}
                    />
                  }
                  label="Žiak so zdravotným znevýhodnením"
                />
                <FormControlLabel
                  value="Žiak zo sociálne znevýhodneného prostredia"
                  control={
                    <Radio
                      required
                      slotProps={{
                        input: {
                          "aria-label":
                            "Žiak zo sociálne znevýhodneného prostredia",
                        },
                      }}
                    />
                  }
                  label="Žiak zo sociálne znevýhodneného prostredia"
                />
                <FormControlLabel
                  value="Nepatrím do žiadnej z uvedených skupín"
                  control={
                    <Radio
                      required
                      slotProps={{
                        input: {
                          "aria-label":
                            "Nepatrím do žiadnej z uvedených skupín",
                        },
                      }}
                    />
                  }
                  label="Nepatrím do žiadnej z uvedených skupín"
                />
              </RadioGroup>
            </FormControl>

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

            <FormControlLabel
              required
              control={
                <Checkbox
                  name="personalDataConsent"
                  checked={form.personalDataConsent}
                  onChange={handleChange}
                  required
                  slotProps={{
                    input: {
                      "aria-label":
                        "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.",
                    },
                  }}
                />
              }
              label="Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+."
              sx={{ alignItems: "flex-start" }}
            />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ fontWeight: 600, display: "block" }}
              >
                Prílohy / Attachments (nepovinné):
              </Typography>

              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon />}
                sx={{ textTransform: "none", mr: 1, mb: 1 }}
              >
                {cv ? cv.name : "Životopis / CV"}
                <input
                  type="file"
                  hidden
                  aria-label="Životopis / CV"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                />
              </Button>

              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon />}
                sx={{ textTransform: "none", mb: 1 }}
              >
                {motivationLetter
                  ? motivationLetter.name
                  : "Motivačný list / Motivation letter"}
                <input
                  type="file"
                  hidden
                  aria-label="Motivačný list / Motivation letter"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) =>
                    setMotivationLetter(e.target.files?.[0] || null)
                  }
                />
              </Button>

              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: "block", mt: 0.5 }}
              >
                Formát: PDF alebo DOCX
              </Typography>
            </Paper>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || !form.personalDataConsent}
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
            </>
          )}

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

export default ApplicationForm;
