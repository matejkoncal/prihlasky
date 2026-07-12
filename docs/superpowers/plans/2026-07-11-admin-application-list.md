# Admin Application List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-expanded admin application view with a compact expandable list, reviewer-only assignment controls, sticky navigation, and viewport-fixed feedback.

**Architecture:** `AdminDashboard` owns local expansion and feedback state while server actions return structured results. `StaffLayout` provides sticky navigation. Existing Supabase RPCs remain unchanged.

**Tech Stack:** Next.js 16, React 19, Material UI 9, Vitest 4.

## Global Constraints

- Do not modify `app/page.tsx` or `components/application-form.tsx`.
- Assignment selectors show only active profiles with role `reviewer`.
- Errors and successes remain visible independent of scroll position.
- Detail expands inline; no new route or drawer is introduced.

---

### Task 1: Structured assignment actions

**Files:**

- Modify: `app/admin/actions.ts`
- Test: `app/admin/actions.test.ts`

**Interfaces:**

- Produces: `assignReviewer(formData): Promise<{ error?: string; success?: string }>`
- Produces: `removeAssignment(formData): Promise<{ error?: string; success?: string }>`

- [ ] Write failing tests asserting invalid input and RPC failures return `{ error }` instead of throwing.
- [ ] Implement structured Slovak results and retain `revalidatePath('/admin')` on success.
- [ ] Run `npm test -- app/admin/actions.test.ts` and expect all tests to pass.

### Task 2: Compact expandable application list

**Files:**

- Modify: `components/admin-dashboard.tsx`
- Create: `components/admin-dashboard.test.tsx`

**Interfaces:**

- Consumes: existing `AdminApplication[]` and `AdminReviewer[]`.
- Produces: collapsed application summaries, one inline expanded detail, and a fixed Snackbar.

- [ ] Write failing component tests for collapsed details, click expansion, active-reviewer-only options, and feedback Snackbar.
- [ ] Filter reviewers with `reviewer.role === 'reviewer' && reviewer.is_active`.
- [ ] Render summary chips for completed and assigned counts; toggle expanded category content with one selected application ID.
- [ ] Replace page-top Alert with a dismissible bottom-right Snackbar containing an Alert.
- [ ] Run `npm test -- components/admin-dashboard.test.tsx` and expect all tests to pass.

### Task 3: Sticky staff navigation and verification

**Files:**

- Modify: `components/staff-layout.tsx`
- Test: `components/admin-dashboard.test.tsx`

**Interfaces:**

- Produces: an AppBar with `position="sticky"` and `top: 0`.

- [ ] Add a failing assertion for sticky navigation.
- [ ] Set the AppBar to sticky with sufficient z-index and responsive navigation wrapping.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; expect exit code 0.
- [ ] Commit with `git commit -m "feat: refine admin application workflow"`.

### Task 4: Preview deployment

**Files:**

- No source changes.

- [ ] Deploy the verified worktree with existing Preview Supabase environment values.
- [ ] Inspect the deployment until Vercel reports `Ready`.
- [ ] Report the Preview URL and verification evidence.
