import type { EmailMessage } from "./application-emails";
import {
  createApplicantConfirmationEmail,
  createSchoolEmail,
} from "./application-emails";
import type { PdfApplicationData } from "./application-types";
import { validateApplication } from "./application-validation";

export interface SubmissionDependencies {
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

  return { success: true };
}
