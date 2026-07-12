# Evaluation Export, Attachments, and Appbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store new application attachments privately, let admins download them and export completed five-category evaluations as individual PDFs, and show the school logo plus current user in the staff appbar.

**Architecture:** A Supabase migration adds a private Storage bucket, attachment metadata, and admin-only RPC data. Submission orchestration writes attachments through a focused repository with cleanup on failure. Authenticated Next.js route handlers stream attachments and render evaluation PDFs on demand, while existing admin cards and the shared staff layout expose the new actions.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase Postgres/Auth/Storage, `@formepdf/core`, `@formepdf/react`, Material UI, Vitest, Poppler.

## Global Constraints

- Only active admins may download application files or evaluation PDFs.
- Existing applications remain valid without stored attachments.
- A PDF export requires exactly five completed evaluations.
- The evaluation threshold is 35 out of 50 points.
- Attachments remain in a private Supabase bucket and internal paths never reach the browser.
- The public application form layout must not change.
- Preserve PDF and DOCX support with a combined 3 MB attachment limit.

---

### Task 1: Supabase attachment schema and admin export data

**Files:**

- Create: `supabase/migrations/20260711210000_application_attachments_and_exports.sql`
- Modify: `supabase/tests/application_review_system.test.sql`
- Create: `server/application-attachments-migration.test.ts`

**Interfaces:**

- Produces: private bucket `application-attachments`, table `public.application_attachments`, extended `public.admin_list_applications()`, RPC `public.admin_get_application_export(uuid)`.
- `admin_list_applications()` returns `class_name`, `field_of_study`, and `attachments` alongside current columns.
- `admin_get_application_export(uuid)` returns one JSON object with applicant fields and ordered completed categories, and raises `P0001` unless the count is exactly five.

- [ ] Write a failing migration source test asserting the bucket is private, `(application_id, kind)` is unique, RLS is enabled, the admin list exposes attachments, and the export RPC requires five completed rows.
- [ ] Run `npx vitest run server/application-attachments-migration.test.ts` and verify it fails because the migration is absent.
- [ ] Add SQL that creates the metadata table with `kind in ('cv','motivation_letter')`, inserts the private bucket idempotently, replaces `admin_list_applications()`, and creates/grants `admin_get_application_export(uuid)` only to authenticated users while checking `require_admin()`.
- [ ] Extend pgTAP assertions for the table, RLS, constraints, bucket privacy, and function presence.
- [ ] Run the migration test and `npm test` and verify both pass.
- [ ] Commit with `feat: add private application attachments schema`.

### Task 2: Structured class data and attachment persistence

**Files:**

- Modify: `components/application-form.tsx`
- Modify: `server/application-types.ts`
- Modify: `server/application-validation.ts`
- Modify: `server/application-validation.test.ts`
- Modify: `server/application-types.test.ts`
- Create: `server/application-attachment-repository.ts`
- Create: `server/application-attachment-repository.test.ts`
- Modify: `server/submit-application.ts`
- Modify: `server/submit-application.test.ts`
- Modify: `app/api/submit/route.ts`
- Modify: `app/api/submit/route.test.ts`

**Interfaces:**

- `ValidatedApplication` gains `className: string` and `fieldOfStudy: string` while retaining `classField`.
- `ApplicationAttachmentRepository.store(applicationId, data)` stores present `cv` and `motivationLetter`; `removeAll(applicationId)` removes stored objects and metadata.
- Storage paths use `${applicationId}/${kind}-${crypto.randomUUID()}.${extension}` and derive MIME from `.pdf` or `.docx`.
- `SubmissionDependencies` gains `attachments: ApplicationAttachmentRepository`.

- [ ] Add failing validation and form payload tests proving separate `className` and `fieldOfStudy` are submitted and old `classField` payloads still normalize by splitting on `–`.
- [ ] Run the targeted validation/form tests and verify the new assertions fail.
- [ ] Implement normalized structured class fields without changing the rendered public form.
- [ ] Add failing repository tests for two uploads, metadata inserts, safe random paths, and `removeAll` cleanup.
- [ ] Run the repository test and verify it fails because the repository is absent.
- [ ] Implement the focused Storage/metadata repository using decoded `Uint8Array` data and explicit content types.
- [ ] Add failing orchestration tests showing attachment storage happens after pending creation and cleanup happens when upload, PDF render, email, or final status update fails.
- [ ] Run `npx vitest run server/submit-application.test.ts app/api/submit/route.test.ts` and verify the new assertions fail.
- [ ] Inject the repository into production dependencies, store before rendering/e-mail, and remove stored attachments in the failure path before marking failed.
- [ ] Run all Task 2 tests and verify they pass.
- [ ] Commit with `feat: persist application attachments privately`.

### Task 3: Staff identity in the shared appbar

**Files:**

- Modify: `server/staff-auth.ts`
- Modify: `server/staff-auth.test.ts`
- Modify: `components/staff-layout.tsx`
- Modify: `components/staff-layout.test.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/hodnotitelia/page.tsx`
- Modify: `app/hodnotenie/page.tsx`
- Modify: affected page tests under `app/admin`, `app/admin/hodnotitelia`, and `app/hodnotenie`.

**Interfaces:**

- `VerifiedStaffUser` becomes `{ id, role, displayName, email }`.
- `StaffLayout` accepts `{ user: VerifiedStaffUser; children: ReactNode }`.

- [ ] Add failing auth tests for `display_name` and email fallback data and layout tests for the SOŠTaR logo, current user name, role, navigation, and logout.
- [ ] Run the targeted staff tests and verify they fail against the current interfaces.
- [ ] Extend the profile select to `id, role, is_active, display_name, email`, update all pages to pass `user`, and build a responsive sticky appbar with `/logos/sos-logo.jpg` through `next/image`.
- [ ] Run targeted tests and verify they pass.
- [ ] Commit with `feat: show staff identity in appbar`.

### Task 4: Admin attachment download route

**Files:**

- Create: `app/admin/prihlasky/[applicationId]/prilohy/[kind]/route.ts`
- Create: `app/admin/prihlasky/[applicationId]/prilohy/[kind]/route.test.ts`
- Create: `server/admin-download-auth.ts`
- Create: `server/admin-download-auth.test.ts`

**Interfaces:**

- `requireActiveAdmin()` returns the verified admin or a controlled 401/403 response.
- `GET` accepts UUID `applicationId` and `kind` equal to `cv` or `motivation_letter`.
- Success returns stored bytes with authoritative MIME, `Content-Length`, `X-Content-Type-Options: nosniff`, and RFC 5987-safe `Content-Disposition`.

- [ ] Add failing tests for anonymous, reviewer, invalid parameters, missing metadata/object, and successful PDF/DOCX downloads.
- [ ] Run the route/auth tests and verify imports or assertions fail.
- [ ] Implement reusable active-admin authorization and the route with service-role metadata/object access only after authorization.
- [ ] Run targeted tests and verify they pass.
- [ ] Commit with `feat: add protected attachment downloads`.

### Task 5: Evaluation PDF and protected export route

**Files:**

- Create: `server/evaluation-export-types.ts`
- Create: `server/evaluation-pdf.tsx`
- Create: `server/evaluation-pdf.test.tsx`
- Create: `app/admin/prihlasky/[applicationId]/hodnotenie.pdf/route.ts`
- Create: `app/admin/prihlasky/[applicationId]/hodnotenie.pdf/route.test.ts`

**Interfaces:**

- `EvaluationExportData` contains `applicantName`, `className`, `fieldOfStudy`, and five ordered `{ categoryName, reviewerName, score, comment }` rows.
- `EvaluationPdf({ data })` returns a FormePDF document.
- Export `GET` invokes `admin_get_application_export`, renders with `renderDocument`, and streams `application/pdf`; incomplete RPC errors map to 409.

- [ ] Add failing PDF component tests for student details, all category fields, reviewer names, total `/50`, and both sides of the 35-point criterion.
- [ ] Add failing route tests for non-admin, invalid UUID, missing application, incomplete evaluation, and successful PDF headers.
- [ ] Run targeted tests and verify they fail.
- [ ] Implement the typed document with school/Erasmus logos, ordered category sections, wrapping comments, total, criterion, footer, and page numbering.
- [ ] Implement the protected route and controlled status mapping.
- [ ] Run targeted tests and verify they pass.
- [ ] Generate `tmp/pdfs/evaluation-sample.pdf`, render it with `pdftoppm` into `tmp/pdfs/evaluation-sample-*.png`, inspect every page, and adjust spacing until no clipping or overlap remains; delete temporary artifacts after approval.
- [ ] Commit with `feat: export completed evaluations as pdf`.

### Task 6: Admin card document and export controls

**Files:**

- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`
- Modify: `app/admin/page.tsx` only if RPC typing changes require it.

**Interfaces:**

- `AdminApplication` gains `class_name`, `field_of_study`, and `attachments: Array<{ kind, original_filename }>`.
- Attachment links point to the protected routes and use `download` semantics.
- Evaluation export link appears only when `getEvaluationSummary(...).isComplete` and the category count is five.

- [ ] Add failing UI tests for CV/motivation links, missing-file copy, export hidden at 4/5, and export shown at 5/5.
- [ ] Run `npx vitest run components/admin-dashboard.test.tsx` and verify the assertions fail.
- [ ] Add a compact `Dokumenty` section to expanded details and an export action to the completed card header without disturbing assignment controls.
- [ ] Run the dashboard and staff layout tests and verify they pass.
- [ ] Commit with `feat: expose admin application downloads`.

### Task 7: Remote migration, full verification, and production deployment

**Files:**

- No new source files expected.

**Interfaces:**

- Remote Supabase project `edbccqxhyinlqtpwxtvb` receives the committed migration.
- Production alias remains `https://prihlasky.koncal.sk`.

- [ ] Run `npx supabase db push --linked` and verify the migration applies without drift.
- [ ] Query remote metadata without printing secrets and verify bucket privacy, table RLS, functions, and grants.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; require zero failures.
- [ ] Inspect `git status` and commit any final verification-only corrections.
- [ ] Push `main` and deploy with the established `npx vercel --prod --yes` environment bindings.
- [ ] Wait for Vercel status `Ready` and confirm the production aliases.
- [ ] Create a temporary submitted application and admin session, verify both protected attachment downloads, verify incomplete export returns 409, complete five evaluations, download a non-empty PDF containing the expected text, and remove all temporary database/storage/auth data in `finally` cleanup.
- [ ] Check recent Vercel error logs and confirm `origin/main...main` reports `0 0` with a clean worktree.
