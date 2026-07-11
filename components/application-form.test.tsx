import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApplicationForm from "./application-form";

const PRIVACY_LABEL =
  "Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške na účely výberového konania projektu Erasmus+.";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function fillRequiredFieldsAndSubmit(email = "jan@example.com") {
  const user = userEvent.setup();
  fireEvent.change(screen.getByRole("textbox", { name: /Meno a priezvisko/ }), {
    target: { value: "Ján Žiak" },
  });
  fireEvent.change(screen.getByLabelText(/Dátum narodenia/), {
    target: { value: "2008-01-01" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Trieda \/ Class/ }), {
    target: { value: "3.A" },
  });
  await user.click(screen.getByRole("combobox", { name: /Odbor/ }));
  await user.click(screen.getByRole("option", { name: "Mechanik elektrotechnik" }));
  fireEvent.change(screen.getByRole("textbox", { name: /Ulica a číslo/ }), {
    target: { value: "Školská 1" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Telefón/ }), {
    target: { value: "+421900000000" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Email$/ }), {
    target: { value: email },
  });
  await user.click(screen.getByLabelText("Žiak so zdravotným znevýhodnením"));
  if (!(screen.getByLabelText(PRIVACY_LABEL) as HTMLInputElement).checked) {
    await user.click(screen.getByLabelText(PRIVACY_LABEL));
  }
  await user.click(screen.getByRole("button", { name: "Odoslať prihlášku" }));
}

describe("ApplicationForm", () => {
  it("keeps submission disabled until privacy consent", async () => {
    const user = userEvent.setup();
    render(<ApplicationForm />);
    const submit = screen.getByRole("button", { name: "Odoslať prihlášku" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText(PRIVACY_LABEL));
    expect(submit).toBeEnabled();
  });

  it("renders the official co-funding mark", () => {
    render(<ApplicationForm />);
    expect(
      screen.getByRole("img", { name: "Spolufinancované Európskou úniou" }),
    ).toBeInTheDocument();
  });

  it("rejects attachments larger than 3 MB in total without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ApplicationForm />);
    const first = new File([new Uint8Array(2 * 1024 * 1024)], "cv.pdf", {
      type: "application/pdf",
    });
    const second = new File([new Uint8Array(1024 * 1024 + 1)], "letter.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Životopis / CV"), first);
    await user.upload(
      screen.getByLabelText("Motivačný list / Motivation letter"),
      second,
    );
    await fillRequiredFieldsAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Prílohy môžu mať spolu maximálne 3 MB",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the same-origin route and shows confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<ApplicationForm />);
    await fillRequiredFieldsAndSubmit("jan@example.com");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/submit",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toEqual(expect.objectContaining({
      className: "3.A",
      fieldOfStudy: "Mechanik elektrotechnik",
      classField: "3.A – Mechanik elektrotechnik",
    }));
    expect(
      await screen.findByText("Prihláška bola úspešne odoslaná."),
    ).toBeInTheDocument();
    expect(screen.getByText(/jan@example.com/)).toBeInTheDocument();
  });
});
