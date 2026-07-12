import type { ReactNode } from "react";
import Image from "next/image";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { AppBar, Avatar, Box, Container, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import type { VerifiedStaffUser } from "@/server/staff-auth";
import { StaffNavigation } from "@/components/staff-navigation";

export function StaffLayout({ user, children }: { user: VerifiedStaffUser; children: ReactNode }) {
	const label = user.displayName || user.email;
	const initials = label
		.split(/\s+/)
		.map(part => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb" }}>
			<AppBar position="sticky" elevation={0} sx={{ bgcolor: "#102f4a", top: 0, zIndex: 1100, borderBottom: "1px solid rgba(125,226,232,.22)" }}>
				<Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 68 }, py: { xs: 0.75, md: 0 } }}>
					<Container
						maxWidth="lg"
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "minmax(0,1fr) auto", md: "auto minmax(0,1fr) auto" },
							gridTemplateRows: { xs: "auto auto", md: "1fr" },
							alignItems: "center",
							columnGap: { xs: 1, md: 3 },
							rowGap: 0.75,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0, gridColumn: 1, gridRow: 1 }}>
							<Box
								sx={{
									width: 40,
									height: 40,
									flexShrink: 0,
									borderRadius: 1.75,
									bgcolor: "white",
									p: 0.3,
									display: "grid",
									placeItems: "center",
									overflow: "hidden",
									boxShadow: "0 4px 16px rgba(0,0,0,.18)",
								}}
							>
								<Image src="/logos/sos-logo.jpg" alt="SOŠTaR" width={36} height={36} priority />
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Typography noWrap sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 16 }, lineHeight: 1.2 }}>
									Erasmus+ hodnotenie
								</Typography>
								<Typography noWrap variant="caption" sx={{ display: { xs: "none", sm: "block" }, color: "rgba(255,255,255,.62)" }}>
									SOŠ technológií a remesiel
								</Typography>
							</Box>
						</Box>
						{user.role === "admin" && (
							<Box
								data-testid="staff-navigation-row"
								sx={{
									gridColumn: { xs: "1 / -1", md: 2 },
									gridRow: { xs: 2, md: 1 },
									overflowX: "auto",
									scrollbarWidth: "none",
									"&::-webkit-scrollbar": { display: "none" },
								}}
							>
								<StaffNavigation />
							</Box>
						)}
						<Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.9, gridColumn: { xs: 2, md: 3 }, gridRow: 1 }}>
							<Avatar sx={{ width: 34, height: 34, bgcolor: "#7de2e8", color: "#102f4a", fontSize: 13, fontWeight: 850 }}>{initials}</Avatar>
							<Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left", maxWidth: 180 }}>
								<Typography variant="body2" noWrap sx={{ fontWeight: 750, lineHeight: 1.25 }}>
									{label}
								</Typography>
								<Typography variant="caption" sx={{ color: "rgba(255,255,255,.58)" }}>
									{user.role === "admin" ? "Admin" : "Hodnotiteľ"}
								</Typography>
							</Box>
							<Tooltip title="Odhlásiť sa">
								<Box component="form" action="/logout" method="post">
									<IconButton
										type="submit"
										color="inherit"
										size="small"
										aria-label="Odhlásiť sa"
										sx={{ color: "rgba(255,255,255,.76)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,.1)" } }}
									>
										<LogoutRoundedIcon fontSize="small" />
									</IconButton>
								</Box>
							</Tooltip>
						</Box>
					</Container>
				</Toolbar>
			</AppBar>
			{children}
		</Box>
	);
}
