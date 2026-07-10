import type { FileAttachment, ValidatedApplication } from "./application-types";

export const RECIPIENT_EMAILS = ["matej@koncal.sk", "koncalova@sostar.sk"];
export const SENDER_EMAIL = "prihlasky@koncal.sk";

interface EmailAttachment {
  filename: string;
  content: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attachment(file: FileAttachment): EmailAttachment {
  return { filename: file.name, content: file.content };
}

function pdfFilename(name: string): string {
  const safeName = name
    .trim()
    .toLocaleLowerCase("sk")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");
  return `prihlaska-erasmus-${safeName || "ziak"}.pdf`;
}

export function createSchoolEmail(
  data: ValidatedApplication,
  pdfBase64: string,
): EmailMessage {
  const attachments: EmailAttachment[] = [
    { filename: pdfFilename(data.name), content: pdfBase64 },
  ];
  if (data.cv) attachments.push(attachment(data.cv));
  if (data.motivationLetter) {
    attachments.push(attachment(data.motivationLetter));
  }

  return {
    to: RECIPIENT_EMAILS,
    subject: `Nová prihláška Erasmus+ - ${data.name}`,
    html: `
      <h2>Nová prihláška do výberového konania Erasmus+ 2026/2027</h2>
      <p><strong>Meno:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Dátum narodenia:</strong> ${escapeHtml(data.dateOfBirth)}</p>
      <p><strong>Trieda:</strong> ${escapeHtml(data.classField)}</p>
      <p><strong>Adresa:</strong> ${escapeHtml(data.address1)} ${escapeHtml(data.address2)} ${escapeHtml(data.address3)}</p>
      <p><strong>Telefón:</strong> ${escapeHtml(data.phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Situácia žiaka:</strong> ${escapeHtml(data.studentSituation)}</p>
      <p><strong>Súhlas so spracovaním osobných údajov:</strong> Áno</p>
      <p><em>PDF prihláška je v prílohe.</em></p>
    `,
    attachments,
  };
}

export function createApplicantConfirmationEmail(email: string): EmailMessage {
  return {
    to: email,
    subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
    html: `
      <h2>Prihláška Erasmus+</h2>
      <p>Vaša prihláška pre Erasmus+ bola úspešne odoslaná.</p>
    `,
  };
}
