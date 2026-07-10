import { describe, expect, it } from "vitest";
import {
  STUDENT_SITUATIONS,
  validateApplicationExtras,
} from "../src/application-validation";

describe("validateApplicationExtras", () => {
  it.each(STUDENT_SITUATIONS)(
    "accepts supported situation %s",
    (studentSituation) => {
      expect(
        validateApplicationExtras({
          studentSituation,
          personalDataConsent: true,
        }),
      ).toBeNull();
    },
  );

  it("rejects missing and unsupported situations", () => {
    expect(validateApplicationExtras({ personalDataConsent: true })).toBe(
      "Vyberte jednu z uvedených možností",
    );
    expect(
      validateApplicationExtras({
        studentSituation: "Iná skupina",
        personalDataConsent: true,
      }),
    ).toBe("Vyberte jednu z uvedených možností");
  });

  it("requires explicit boolean consent", () => {
    expect(
      validateApplicationExtras({
        studentSituation: STUDENT_SITUATIONS[0],
        personalDataConsent: "true",
      }),
    ).toBe(
      "Na odoslanie prihlášky je potrebný súhlas so spracovaním osobných údajov",
    );
  });
});
