import { describe, expect, it } from "vitest";
import { toStoredApplicationPayload } from "./application-types";

describe("toStoredApplicationPayload", () => {
  it("keeps validated form data but excludes email-only attachments", () => {
    const payload = toStoredApplicationPayload({
      name: "Ján Žiak",
      dateOfBirth: "2008-01-01",
      classField: "3.A",
      address1: "Školská 1",
      address2: "",
      address3: "",
      phone: "+421900000000",
      email: "jan@example.com",
      studentSituation: "Žiak so zdravotným znevýhodnením",
      personalDataConsent: true,
      cv: { name: "cv.pdf", content: "Y3Y=" },
      motivationLetter: { name: "list.pdf", content: "bGlzdA==" },
    });

    expect(payload.applicantName).toBe("Ján Žiak");
    expect(payload.formData).not.toHaveProperty("cv");
    expect(payload.formData).not.toHaveProperty("motivationLetter");
    expect(payload.formData.email).toBe("jan@example.com");
  });
});
