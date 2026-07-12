# Administrator Reviewer Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow an active administrator to be assigned evaluations, view them through admin navigation, and submit them without changing the administrator landing page or role.

**Architecture:** Assignment ownership, not the profile role, grants evaluation capability. Client filtering, page routing, server actions, and hosted PostgreSQL functions all adopt the same active-staff rule. Existing database ownership and pending-status checks remain the final authorization boundary.

**Tech Stack:** Next.js 16 App Router, React 19, MUI 9, Supabase Auth/PostgreSQL, Vitest, Testing Library, Vercel

## Global Constraints

- Admins continue to land on `/admin` after login.
- Reviewers continue to land on `/hodnotenie` and never gain admin access.
- Only active staff profiles may receive assignments.
- Only the owner of a pending assignment may submit it.
- Completed evaluations remain immutable.
- No changes are made to the public application form.

---

### Task 1: Administrator assignment option and navigation

**Files:**

- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`
- Modify: `components/staff-navigation.tsx`
- Modify: `components/staff-navigation.test.tsx`
- Modify: `components/staff-layout.test.tsx`

**Interfaces:**

- Assignment options consume all `AdminReviewer` rows where `is_active` is true.
- Admin option labels append ` (admin)` when `role === "admin"`.
- Administrator navigation adds `/hodnotenie` with label `Moje hodnotenia`.

- [ ] **Step 1: Write failing selector tests**

Change the existing selector expectation so it requires the active admin option `Ďalší admin (admin)`, keeps the active reviewer, and excludes only the inactive profile.

- [ ] **Step 2: Write failing navigation tests**

For pathname `/hodnotenie`, require `Moje hodnotenia` to have `aria-current="page"` and the other two destinations not to be current. Require all three destinations for an admin and none for a reviewer.

- [ ] **Step 3: Verify RED**

Run: `npm test -- components/admin-dashboard.test.tsx components/staff-navigation.test.tsx components/staff-layout.test.tsx`

Expected: FAIL because admins are filtered out and the third navigation destination does not exist.

- [ ] **Step 4: Implement active staff filtering and navigation**

Filter only on `is_active`. Render admin names with an `(admin)` suffix. Add the `/hodnotenie` destination to `StaffNavigation`, with an exact pathname match so only the evaluation route is active.

- [ ] **Step 5: Verify GREEN**

Run the Task 1 test command again. Expected: all tests PASS.

### Task 2: Administrator reviewer page and submission authorization

**Files:**

- Modify: `app/hodnotenie/page.tsx`
- Create: `app/hodnotenie/page.test.tsx`
- Modify: `app/hodnotenie/actions.ts`
- Create: `app/hodnotenie/actions.test.ts`

**Interfaces:**

- `ReviewerPage` accepts any non-null `VerifiedStaffUser` and passes `user.role` into `StaffLayout`.
- `submitEvaluation` accepts any non-null verified active user before calling `submit_evaluation`.

- [ ] **Step 1: Write failing page tests**

Mock server auth and repository calls. Require an admin to receive a rendered `StaffLayout` with `role="admin"` and loaded assignments rather than a redirect to `/admin`. Retain a test that an unauthenticated user redirects to `/login`.

- [ ] **Step 2: Write failing action tests**

Mock `getVerifiedStaffUser` as an admin and the RPC as successful. Submit valid form data and require `submit_evaluation` to be called. Also require a null user to throw `Nemáte oprávnenie hodnotiť` before RPC.

- [ ] **Step 3: Verify RED**

Run: `npm test -- app/hodnotenie/page.test.tsx app/hodnotenie/actions.test.ts`

Expected: FAIL because the page redirects admins and the action rejects all roles except reviewer.

- [ ] **Step 4: Implement role-agnostic active staff access**

Remove the admin redirect from the page and render `<StaffLayout role={user.role}>`. Change the action guard from `user?.role !== "reviewer"` to `!user`. Keep input validation, RPC ownership enforcement, error copy, and revalidation unchanged.

- [ ] **Step 5: Verify GREEN**

Run the Task 2 test command again. Expected: all page and action tests PASS.

### Task 3: Hosted assignment function migration

**Files:**

- Create: `supabase/migrations/20260711130000_allow_admin_review_assignments.sql`
- Create: `server/admin-reviewer-migration.test.ts`

**Interfaces:**

- Replaces `admin_create_assignment(uuid, uuid, uuid)`.
- Replaces `admin_reassign_assignment(uuid, uuid)`.
- Both validate `public.profiles.id = p_reviewer_id AND is_active` without a role predicate.

- [ ] **Step 1: Write failing SQL contract test**

Require both function names, the active-profile predicate, all existing application/category/pending checks, and the absence of `role = 'reviewer'` from the migration.

- [ ] **Step 2: Verify RED**

Run: `npm test -- server/admin-reviewer-migration.test.ts`

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Create replacement functions**

Copy the current hosted function bodies and change only target-profile validation to `id = p_reviewer_id and is_active`. Preserve `require_admin`, application delivery status, active category, pending-only reassignment, error codes, return types, revokes, and authenticated grants.

- [ ] **Step 4: Verify GREEN**

Run the Task 3 test command again. Expected: migration contract PASS.

- [ ] **Step 5: Push hosted migration**

Run: `npx supabase db push --linked --yes`. Verify the remote migration list contains `20260711130000`.

### Task 4: Full verification and production release

**Files:**

- Modify: none beyond Tasks 1–3

- [ ] **Step 1: Run complete verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: exit code 0 with no test, lint, build, or diff failures.

- [ ] **Step 2: Commit and push main**

Stage only the files in this plan, commit as `feat: allow admins to review applications`, and push `main` to `origin`.

- [ ] **Step 3: Deploy Vercel Production**

Load `.env.local` without printing secrets, run the established `npx vercel --prod --yes` command with Supabase variables, and wait for `Ready` with the production aliases.

- [ ] **Step 4: Verify live admin reviewer flow**

Create a temporary confirmed admin and a temporary sent application through the service-role client. Sign in as the admin, call `admin_create_assignment` assigning the admin to an active category, request `/hodnotenie` with the session cookie, and require 200 with Admin navigation and assignment content. Submit the assignment using the authenticated `submit_evaluation` RPC and require status `completed`. Delete the assignment, application, and temporary Auth user in `finally`.

- [ ] **Step 5: Check production logs and repository state**

Require no new Vercel error logs, a clean normal repository, and `origin/main...main` equal to `0 0`.
