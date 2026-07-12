import { renderDocument } from "@formepdf/core";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminAuthorizationError } from "@/server/admin-download-auth";
import type { EvaluationExportData } from "@/server/evaluation-export-types";
import { EvaluationPdf } from "@/server/evaluation-pdf";
import { getVerifiedStaffUser, type StaffAuthClient, type VerifiedStaffUser } from "@/server/staff-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

type ExportLookup = { status: "ok"; data: EvaluationExportData } | { status: "not_found" } | { status: "incomplete" };

interface EvaluationExportDependencies {
	getUser(): Promise<VerifiedStaffUser | null>;
	getExport(applicationId: string): Promise<ExportLookup>;
	render(data: EvaluationExportData): Promise<Uint8Array>;
}

interface RouteContext {
	params: Promise<{ applicationId: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function filenameFor(name: string): string {
	const slug =
		name
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-|-$/g, "") || "ziak";
	return `hodnotenie-${slug}.pdf`;
}

export function createEvaluationExportRoute(dependencies: EvaluationExportDependencies) {
	return async function evaluationExport(_request: Request, context: RouteContext): Promise<Response> {
		const user = await dependencies.getUser();
		const authorizationError = adminAuthorizationError(user);
		if (authorizationError) {
			return authorizationError;
		}

		const { applicationId } = await context.params;
		if (!UUID_PATTERN.test(applicationId)) {
			return Response.json({ error: "Neplatná prihláška" }, { status: 400 });
		}

		try {
			const lookup = await dependencies.getExport(applicationId);
			if (lookup.status === "not_found") {
				return Response.json({ error: "Prihláška sa nenašla" }, { status: 404 });
			}
			if (lookup.status === "incomplete" || lookup.data.categories.length !== 5) {
				return Response.json({ error: "Hodnotenie ešte nie je dokončené" }, { status: 409 });
			}
			const bytes = await dependencies.render(lookup.data);
			return new Response(Buffer.from(bytes), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Length": String(bytes.byteLength),
					"Content-Disposition": `attachment; filename="${filenameFor(lookup.data.applicantName)}"`,
					"X-Content-Type-Options": "nosniff",
					"Cache-Control": "private, no-store",
				},
			});
		} catch (error) {
			console.error("Evaluation PDF export failed:", error);
			return Response.json({ error: "PDF sa nepodarilo vytvoriť" }, { status: 500 });
		}
	};
}

export const GET = createEvaluationExportRoute({
	async getUser() {
		const supabase = await createServerSupabaseClient();
		return getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
	},
	async getExport(applicationId) {
		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase.rpc("admin_get_application_export", {
			p_application_id: applicationId,
		});
		if (error) {
			if (error.message.includes("incomplete")) {
				return { status: "incomplete" };
			}
			if (error.message.includes("unavailable")) {
				return { status: "not_found" };
			}
			throw new Error(error.message);
		}
		if (!data) {
			return { status: "not_found" };
		}
		return { status: "ok", data: data as unknown as EvaluationExportData };
	},
	async render(data) {
		return renderDocument(EvaluationPdf({ data }));
	},
});
