"use client";

import { Box, Button } from "@mui/material";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/admin", label: "Prihlášky", matches: (pathname: string) => pathname === "/admin" },
  { href: "/admin/hodnotitelia", label: "Používatelia", matches: (pathname: string) => pathname.startsWith("/admin/hodnotitelia") },
];

export function StaffNavigation() {
  const pathname = usePathname() ?? "";

  return (
    <Box component="nav" aria-label="Administrácia" sx={{ display: "flex", alignSelf: "stretch", alignItems: "stretch" }}>
      {destinations.map((destination) => {
        const active = destination.matches(pathname);
        return (
          <Button
            key={destination.href}
            href={destination.href}
            color="inherit"
            aria-current={active ? "page" : undefined}
            sx={{
              px: { xs: 1.25, sm: 2 },
              borderRadius: 0,
              borderBottom: "3px solid",
              borderColor: active ? "#54d2dc" : "transparent",
              bgcolor: active ? "rgba(255,255,255,.1)" : "transparent",
              fontWeight: active ? 800 : 600,
              opacity: active ? 1 : .78,
              "&:hover": { bgcolor: "rgba(255,255,255,.12)", opacity: 1 },
            }}
          >
            {destination.label}
          </Button>
        );
      })}
    </Box>
  );
}
