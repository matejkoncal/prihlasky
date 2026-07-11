# Prefetch-Safe Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure email scanners cannot consume a Supabase invite token before the invited user explicitly accepts the invitation.

**Architecture:** Email links land on a non-consuming GET page. A user-initiated HTML form POST is the only new-email path that verifies the token, writes the Supabase session cookie, and redirects to password setup. Hosted template styling remains unchanged; only the action redirect destination and allowlist change.

**Tech Stack:** Next.js 16 App Router, React 19, MUI 9, Supabase Auth/SSR, Vitest, Testing Library, Vercel

## Global Constraints

- A GET request to the email destination must never call `verifyOtp`.
- Invite verification uses fixed type `invite` and occurs only after explicit POST.
- Successful POST redirects with status 303 to `/set-password`.
- Invalid or used tokens redirect to `/login?error=invite`.
- Existing branded email HTML, SMTP configuration, and unrelated Auth settings remain unchanged.

---

### Task 1: Safe invitation acceptance page

**Files:**
- Create: `app/accept-invite/page.tsx`
- Create: `app/accept-invite/page.test.tsx`

**Interfaces:**
- Consumes: async `searchParams` containing optional `token_hash`.
- Produces: a form with `method="post"`, `action="/auth/confirm"`, hidden `token_hash`, and submit label `Prijať pozvánku a nastaviť heslo`.

- [ ] **Step 1: Write failing page tests**

Require a valid token hash to render the Erasmus+ acceptance copy and POST form with the unchanged token. Require a missing token to redirect to `/login?error=invite`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- app/accept-invite/page.test.tsx`

Expected: FAIL because the acceptance page does not exist.

- [ ] **Step 3: Implement the GET-safe page**

Create a Server Component that only validates token presence and renders MUI presentation plus a native POST form. It must not create a Supabase client or import Auth code.

- [ ] **Step 4: Verify GREEN**

Run the Task 1 test command again. Expected: all page tests PASS.

### Task 2: POST confirmation and invitation redirect

**Files:**
- Modify: `app/auth/confirm/route.ts`
- Modify: `app/auth/confirm/route.test.ts`
- Modify: `app/admin/hodnotitelia/actions.ts`
- Create: `app/admin/hodnotitelia/actions.test.ts`

**Interfaces:**
- Adds `POST(request: NextRequest)` reading `token_hash` from `request.formData()`.
- Reuses `confirmInvite` with a selectable success redirect status; POST uses 303.
- `inviteReviewer` passes `${origin}/accept-invite` as `redirectTo`.

- [ ] **Step 1: Write failing POST route tests**

Submit FormData with a valid token and require `verifyOtp({ token_hash, type: "invite" })`, status 303, and `/set-password`. Cover missing and invalid token redirects to login.

- [ ] **Step 2: Write failing invitation action test**

Mock the admin Auth client and require `inviteUserByEmail` to receive `redirectTo: "https://prihlasky.koncal.sk/accept-invite"` with display-name metadata.

- [ ] **Step 3: Verify RED**

Run: `npm test -- app/auth/confirm/route.test.ts app/admin/hodnotitelia/actions.test.ts`

Expected: FAIL because POST is absent and the action still targets `/auth/confirm`.

- [ ] **Step 4: Implement POST and the safe redirect**

Add POST without removing existing GET. Make `confirmInvite` accept an optional redirect status, preserving 307 for GET and using 303 for POST. Change only the invitation action’s redirect pathname to `/accept-invite`.

- [ ] **Step 5: Verify GREEN**

Run the Task 2 test command again. Expected: all route and action tests PASS.

### Task 3: Hosted Auth configuration

**Files:**
- Modify: none

- [ ] **Step 1: Patch only the redirect allowlist**

Through the Supabase Management API, append `https://prihlasky.koncal.sk/accept-invite` while retaining `https://prihlasky.koncal.sk/auth/confirm`.

- [ ] **Step 2: Verify configuration preservation**

Fetch Auth config again. Require both URLs, exact equality between hosted and local invite HTML, and equality of every unrelated Auth config field before and after the patch.

### Task 4: Verification and Production release

**Files:**
- Modify: none beyond Tasks 1–2

- [ ] **Step 1: Run complete verification**

Run: `npm test && npm run lint && npm run build && git diff --check`.

- [ ] **Step 2: Commit and push main**

Commit as `fix: protect invite links from email prefetching` and push `main`.

- [ ] **Step 3: Deploy Vercel Production**

Use the established Production deployment command with `.env.local` Supabase variables and wait for `Ready` aliases.

- [ ] **Step 4: Verify scanner-safe behavior live**

Generate a temporary invite token. GET `/accept-invite` twice and verify the Auth user remains unconfirmed. POST the token once to `/auth/confirm`, require 303, session cookies, and `/set-password`; then verify the Auth user is confirmed. Delete the temporary user in `finally`.

- [ ] **Step 5: Check logs and repository state**

Require no new Vercel error logs, a clean normal repository, and `origin/main...main` equal to `0 0`.
