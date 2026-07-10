# Staff Administration UI Design

## Goal

Make the internal application-review area easier to navigate and administer without modifying the public application form.

## Scope

- Add shared internal navigation with links to applications, staff management, and logout.
- Let an active administrator invite either a reviewer or another administrator.
- Replace user deletion with reversible access deactivation.
- Prevent sign-in and new assignment of deactivated users while retaining completed reviews for audit.
- Prevent deactivation of the last active administrator.
- Improve only staff pages with a cohesive header, cards, status chips, empty states, and responsive layout.

## Data and Security

`profiles` gains `is_active boolean not null default true` and `deactivated_at timestamptz`. Existing accounts are active after the migration. The role remains `admin` or `reviewer`.

Authentication checks require both a valid Auth claim and an active profile. Deactivated users are signed out and redirected to login. All assignment functions reject inactive reviewers. Admin deactivation is an atomic database function that rejects a request targeting the last active admin. It may not deactivate the requesting admin unless another active admin remains.

Deactivation never deletes `auth.users`, `profiles`, assignments, or completed scores. Pending assignments owned by an inactive reviewer stay visible to admins as needing reassignment and are excluded from the reviewer’s task list.

## UI

The internal header shows the Erasmus+ label, the signed-in role, navigation, and logout. `/admin` shows application coverage and assignment actions. `/admin/hodnotitelia` shows active and inactive staff, role, task counts, invitation form with role selection, and deactivation action. `/hodnotenie` uses the same header and logout control.

## Verification

Tests cover inactive-user authorization, last-admin protection, role selection for invitations, and inactive reviewer assignment rejection. Existing public-form tests remain unchanged. The full test suite, lint, production build, and remote Supabase database tests must pass before deployment.
