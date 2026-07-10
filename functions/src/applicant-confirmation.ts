export function createApplicantConfirmationEmail(email: string) {
  return {
    to: email,
    subject: "Vaša prihláška Erasmus+ bola úspešne odoslaná",
    html: `
      <h2>Prihláška Erasmus+</h2>
      <p>Vaša prihláška pre Erasmus+ bola úspešne odoslaná.</p>
    `,
  };
}
