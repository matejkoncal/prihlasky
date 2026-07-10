// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { EmailMessage } from "./application-emails";
import type { ApplicationRepository } from "./application-repository";
import type { PdfApplicationData } from "./application-types";
import {
  submitApplication,
  type SubmissionDependencies,
} from "./submit-application";

function validPayload() {
  return {
    name: "Ján Žiak",
    dateOfBirth: "2008-01-01",
    classField: "3.A – Mechanik elektrotechnik",
    address1: "Školská 1",
    address2: "821 01 Bratislava",
    address3: "Slovensko",
    phone: "+421900000000",
    email: "jan@example.com",
    studentSituation: "Žiak so zdravotným znevýhodnením",
    personalDataConsent: true,
  };
}

function dependencies() {
  const events: string[] = [];
  const renderPdf = vi.fn(async (data: PdfApplicationData) => {
    events.push(`render:${data.date}`);
    return new Uint8Array(Buffer.from("pdf"));
  });
  const sendEmail = vi.fn(async (message: EmailMessage) => {
    events.push(`email:${Array.isArray(message.to) ? "school" : message.to}`);
  });
  const applications: ApplicationRepository = {
    createPending: vi.fn(async () => {
      events.push("application:pending");
      return { id: "application-id" };
    }),
    markSent: vi.fn(async () => {
      events.push("application:sent");
    }),
    markFailed: vi.fn(async () => {
      events.push("application:failed");
    }),
  };
  const value: SubmissionDependencies = {
    now: () => new Date(2026, 6, 10),
    renderPdf,
    sendEmail,
    applications,
  };
  return { value, events, renderPdf, sendEmail, applications };
}

describe("submitApplication", () => {
  it("does no work for invalid input", async () => {
    const deps = dependencies();
    await expect(submitApplication({}, deps.value)).resolves.toEqual({
      success: false,
      error: "Vyplňte všetky povinné polia",
    });
    expect(deps.renderPdf).not.toHaveBeenCalled();
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it("renders the PDF and sends school then applicant emails", async () => {
    const deps = dependencies();
    await expect(submitApplication(validPayload(), deps.value)).resolves.toEqual({
      success: true,
    });
    expect(deps.events).toEqual([
      "application:pending",
      "render:10.7.2026",
      "email:school",
      "email:jan@example.com",
      "application:sent",
    ]);
    expect(deps.sendEmail.mock.calls[0][0].attachments?.[0]).toEqual(
      expect.objectContaining({ content: Buffer.from("pdf").toString("base64") }),
    );
    expect(deps.sendEmail.mock.calls[1][0].attachments).toBeUndefined();
  });

  it("does not report success when applicant confirmation fails", async () => {
    const deps = dependencies();
    deps.sendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("delivery failed"));
    await expect(submitApplication(validPayload(), deps.value)).rejects.toThrow(
      "delivery failed",
    );
    expect(deps.applications.markFailed).toHaveBeenCalledWith(
      "application-id",
      expect.objectContaining({ message: "delivery failed" }),
    );
  });
});
