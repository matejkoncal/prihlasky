import type { ReactNode } from "react";
import Image from "next/image";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import type { VerifiedStaffUser } from "@/server/staff-auth";
import { StaffNavigation } from "@/components/staff-navigation";

export function StaffLayout({ user, children }: { user: VerifiedStaffUser; children: ReactNode }) {
  const label = user.displayName || user.email;
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#102a43", top: 0, zIndex: 1100, borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <Toolbar sx={{ py: 1 }}>
          <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 1, md: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexGrow: 1, minWidth: { xs: "100%", sm: 210 } }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "white", p: .4, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <Image src="/logos/sos-logo.jpg" alt="SOŠTaR" width={40} height={40} priority />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 850, lineHeight: 1.15 }}>Erasmus+ hodnotenie</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.68)" }}>SOŠ technológií a remesiel</Typography>
              </Box>
            </Box>
            {user.role === "admin" && <StaffNavigation />}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { xs: 0, md: 1 } }}>
              <Box sx={{ textAlign: "right", maxWidth: { xs: 190, md: 230 } }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.65)" }}>{user.role === "admin" ? "Admin" : "Hodnotiteľ"}</Typography>
              </Box>
              <Box component="form" action="/logout" method="post"><Button type="submit" color="inherit" size="small">Odhlásiť sa</Button></Box>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  );
}
