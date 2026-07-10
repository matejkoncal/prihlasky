import type { StoredApplicationPayload } from "./application-types";

interface SupabaseError {
  message: string;
}

interface InsertResult {
  data: { id: string } | null;
  error: SupabaseError | null;
}

interface MutationResult {
  error: SupabaseError | null;
}

export interface ApplicationStoreClient {
  from(table: "applications"): {
    insert(values: {
      applicant_name: string;
      form_data: StoredApplicationPayload["formData"];
      delivery_status: "pending";
    }): {
      select(columns: "id"): { single(): Promise<InsertResult> };
    };
    update(values: {
      delivery_status: "sent" | "failed";
      delivery_error: string | null;
      email_sent_at?: string;
    }): {
      eq(column: "id", value: string): Promise<MutationResult>;
    };
  };
}

export interface StoredApplication {
  id: string;
}

export interface ApplicationRepository {
  createPending(data: StoredApplicationPayload): Promise<StoredApplication>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, error: Error): Promise<void>;
}

function throwIfError(error: SupabaseError | null): void {
  if (error) throw new Error(error.message);
}

export function createApplicationRepository(
  supabase: ApplicationStoreClient,
): ApplicationRepository {
  return {
    async createPending(data) {
      const { data: row, error } = await supabase
        .from("applications")
        .insert({
          applicant_name: data.applicantName,
          form_data: data.formData,
          delivery_status: "pending",
        })
        .select("id")
        .single();
      throwIfError(error);
      if (!row) throw new Error("Supabase did not return an application id");
      return row;
    },

    async markSent(id) {
      const { error } = await supabase
        .from("applications")
        .update({
          delivery_status: "sent",
          delivery_error: null,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", id);
      throwIfError(error);
    },

    async markFailed(id, error) {
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          delivery_status: "failed",
          delivery_error: error.message.slice(0, 500),
        })
        .eq("id", id);
      throwIfError(updateError);
    },
  };
}
