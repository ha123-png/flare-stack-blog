import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as MediaRepo from "@/features/media/data/media.data";
import type { McpToolContext } from "../../service/mcp.types";
import { McpMediaUploadOutputSchema } from "./schema/mcp-media.schema";
import { mediaUploadFromUrlTool } from "./tools/media-upload-from-url.tool";

// Exercise the real MediaService.upload and R2 adapter; mock only external I/O.
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYQAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const sourceUrl = "https://images.example.com/cat.png?signature=source-secret";
const r2Put = vi.fn();
const r2Delete = vi.fn();
const background: Promise<unknown>[] = [];
const context = {
  db: {} as DB,
  env: { R2: { put: r2Put, delete: r2Delete } } as unknown as Env,
  executionCtx: {
    waitUntil(task: Promise<unknown>) {
      background.push(task);
    },
  } as ExecutionContext,
  principal: { clientId: "test", subject: "author", scopes: ["media:write"] },
} satisfies McpToolContext;

beforeEach(() => {
  background.length = 0;
  r2Put.mockReset().mockResolvedValue(undefined);
  r2Delete.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(png, {
        headers: { "Content-Type": "image/png" },
      }),
    ),
  );
  vi.spyOn(MediaRepo, "insertMedia").mockImplementation(async (_db, item) => ({
    ...item,
    id: 42,
    width: item.width ?? null,
    height: item.height ?? null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
  }));
});
afterEach(async () => {
  await Promise.all(background);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MCP import using the real media upload pipeline", () => {
  it("stores the downloaded bytes and dimensions with the original key and URL rules", async () => {
    let storedBytes: ArrayBuffer | undefined;
    r2Put.mockImplementation(async (_key, stream) => {
      storedBytes = await new Response(stream).arrayBuffer();
    });
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).not.toBe(true);
    const output = McpMediaUploadOutputSchema.parse(
      "structuredContent" in result ? result.structuredContent : undefined,
    );
    expect(output).toMatchObject({
      id: 42,
      url: `/images/${output.key}`,
      fileName: "cat.png",
      mimeType: "image/png",
      sizeInBytes: png.byteLength,
      width: 1,
      height: 1,
      inUse: false,
    });
    expect(new Uint8Array(storedBytes!)).toEqual(png);
    expect(r2Put).toHaveBeenCalledWith(output.key, expect.any(ReadableStream), {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { originalName: "cat.png" },
    });
    expect(MediaRepo.insertMedia).toHaveBeenCalledWith(context.db, {
      key: output.key,
      url: output.url,
      fileName: output.fileName,
      mimeType: output.mimeType,
      sizeInBytes: output.sizeInBytes,
      width: 1,
      height: 1,
    });
    expect(r2Delete).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("source-secret");
  });

  it("keeps the existing R2 rollback on failed database insertion", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(MediaRepo.insertMedia).mockRejectedValueOnce(
      new Error("DB failure"),
    );
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Could not save the image record");
    expect("structuredContent" in result).toBe(false);
    expect(r2Put).toHaveBeenCalledTimes(1);
    expect(background).toHaveLength(1);
    await Promise.all(background);
    expect(r2Delete).toHaveBeenCalledExactlyOnceWith(r2Put.mock.calls[0][0]);
    expect(JSON.stringify(result)).not.toContain("DB failure");
  });

  it("does not insert a database record when R2 upload fails", async () => {
    r2Put.mockRejectedValueOnce(new Error("R2 credentials and internal stack"));
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Could not upload the image");
    expect(MediaRepo.insertMedia).not.toHaveBeenCalled();
    expect(r2Delete).not.toHaveBeenCalled();
    expect(background).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain("credentials");
  });
});
