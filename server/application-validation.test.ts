import { describe, expect, it } from "vitest";
import {
  MAX_ATTACHMENTS_SIZE,
  STUDENT_SITUATIONS,
  validateApplication,
} from "./application-validation";

function validPayload() {
  return {
    name: " Ján Žiak ",
    dateOfBirth: "2008-01-01",
    classField: "3.A – Mechanik elektrotechnik",
    address1: "Školská 1",
    address2: "821 01 Bratislava",
    address3: "Slovensko",
    phone: "+421900000000",
    email: "jan@example.com",
    studentSituation: STUDENT_SITUATIONS[0],
    personalDataConsent: true,
  };
}

describe("validateApplication", () => {
  it("accepts and normalizes a complete application", () => {
    const result = validateApplication(validPayload());
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        name: "Ján Žiak",
        address2: "821 01 Bratislava",
        personalDataConsent: true,
      }),
    });
  });

  it("rejects a missing required string", () => {
    expect(validateApplication({ ...validPayload(), phone: " " })).toEqual({
      success: false,
      error: "Vyplňte všetky povinné polia",
    });
  });

  it("rejects a malformed email", () => {
    expect(validateApplication({ ...validPayload(), email: "not-an-email" })).toEqual({
      success: false,
      error: "Neplatná emailová adresa",
    });
  });

  it("rejects unsupported student situations", () => {
    expect(
      validateApplication({ ...validPayload(), studentSituation: "Iná skupina" }),
    ).toEqual({
      success: false,
      error: "Vyberte jednu z uvedených možností",
    });
  });

  it("requires literal boolean privacy consent", () => {
    expect(
      validateApplication({ ...validPayload(), personalDataConsent: "true" }),
    ).toEqual({
      success: false,
      error:
        "Na odoslanie prihlášky je potrebný súhlas so spracovaním osobných údajov",
    });
  });

  it("rejects unsupported attachment extensions", () => {
    expect(
      validateApplication({
        ...validPayload(),
        cv: { name: "cv.txt", content: Buffer.from("test").toString("base64") },
      }),
    ).toEqual({
      success: false,
      error: "Prílohy musia byť vo formáte PDF alebo DOCX",
    });
  });

  it("rejects unsafe attachment filenames", () => {
    expect(
      validateApplication({
        ...validPayload(),
        cv: { name: "../cv.pdf", content: Buffer.from("test").toString("base64") },
      }),
    ).toEqual({
      success: false,
      error: "Neplatný názov prílohy",
    });
  });

  it("rejects malformed base64 attachments", () => {
    expect(
      validateApplication({
        ...validPayload(),
        cv: { name: "cv.pdf", content: "not base64!" },
      }),
    ).toEqual({
      success: false,
      error: "Neplatný obsah prílohy",
    });
  });

  it("accepts exactly 3 MB and rejects one decoded byte more", () => {
    const exact = Buffer.alloc(MAX_ATTACHMENTS_SIZE).toString("base64");
    const oneByte = Buffer.alloc(1).toString("base64");
    expect(
      validateApplication({
        ...validPayload(),
        cv: { name: "cv.PDF", content: exact },
      }).success,
    ).toBe(true);
    expect(
      validateApplication({
        ...validPayload(),
        cv: { name: "cv.pdf", content: exact },
        motivationLetter: { name: "letter.docx", content: oneByte },
      }),
    ).toEqual({
      success: false,
      error: "Prílohy môžu mať spolu maximálne 3 MB",
    });
  });
});
