import { describe, expect, it, vi } from "vitest";
import {
  createApplicationRepository,
  type ApplicationStoreClient,
} from "./application-repository";

function createClient() {
  const single = vi.fn(async () => ({ data: { id: "application-id" }, error: null }));
  const insert = vi.fn(() => ({ select: () => ({ single }) }));
  const eq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ insert, update }));
  return { client: { from } as unknown as ApplicationStoreClient, from, insert, update, eq };
}

const payload = {
  applicantName: "Ján Žiak",
  formData: {
    name: "Ján Žiak",
    dateOfBirth: "2008-01-01",
    classField: "3.A",
    address1: "Školská 1",
    address2: "",
    address3: "",
    phone: "+421900000000",
    email: "jan@example.com",
    studentSituation: "Žiak so zdravotným znevýhodnením" as const,
    personalDataConsent: true as const,
  },
};

describe("application repository", () => {
  it("creates an attachment-free pending application", async () => {
    const fake = createClient();
    const repository = createApplicationRepository(fake.client);

    await expect(repository.createPending(payload)).resolves.toEqual({ id: "application-id" });

    expect(fake.from).toHaveBeenCalledWith("applications");
    expect(fake.insert).toHaveBeenCalledWith({
      applicant_name: "Ján Žiak",
      form_data: payload.formData,
      delivery_status: "pending",
    });
  });

  it("marks delivery success and failure without exposing the full error", async () => {
    const fake = createClient();
    const repository = createApplicationRepository(fake.client);

    await repository.markSent("application-id");
    await repository.markFailed("application-id", new Error("x".repeat(600)));

    expect(fake.update).toHaveBeenNthCalledWith(1, {
      delivery_status: "sent",
      delivery_error: null,
      email_sent_at: expect.any(String),
    });
    expect(fake.update).toHaveBeenNthCalledWith(2, {
      delivery_status: "failed",
      delivery_error: "x".repeat(500),
    });
    expect(fake.eq).toHaveBeenCalledWith("id", "application-id");
  });
});
