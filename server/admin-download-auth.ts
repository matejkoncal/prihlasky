import type { VerifiedStaffUser } from "./staff-auth";

export function adminAuthorizationError(user: VerifiedStaffUser | null): Response | null {
	if (!user) {
		return Response.json({ error: "Prihlásenie je potrebné" }, { status: 401 });
	}
	if (user.role !== "admin") {
		return Response.json({ error: "Nemáte oprávnenie správcu" }, { status: 403 });
	}
	return null;
}
