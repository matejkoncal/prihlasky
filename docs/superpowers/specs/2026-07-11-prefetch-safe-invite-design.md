# Prefetch-safe invitation design

## Goal

Prevent email security scanners and link prefetchers from consuming a single-use Supabase invite token before the invited user can establish a session and choose a password.

## Flow

New invitations use `/accept-invite` as their `redirectTo`. The existing branded email template therefore links to `/accept-invite?token_hash=...`. A GET request to this page never calls Supabase Auth and cannot consume the token.

The acceptance page presents an Erasmus+ invitation card and a form containing the token hash in a hidden field. The user must click `Prijať pozvánku a nastaviť heslo`, which sends a POST request to `/auth/confirm`. The POST handler calls `verifyOtp` with the fixed `invite` type, writes the returned session cookies, and responds with a 303 redirect to `/set-password`.

Missing, invalid, expired, or already-used tokens redirect to `/login?error=invite`. The existing GET confirmation handler remains available for controlled direct token verification and backward compatibility, but newly sent emails do not point to a token-consuming GET endpoint.

## Configuration

Hosted Supabase Auth keeps the existing branded invite subject and HTML. The Management API adds `https://prihlasky.koncal.sk/accept-invite` to the redirect allowlist while preserving the existing confirmation URL, SMTP, and all unrelated Auth configuration.

## Verification

Tests prove that rendering the acceptance page does not call `verifyOtp`, that the form posts the token to the confirmation handler, and that POST success and failure produce the correct redirects. Production verification generates a temporary invite token, performs one or more GET requests to `/accept-invite` and confirms the Auth user remains unconfirmed, then submits the POST once, confirms the session cookie and `/set-password`, and deletes the temporary user.
