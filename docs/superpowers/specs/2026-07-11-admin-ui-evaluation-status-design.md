# Admin UI and evaluation status design

## Goal

Make the administration area easier to navigate and safer to operate, expose the aggregate evaluation result at a glance, and replace placeholder evaluation category names with the approved Erasmus+ categories.

Application deletion is explicitly outside this scope.

## Admin navigation

The sticky staff AppBar keeps the product title, role badge, logout action, and two administrator destinations: `Prihlášky` and `Používatelia`. The destinations use a conventional tab-style treatment with an active underline and `aria-current="page"`. A small client navigation component derives the active item from `usePathname`; the rest of `StaffLayout` remains server-renderable. On narrow screens the navigation remains usable without covering the page content.

## Application evaluation summary

Each application summary card displays:

- the sum of all submitted category scores as `Skóre X/50`;
- `Kritérium splnené` in a success treatment as soon as the submitted total is at least 35;
- `Kritérium nesplnené` in an error treatment only when all five categories are completed and the final total is below 35;
- evaluation progress as `Hotové X/5` while incomplete;
- `Hodnotenie dokončené` in a success treatment when all five categories are completed.

Pending or unassigned categories contribute zero to the displayed running total. A partially evaluated application below 35 is not marked as failed because its result is not final. Existing assigned-count information remains available.

The score/status calculation is a pure helper so boundary cases 34 and 35, partial evaluations, and completion can be tested independently.

## Pending mutation states

Every mutation form visible in the admin applications and user management screens owns an independent pending state. While its request is running:

- all editable controls in that form are disabled;
- its submit button is disabled;
- the button shows a small progress indicator and action-specific pending copy;
- duplicate submission is impossible;
- other unrelated rows and forms remain usable;
- the existing success or error feedback appears after completion.

This applies to reviewer assignment, assignment removal, staff invitation, and staff deactivation.

## Evaluation categories

A Supabase migration updates the five existing rows by stable slug, preserving category IDs and all linked assignments and evaluations:

1. `category-1`: `Výsledky písomného testu z ANJ`
2. `category-2`: `Schopnosť komunikácie v anglickom jazyku – interview`
3. `category-3`: `Odborné predmety – hodnotenie`
4. `category-4`: `Vyjadrenie triedneho učiteľa – správanie / integrácia / inklúzia / spoľahlivosť`
5. `category-5`: `Vyjadrenie majstra odbornej výchovy`

All categories keep their current order, active state, 0–10 score range, and free-text comment. No detailed instructions are added because the supplied source contains category headings but no separate evaluation instructions.

## Verification and release

Component tests cover active navigation, scoring states, category progress, disabled controls, pending indicators, and duplicate-submit prevention. A migration contract test checks the exact five names and slug-based updates. The full test suite, lint, production build, and diff checks must pass before committing. The migration is pushed to the linked hosted Supabase project, the application is deployed to Vercel Production, and live admin routes plus remote category rows and production error logs are verified.
