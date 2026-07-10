import { expect, it } from "vitest";
import { createApplicantConfirmationEmail } from "../src/applicant-confirmation";

it("creates an attachment-free applicant confirmation", () => {
  expect(createApplicantConfirmationEmail("ziak@example.com")).toEqual({
    to: "ziak@example.com",
    subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
    html: expect.stringContaining(
      "Vaša prihláška pre Erasmus+ bola úspešne odoslaná.",
    ),
  });
});
