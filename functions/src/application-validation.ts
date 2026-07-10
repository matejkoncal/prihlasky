export const STUDENT_SITUATIONS = [
  "Žiak so zdravotným znevýhodnením",
  "Žiak zo sociálne znevýhodneného prostredia",
  "Nepatrím do žiadnej z uvedených skupín",
] as const;

export type StudentSituation = (typeof STUDENT_SITUATIONS)[number];

interface ApplicationExtras {
  studentSituation?: unknown;
  personalDataConsent?: unknown;
}

export function validateApplicationExtras(
  data: ApplicationExtras,
): string | null {
  if (
    typeof data.studentSituation !== "string" ||
    !STUDENT_SITUATIONS.includes(data.studentSituation as StudentSituation)
  ) {
    return "Vyberte jednu z uvedených možností";
  }

  if (data.personalDataConsent !== true) {
    return "Na odoslanie prihlášky je potrebný súhlas so spracovaním osobných údajov";
  }

  return null;
}
