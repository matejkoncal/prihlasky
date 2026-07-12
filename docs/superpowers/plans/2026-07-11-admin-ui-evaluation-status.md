# Admin UI and Evaluation Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add conventional active admin navigation, aggregate evaluation status, safe pending mutation states, and the approved five Erasmus+ category names.

**Architecture:** A focused client navigation reads the current path while the staff shell remains server-renderable. A pure evaluation-summary helper feeds compact status chips in the application cards. Each mutation form owns an isolated pending state, and a slug-based SQL migration renames existing category rows without changing IDs.

**Tech Stack:** Next.js 16 App Router, React 19, MUI 9, Supabase PostgreSQL, Vitest, Testing Library, Vercel

## Global Constraints

- Application deletion is not implemented.
- The criterion is met at 35 or more points out of 50.
- A final failure state is shown only after all five categories are completed.
- Mutation pending state disables only the form currently submitting.
- Category IDs, assignments, evaluations, ordering, and score constraints must be preserved.
- No changes are made to the public application form.

---

### Task 1: Active administrator navigation

**Files:**

- Create: `components/staff-navigation.tsx`
- Create: `components/staff-navigation.test.tsx`
- Modify: `components/staff-layout.tsx`
- Modify: `components/staff-layout.test.tsx`

**Interfaces:**

- Produces: `StaffNavigation(): ReactElement`, visible only inside the administrator layout
- Consumes: `usePathname()` and the routes `/admin` and `/admin/hodnotitelia`

- [ ] **Step 1: Write failing navigation tests**

Mock `usePathname` for each route. Render `StaffNavigation`, then assert the current link has `aria-current="page"`, the matching tab is selected, and the other tab is not current. Extend the staff layout test to require the two navigation labels for an admin and no administrator tabs for a reviewer.

- [ ] **Step 2: Verify RED**

Run: `npm test -- components/staff-navigation.test.tsx components/staff-layout.test.tsx`

Expected: FAIL because `StaffNavigation` does not exist and the layout still renders plain buttons.

- [ ] **Step 3: Implement tab navigation**

Create a client component using MUI `Tabs` and `Tab`. Resolve the value to `users` when the pathname begins with `/admin/hodnotitelia`, otherwise `applications`. Give each tab an `href`, matching `value`, and `aria-current` only when active. Replace the two layout buttons with `<StaffNavigation />` for admins.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- components/staff-navigation.test.tsx components/staff-layout.test.tsx`

Expected: all navigation and layout tests PASS.

### Task 2: Aggregate evaluation summary

**Files:**

- Create: `lib/evaluation-summary.ts`
- Create: `lib/evaluation-summary.test.ts`
- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`

**Interfaces:**

- Produces: `getEvaluationSummary(categories)` returning `{ totalScore, maximumScore, completedCount, categoryCount, isComplete, criterion: "pending" | "met" | "not-met" }`
- Consumes: category objects containing `status: "pending" | "completed" | null` and `score: number | null`

- [ ] **Step 1: Write failing boundary tests**

Cover a partial total below 35 (`pending`), a partial total of 35 (`met`), a completed total of 34 (`not-met`), and five completed scores totaling 35 (`met` and complete). Assert null scores contribute zero and maximum score equals category count multiplied by 10.

- [ ] **Step 2: Verify helper RED**

Run: `npm test -- lib/evaluation-summary.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the pure helper**

Sum only numeric scores, count categories whose status is `completed`, set `isComplete` when every category is completed and at least one category exists, then use the fixed 35-point threshold. Return `not-met` only when complete and below 35.

- [ ] **Step 4: Add failing card UI assertions**

Extend the dashboard fixtures to five categories. Assert application cards show `Skóre 35/50`, `Kritérium splnené`, and `Hodnotenie dokončené` for a completed passing application. Add a partial fixture that shows `Hotové 3/5` and does not show `Kritérium nesplnené`.

- [ ] **Step 5: Implement status chips**

Use `getEvaluationSummary` for every application. Keep the assigned chip, replace the old completed chip copy with `Hodnotenie dokončené` when complete, add the score chip, and render criterion chips according to the helper state.

- [ ] **Step 6: Verify summary GREEN**

Run: `npm test -- lib/evaluation-summary.test.ts components/admin-dashboard.test.tsx`

Expected: helper and card UI tests PASS.

### Task 3: Pending assignment actions

**Files:**

- Create: `components/use-pending-form-action.ts`
- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`

**Interfaces:**

- Produces: `usePendingFormAction(action, onResult, fallbackError)` returning `{ pending, formAction }`
- Guarantees: a ref-based lock prevents duplicate execution before React rerenders

- [ ] **Step 1: Write failing assignment pending test**

Mock `assignReviewer` with an unresolved promise. Select a reviewer and submit. Assert the select and submit button are disabled, a progress indicator appears, the label becomes `Priraďujem…`, and a second submission cannot call the action twice. Resolve the promise and assert the success feedback appears.

- [ ] **Step 2: Verify assignment RED**

Run: `npm test -- components/admin-dashboard.test.tsx`

Expected: FAIL because the controls remain enabled and no progress indicator exists.

- [ ] **Step 3: Implement the pending hook and focused forms**

The hook sets a synchronous ref lock, sets React pending state, awaits the server action, reports its result, converts thrown values to the supplied Slovak fallback error, and unlocks in `finally`. Extract assignment and removal controls inside the dashboard so each form calls the hook independently. Wrap controls in a disabled fieldset and show a 16px MUI `CircularProgress` in the pending button.

- [ ] **Step 4: Verify assignment GREEN**

Run: `npm test -- components/admin-dashboard.test.tsx`

Expected: all dashboard behavior and pending-state tests PASS.

### Task 4: Pending staff management actions

**Files:**

- Modify: `components/reviewer-admin.tsx`
- Create: `components/reviewer-admin.test.tsx`

**Interfaces:**

- Consumes: `usePendingFormAction`, `inviteReviewer`, and `deactivateStaff`
- Produces: isolated invitation and deactivation pending states

- [ ] **Step 1: Write failing invitation pending test**

Mock `inviteReviewer` with an unresolved promise. Submit valid name and email, then assert all invite fields and the button are disabled, the button says `Odosielam…`, and a progress indicator is visible. Resolve and assert the form becomes enabled.

- [ ] **Step 2: Write failing deactivation pending test**

Mock `deactivateStaff` with an unresolved promise. Click one staff member’s deactivate button and assert only that row’s action becomes disabled with `Deaktivujem…` while unrelated controls remain usable.

- [ ] **Step 3: Verify staff RED**

Run: `npm test -- components/reviewer-admin.test.tsx`

Expected: FAIL because the current component has no pending states.

- [ ] **Step 4: Implement isolated pending forms**

Split invitation and staff-row controls into focused components within `reviewer-admin.tsx`. Reuse the shared pending hook, disabled fieldsets, `CircularProgress`, and the existing error feedback.

- [ ] **Step 5: Verify staff GREEN**

Run: `npm test -- components/reviewer-admin.test.tsx`

Expected: invitation and deactivation tests PASS.

### Task 5: Approved evaluation category migration

**Files:**

- Create: `supabase/migrations/20260711110000_rename_evaluation_categories.sql`
- Create: `server/evaluation-categories-migration.test.ts`

**Interfaces:**

- Updates rows by stable slugs `category-1` through `category-5`
- Produces the five exact Slovak names from the approved design

- [ ] **Step 1: Write failing migration contract test**

Read the migration file and assert it exists, contains each slug exactly once, contains all five exact names, updates `public.evaluation_categories`, and contains no `delete`, `truncate`, or `insert` statement.

- [ ] **Step 2: Verify migration RED**

Run: `npm test -- server/evaluation-categories-migration.test.ts`

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Create slug-based update migration**

Use a single `UPDATE ... FROM (VALUES ...) AS approved(slug, name)` statement and set `name = approved.name` where the existing row’s slug matches. Do not modify IDs, instructions, order, active state, or assignments.

- [ ] **Step 4: Verify migration GREEN**

Run: `npm test -- server/evaluation-categories-migration.test.ts`

Expected: migration contract PASS.

- [ ] **Step 5: Push and verify hosted migration**

Run: `npx supabase db push --linked --yes`, then query `evaluation_categories` through the service-role client ordered by `sort_order`. Expected: the five exact names with unchanged IDs and order 1–5.

### Task 6: Full verification and Production release

**Files:**

- Modify: none beyond Tasks 1–5

- [ ] **Step 1: Run full verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: exit code 0, no failed tests, no lint errors, successful production build.

- [ ] **Step 2: Commit and push main**

Stage only files from this plan, commit as `feat: improve admin evaluation workflow`, and push `main` to `origin`.

- [ ] **Step 3: Deploy Vercel Production**

Load `.env.local` without printing values and run `npx vercel --prod --yes` with the existing Supabase build/runtime variables. Wait until the deployment is `Ready` and aliases include `https://prihlasky.koncal.sk`.

- [ ] **Step 4: Production smoke test**

Use a temporary authenticated admin session to request `/admin` and `/admin/hodnotitelia`. Assert both return 200 and contain the expected active navigation and category/status content. Delete the temporary account in `finally`.

- [ ] **Step 5: Check logs and repository state**

Run Vercel error logs for the deployment window. Assert no new errors, a clean worktree, and `origin/main...main` is `0 0`.
