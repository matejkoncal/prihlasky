# Staff Administration UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe staff deactivation, role-aware invitations, navigation, logout, and improved internal UI without changing the public form.

**Architecture:** A Supabase migration adds activity state and protected administrative RPCs. Next.js server actions call those RPCs after verified role checks. A shared staff header keeps navigation and logout consistent across admin and reviewer pages.

**Tech Stack:** Next.js 16, React 19, Material UI 9, Supabase PostgreSQL/RLS, Vitest, Supabase CLI.

## Global Constraints

- Do not modify `app/page.tsx` or `components/application-form.tsx`.
- Only active profiles may authenticate into staff pages or receive assignments.
- Never delete historical reviews, applications, or Auth users from the UI.
- Only an active admin may invite or deactivate staff; the last active admin cannot be deactivated.

### Task 1: Add profile activity state and database guards

**Files:**
- Create: `supabase/migrations/<timestamp>_staff_activity.sql`
- Modify: `supabase/tests/application_review_system.test.sql`

- [ ] Write a failing pgTAP assertion that inactive reviewers cannot use `submit_evaluation` and that last-admin deactivation fails.
- [ ] Add `is_active` and `deactivated_at` to profiles, create `admin_deactivate_profile(uuid)`, and require active reviewers in assignment RPCs.
- [ ] Push the migration to the linked project and run `npx supabase test db --linked supabase/tests/application_review_system.test.sql`.

### Task 2: Add role selection, safe deactivation, and logout

**Files:**
- Modify: `server/staff-auth.ts`
- Modify: `app/admin/hodnotitelia/actions.ts`
- Modify: `components/reviewer-admin.tsx`
- Create: `app/logout/route.ts`
- Test: `server/staff-auth.test.ts`

- [ ] Write failing tests for inactive profiles and invitation role validation.
- [ ] Return inactive users as unauthenticated, update invited profile roles, call deactivation RPC, and implement POST logout.
- [ ] Run targeted tests and lint.

### Task 3: Unify staff navigation and improve internal UI

**Files:**
- Create: `components/staff-layout.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/hodnotitelia/page.tsx`
- Modify: `app/hodnotenie/page.tsx`
- Modify: `components/admin-dashboard.tsx`
- Modify: `components/reviewer-admin.tsx`
- Modify: `components/reviewer-dashboard.tsx`

- [ ] Write component tests for navigation and role-aware staff management controls.
- [ ] Add header, navigation, logout, role/state chips, responsive cards, and empty states.
- [ ] Run the full test suite, lint, and production build.

### Task 4: Verify and deploy Preview

**Files:**
- Modify: `docs/supabase-first-admin.md`

- [ ] Document deactivation behaviour and custom SMTP requirement.
- [ ] Run remote database tests, full test suite, lint, build, and `git diff --check`.
- [ ] Deploy a Vercel Preview using existing Supabase environment values and inspect until Ready.
