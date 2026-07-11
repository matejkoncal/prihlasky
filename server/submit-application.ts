import type { EmailMessage } from "./application-emails";
import type { ApplicationRepository } from "./application-repository";
import type { ApplicationAttachmentRepository } from "./application-attachment-repository";
import {
  createApplicantConfirmationEmail,
  createSchoolEmail,
} from "./application-emails";
import {
  toStoredApplicationPayload,
  type PdfApplicationData,
} from "./application-types";
import { validateApplication } from "./application-validation";

export interface SubmissionDependencies {
  applications: ApplicationRepository;
  attachments: ApplicationAttachmentRepository;
  now: () => Date;
  renderPdf: (data: PdfApplicationData) => Promise<Uint8Array>;
  sendEmail: (message: EmailMessage) => Promise<void>;
}

export type SubmissionResult =
  | { success: true }
  | { success: false; error: string };

function formatDate(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export async function submitApplication(
  input: unknown,
  dependencies: SubmissionDependencies,
): Promise<SubmissionResult> {
  const validation = validateApplication(input);
  if (!validation.success) return validation;

  const application = await dependencies.applications.createPending(
    toStoredApplicationPayload(validation.data),
  );

  try {
    await dependencies.attachments.store(application.id, validation.data);
    const pdfData: PdfApplicationData = {
      ...validation.data,
      date: formatDate(dependencies.now()),
    };
    const pdfBytes = await dependencies.renderPdf(pdfData);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    await dependencies.sendEmail(createSchoolEmail(validation.data, pdfBase64));
    await dependencies.sendEmail(
      createApplicantConfirmationEmail(validation.data.email),
    );
    await dependencies.applications.markSent(application.id);

    return { success: true };
  } catch (error) {
    const failure =
      error instanceof Error ? error : new Error("Unknown delivery failure");
    await dependencies.attachments.removeAll(application.id).catch(() => undefined);
    await dependencies.applications.markFailed(application.id, failure).catch(() => undefined);
    throw failure;
  }
}
