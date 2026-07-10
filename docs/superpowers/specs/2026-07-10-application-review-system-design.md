# Application Review System Design

## Goal

Extend the Erasmus+ application website with a secure internal review system. Every submitted application is stored in Supabase, an administrator assigns exactly one reviewer to each evaluation category, and reviewers submit one final score and comment for each assigned category.

The existing public application form, PDF generation, and Resend email delivery remain in place. The system adds an authenticated staff area without exposing applicant data beyond the minimum needed by each reviewer.

## Scope of the First Version

The first version provides:

- Supabase PostgreSQL, Auth, and database migrations managed with `npx supabase`.
- Storage of validated form data for each submitted application. CV and motivation-letter files remain email-only and are not written to Supabase Storage.
- A `/login` route, invite acceptance, password setup, and authenticated sessions.
- Two roles: `admin` and `reviewer`.
- Five seed categories named `Kategória 1` through `Kategória 5`; their names and instructions are changed manually through Supabase SQL for now.
- A reviewer dashboard containing only the reviewer’s own assignments, each with the applicant’s name, category name, category instructions, a 0–10 score, and a single comment.
- One final submission per assignment. A submitted review cannot be changed by its reviewer.
- An administrator dashboard for inviting reviewers, assigning or changing pending assignments, and checking assignment and completion status per application.

The first version deliberately excludes permanent attachment storage, category-management UI, applicant self-service access, score aggregation/ranking, reviewer-visible full applications, and editing or reopening a submitted review.

## Architecture

Next.js remains the web application and secure application layer. Supabase provides Auth, PostgreSQL, SQL migrations, row-level security (RLS), and narrowly scoped database functions. Browser code never receives the Supabase service-role key.

The staff pages call Next.js server actions or Route Handlers. They authenticate the request from the Supabase session, authorize the user’s role, and call either an RLS-protected query or a purpose-built PostgreSQL function. The only server-side service-role operations are: accepting a public application into the database, issuing Auth invitations, and any administrative database operation that Auth itself cannot perform.

The existing `POST /api/submit` route continues to validate input, render the PDF, and send the two current emails. It also writes the validated, attachment-free form data to Supabase. A failed insert returns the existing generic server error and no success response. A failed email delivery also continues to return an error; its application record remains for administrator follow-up and is marked with an email-delivery status rather than being made assignable by default.

## Roles and Access

### Reviewer

A reviewer can sign in and see only assignments whose `reviewer_id` equals the authenticated user ID. For each assignment, the application layer returns only:

- applicant name;
- assigned category name and instructions;
- current pending/completed status;
- the reviewer’s own score and comment while the assignment is still pending;
- submitted timestamp after completion.

Reviewers cannot read the general applications table, other reviewers, other assignments, other scores, or stored form data. Reviewers cannot alter an assignment, its category, or its reviewer. They submit score and comment once through a database function that checks ownership and pending status atomically.

### Admin

An admin can view submitted applications, all categories, reviewers, all assignments, and review status. An admin can invite a reviewer, create or remove a pending assignment, and change the reviewer on a pending assignment. Submitted assignment content is visible for audit but is not editable or reopenable in the first version.

### Initial Admin

The initial administrator is created manually through Supabase Auth’s Dashboard invite flow. The invitee receives an email, sets a password through the normal acceptance route, and signs in. A database trigger creates the matching `profiles` row as a reviewer; an administrator runs the documented SQL statement once to promote that profile to `admin`. This avoids manually creating password hashes or exposing any privileged key.

## Data Model

### Types

`app_role` is an enum with `admin` and `reviewer`.

`application_delivery_status` is an enum with `pending`, `sent`, and `failed`. Only applications with status `sent` are shown for assignment by default.

`assignment_status` is an enum with `pending` and `completed`.

### `profiles`

One row per Auth user.

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text not null`
- `display_name text`
- `role app_role not null default 'reviewer'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

An `auth.users` trigger creates the profile on user creation. The server treats the role in this table as the authorization source; a browser-submitted role is never trusted.

### `applications`

One row per accepted public-form submission.

- `id uuid primary key default gen_random_uuid()`
- `applicant_name text not null`
- `form_data jsonb not null`
- `delivery_status application_delivery_status not null default 'pending'`
- `delivery_error text`
- `submitted_at timestamptz not null default now()`
- `email_sent_at timestamptz`

`form_data` contains the server-validated fields already represented by `ValidatedApplication`, excluding `cv` and `motivationLetter`. Keeping the raw validated form object enables future form changes without losing historical submissions. `applicant_name` is duplicated as a queryable field for administration and reviewer task display.

### `evaluation_categories`

- `id uuid primary key default gen_random_uuid()`
- `slug text not null unique`
- `name text not null`
- `instructions text not null default ''`
- `sort_order integer not null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`

The initial migration inserts five active rows with stable slugs `category-1` through `category-5`, visible names `Kategória 1` through `Kategória 5`, empty instructions, and sort orders 1 through 5. Existing assignments retain their category relationship if category names are later changed.

### `evaluation_assignments`

- `id uuid primary key default gen_random_uuid()`
- `application_id uuid not null references applications(id) on delete restrict`
- `category_id uuid not null references evaluation_categories(id) on delete restrict`
- `reviewer_id uuid not null references profiles(id) on delete restrict`
- `status assignment_status not null default 'pending'`
- `score smallint`
- `comment text not null default ''`
- `assigned_at timestamptz not null default now()`
- `submitted_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints enforce `score between 0 and 10` when present, require score and `submitted_at` for `completed` rows, prohibit a `submitted_at` on a pending row, and require `unique(application_id, category_id)`. The latter makes one category of one application a distinct task with exactly one reviewer; one reviewer may own several tasks.

## Database Security

RLS is enabled on every application table.

- No anonymous user can select staff data.
- Reviewers can select only their `evaluation_assignments`; they have no direct `applications` policy.
- Reviewer task data is returned by `get_my_review_assignments()`, a `security definer` function that filters by `auth.uid()` and returns only the permitted fields.
- `submit_evaluation(assignment_id uuid, score smallint, comment text)` is a `security definer` function. It updates only the caller’s pending assignment, validates the score, writes the comment, switches status to `completed`, and sets `submitted_at` in one statement. A second submission fails without modifying the completed row.
- Admin-only queries and mutation functions check that `profiles.role = 'admin'` for `auth.uid()` before returning or changing data.
- The public `POST /api/submit` Route Handler uses the service role only after server-side form validation. It is the sole public ingestion path and inserts an attachment-free application record.

All `security definer` functions set a fixed search path and are granted only to the authenticated role that needs them. The service-role key, database password, and Resend key remain server-only variables.

## Authentication and Invitations

`/login` presents email/password sign-in and a password-reset link. Successful sign-in redirects according to `profiles.role`: reviewers to `/hodnotenie`, admins to `/admin`.

`/auth/confirm` exchanges the Supabase invitation or recovery token for a session. A protected set-password page lets the user choose the password, then redirects to the role-appropriate dashboard. Supabase Auth redirect URLs are configured for the deployed site and local development.

From `/admin/hodnotitelia`, an administrator enters an email address and optional display name. The server verifies the current user’s admin role and invokes `auth.admin.inviteUserByEmail` with a redirect to `/auth/confirm`. Existing users are not silently re-invited; the UI reports the conflict and instructs the admin to use the current account or password-reset flow.

## Screens and Workflows

### Public submission

The existing public form remains at `/`. Once validation succeeds, the server creates the application with delivery status `pending`, performs the existing school and applicant email sends, then marks the row `sent` with `email_sent_at`. If delivery fails, the row becomes `failed` and is excluded from assignment lists. The API keeps the present generic failure response, so applicants never see internal delivery details.

### Reviewer dashboard: `/hodnotenie`

The page presents a task list ordered by pending first, then category order and applicant name. A task card shows the applicant name, category name, instructions, a numeric score control limited to 0–10, and the shared free-text comment for that one task. Selecting “Odoslať hodnotenie” warns that submission is final, then invokes `submit_evaluation`. On success, the page displays the completed state and timestamp; on conflict it refreshes the task and says that it was already submitted.

### Administrator dashboard: `/admin`

The page lists all deliverable applications with their five category rows. Each category row displays category, assigned reviewer or “nepriradené”, and `pending` or `completed` status with submitted time. The admin can assign an existing reviewer, replace the reviewer of a pending row, or remove a pending row. A completed row is read-only and displays the score and comment.

The dashboard also identifies incomplete coverage: an application with fewer than five assignments has visible unassigned category rows, so the admin can fill them deliberately.

### Reviewer administration: `/admin/hodnotitelia`

The page offers a reviewer list and invitation form. It shows email, display name, role, and counts of pending and completed assignments. The page does not expose Auth passwords, tokens, or raw delivery metadata.

## Error Handling and Integrity

- Unauthenticated users are redirected to `/login`; authenticated users reaching the wrong area receive a role-appropriate redirect rather than data.
- Invalid invitation, expired invite, or expired password-recovery links render a Slovak explanation and offer a return to login.
- The server validates invite email input and reports generic, non-sensitive delivery errors.
- Assignment creation verifies that the application has `delivery_status = 'sent'`, the category is active, and the reviewer profile exists and has role `reviewer`.
- Attempts to create a duplicate application/category assignment receive a clear admin error; the unique constraint remains the final guard against concurrent requests.
- A reviewer submitting an out-of-range score, an assignment owned by someone else, or a completed assignment receives no data leak and no mutation.
- All timestamps use `timestamptz`; UI formatting is localized to Slovak.

## Configuration

The application requires server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and browser-safe `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The browser-safe key is used only with RLS-enabled Auth/session clients; it does not bypass database policies.

Supabase project configuration sets Site URL, local and deployment redirect URLs for `/auth/confirm`, and an invitation email template in Slovak. Production email deliverability requires Supabase Auth SMTP configuration; default Supabase email sending is acceptable only for initial development and testing within its limits.

## Testing and Verification

Tests cover the following behaviour:

- public submission persists exactly the validated attachment-free data and records email delivery outcome;
- category seed data and every database constraint, including the one-category-per-application uniqueness and 0–10 range;
- profile trigger creation and role checks;
- RLS and RPC behaviour: a reviewer cannot read another assignment or application data and cannot submit twice;
- admin actions: invite authorization, assignment creation, replacement, removal, and completed-state read-only behaviour;
- `/login`, invite confirmation/password setup, role redirects, protected routes, and reviewer UI task submission;
- admin dashboard status presentation, including unassigned and completed categories;
- complete application test suite, lint, production build, and a controlled local Supabase end-to-end flow using two reviewer accounts and one admin account.

## Deferred Decisions

The following are intentionally not part of this implementation: permanent attachment storage and access controls, administrator editing/reopening of completed reviews, category-management UI, aggregate scoring and finalist selection, email reminders, audit-history UI, and data-retention/deletion workflows. The schema leaves room for each without changing existing review identities or score records.
