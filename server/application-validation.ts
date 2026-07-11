import {
  STUDENT_SITUATIONS,
  type FileAttachment,
  type StudentSituation,
  type ValidatedApplication,
  type ValidationResult,
} from "./application-types";

export { STUDENT_SITUATIONS } from "./application-types";

export const MAX_ATTACHMENTS_SIZE = 3 * 1024 * 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_ATTACHMENT_PATTERN = /\.(pdf|docx)$/i;
const UNSAFE_ATTACHMENT_NAME_PATTERN = /[/\\\u0000-\u001f\u007f]/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function requiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseAttachment(
  value: unknown,
): { attachment?: FileAttachment; decodedSize: number; error?: string } {
  if (value === undefined || value === null) {
    return { decodedSize: 0 };
  }

  if (!isPlainObject(value)) {
    return { decodedSize: 0, error: "Neplatný obsah prílohy" };
  }

  const name = requiredString(value.name);
  if (
    name &&
    (name.length > 200 || UNSAFE_ATTACHMENT_NAME_PATTERN.test(name))
  ) {
    return { decodedSize: 0, error: "Neplatný názov prílohy" };
  }
  if (!name || !ALLOWED_ATTACHMENT_PATTERN.test(name)) {
    return {
      decodedSize: 0,
      error: "Prílohy musia byť vo formáte PDF alebo DOCX",
    };
  }

  const content = value.content;
  if (
    typeof content !== "string" ||
    content.length === 0 ||
    content.length % 4 !== 0 ||
    !BASE64_PATTERN.test(content)
  ) {
    return { decodedSize: 0, error: "Neplatný obsah prílohy" };
  }

  const decoded = Buffer.from(content, "base64");
  if (decoded.toString("base64") !== content) {
    return { decodedSize: 0, error: "Neplatný obsah prílohy" };
  }

  return {
    attachment: { name, content },
    decodedSize: decoded.byteLength,
  };
}

export function validateApplication(input: unknown): ValidationResult {
  if (!isPlainObject(input)) {
    return { success: false, error: "Vyplňte všetky povinné polia" };
  }

  const name = requiredString(input.name);
  const dateOfBirth = requiredString(input.dateOfBirth);
  const submittedClassName = requiredString(input.className);
  const submittedFieldOfStudy = requiredString(input.fieldOfStudy);
  const submittedClassField = requiredString(input.classField);
  const separator = " – ";
  const separatorIndex = submittedClassField?.indexOf(separator) ?? -1;
  const className = submittedClassName ?? (
    separatorIndex >= 0
      ? submittedClassField!.slice(0, separatorIndex).trim()
      : submittedClassField
  );
  const fieldOfStudy = submittedFieldOfStudy ?? (
    separatorIndex >= 0
      ? submittedClassField!.slice(separatorIndex + separator.length).trim()
      : ""
  );
  const classField = submittedClassName && submittedFieldOfStudy
    ? `${submittedClassName}${separator}${submittedFieldOfStudy}`
    : submittedClassField;
  const address1 = requiredString(input.address1);
  const phone = requiredString(input.phone);
  const email = requiredString(input.email);

  if (!name || !dateOfBirth || !className || !classField || !address1 || !phone || !email) {
    return { success: false, error: "Vyplňte všetky povinné polia" };
  }

  if (
    typeof input.studentSituation !== "string" ||
    !STUDENT_SITUATIONS.includes(input.studentSituation as StudentSituation)
  ) {
    return { success: false, error: "Vyberte jednu z uvedených možností" };
  }

  if (input.personalDataConsent !== true) {
    return {
      success: false,
      error:
        "Na odoslanie prihlášky je potrebný súhlas so spracovaním osobných údajov",
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "Neplatná emailová adresa" };
  }

  const cv = parseAttachment(input.cv);
  if (cv.error) return { success: false, error: cv.error };
  const motivationLetter = parseAttachment(input.motivationLetter);
  if (motivationLetter.error) {
    return { success: false, error: motivationLetter.error };
  }

  if (cv.decodedSize + motivationLetter.decodedSize > MAX_ATTACHMENTS_SIZE) {
    return {
      success: false,
      error: "Prílohy môžu mať spolu maximálne 3 MB",
    };
  }

  const data: ValidatedApplication = {
    name,
    dateOfBirth,
    className,
    fieldOfStudy,
    classField,
    address1,
    address2: optionalString(input.address2),
    address3: optionalString(input.address3),
    phone,
    email,
    studentSituation: input.studentSituation as StudentSituation,
    personalDataConsent: true,
    ...(cv.attachment ? { cv: cv.attachment } : {}),
    ...(motivationLetter.attachment
      ? { motivationLetter: motivationLetter.attachment }
      : {}),
  };

  return { success: true, data };
}
