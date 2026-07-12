# Next.js and Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split Vite/Firebase/legacy-Vercel application with one equivalent Next.js App Router application and deploy it only as a Vercel Preview.

**Architecture:** Render the unchanged Material UI form from a statically eligible Next.js page and post same-origin JSON to a Node.js Route Handler. Keep validation, PDF rendering, email construction, and submission orchestration in focused server-only modules so they can be tested without invoking Resend.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript, Material UI 9.2.0, FormePDF, Resend, Vitest 4.1.10, Testing Library, Vercel Node.js runtime.

## Global Constraints

- Preserve the current form appearance, labels, current recipients, sender identity, PDF, optional attachments, and two-email submission flow.
- The two optional attachments may be PDF or DOCX and may total at most 3 MB decoded.
- Use one same-origin `POST /api/submit` Route Handler with the Node.js runtime; do not use Edge runtime, Firebase, Express, CORS, storage, or a database.
- Read `RESEND_API_KEY` only from a server-side environment variable without a `NEXT_PUBLIC_` prefix.
- Do not push, change DNS, promote to Production, or disturb the currently running production application.
- Deploy only a Vercel Preview after all local verification passes.
- Preserve unrelated untracked `.DS_Store` files.

---

### Task 1: Next.js shell and client form

**Files:**

- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/application-form.tsx`
- Create: `components/application-form.test.tsx`
- Create: `test/setup.ts`
- Create: `vitest.config.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `tsconfig.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `public/favicon.svg`
- Create: `public/logos/sos-logo.jpg`
- Create: `public/logos/erasmus-logo.jpg`
- Create: `public/logos/saaic-logo.jpg`
- Create: `public/logos/eu-co-funded-sk.png`

**Interfaces:**

- Consumes: browser `fetch('/api/submit', { method: 'POST' })` and the current form/asset behaviour from `web/src/App.tsx`.
- Produces: default `ApplicationForm` Client Component and JSON `ApplicationPayload` containing current fields plus optional `{ name: string; content: string }` attachments.

- [ ] **Step 1: Scaffold only the test runner and write failing client tests**

Create a root manifest with scripts `dev`, `build`, `lint`, and `test`, install the exact stack in the plan header, configure jsdom in `vitest.config.ts`, import `@testing-library/jest-dom/vitest` from `test/setup.ts`, and create tests that assert:

```tsx
it("keeps submission disabled until privacy consent", async () => {
  render(<ApplicationForm />);
  const submit = screen.getByRole("button", { name: "Odoslať prihlášku" });
  expect(submit).toBeDisabled();
  await userEvent.click(screen.getByLabelText(PRIVACY_LABEL));
  expect(submit).toBeEnabled();
});

it("rejects attachments larger than 3 MB in total without calling the API", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<ApplicationForm />);
  const first = new File([new Uint8Array(2 * 1024 * 1024)], "cv.pdf", { type: "application/pdf" });
  const second = new File([new Uint8Array(1024 * 1024 + 1)], "letter.pdf", { type: "application/pdf" });
  await userEvent.upload(screen.getByLabelText("Životopis / CV"), first);
  await userEvent.upload(screen.getByLabelText("Motivačný list / Motivation letter"), second);
  await fillRequiredFieldsAndSubmit();
  expect(await screen.findByRole("alert")).toHaveTextContent("Prílohy môžu mať spolu maximálne 3 MB");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("posts to the same-origin route and shows confirmation", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  render(<ApplicationForm />);
  await fillRequiredFieldsAndSubmit("jan@example.com");
  expect(fetch).toHaveBeenCalledWith("/api/submit", expect.objectContaining({ method: "POST" }));
  expect(await screen.findByText("Prihláška bola úspešne odoslaná.")).toBeInTheDocument();
  expect(screen.getByText(/jan@example.com/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the client tests and confirm RED**

Run `npm test -- components/application-form.test.tsx`. Expected: FAIL because `components/application-form.tsx` does not exist.

- [ ] **Step 3: Implement the Next.js page and form**

Move the current Material UI form into a `"use client"` component, use `/logos/...` asset URLs, replace `VITE_API_URL` with the literal same-origin `/api/submit`, expose accessible labels on hidden file inputs, and check `cv.size + motivationLetter.size <= 3 * 1024 * 1024` before conversion. Render it from `app/page.tsx`; define Slovak metadata in `app/layout.tsx`; use `next/font/google` Inter and preserve the current responsive background/layout.

- [ ] **Step 4: Run client verification and confirm GREEN**

Run `npm test -- components/application-form.test.tsx && npm run lint && npm run build`. Expected: all form tests pass, ESLint exits 0, and Next reports a successful production build.

- [ ] **Step 5: Commit the client migration**

Run `git add package.json package-lock.json app components test vitest.config.ts next.config.ts eslint.config.mjs tsconfig.json public && git commit -m "feat: migrate application form to nextjs"`.

### Task 2: Validated server domain and PDF/email generation

**Files:**

- Create: `server/application-types.ts`
- Create: `server/application-validation.ts`
- Create: `server/application-validation.test.ts`
- Create: `server/application-emails.ts`
- Create: `server/application-emails.test.ts`
- Create: `server/application-pdf.tsx`
- Create: `server/application-pdf.test.tsx`

**Interfaces:**

- Produces: `ApplicationPayload`, `ValidatedApplication`, `FileAttachment`, `STUDENT_SITUATIONS`, `validateApplication(input: unknown): ValidationResult`, `createSchoolEmail(data, pdfBase64): EmailMessage`, `createApplicantConfirmationEmail(email): EmailMessage`, and `ApplicationPdf({ data })`.
- Consumes: official logos from `public/logos`, FormePDF React primitives, and escaped values from validated application data.

- [ ] **Step 1: Write failing validation tests**

Test one complete accepted payload and separate rejection cases for a missing required string, malformed email, unsupported student situation, consent other than literal `true`, unsupported `.txt` attachment, malformed base64, and two decoded attachments whose combined size is `3 * 1024 * 1024 + 1`. Assert the stable Slovak messages used by the UI.

- [ ] **Step 2: Run validation tests and confirm RED**

Run `npm test -- server/application-validation.test.ts`. Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement types and validation**

Define the three supported situation literals, validate plain-object input without coercion, trim required strings, validate the current email pattern, allow `.pdf` and `.docx` case-insensitively, require canonical decodable base64 content, and use `Buffer.byteLength(decoded)`/decoded buffers to enforce a combined `3 * 1024 * 1024` limit. Return `{ success: true, data }` or `{ success: false, error }` rather than throwing for user input.

- [ ] **Step 4: Confirm validation GREEN**

Run `npm test -- server/application-validation.test.ts`. Expected: all validation cases pass.

- [ ] **Step 5: Write failing email and PDF tests**

Assert that the school email uses recipients `matej@koncal.sk` and `koncalova@sostar.sk`, sender-facing subject data, HTML-escaped applicant fields, the generated PDF attachment, and any supplied optional files. Assert the applicant message targets only the applicant and has no attachment. Recursively inspect `ApplicationPdf` to assert the situation, consent copy, applicant details, and a PNG data URI for the EU co-funding mark.

- [ ] **Step 6: Run email/PDF tests and confirm RED**

Run `npm test -- server/application-emails.test.ts server/application-pdf.test.tsx`. Expected: FAIL because both modules do not exist.

- [ ] **Step 7: Implement emails and PDF**

Extract a shared `escapeHtml(text: string): string`, retain the existing recipients, `prihlasky@koncal.sk` sender identity, subjects, PDF filename normalization, current email bodies, and confirmation content. Move the current FormePDF A4 template and load the four logo files as data URIs from `public/logos` using Node filesystem APIs.

- [ ] **Step 8: Confirm server domain GREEN and commit**

Run `npm test -- server && npm run lint && npm run build`. Expected: all server tests pass, lint exits 0, and the Next build succeeds. Then run `git add server next.config.ts && git commit -m "feat: migrate submission domain to nextjs"`.

### Task 3: Route Handler and submission orchestration

**Files:**

- Create: `server/submit-application.ts`
- Create: `server/submit-application.test.ts`
- Create: `app/api/submit/route.ts`
- Create: `app/api/submit/route.test.ts`

**Interfaces:**

- Produces: `submitApplication(input: unknown, dependencies: SubmissionDependencies): Promise<SubmissionResult>` and `POST(request: Request): Promise<Response>`.
- Consumes: `validateApplication`, `ApplicationPdf`, `renderDocument`, `createSchoolEmail`, `createApplicantConfirmationEmail`, `Resend`, and `process.env.RESEND_API_KEY`.

- [ ] **Step 1: Write failing orchestration and route tests**

Use injected `renderPdf`, `sendEmail`, and `now` dependencies to prove that invalid input triggers neither rendering nor email, while valid input renders once, sends the school email before the applicant confirmation, and returns success only after both sends. For the route, test malformed JSON returns 400, validation errors return 400 with the exact message, missing `RESEND_API_KEY` returns a generic 500 without calling Resend, and valid JSON returns 200 with `{ success: true }` using a module-level mocked delivery adapter.

- [ ] **Step 2: Run route tests and confirm RED**

Run `npm test -- server/submit-application.test.ts app/api/submit/route.test.ts`. Expected: FAIL because orchestration and route modules do not exist.

- [ ] **Step 3: Implement orchestration and the Node Route Handler**

Export `runtime = "nodejs"` and `maxDuration = 60`. Parse `request.json()` inside a guarded block. Construct production dependencies with FormePDF and Resend only after confirming `RESEND_API_KEY` exists. Map validation failures to 400, success to 200, and unexpected/rendering/delivery failures to `{ error: "Interná chyba servera" }` with status 500 while logging only the exception and never request contents or secrets.

- [ ] **Step 4: Confirm route GREEN and commit**

Run `npm test -- server/submit-application.test.ts app/api/submit/route.test.ts && npm test && npm run lint && npm run build`. Expected: all tests pass, lint exits 0, and the production build exits 0. Commit with `git add app/api server/submit-application.ts server/submit-application.test.ts && git commit -m "feat: add nextjs submission route"`.

### Task 4: Remove legacy applications, verify, and deploy Preview

**Files:**

- Delete: `web/`
- Delete: `functions/`
- Delete: `api/`
- Delete: `firebase.json`
- Delete: `vercel.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `docs/superpowers/specs/2026-07-10-nextjs-vercel-migration-design.md`
- Modify: `docs/superpowers/plans/2026-07-10-nextjs-vercel-migration.md`

**Interfaces:**

- Produces: one root Next.js application, a documented `RESEND_API_KEY` requirement, and a Vercel Preview URL.
- Consumes: all green root tests and the authenticated Vercel CLI session.

- [ ] **Step 1: Remove legacy trees and document environment configuration**

Delete only the listed tracked legacy files. Add `.next/`, `node_modules/`, `.env*`, `!.env.example`, `.vercel/`, and `.DS_Store` to `.gitignore`. Create `.env.example` containing only `RESEND_API_KEY=` with no real value.

- [ ] **Step 2: Run fresh repository-wide verification**

Run `npm test && npm run lint && npm run build && git diff --check`. Expected: zero failed tests, lint exit 0, successful Next production build, and no whitespace errors. Inspect `git status --short` and confirm no `.DS_Store`, `.env`, `.vercel`, or secret is staged.

- [ ] **Step 3: Inspect the application in a browser**

Run `npm run dev`, open the local page at desktop and narrow mobile widths, and verify the complete form, logos, attachment selectors, consent-gated submit button, error presentation, and responsive layout. Exercise an oversized attachment without making an API call.

- [ ] **Step 4: Commit the cleanup**

Run `git add -A && git restore --staged .DS_Store functions/.DS_Store 2>/dev/null || true`, inspect `git diff --cached --stat` and `git diff --cached --check`, then commit with `git commit -m "chore: remove legacy vite and firebase apps"`. Never push the branch.

- [ ] **Step 5: Configure the Preview secret without exposing it**

First check whether `RESEND_API_KEY` already exists for Preview using Vercel environment metadata or whether an authenticated Firebase CLI can confirm a retrievable secret without printing it. If no safely retrievable value exists, ask the user to add `RESEND_API_KEY` in Vercel Dashboard → Project → Settings → Environment Variables, select Preview, then confirm. Do not paste the key into chat or pass it as a visible shell argument.

- [ ] **Step 6: Deploy only to Vercel Preview**

Run `vercel` without `--prod`, verify the CLI identifies the deployment as Preview, and capture its generated URL. Do not run `vercel --prod`, modify aliases/domains, or update DNS.

- [ ] **Step 7: Verify the Preview deployment**

Open the Preview URL, verify HTTP rendering and responsive UI, then submit a controlled test only after the Preview secret is present. Confirm the endpoint returns success and the page displays the confirmation screen. Report the Preview URL, branch name, local commit list, exact verification results, and that production/DNS/Git remote were untouched.
