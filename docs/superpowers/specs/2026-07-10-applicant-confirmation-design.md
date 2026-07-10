# Applicant Confirmation Design

## Goal

Send applicants a separate confirmation email after a successful Erasmus+ application submission and replace the completed form with a clear success screen.

## Email Delivery

The existing administrator email remains unchanged: it contains the application PDF and optional CV or motivation-letter attachments. After it succeeds, the Firebase function sends a second, separate email to `data.email` with no attachments.

The applicant confirmation uses subject `Vaša prihláška Erasmus+ bola úspešne odoslaná` and states that the Erasmus+ application was successfully submitted. It does not repeat sensitive application details or attach the PDF.

Both sends are required for API success. If either email provider request fails, the endpoint returns HTTP 500 and the browser remains on the form with an error rather than showing success.

## Success Screen

After an HTTP 200 response, the React app clears local form and attachment state, then replaces the form with a centred success card. The card states `Prihláška bola úspešne odoslaná.` and tells the applicant that a confirmation was sent to the submitted email address. The header and page footer remain visible; the form is not rendered.

## Testing and Verification

Server tests will verify that the email helper issues one administrator email with the PDF and one attachment-free applicant confirmation. Web tests will verify that successful submission replaces the form with the success screen. Functions and web test suites, web lint, and both production builds must pass before pushing `main`.
