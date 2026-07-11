# Login and Invitation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redirect authenticated staff away from `/login` and deliver invited staff to a server-verified password setup flow from a branded Erasmus+ email.

**Architecture:** The login Server Component resolves the active profile before rendering. The invite template sends the Supabase token hash to a focused server confirmation handler, which verifies an `invite` OTP and writes the session cookies before redirecting to password setup. The hosted email template is updated narrowly through the Supabase Management API.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Auth/SSR, Vitest, MUI, Vercel

## Global Constraints

- Only active staff profiles are redirected from `/login`.
- Invite confirmation accepts `token_hash` with the fixed Supabase OTP type `invite`.
- Invalid or expired invitations redirect to `/login?error=invite`.
- Only the hosted invite subject and invite HTML content may be changed in Supabase Auth configuration.
- Production SMTP and all unrelated Auth configuration must remain unchanged.

---

### Task 1: Authenticated login routing

**Files:**
- Modify: `app/login/page.tsx`
- Create: `app/login/page.test.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` and `getVerifiedStaffUser(client)`
- Produces: server-rendered login behavior with `/admin` and `/hodnotenie` redirects

- [ ] **Step 1: Write failing page tests**

Mock `createServerSupabaseClient`, `getVerifiedStaffUser`, and `next/navigation.redirect`. Assert admin redirects to `/admin`, reviewer redirects to `/hodnotenie`, and a null user returns `LoginForm` without redirecting.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- app/login/page.test.tsx`

Expected: FAIL because the current synchronous page never resolves the server user or calls `redirect`.

- [ ] **Step 3: Implement the server check**

Use this page flow:

```tsx
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const user = await getVerifiedStaffUser(supabase as unknown as StaffAuthClient);
  if (user?.role === "admin") redirect("/admin");
  if (user) redirect("/hodnotenie");
  return <LoginForm />;
}
```

- [ ] **Step 4: Verify the login tests pass**

Run: `npm test -- app/login/page.test.tsx`

Expected: all login page tests PASS.

### Task 2: Server-side invite verification

**Files:**
- Modify: `app/auth/confirm/route.ts`
- Create: `app/auth/confirm/route.test.ts`

**Interfaces:**
- Produces: `confirmInvite(request: NextRequest, supabase: InviteAuthClient): Promise<NextResponse>`
- Calls: `supabase.auth.verifyOtp({ token_hash: string, type: "invite" })`

- [ ] **Step 1: Write failing handler tests**

Test a valid token hash redirects to `/set-password` and invokes `verifyOtp` with type `invite`. Test missing token and a returned Supabase error redirect to `/login?error=invite` without leaking error details.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- app/auth/confirm/route.test.ts`

Expected: FAIL because the current handler expects `code` and calls `exchangeCodeForSession`.

- [ ] **Step 3: Implement the invite handler**

```ts
export interface InviteAuthClient {
  auth: {
    verifyOtp(args: { token_hash: string; type: "invite" }): Promise<{ error: { message: string } | null }>;
  };
}

export async function confirmInvite(request: NextRequest, supabase: InviteAuthClient) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) return NextResponse.redirect(new URL("/login?error=invite", request.url));
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
  return NextResponse.redirect(new URL(error ? "/login?error=invite" : "/set-password", request.url));
}
```

`GET` creates the server Supabase client and delegates to `confirmInvite`.

- [ ] **Step 4: Verify confirmation tests pass**

Run: `npm test -- app/auth/confirm/route.test.ts`

Expected: all invite handler tests PASS.

### Task 3: Branded hosted invite email

**Files:**
- Create: `supabase/templates/invite.html`
- Create: `server/invite-email-template.test.ts`

**Interfaces:**
- Template variables: `{{ .RedirectTo }}`, `{{ .TokenHash }}`
- Final CTA URL: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`

- [ ] **Step 1: Write a failing template contract test**

Read `supabase/templates/invite.html` and assert it contains the exact token hash URL, `Erasmus+`, Slovak system description, CTA label, fallback link text, and no `{{ .ConfirmationURL }}`.

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- server/invite-email-template.test.ts`

Expected: FAIL because the branded template file does not exist.

- [ ] **Step 3: Create the email HTML**

Create a table-based, responsive email with inline CSS, dark-blue header, Erasmus+ title, explanatory copy, a high-contrast CTA, security note, and a selectable fallback link. Use the exact URL from the Interfaces section for both the CTA and fallback link.

- [ ] **Step 4: Verify the template contract passes**

Run: `npm test -- server/invite-email-template.test.ts`

Expected: template contract PASS.

- [ ] **Step 5: Patch only the hosted invite fields**

Read the current hosted Auth config, then PATCH only:

```json
{
  "mailer_subjects_invite": "Pozvánka do systému Erasmus+ prihlášok",
  "mailer_templates_invite_content": "<contents of supabase/templates/invite.html>"
}
```

Fetch the config again and assert the two fields match while SMTP-related fields remain unchanged.

### Task 4: Verification and production release

**Files:**
- Modify: none beyond Tasks 1–3

**Interfaces:**
- Production URL: `https://prihlasky.koncal.sk`

- [ ] **Step 1: Run complete verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: zero failures and exit code 0.

- [ ] **Step 2: Commit and push main**

Stage only the files in this plan, commit with `feat: fix staff login and invite flow`, and push `main` to `origin`.

- [ ] **Step 3: Deploy Production**

Run `npx vercel --prod --yes` with the existing Supabase build and runtime environment variables loaded from `.env.local` without printing their values.

- [ ] **Step 4: Verify the live invite path**

Generate a temporary Supabase invite link, call the deployed confirmation URL using its token hash, retain the returned cookies, open `/set-password`, set a password, and verify `/auth/landing` reaches the role dashboard. Delete the temporary user in a `finally` block.

- [ ] **Step 5: Inspect production logs**

Run: `npx vercel logs https://prihlasky.vercel.app --since 10m --limit 50 --expand --level error`

Expected: no errors from the login or invite verification requests.
