# Student Situation and Privacy Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required student-situation choice and explicit privacy consent to the Erasmus+ application, validate both server-side, and include both in the PDF and notification email.

**Architecture:** Keep form state and presentation in the existing React application, while extracting the accepted situation values and server validation into a focused Firebase-functions module. Pass both new fields through the existing JSON payload, reject invalid API calls, and render accepted values in the current PDF template and email.

**Tech Stack:** React 19, TypeScript 6, Material UI 9, Vitest, Firebase Functions/Express, `@formepdf/react`, Resend

## Global Constraints

- Use the exact approved Slovak question, three situation options, and consent wording from the design spec.
- Disable submit until consent is checked and while submission is in progress.
- Independently validate the situation allow-list and boolean consent in the Firebase endpoint.
- Preserve attachments, recipients, unrelated UI, and untracked `.DS_Store` files.

---

### Task 1: Firebase validation rules

**Files:**
- Create: `functions/test/application-validation.test.ts`
- Create: `functions/src/application-validation.ts`
- Modify: `functions/package.json`
- Modify: `functions/package-lock.json`
- Modify: `functions/src/index.tsx`

**Interfaces:**
- Produces: `STUDENT_SITUATIONS`, `StudentSituation`, and `validateApplicationExtras(data): string | null`.
- Consumes: The Express handler validates `req.body` before email validation.

- [ ] **Step 1: Install and configure the test runner**

Run `cd functions && npm install --save-dev vitest`, then add `"test": "vitest run"` to `functions/package.json`.

- [ ] **Step 2: Write the failing validation tests**

Create `functions/test/application-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STUDENT_SITUATIONS, validateApplicationExtras } from "../src/application-validation";

describe("validateApplicationExtras", () => {
  it.each(STUDENT_SITUATIONS)("accepts supported situation %s", (studentSituation) => {
    expect(validateApplicationExtras({ studentSituation, personalDataConsent: true })).toBeNull();
  });

  it("rejects missing and unsupported situations", () => {
    expect(validateApplicationExtras({ personalDataConsent: true })).toBe(
      "Vyberte jednu z uvedených možností",
    );
    expect(validateApplicationExtras({
      studentSituation: "Iná skupina",
      personalDataConsent: true,
    })).toBe("Vyberte jednu z uvedených možností");
  });

  it("requires explicit boolean consent", () => {
    expect(validateApplicationExtras({
      studentSituation: STUDENT_SITUATIONS[0],
      personalDataConsent: "true",
    })).toBe(
      "Na odoslanie prihlášky je potrebný súhlas so spracovaním osobných údajov",
    );
  });
});
```

- [ ] **Step 3: Verify RED**

Run `cd functions && npm test -- application-validation.test.ts`.

Expected: FAIL because `application-validation.ts` is absent.

- [ ] **Step 4: Add the minimal implementation**

Create `functions/src/application-validation.ts`:

```ts
export const STUDENT_SITUATIONS = [
  "Žiak so zdravotným znevýhodnením",
  "Žiak zo sociálne znevýhodneného prostredia",
  "Nepatrím do žiadnej z uvedených skupín",
] as const;

export type StudentSituation = (typeof STUDENT_SITUATIONS)[number];

export function validateApplicationExtras(data: {
  studentSituation?: unknown;
  personalDataConsent?: unknown;
}): string | null {
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
```

Extend the handler's `FormData` with `studentSituation: StudentSituation` and `personalDataConsent: true`, then return HTTP 400 when `validateApplicationExtras(data)` returns an error.

- [ ] **Step 5: Verify GREEN and commit**

Run `cd functions && npm test -- application-validation.test.ts`; expect all validation tests to pass. Commit only Task 1 files with message `feat: validate application situation and consent`.

---

### Task 2: Required form controls and payload

**Files:**
- Create: `web/src/App.test.tsx`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Produces: payload fields `studentSituation: string` and `personalDataConsent: boolean`.
- Consumes: the existing generic form state and `/api/submit` request.

- [ ] **Step 1: Install and configure UI tests**

Run `cd web && npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom`, then add `"test": "vitest run --environment jsdom"` to `web/package.json`.

- [ ] **Step 2: Write the failing UI test**

Create `web/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "./App";

it("shows all situations and enables submit only after consent", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByLabelText("Žiak so zdravotným znevýhodnením")).toBeTruthy();
  expect(screen.getByLabelText("Žiak zo sociálne znevýhodneného prostredia")).toBeTruthy();
  expect(screen.getByLabelText("Nepatrím do žiadnej z uvedených skupín")).toBeTruthy();
  const submit = screen.getByRole("button", { name: "Odoslať prihlášku" }) as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  await user.click(screen.getByLabelText(
    "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.",
  ));
  expect(submit.disabled).toBe(false);
});
```

- [ ] **Step 3: Verify RED**

Run `cd web && npm test -- App.test.tsx`.

Expected: FAIL because the radios and checkbox are absent.

- [ ] **Step 4: Implement form state and controls**

Import the MUI checkbox/radio form components. Add these initialized state fields:

```ts
studentSituation: "",
personalDataConsent: false,
```

Make `handleChange` use `checked` for checkbox inputs. Add a required `RadioGroup` with the exact three options and a required consent `Checkbox`. Set submit to:

```tsx
disabled={submitting || !form.personalDataConsent}
```

The existing object spread automatically includes both values in the payload and resets both after success.

- [ ] **Step 5: Verify GREEN, lint, build, and commit**

Run `cd web && npm test -- App.test.tsx && npm run lint && npm run build`; expect exit 0. Commit Task 2 files with message `feat: require student situation and privacy consent`.

---

### Task 3: PDF and email output

**Files:**
- Create: `functions/test/pdf-template.test.tsx`
- Modify: `functions/src/pdf-template.tsx`
- Modify: `functions/src/index.tsx`

**Interfaces:**
- Consumes: the validated situation and consent fields.
- Produces: PDF text with the selected situation, consent wording, and `Súhlas udelený: Áno`; email HTML with situation and consent confirmation.

- [ ] **Step 1: Write the failing PDF test**

Create `functions/test/pdf-template.test.tsx`:

```tsx
import { isValidElement, type ReactNode } from "react";
import { expect, it } from "vitest";
import { ApplicationPdf } from "../src/pdf-template";

function collectText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectText(node.props.children);
  }
  return "";
}

it("includes student situation and privacy consent", () => {
  const document = ApplicationPdf({
    data: {
      name: "Ján Žiak",
      dateOfBirth: "2008-01-01",
      classField: "3.A – Mechanik elektrotechnik",
      address1: "Školská 1",
      address2: "821 01 Bratislava",
      address3: "Slovensko",
      phone: "+421900000000",
      email: "jan@example.com",
      date: "10.7.2026",
      studentSituation: "Žiak so zdravotným znevýhodnením",
      personalDataConsent: true,
    },
  });
  const text = collectText(document);
  expect(text).toContain("Žiak so zdravotným znevýhodnením");
  expect(text).toContain(
    "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.",
  );
  expect(text).toContain("Súhlas udelený: Áno");
});
```

- [ ] **Step 2: Verify RED**

Run `cd functions && npm test -- pdf-template.test.tsx`.

Expected: FAIL because the current PDF omits those strings.

- [ ] **Step 3: Add PDF and email output**

Extend `ApplicationData` with `studentSituation` and `personalDataConsent`. Add a labelled situation row and compact consent block using the exact approved wording plus `Súhlas udelený: Áno`. Keep the document on one A4 page. Add escaped email rows for `Situácia žiaka` and `Súhlas so spracovaním osobných údajov: Áno`.

- [ ] **Step 4: Verify GREEN and commit**

Run `cd functions && npm test -- pdf-template.test.tsx && npm test && npm run build`; expect exit 0. Commit Task 3 files with message `feat: include application extras in PDF and email`.

---

### Task 4: Official EU co-funding mark

**Files:**
- Create: `web/src/assets/logos/eu-co-funded-sk.png`
- Create: `functions/src/assets/eu-co-funded-sk.png`
- Modify: `web/src/App.test.tsx`
- Modify: `web/src/App.tsx`
- Modify: `functions/test/pdf-template.test.tsx`
- Modify: `functions/src/pdf-template.tsx`

**Interfaces:**
- Consumes: official archive `https://ec.europa.eu/regional_policy/sources/information-sources/logo-download-center/co-funded_sk.zip` and member `co-funded_SK/horizontal/RGB/PNG/SK_Co-fundedbytheEU_RGB_POS.png`.
- Produces: accessible web image with alt text `Spolufinancované Európskou úniou` and a centred PNG data URI in the PDF header.

- [ ] **Step 1: Extend tests and verify RED**

In `web/src/App.test.tsx`, add:

```ts
expect(
  screen.getByRole("img", { name: "Spolufinancované Európskou úniou" }),
).toBeTruthy();
```

In `functions/test/pdf-template.test.tsx`, recursively collect every React element's `src` prop and assert that one starts with `data:image/png;base64,`. Run the focused web and PDF tests; expect both to fail because the co-funding mark is absent.

- [ ] **Step 2: Extract the official positive RGB PNG**

Download `co-funded_sk.zip`, extract only `SK_Co-fundedbytheEU_RGB_POS.png`, and copy the unchanged binary to both exact asset paths above. Verify both copies have identical SHA-256 hashes.

- [ ] **Step 3: Add the web mark**

Import `eu-co-funded-sk.png` in `web/src/App.tsx` and add this centred image directly below the existing Erasmus+/SAAIC logo row:

```tsx
<Box
  component="img"
  src={euCoFundedLogo}
  alt="Spolufinancované Európskou úniou"
  sx={{ width: 220, maxWidth: "75%", mx: "auto", mb: 2, display: "block" }}
/>
```

- [ ] **Step 4: Add the PDF mark**

Update the PDF image loader to derive `image/png` for `.png` and retain `image/jpeg` for `.jpg`. Load `eu-co-funded-sk.png` and render it in a centred row below the existing three-logo row with width 170 and proportional height. Reduce adjacent vertical spacing only as needed to preserve one A4 page.

- [ ] **Step 5: Verify GREEN and commit**

Run both focused tests, all web/functions tests, web lint, and both builds. Expect exit 0. Commit the official assets, tests, and UI/PDF changes with message `feat: add official EU co-funding mark`.

---

### Task 5: Final verification and deployment push

**Files:**
- Verify: all committed feature, dependency, test, spec, and plan files.

**Interfaces:**
- Produces: verified commits pushed to `origin/main`.

- [ ] **Step 1: Run the complete verification suite**

Run:

```bash
cd web && npm test && npm run lint && npm run build
cd ../functions && npm test && npm run build
cd .. && git diff --check origin/main..HEAD
```

Expected: every command exits 0 with no failures or whitespace errors.

- [ ] **Step 2: Review scope**

Run `git status --short`, `git diff --stat origin/main..HEAD`, and inspect the full source diff. Confirm that `.DS_Store` remains untracked and no unrelated changes are staged or committed.

- [ ] **Step 3: Push**

Run `git push origin main` and confirm that `origin/main` advances. A successful push triggers the deployment configured outside this repository, as expected by the project owner.
