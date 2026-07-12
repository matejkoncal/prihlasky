# Submit Recovery and Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore production application submission and replace the awkward staff appbar and application rows with compact, stable, responsive layouts.

**Architecture:** Production secrets will live only in Vercel project environments and a checked deployment script will deploy without runtime overrides. The staff shell will use a brand/navigation/user grid, while each application summary will use explicitly positioned identity, metrics, and action zones so responsive CSS cannot reorder content.

**Tech Stack:** Next.js 16, TypeScript, Material UI 9, Supabase, Vercel CLI, Vitest, Testing Library.

## Global Constraints

- Do not change the public application form UI.
- Do not store or print secret values.
- Do not pass `RESEND_API_KEY` through `vercel -e` or a local shell expansion.
- Preserve all current admin actions, attachment downloads, PDF exports, pending states, and snackbars.
- Keep the appbar sticky and make navigation usable on mobile.

---

### Task 1: Safe production deployment and submit regression

**Files:**
- Create: `scripts/deploy-production.sh`
- Modify: `package.json`
- Create: `server/production-deploy.test.ts`
- Test: `app/api/submit/route.test.ts`
- Test: `server/submit-application.test.ts`

**Interfaces:**
- Produces: `npm run deploy:production`, which executes `npx vercel --prod --yes` without runtime `-e` or build `-b` secret overrides.
- Consumes: Supabase and Resend Production variables configured in the linked Vercel project.

- [ ] Add a failing test that reads `scripts/deploy-production.sh`, requires `vercel --prod --yes`, and rejects `RESEND_API_KEY`, `--env`, `-e`, `--build-env`, and `-b`.
- [ ] Run `npx vitest run server/production-deploy.test.ts` and verify it fails because the safe script does not exist.
- [ ] Create the strict shell script and add `"deploy:production": "bash scripts/deploy-production.sh"` to `package.json`.
- [ ] Run deployment and submit unit tests and verify they pass.
- [ ] Configure the three Supabase Production variables in Vercel without exposing their values; leave the existing sensitive Resend variable untouched.
- [ ] Commit with `fix: protect production email configuration`.

### Task 2: Compact responsive staff appbar

**Files:**
- Modify: `components/staff-layout.tsx`
- Modify: `components/staff-layout.test.tsx`
- Modify: `components/staff-navigation.tsx`
- Modify: `components/staff-navigation.test.tsx`

**Interfaces:**
- `StaffLayout` continues to consume `VerifiedStaffUser` and children.
- Appbar exposes accessible logo, user name, role, initials avatar, navigation, and `Odhlásiť sa` tooltip/action.

- [ ] Add failing tests for initials avatar, icon-only logout, compact brand, active pill navigation, and a separate mobile navigation row.
- [ ] Run targeted staff tests and verify the new assertions fail.
- [ ] Implement a desktop single-row grid and mobile two-row layout with smaller logo, calm active pill, avatar identity, and logout icon.
- [ ] Run targeted tests and verify they pass.
- [ ] Commit with `feat: redesign staff navigation shell`.

### Task 3: Stable application summary cards

**Files:**
- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`

**Interfaces:**
- Each card header has `data-testid` zones `application-identity`, `application-metrics`, and `application-actions` with explicit desktop grid columns.
- Metrics render labelled values for score, assigned categories, and completed categories.
- PDF and expand actions remain icon links/buttons with accessible labels.

- [ ] Add failing UI assertions for explicit grid placement, class and field display, three labelled metrics, criterion badge, and fixed action zone.
- [ ] Run `npx vitest run components/admin-dashboard.test.tsx` and verify the new assertions fail.
- [ ] Replace chip clusters with metric blocks, set explicit grid coordinates at every breakpoint, and keep criterion as a single status badge.
- [ ] Run the dashboard tests and verify they pass.
- [ ] Commit with `feat: redesign application summary cards`.

### Task 4: Refined expanded detail and production verification

**Files:**
- Modify: `components/admin-dashboard.tsx`
- Modify: `components/admin-dashboard.test.tsx`

**Interfaces:**
- Expanded category rows expose a numbered marker, category title, and a consistent reviewer/status area.
- Existing assignment forms and protected document links remain unchanged functionally.

- [ ] Add failing tests for numbered rows, document panel hierarchy, completed reviewer/score/comment hierarchy, and consistent row minimum height.
- [ ] Run dashboard tests and verify the assertions fail.
- [ ] Implement the refined document panel and category rows with balanced spacing and secondary comment typography.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check` with zero failures.
- [ ] Push `main`, run `npm run deploy:production`, wait for `Ready`, and verify the production deployment contains no runtime Resend override.
- [ ] Verify `/api/submit` no longer fails before database creation, inspect production errors, verify admin HTML and responsive controls, and clean all controlled test data.
- [ ] Commit any final corrections and confirm `origin/main...main` is `0 0`.
