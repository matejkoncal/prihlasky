import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows all situations and enables submit only after consent", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(
    screen.getByRole("img", {
      name: "Spolufinancované Európskou úniou",
    }),
  ).toBeTruthy();

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

it("replaces the form with a success screen after submission", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  const user = userEvent.setup();
  render(<App />);

  fireEvent.change(
    screen.getByRole("textbox", {
      name: /Meno a priezvisko \/ Name and surname/,
    }),
    { target: { value: "Ján Žiak" } },
  );
  fireEvent.change(screen.getByLabelText(/Dátum narodenia \/ Date of Birth/), {
    target: { value: "2008-01-01" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Trieda \/ Class/ }), {
    target: { value: "3.A" },
  });
  await user.click(screen.getByRole("combobox", { name: "Odbor / Field of study" }));
  await user.click(screen.getByRole("option", { name: "Mechanik elektrotechnik" }));
  fireEvent.change(screen.getByRole("textbox", { name: /Ulica a číslo \/ Street/ }), {
    target: { value: "Školská 1" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Telefón \/ Phone/ }), {
    target: { value: "+421900000000" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Email/ }), {
    target: { value: "jan@example.com" },
  });
  await user.click(screen.getByLabelText("Žiak so zdravotným znevýhodnením"));
  await user.click(
    screen.getByLabelText(
      "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.",
    ),
  );
  await user.click(screen.getByRole("button", { name: "Odoslať prihlášku" }));

  await waitFor(() => {
    expect(screen.getByText("Prihláška bola úspešne odoslaná.")).toBeTruthy();
  });
  expect(
    screen.queryByRole("button", { name: "Odoslať prihlášku" }),
  ).toBeNull();
});
