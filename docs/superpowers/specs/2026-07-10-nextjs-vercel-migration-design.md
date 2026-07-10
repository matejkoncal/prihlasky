# Next.js and Vercel Migration Design

## Goal

Consolidate the existing Vite frontend, Firebase Functions backend, and obsolete standalone Vercel handler into one Next.js application deployed as a Vercel Preview deployment. Preserve the current user interface and all current submission behaviour while leaving the existing production deployment and DNS records unchanged.

## Current State and Source of Truth

The current functionality is split across three implementations:

- `web/` contains the active React and Material UI form.
- `functions/` contains the current backend behaviour: validation, PDF creation, optional attachments, the school notification email, and the applicant confirmation email.
- `api/submit.ts` is an obsolete and incomplete Vercel implementation. It lacks current fields and attachments and imports a PDF module that is not present.

The migration will use `web/` as the source of truth for the user interface and `functions/` as the source of truth for backend behaviour. The obsolete handler will not be carried forward.

## Target Architecture

The repository root will become a single Next.js App Router application:

- `app/page.tsx` renders the application page.
- `components/application-form.tsx` contains the interactive Material UI form as a Client Component.
- `app/api/submit/route.ts` exposes the same-origin `POST /api/submit` endpoint.
- `server/application-validation.ts` owns request and attachment validation.
- `server/application-pdf.tsx` owns PDF rendering.
- `server/application-emails.ts` owns school and applicant email content.
- `public/` contains the favicon and official logos used by the page.

The page can be prerendered and distributed through the Vercel CDN. The submission Route Handler will explicitly use the Node.js runtime because PDF generation, filesystem-backed bundled assets, and `Buffer` require Node-compatible APIs. No Edge Function, Firebase project, Express server, CORS configuration, or separately deployed backend will remain.

Vercel may implement the Route Handler as a Vercel Function internally. This is managed automatically as part of the single Next.js deployment and is not a separate project or manual deployment unit.

## Submission Data Flow

The browser will retain the current fields and optional PDF/DOCX inputs. On submit it will:

1. Check that the two optional attachments total no more than 3 MB before base64 encoding.
2. Build the existing JSON-compatible submission payload.
3. Send it to the same-origin `/api/submit` route.
4. Replace the form with the existing success state only after a successful response.
5. Display the backend error message when validation or delivery fails.

The server route will:

1. Reject non-POST access through the absence of other method handlers.
2. Parse and validate the request without trusting browser validation.
3. Require all current personal, class, situation, and privacy-consent fields.
4. Accept only PDF and DOCX attachments whose combined decoded content is at most 3 MB.
5. Generate the current branded Erasmus+ application PDF.
6. Send the school email to the current recipient list with the generated PDF and optional submitted files.
7. Send the existing attachment-free confirmation email to the applicant.
8. Return `{ "success": true }` only when both email operations succeed.

The payload will remain JSON with base64 attachments. A direct-to-storage upload is deliberately excluded because the agreed 3 MB combined attachment limit fits below Vercel's 4.5 MB request limit after base64 and JSON overhead.

## Security and Validation

`RESEND_API_KEY` will be read exclusively from `process.env.RESEND_API_KEY` in server-only code. It will be configured as a Vercel Environment Variable for Preview before the test deployment and later for Production only after approval. It will never use a `NEXT_PUBLIC_` prefix, be committed, or be embedded in frontend JavaScript.

The server will validate object shape, strings, supported student-situation values, exact boolean consent, email syntax, attachment filenames, allowed MIME/type extensions, valid base64 content, and the combined decoded byte size. Dynamic email HTML will be escaped. Errors returned to the browser will use the current Slovak messages for user-correctable input and a generic internal error for delivery or server failures.

This migration will preserve the current recipient addresses and sender identity. It will not introduce a database or permanent file storage.

## UI and Assets

The visual design, Slovak and English labels, Material UI theme, responsive layout, logos, attachments, submission progress, error alert, and success screen will remain equivalent to the current Vite application. Vite-specific bootstrapping and `VITE_API_URL` will be removed because the API is same-origin.

The existing Google Fonts CSS import will be replaced by the Next.js font integration when compatible with the current Inter typography. Static images will be served from `public/`; functional image output and accessibility labels will remain unchanged.

## Testing and Verification

Tests will be consolidated under the root project and will cover:

- current form controls, consent gating, payload submission, errors, and success state;
- the 3 MB combined attachment limit in the browser;
- server validation of required fields, situation, consent, email, file types, base64, and decoded attachment size;
- school and applicant email construction;
- PDF text and embedded co-funding image;
- the Route Handler response for invalid requests and a successful submission with injected/mocked external email delivery.

Verification will include the complete test suite, lint, TypeScript checking through the Next.js production build, and a local browser inspection of the responsive form. After that, the application will be deployed with `vercel` as a Preview deployment only. The Preview URL will be tested without changing the existing Production deployment, Git remote, or DNS records.

## Repository Cleanup

After equivalent functionality exists and verification passes, remove the obsolete `web/`, `functions/`, and `api/` application trees, `firebase.json`, the custom legacy `vercel.json`, and their nested manifests and lockfiles. Keep a single root `package.json`, lockfile, Next.js configuration, TypeScript configuration, source tree, tests, public assets, and documentation.

Existing untracked `.DS_Store` files are unrelated user files and will not be modified or included in any deployment source decisions beyond normal Vercel ignore behaviour.

## Deployment Constraints

- Do not create a Git commit.
- Do not push to any Git remote.
- Do not update DNS records or domains.
- Do not promote the Preview deployment to Production.
- Do not change the currently running production application.
- Configure `RESEND_API_KEY` only through Vercel's encrypted Environment Variables for Preview testing.
