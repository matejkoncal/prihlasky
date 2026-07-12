"use client";

import { Box, Button } from "@mui/material";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/admin", label: "Prihlášky", matches: (pathname: string) => pathname === "/admin" },
  { href: "/admin/hodnotitelia", label: "Používatelia", matches: (pathname: string) => pathname.startsWith("/admin/hodnotitelia") },
  { href: "/hodnotenie", label: "Moje hodnotenia", matches: (pathname: string) => pathname === "/hodnotenie" },
];

export function StaffNavigation() {
  const pathname = usePathname() ?? "";

  return (
    <Box component="nav" aria-label="Administrácia" sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "center" }, gap: .5, minWidth: "max-content" }}>
      {destinations.map((destination) => {
        const active = destination.matches(pathname);
        return (
          <Button
            key={destination.href}
            href={destination.href}
            color="inherit"
            aria-current={active ? "page" : undefined}
            data-active={active}
            sx={{
              px: { xs: 1.4, sm: 1.75 },
              py: .75,
              minHeight: 36,
              borderRadius: 2,
              textTransform: "none",
              whiteSpace: "nowrap",
              bgcolor: active ? "rgba(125,226,232,.16)" : "transparent",
              color: active ? "#a8f0f3" : "rgba(255,255,255,.7)",
              fontSize: 13,
              fontWeight: active ? 800 : 650,
              "&:hover": { bgcolor: active ? "rgba(125,226,232,.2)" : "rgba(255,255,255,.08)", color: "white" },
            }}
          >
            {destination.label}
          </Button>
        );
      })}
    </Box>
  );
}
