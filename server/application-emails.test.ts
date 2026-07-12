import { describe, expect, it } from "vitest";
import type { ValidatedApplication } from "./application-types";
import { RECIPIENT_EMAILS, createApplicantConfirmationEmail, createSchoolEmail } from "./application-emails";

function application(): ValidatedApplication {
	return {
		name: "Ján <Žiak>",
		dateOfBirth: "2008-01-01",
		classField: "3.A – Mechanik elektrotechnik",
		address1: "Školská 1",
		address2: "821 01 Bratislava",
		address3: "Slovensko",
		phone: "+421900000000",
		email: "jan@example.com",
		studentSituation: "Žiak so zdravotným znevýhodnením",
		personalDataConsent: true,
		cv: { name: "cv.pdf", content: "Y3Y=" },
		motivationLetter: { name: "letter.docx", content: "bGV0dGVy" },
	};
}

describe("application emails", () => {
	it("builds the school message with escaped data and all attachments", () => {
		const message = createSchoolEmail(application(), "cGRm");
		expect(message.to).toEqual(RECIPIENT_EMAILS);
		expect(message.subject).toBe("Nová prihláška Erasmus+ - Ján <Žiak>");
		expect(message.html).toContain("Ján &lt;Žiak&gt;");
		expect(message.html).not.toContain("Ján <Žiak>");
		expect(message.attachments).toEqual([
			{
				filename: "prihlaska-erasmus-ján-žiak.pdf",
				content: "cGRm",
			},
			{ filename: "cv.pdf", content: "Y3Y=" },
			{ filename: "letter.docx", content: "bGV0dGVy" },
		]);
	});

	it("builds an attachment-free applicant confirmation", () => {
		expect(createApplicantConfirmationEmail("ziak@example.com")).toEqual({
			to: "ziak@example.com",
			subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
			html: expect.stringContaining("Vaša prihláška pre Erasmus+ bola úspešne odoslaná."),
		});
	});

	it("removes line breaks from the email subject", () => {
		const data = { ...application(), name: "Ján\r\nBcc: attacker@example.com" };
		expect(createSchoolEmail(data, "cGRm").subject).toBe("Nová prihláška Erasmus+ - Ján Bcc: attacker@example.com");
	});
});
