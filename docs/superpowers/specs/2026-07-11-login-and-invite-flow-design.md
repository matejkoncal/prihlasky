# Login and invitation flow design

## Goal

Authenticated staff members who open `/login` are redirected to their role dashboard. Newly invited staff members follow a branded Erasmus+ email link, establish a Supabase session on the server, choose their password, and continue to the same role dashboard.

## Login behavior

`/login` is a dynamic Server Component. It creates the server Supabase client and resolves the active staff profile through `getVerifiedStaffUser`. An administrator is redirected to `/admin`, a reviewer to `/hodnotenie`, and an unauthenticated or inactive user sees `LoginForm`.

## Invitation behavior

The hosted Supabase invite template links to the application confirmation endpoint with `token_hash={{ .TokenHash }}` and `type=invite`. `/auth/confirm` accepts only an invite token hash, calls `supabase.auth.verifyOtp({ token_hash, type: "invite" })`, and redirects a successful verification to `/set-password`. Invalid, missing, expired, or already-used tokens redirect to `/login?error=invite`.

The existing `inviteUserByEmail` action continues to pass the production confirmation URL as `redirectTo`, and the hosted template uses that value as the confirmation endpoint. Supabase Auth must allow the production confirmation URL.

## Email template

The invite subject identifies Erasmus+. The responsive HTML email states that the recipient was invited to the Erasmus+ application evaluation system, contains a prominent “Nastaviť heslo a vstúpiť do systému” button, explains that the link is single-use and time-limited, and provides the same URL as a plain fallback link. Styling uses the application’s dark blue and light background palette and remains readable in clients that strip advanced CSS.

Only `mailer_subjects_invite` and `mailer_templates_invite_content` are patched through the Supabase Management API. Existing SMTP and all unrelated Auth configuration remain unchanged.

## Testing and release

Unit tests cover role-specific `/login` decisions and invite token verification outcomes. The full test suite, lint, production build, and diff checks must pass. After deployment, a temporary invited user validates the live confirmation endpoint, password page session, and dashboard redirect; the user is deleted immediately afterward. Production logs are checked for new errors.
