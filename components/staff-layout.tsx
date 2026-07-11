import type { ReactNode } from "react";
import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from "@mui/material";
import type { StaffRole } from "@/server/staff-auth";

export function StaffLayout({ role, children }: { role: StaffRole; children: ReactNode }) {
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}><AppBar position="sticky" elevation={0} sx={{ bgcolor: "#102a43", top: 0, zIndex: (theme) => theme.zIndex.appBar }}><Toolbar sx={{ py: { xs: 1, sm: 0 } }}><Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 1, md: 2 } }}><Typography sx={{ flexGrow: 1, minWidth: { xs: "100%", sm: "auto" }, fontWeight: 800 }}>Erasmus+ hodnotenie</Typography><Chip size="small" label={role === "admin" ? "Admin" : "Hodnotiteľ"} sx={{ bgcolor: "rgba(255,255,255,.16)", color: "white" }} />{role === "admin" && <><Button href="/admin" color="inherit" size="small">Prihlášky</Button><Button href="/admin/hodnotitelia" color="inherit" size="small">Používatelia</Button></>}<Box component="form" action="/logout" method="post"><Button type="submit" color="inherit" size="small">Odhlásiť sa</Button></Box></Container></Toolbar></AppBar>{children}</Box>;
}
