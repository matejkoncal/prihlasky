// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubmissionDependencies } from "@/server/submit-application";
import type { ApplicationRepository } from "@/server/application-repository";
import type { ApplicationAttachmentRepository } from "@/server/application-attachment-repository";
import { createSubmitRoute } from "./route";

function validPayload() {
	return {
		name: "Ján Žiak",
		dateOfBirth: "2008-01-01",
		classField: "3.A – Mechanik elektrotechnik",
		address1: "Školská 1",
		address2: "",
		address3: "",
		phone: "+421900000000",
		email: "jan@example.com",
		studentSituation: "Žiak so zdravotným znevýhodnením",
		personalDataConsent: true,
	};
}

function request(body: string) {
	return new Request("http://localhost/api/submit", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	});
}

function fakeDependencies(sendEmail = vi.fn(async () => undefined)) {
	const applications: ApplicationRepository = {
		createPending: vi.fn(async () => ({ id: "application-id" })),
		markSent: vi.fn(async () => undefined),
		markFailed: vi.fn(async () => undefined),
	};
	const attachments: ApplicationAttachmentRepository = {
		store: vi.fn(async () => undefined),
		removeAll: vi.fn(async () => undefined),
	};
	return {
		applications,
		attachments,
		now: () => new Date(2026, 6, 10),
		renderPdf: vi.fn(async () => new Uint8Array(Buffer.from("pdf"))),
		sendEmail,
	} satisfies SubmissionDependencies;
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("POST /api/submit", () => {
	it("returns 400 for malformed JSON", async () => {
		const factory = vi.fn(() => fakeDependencies());
		const response = await createSubmitRoute(factory)(request("{"));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Neplatné údaje prihlášky",
		});
		expect(factory).not.toHaveBeenCalled();
	});

	it("returns the exact validation error without creating dependencies", async () => {
		const factory = vi.fn(() => fakeDependencies());
		const response = await createSubmitRoute(factory)(request("{}"));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Vyplňte všetky povinné polia",
		});
		expect(factory).not.toHaveBeenCalled();
	});

	it("returns a generic 500 when the Preview secret is missing", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		const sendEmail = vi.fn(async () => undefined);
		const factory = vi.fn(() => {
			if (!process.env.RESEND_API_KEY) {
				throw new Error("Missing RESEND_API_KEY");
			}
			return fakeDependencies(sendEmail);
		});
		const response = await createSubmitRoute(factory)(request(JSON.stringify(validPayload())));
		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Interná chyba servera" });
		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("returns success after both messages are delivered", async () => {
		const sendEmail = vi.fn(async () => undefined);
		const response = await createSubmitRoute(() => fakeDependencies(sendEmail))(request(JSON.stringify(validPayload())));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(sendEmail).toHaveBeenCalledTimes(2);
	});

	it("returns a generic 500 when delivery fails", async () => {
		const sendEmail = vi.fn(async () => {
			throw new Error("Resend unavailable");
		});
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		const response = await createSubmitRoute(() => fakeDependencies(sendEmail))(request(JSON.stringify(validPayload())));
		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Interná chyba servera" });
		expect(consoleError).toHaveBeenCalledWith("Error processing submission:", expect.any(Error));
	});
});
