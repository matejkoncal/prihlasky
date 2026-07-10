export const STUDENT_SITUATIONS = [
  "Žiak so zdravotným znevýhodnením",
  "Žiak zo sociálne znevýhodneného prostredia",
  "Nepatrím do žiadnej z uvedených skupín",
] as const;

export type StudentSituation = (typeof STUDENT_SITUATIONS)[number];

export interface FileAttachment {
  name: string;
  content: string;
}

export interface ValidatedApplication {
  name: string;
  dateOfBirth: string;
  classField: string;
  address1: string;
  address2: string;
  address3: string;
  phone: string;
  email: string;
  studentSituation: StudentSituation;
  personalDataConsent: true;
  cv?: FileAttachment;
  motivationLetter?: FileAttachment;
}

export interface PdfApplicationData extends ValidatedApplication {
  date: string;
}

export interface StoredApplicationPayload {
  applicantName: string;
  formData: Omit<ValidatedApplication, "cv" | "motivationLetter">;
}

export function toStoredApplicationPayload(
  data: ValidatedApplication,
): StoredApplicationPayload {
  const { cv, motivationLetter, ...formData } = data;
  void cv;
  void motivationLetter;
  return { applicantName: data.name, formData };
}

export type ValidationResult =
  | { success: true; data: ValidatedApplication }
  | { success: false; error: string };
