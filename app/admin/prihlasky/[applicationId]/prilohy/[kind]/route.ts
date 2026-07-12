import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminAuthorizationError } from "@/server/admin-download-auth";
import { APPLICATION_ATTACHMENTS_BUCKET } from "@/server/application-attachment-repository";
import { getVerifiedStaffUser, type StaffAuthClient, type VerifiedStaffUser } from "@/server/staff-auth";

export const runtime = "nodejs";

type AttachmentKind = "cv" | "motivation_letter";

interface AttachmentMetadata {
	original_filename: string;
	mime_type: string;
	size_bytes: number;
	storage_path: string;
}

interface AttachmentDownloadDependencies {
	getUser(): Promise<VerifiedStaffUser | null>;
	findAttachment(applicationId: string, kind: AttachmentKind): Promise<AttachmentMetadata | null>;
	download(storagePath: string): Promise<Blob | null>;
}

interface RouteContext {
	params: Promise<{ applicationId: string; kind: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function downloadDisposition(filename: string): string {
	const extension = filename.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
	const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
	return `attachment; filename="dokument.${extension}"; filename*=UTF-8''${encoded}`;
}

export function createAttachmentDownloadRoute(dependencies: AttachmentDownloadDependencies) {
	return async function attachmentDownload(_request: Request, context: RouteContext): Promise<Response> {
		const user = await dependencies.getUser();
		const authorizationError = adminAuthorizationError(user);
		if (authorizationError) {
			return authorizationError;
		}

		const { applicationId, kind } = await context.params;
		if (!UUID_PATTERN.test(applicationId) || (kind !== "cv" && kind !== "motivation_letter")) {
			return Response.json({ error: "Neplatný dokument" }, { status: 400 });
		}

		try {
			const metadata = await dependencies.findAttachment(applicationId, kind);
			if (!metadata) {
				return Response.json({ error: "Dokument sa nenašiel" }, { status: 404 });
			}
			const file = await dependencies.download(metadata.storage_path);
			if (!file) {
				return Response.json({ error: "Dokument sa nenašiel" }, { status: 404 });
			}
			const bytes = await file.arrayBuffer();
			return new Response(bytes, {
				headers: {
					"Content-Type": metadata.mime_type,
					"Content-Length": String(metadata.size_bytes),
					"Content-Disposition": downloadDisposition(metadata.original_filename),
					"X-Content-Type-Options": "nosniff",
					"Cache-Control": "private, no-store",
				},
			});
		} catch (error) {
			console.error("Attachment download failed:", error);
			return Response.json({ error: "Dokument sa nepodarilo stiahnuť" }, { status: 500 });
		}
	};
}

export const GET = createAttachmentDownloadRoute({
	async getUser() {
		const supabase = await createServerSupabaseClient();
		return getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
	},
	async findAttachment(applicationId, kind) {
		const { data, error } = await createAdminSupabaseClient()
			.from("application_attachments")
			.select("original_filename, mime_type, size_bytes, storage_path")
			.eq("application_id", applicationId)
			.eq("kind", kind)
			.maybeSingle();
		if (error) {
			throw new Error(error.message);
		}
		return data;
	},
	async download(storagePath) {
		const { data, error } = await createAdminSupabaseClient().storage.from(APPLICATION_ATTACHMENTS_BUCKET).download(storagePath);
		if (error) {
			if (error.message.toLowerCase().includes("not found")) {
				return null;
			}
			throw new Error(error.message);
		}
		return data;
	},
});
