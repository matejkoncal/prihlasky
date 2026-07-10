# Student Situation and Privacy Consent Design

## Goal

Extend the Erasmus+ application form with a required student-situation selection and a required consent to personal-data processing, and include both values in the generated PDF.

## User Interface

The React form will add a required radio group labelled:

> Vyberte možnosť, ktorá najlepšie vystihuje Vašu situáciu:

It will offer exactly these mutually exclusive choices:

- Žiak so zdravotným znevýhodnením
- Žiak zo sociálne znevýhodneného prostredia
- Nepatrím do žiadnej z uvedených skupín

The form will also add a required checkbox with this approved wording:

> Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.

The submit button will be disabled while the checkbox is unchecked and while a submission is in progress. The radio group will use native required-form semantics so the application cannot be submitted without a choice. After a successful submission, both new fields will reset with the rest of the form.

## Data Flow and Validation

The browser payload will add:

- `studentSituation`: one of the three displayed Slovak option strings.
- `personalDataConsent`: boolean, which must be `true`.

The Firebase HTTP function will treat both fields as required. It will accept `studentSituation` only when it exactly matches one of the three supported values and will reject the request unless `personalDataConsent === true`. This server-side validation prevents callers from bypassing the browser controls.

The existing Vercel handler is not the active implementation used by the current frontend and references an absent PDF module. This change will remain scoped to the deployed Firebase function in `functions/src/index.tsx`, the web form, and the Firebase PDF template.

## PDF and Email

The generated PDF will display:

- the selected student-situation value;
- the approved consent wording; and
- `Súhlas udelený: Áno`.

The notification email body will also show the selected situation and confirm that consent was granted, making the submitted values visible without opening the attachment. Existing attachments and recipient behaviour remain unchanged.

## Error Handling

Requests with a missing or unsupported student situation will receive HTTP 400 with the existing Slovak required-fields error. Requests without explicit consent will receive HTTP 400 with a Slovak consent-specific error. Existing email validation and internal-error handling remain unchanged.

## Testing and Verification

Tests will cover the reusable validation rules for the three accepted situation values and the requirement that consent equal `true`. PDF-related types and rendering will be exercised by the existing TypeScript build, and both the web and functions production builds will be run before committing and pushing. The final diff and git status will be checked so unrelated `.DS_Store` files are not committed.

## Deployment

Implementation changes will be committed to the current `main` branch and pushed to `origin/main`, which the project owner expects to trigger the configured deployment.
