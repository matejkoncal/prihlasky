# Administrator reviewer capability design

## Goal

Allow an active administrator to receive and submit evaluation assignments without losing administrator access or using a second account.

## Role model

The existing `admin` and `reviewer` profile roles remain unchanged. The role determines access to administration, while an evaluation assignment determines whether a staff member may evaluate a particular application category. Both active admins and active reviewers are valid assignment targets.

This avoids a new combined role, duplicate accounts, or a separate permissions table while preserving existing authorization boundaries.

## Assignment administration

The application detail selector lists every active staff profile returned by `admin_list_reviewers`, including admins. Admin labels include an `(admin)` suffix so the role is visible during assignment. Inactive profiles remain excluded.

The hosted database functions `admin_create_assignment` and `admin_reassign_assignment` validate only that the target profile exists and is active; they no longer require the `reviewer` role. Existing application/category validation and pending-only reassignment rules remain unchanged.

## Administrator evaluation access

`/hodnotenie` accepts any verified active staff user. It loads assignments owned by the current Auth user and renders `StaffLayout` with that user’s actual role. An admin therefore keeps the Admin role badge and administrator navigation while viewing their assignments.

`submitEvaluation` accepts any verified active staff user. Database `submit_evaluation` remains the final ownership guard: only the assigned user can submit a pending assignment, and completed evaluations remain immutable.

## Navigation and landing behavior

Administrator navigation contains `Prihlášky`, `Používatelia`, and `Moje hodnotenia`. The current item is marked from the pathname, including `/hodnotenie`.

Login and `/auth/landing` behavior does not change: admins land on `/admin`; reviewers land on `/hodnotenie`. A reviewer never receives admin navigation or admin access.

## Verification and release

Tests cover admin visibility in the assignment selector, role labeling, active-profile filtering, the `Moje hodnotenia` active navigation state, admin access to the reviewer page, admin evaluation submission, reviewer behavior, and SQL migration constraints. The migration is pushed to hosted Supabase before the Vercel Production deployment. A temporary active admin is assigned a temporary evaluation in production, loads `/hodnotenie`, submits it, and all temporary data is removed afterward.
