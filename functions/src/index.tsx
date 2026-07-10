import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import cors from "cors";
import { renderDocument } from "@formepdf/core";
import { Resend } from "resend";
import { ApplicationPdf } from "./pdf-template";
import {
  type StudentSituation,
  validateApplicationExtras,
} from "./application-validation";

const resendApiKey = defineSecret("RESEND_API_KEY");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

const RECIPIENT_EMAILS = ["matej@koncal.sk", "koncalova@sostar.sk"];
const SENDER_EMAIL = "prihlasky@koncal.sk";

interface FileAttachment {
  name: string;
  content: string; // base64
}

interface FormData {
  name: string;
  dateOfBirth: string;
  classField: string;
  address1: string;
  address2: string;
  address3: string;
  phone: string;
  email: string;
  studentSituation: StudentSituation;
  personalDataConsent: true;
  cv?: FileAttachment;
  motivationLetter?: FileAttachment;
}

app.post("/api/submit", async (req: express.Request, res: express.Response) => {
  try {
    const data: FormData = req.body;

    // Validate required fields
    if (
      !data.name ||
      !data.dateOfBirth ||
      !data.classField ||
      !data.address1 ||
      !data.phone ||
      !data.email
    ) {
      res.status(400).json({ error: "Vyplňte všetky povinné polia" });
      return;
    }

    const extrasValidationError = validateApplicationExtras(data);
    if (extrasValidationError) {
      res.status(400).json({ error: extrasValidationError });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({ error: "Neplatná emailová adresa" });
      return;
    }

    const now = new Date();
    const date = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

    // Generate PDF
    const pdfBytes = await renderDocument(
      ApplicationPdf({ data: { ...data, date } }),
    );

    // Send email via Resend
    const resend = new Resend(resendApiKey.value());
    await resend.emails.send({
      from: `Erasmus+ Prihlášky <${SENDER_EMAIL}>`,
      to: RECIPIENT_EMAILS,
      subject: `Nová prihláška Erasmus+ - ${data.name}`,
      html: `
        <h2>Nová prihláška do výberového konania Erasmus+ 2026/2027</h2>
        <p><strong>Meno:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Dátum narodenia:</strong> ${escapeHtml(data.dateOfBirth)}</p>
        <p><strong>Trieda:</strong> ${escapeHtml(data.classField)}</p>
        <p><strong>Adresa:</strong> ${escapeHtml(data.address1)} ${escapeHtml(data.address2 || "")} ${escapeHtml(data.address3 || "")}</p>
        <p><strong>Telefón:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Situácia žiaka:</strong> ${escapeHtml(data.studentSituation)}</p>
        <p><strong>Súhlas so spracovaním osobných údajov:</strong> Áno</p>
        <p><em>PDF prihláška je v prílohe.</em></p>
      `,
      attachments: [
        {
          filename: `prihlaska-erasmus-${data.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
        ...(data.cv
          ? [
              {
                filename: data.cv.name,
                content: data.cv.content,
              },
            ]
          : []),
        ...(data.motivationLetter
          ? [
              {
                filename: data.motivationLetter.name,
                content: data.motivationLetter.content,
              },
            ]
          : []),
      ],
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error processing submission:", err);
    res.status(500).json({ error: "Interná chyba servera" });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const api = onRequest({ secrets: [resendApiKey] }, app);
