import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "./App";

it("shows all situations and enables submit only after consent", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(
    screen.getByLabelText("Žiak so zdravotným znevýhodnením"),
  ).toBeTruthy();
  expect(
    screen.getByLabelText("Žiak zo sociálne znevýhodneného prostredia"),
  ).toBeTruthy();
  expect(
    screen.getByLabelText("Nepatrím do žiadnej z uvedených skupín"),
  ).toBeTruthy();

  const submitButton = screen.getByRole("button", {
    name: "Odoslať prihlášku",
  }) as HTMLButtonElement;
  expect(submitButton.disabled).toBe(true);

  await user.click(
    screen.getByLabelText(
      "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.",
    ),
  );

  expect(submitButton.disabled).toBe(false);
});
