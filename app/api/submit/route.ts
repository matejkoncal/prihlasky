import { renderDocument } from "@formepdf/core";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  createApplicationRepository,
  type ApplicationStoreClient,
} from "@/server/application-repository";
import {
  createApplicationAttachmentRepository,
  type AttachmentClient,
} from "@/server/application-attachment-repository";
import {
  SENDER_EMAIL,
  type EmailMessage,
} from "@/server/application-emails";
import { ApplicationPdf } from "@/server/application-pdf";
import { validateApplication } from "@/server/application-validation";
import {
  submitApplication,
  type SubmissionDependencies,
} from "@/server/submit-application";

export const runtime = "nodejs";
export const maxDuration = 60;

export type DependenciesFactory = (
  apiKey: string | undefined,
) => SubmissionDependencies;

export const createProductionDependencies: DependenciesFactory = (apiKey) => {
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const resend = new Resend(apiKey);
  const supabase = createAdminSupabaseClient();

  return {
    applications: createApplicationRepository(
      supabase as unknown as ApplicationStoreClient,
    ),
    attachments: createApplicationAttachmentRepository(
      supabase as unknown as AttachmentClient,
    ),
    now: () => new Date(),
    renderPdf: async (data) => renderDocument(ApplicationPdf({ data })),
    sendEmail: async (message: EmailMessage) => {
      const { error } = await resend.emails.send({
        from: `Erasmus+ Prihlášky <${SENDER_EMAIL}>`,
        ...message,
      });
      if (error) throw new Error(error.message);
    },
  };
};

export function createSubmitRoute(
  dependenciesFactory: DependenciesFactory = createProductionDependencies,
) {
  return async function handlePost(request: Request): Promise<Response> {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return Response.json(
        { error: "Neplatné údaje prihlášky" },
        { status: 400 },
      );
    }

    const validation = validateApplication(input);
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    try {
      const dependencies = dependenciesFactory(process.env.RESEND_API_KEY);
      const result = await submitApplication(validation.data, dependencies);
      if (!result.success) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      return Response.json({ success: true });
    } catch (error) {
      console.error("Error processing submission:", error);
      return Response.json({ error: "Interná chyba servera" }, { status: 500 });
    }
  };
}

export const POST = createSubmitRoute();
