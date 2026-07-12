import type { FileAttachment, ValidatedApplication } from "./application-types";

export const APPLICATION_ATTACHMENTS_BUCKET = "application-attachments";

type AttachmentKind = "cv" | "motivation_letter";

interface SupabaseError {
	message: string;
}

interface MutationResult {
	error: SupabaseError | null;
}

interface AttachmentRow {
	storage_path: string;
}

export interface AttachmentClient {
	storage: {
		from(bucket: string): {
			upload(path: string, body: Uint8Array, options: { contentType: string; upsert: false }): Promise<MutationResult>;
			remove(paths: string[]): Promise<MutationResult>;
		};
	};
	from(table: "application_attachments"): {
		insert(values: {
			application_id: string;
			kind: AttachmentKind;
			original_filename: string;
			mime_type: string;
			size_bytes: number;
			storage_path: string;
		}): Promise<MutationResult>;
		select(columns: "storage_path"): {
			eq(
				column: "application_id",
				value: string
			): Promise<{
				data: AttachmentRow[] | null;
				error: SupabaseError | null;
			}>;
		};
		delete(): {
			eq(column: "application_id", value: string): Promise<MutationResult>;
		};
	};
}

export interface ApplicationAttachmentRepository {
	store(applicationId: string, data: Pick<ValidatedApplication, "cv" | "motivationLetter">): Promise<void>;
	removeAll(applicationId: string): Promise<void>;
}

function fileDetails(file: FileAttachment) {
	const extension = file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
	return {
		extension,
		mimeType: extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
		bytes: new Uint8Array(Buffer.from(file.content, "base64")),
	};
}

function assertSuccess(error: SupabaseError | null): void {
	if (error) {
		throw new Error(error.message);
	}
}

export function createApplicationAttachmentRepository(client: AttachmentClient): ApplicationAttachmentRepository {
	const bucket = client.storage.from(APPLICATION_ATTACHMENTS_BUCKET);

	async function removePathsAndMetadata(applicationId: string, paths: string[]) {
		if (paths.length > 0) {
			const { error } = await bucket.remove(paths);
			assertSuccess(error);
		}
		const { error } = await client.from("application_attachments").delete().eq("application_id", applicationId);
		assertSuccess(error);
	}

	return {
		async store(applicationId, data) {
			const files: Array<{ kind: AttachmentKind; file: FileAttachment }> = [];
			if (data.cv) {
				files.push({ kind: "cv", file: data.cv });
			}
			if (data.motivationLetter) {
				files.push({ kind: "motivation_letter", file: data.motivationLetter });
			}

			const uploadedPaths: string[] = [];
			try {
				for (const { kind, file } of files) {
					const details = fileDetails(file);
					const storagePath = `${applicationId}/${kind}-${crypto.randomUUID()}.${details.extension}`;
					const { error: uploadError } = await bucket.upload(storagePath, details.bytes, { contentType: details.mimeType, upsert: false });
					assertSuccess(uploadError);
					uploadedPaths.push(storagePath);

					const { error: metadataError } = await client.from("application_attachments").insert({
						application_id: applicationId,
						kind,
						original_filename: file.name,
						mime_type: details.mimeType,
						size_bytes: details.bytes.byteLength,
						storage_path: storagePath,
					});
					assertSuccess(metadataError);
				}
			} catch (error) {
				await removePathsAndMetadata(applicationId, uploadedPaths).catch(() => undefined);
				throw error;
			}
		},

		async removeAll(applicationId) {
			const { data, error } = await client.from("application_attachments").select("storage_path").eq("application_id", applicationId);
			assertSuccess(error);
			await removePathsAndMetadata(
				applicationId,
				(data ?? []).map(row => row.storage_path)
			);
		},
	};
}
