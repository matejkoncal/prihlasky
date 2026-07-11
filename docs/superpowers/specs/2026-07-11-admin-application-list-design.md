# Admin Application List Design

## Goal

Make the internal admin application list compact, navigable, and reliable while leaving the public application form unchanged.

## Interaction

The staff AppBar uses sticky positioning and remains visible while scrolling. The applications page initially shows one compact summary card per application: applicant name, submission date, completed count, assigned count, and overall status. Clicking the card expands its detail inline. Only the expanded detail renders category assignments, completed scores, comments, and assignment actions.

The reviewer selector includes only active profiles whose role is `reviewer`. Admin profiles and deactivated reviewers are excluded even if they are present in the staff-management response.

## Feedback

Admin assignment actions return structured success or error results rather than throwing errors into the Server Components boundary. A dismissible Snackbar is fixed to the bottom-right of the viewport and displays both success and failure feedback, so the message remains visible regardless of scroll position.

## Responsive UI

On desktop, application summaries use a single horizontal layout with status chips. On small screens, summary information wraps vertically and action controls use the full available width. Expanded content remains part of the document flow; no drawer or separate detail route is introduced.

## Verification

Component tests cover compact initial rendering, expansion, reviewer filtering, and viewport-fixed feedback. Server-action tests cover structured failures. Full tests, lint, production build, and Preview deployment verification must pass. `app/page.tsx` and `components/application-form.tsx` remain untouched.
