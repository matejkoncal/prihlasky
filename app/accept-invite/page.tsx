import { redirect } from "next/navigation";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

export default async function AcceptInvitePage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const tokenHash = (await searchParams).token_hash;
  if (!tokenHash) redirect("/login?error=invite");

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 9 } }}>
      <Paper sx={{ overflow: "hidden", borderRadius: 4, boxShadow: "0 18px 50px rgba(16,42,67,.14)" }}>
        <Box sx={{ px: { xs: 3, md: 5 }, py: 3.5, bgcolor: "#102a43", color: "white" }}>
          <Typography sx={{ mb: 1, color: "#7de2e8", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", fontSize: 12 }}>Erasmus+</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Pozvánka do systému</Typography>
        </Box>
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Typography sx={{ mb: 2, fontSize: 17, lineHeight: 1.7 }}>Boli ste pozvaní do systému na hodnotenie prihlášok do programu Erasmus+.</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.65 }}>Pokračovaním potvrdíte pozvánku a následne si nastavíte svoje heslo.</Typography>
          <Box component="form" action="/auth/confirm" method="post">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <Button type="submit" variant="contained" size="large" fullWidth>Prijať pozvánku a nastaviť heslo</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
