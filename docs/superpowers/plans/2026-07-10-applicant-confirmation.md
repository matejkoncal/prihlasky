# Applicant Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email an attachment-free confirmation to each applicant and replace the submitted form with a success screen.

**Architecture:** Extract the applicant confirmation's subject and payload to a pure server helper that can be tested without contacting Resend. The existing Firebase handler sends its administrator email first, then uses this helper for the submitted email address. The React app's existing `success` state selects a dedicated success view instead of the form.

**Tech Stack:** TypeScript 6, Vitest, Firebase Functions/Express, Resend, React 19, Material UI 9, Testing Library

## Global Constraints

- Confirmation subject is exactly `Vaša prihláška Erasmus+ bola úspešne odoslaná`.
- Applicant confirmation has no PDF or other attachments and repeats no application details.
- The API succeeds only after administrator and applicant email sends succeed.
- Success screen text is exactly `Prihláška bola úspešne odoslaná.` and the form is not rendered.

---

### Task 1: Applicant confirmation email

**Files:**
- Create: `functions/src/applicant-confirmation.ts`
- Create: `functions/test/applicant-confirmation.test.ts`
- Modify: `functions/src/index.tsx`

**Interfaces:**
- Produces: `createApplicantConfirmationEmail(email: string): { to: string; subject: string; html: string }`.
- Consumes: the Firebase handler passes `data.email` to the helper after its administrator message succeeds.

- [ ] **Step 1: Write the failing helper test**

Create `functions/test/applicant-confirmation.test.ts`:

```ts
import { expect, it } from "vitest";
import { createApplicantConfirmationEmail } from "../src/applicant-confirmation";

it("creates an attachment-free applicant confirmation", () => {
  expect(createApplicantConfirmationEmail("ziak@example.com")).toEqual({
    to: "ziak@example.com",
    subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
    html: expect.stringContaining("Vaša prihláška pre Erasmus+ bola úspešne odoslaná."),
  });
});
```

- [ ] **Step 2: Verify RED**

Run `cd functions && npm test -- applicant-confirmation.test.ts`.

Expected: FAIL because `applicant-confirmation.ts` is absent.

- [ ] **Step 3: Implement the helper and second Resend send**

Create `functions/src/applicant-confirmation.ts`:

```ts
export function createApplicantConfirmationEmail(email: string) {
  return {
    to: email,
    subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
    html: "<h2>Prihláška Erasmus+</h2><p>Vaša prihláška pre Erasmus+ bola úspešne odoslaná.</p>",
  };
}
```

In `functions/src/index.tsx`, import the helper and call `resend.emails.send` a second time with the existing `from` sender and the helper's `to`, `subject`, and `html`. Do not pass `attachments` in this second call.

- [ ] **Step 4: Verify GREEN and commit**

Run `cd functions && npm test -- applicant-confirmation.test.ts && npm run build`; expect exit 0. Commit Task 1 files with message `feat: email applicant confirmation`.

---

### Task 2: Success screen

**Files:**
- Modify: `web/src/App.test.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: existing `success: boolean` set after the API returns HTTP 200.
- Produces: a page body showing the success confirmation and no submit button after success.

- [ ] **Step 1: Write the failing successful-submission test**

Add a test that stubs `fetch` with `{ ok: true }`, fills every required field, chooses an `odbor`, a student-situation radio, and consent, submits the form, then waits for `Prihláška bola úspešne odoslaná.` and asserts `queryByRole("button", { name: "Odoslať prihlášku" })` is `null`.

- [ ] **Step 2: Verify RED**

Run `cd web && npm test -- App.test.tsx`.

Expected: FAIL because the current UI keeps rendering the form after success.

- [ ] **Step 3: Implement the dedicated success view**

In `web/src/App.tsx`, use the existing `success` state to conditionally render either the form or a centred `Alert`/`Paper` containing exactly `Prihláška bola úspešne odoslaná.` and a sentence that confirmation was sent to the submitted email address. Capture that email before resetting `form` so it remains visible in the success view.

- [ ] **Step 4: Verify GREEN and commit**

Run `cd web && npm test -- App.test.tsx && npm run lint && npm run build`; expect exit 0. Commit Task 2 files with message `feat: show application success screen`.

---

### Task 3: Final verification and deployment

- [ ] **Step 1: Run verification**

```bash
cd functions && npm test && npm run build
cd ../web && npm test && npm run lint && npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Commit scope and push**

Run `git diff --check`, confirm only approved files are staged, then run `git push origin main`.
