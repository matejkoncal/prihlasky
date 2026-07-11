// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

type RepositoryModule = typeof import("./application-attachment-repository");

async function loadRepository(): Promise<RepositoryModule | null> {
  return vi.importActual<RepositoryModule>("./application-attachment-repository").catch(() => null);
}

const applicationId = "11111111-1111-1111-1111-111111111111";

function fakeClient(paths: string[] = []) {
  const upload = vi.fn(async () => ({ error: null }));
  const remove = vi.fn(async () => ({ error: null }));
  const insert = vi.fn(async () => ({ error: null }));
  const selectEq = vi.fn(async () => ({
    data: paths.map((storage_path) => ({ storage_path })),
    error: null,
  }));
  const deleteEq = vi.fn(async () => ({ error: null }));
  const client = {
    storage: { from: vi.fn(() => ({ upload, remove })) },
    from: vi.fn(() => ({
      insert,
      select: vi.fn(() => ({ eq: selectEq })),
      delete: vi.fn(() => ({ eq: deleteEq })),
    })),
  };
  return { client, upload, remove, insert, selectEq, deleteEq };
}

describe("application attachment repository", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uploads CV and motivation letter under random safe paths and records metadata", async () => {
    const repositoryModule = await loadRepository();
    expect(repositoryModule).not.toBeNull();
    if (!repositoryModule) return;
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .mockReturnValueOnce("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    const fake = fakeClient();
    const repository = repositoryModule.createApplicationAttachmentRepository(fake.client);

    await repository.store(applicationId, {
      cv: { name: "Životopis.pdf", content: Buffer.from("cv").toString("base64") },
      motivationLetter: { name: "list.docx", content: Buffer.from("letter").toString("base64") },
    });

    expect(fake.upload).toHaveBeenNthCalledWith(
      1,
      `${applicationId}/cv-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf`,
      expect.any(Uint8Array),
      { contentType: "application/pdf", upsert: false },
    );
    expect(fake.upload).toHaveBeenNthCalledWith(
      2,
      `${applicationId}/motivation_letter-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.docx`,
      expect.any(Uint8Array),
      {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      },
    );
    expect(fake.insert).toHaveBeenCalledWith(expect.objectContaining({
      application_id: applicationId,
      kind: "cv",
      original_filename: "Životopis.pdf",
      mime_type: "application/pdf",
      size_bytes: 2,
    }));
  });

  it("removes stored objects and metadata", async () => {
    const repositoryModule = await loadRepository();
    expect(repositoryModule).not.toBeNull();
    if (!repositoryModule) return;
    const fake = fakeClient([`${applicationId}/cv.pdf`, `${applicationId}/letter.docx`]);
    const repository = repositoryModule.createApplicationAttachmentRepository(fake.client);

    await repository.removeAll(applicationId);

    expect(fake.remove).toHaveBeenCalledWith([
      `${applicationId}/cv.pdf`,
      `${applicationId}/letter.docx`,
    ]);
    expect(fake.deleteEq).toHaveBeenCalledWith("application_id", applicationId);
  });
});
