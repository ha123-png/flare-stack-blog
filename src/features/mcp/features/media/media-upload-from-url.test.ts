import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import * as MediaService from "@/features/media/service/media.service";
import { err, ok } from "@/lib/errors";
import type { McpToolContext } from "../../service/mcp.types";
import { registerMcpTool } from "../../service/mcp-tool";
import { mcpMediaTools } from "./index";
import {
  McpMediaItemSchema,
  McpMediaListOutputSchema,
  McpMediaUploadFromUrlInputSchema,
  McpMediaUploadOutputSchema,
  McpMediaUsageOutputSchema,
} from "./schema/mcp-media.schema";
import { mediaDeleteTool } from "./tools/media-delete.tool";
import { mediaGetUsageTool } from "./tools/media-get-usage.tool";
import { mediaListTool } from "./tools/media-list.tool";
import { mediaUploadFromUrlTool } from "./tools/media-upload-from-url.tool";

vi.mock("@/features/media/service/media.service", () => ({
  upload: vi.fn(),
  getMediaList: vi.fn(),
  getLinkedMediaKeys: vi.fn(),
  getLinkedPosts: vi.fn(),
  deleteImage: vi.fn(),
}));

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYQAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const sourceUrl = "https://images.example.com/cat.png?signature=source-secret";
const context = {
  db: {} as DB,
  env: {} as Env,
  executionCtx: { waitUntil: vi.fn() } as unknown as ExecutionContext,
  principal: {
    clientId: "test-client",
    subject: "test-author",
    scopes: ["media:read", "media:write"],
  },
} satisfies McpToolContext;
const fetchMock = vi.fn<typeof fetch>();

function imageResponse(body: BodyInit = png, headers: HeadersInit = {}) {
  return new Response(body, {
    headers: { "Content-Type": "image/png", ...headers },
  });
}

async function errorMessage(url = sourceUrl) {
  const result = await mediaUploadFromUrlTool.handler({ url }, context);
  expect(result.isError).toBe(true);
  expect(MediaService.upload).not.toHaveBeenCalled();
  expect(JSON.stringify(result)).not.toContain("source-secret");
  expect("structuredContent" in result).toBe(false);
  return result.content[0].text;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(imageResponse());
  vi.mocked(MediaService.upload).mockImplementation(
    async (_context, { file }) =>
      ok({
        id: 17,
        key: "stored-cat.png",
        url: "/images/stored-cat.png",
        fileName: file.name,
        mimeType: file.type,
        sizeInBytes: file.size,
        width: 1,
        height: 1,
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
      }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("media_upload_from_url", () => {
  it("imports through the existing upload service and returns the media output contract", async () => {
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl, fileName: "cat-autumn.png" },
      context,
    );
    expect(result.isError).not.toBe(true);
    expect(MediaService.upload).toHaveBeenCalledTimes(1);
    const [receivedContext, { file }] = vi.mocked(MediaService.upload).mock
      .calls[0];
    expect(receivedContext).toBe(context);
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("cat-autumn.png");
    expect(file.type).toBe("image/png");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(png);
    const output = McpMediaUploadOutputSchema.parse(
      "structuredContent" in result ? result.structuredContent : undefined,
    );
    expect(McpMediaItemSchema.parse(output)).toEqual(output);
    expect(output).toMatchObject({
      id: 17,
      url: "/images/stored-cat.png",
      fileName: "cat-autumn.png",
      sizeInBytes: png.byteLength,
      inUse: false,
      createdAt: "2026-10-01T00:00:00.000Z",
    });
    expect(result.content[0].text).toContain(output.url);
    expect(JSON.stringify(result)).not.toContain("source-secret");
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
    expect(init?.headers).toEqual({ Accept: ACCEPTED_IMAGE_TYPES.join(", ") });
    expect(init?.signal?.aborted).toBe(true);
  });

  it.each([
    ["image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image.jpg"],
    ["image/jpg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image.jpg"],
    ["image/png", png, "image.png"],
    ["image/webp", new TextEncoder().encode("RIFF0000WEBPVP8 "), "image.webp"],
    ["image/gif", new TextEncoder().encode("GIF89a1234"), "image.gif"],
  ])("accepts %s using the existing whitelist", async (mimeType, bytes, fileName) => {
    fetchMock.mockResolvedValue(
      new Response(bytes, { headers: { "Content-Type": mimeType } }),
    );
    const result = await mediaUploadFromUrlTool.handler(
      { url: "https://images.example.com/download?signature=source-secret" },
      context,
    );
    expect(result.isError).not.toBe(true);
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file).toMatchObject({
      name: fileName,
      type: mimeType,
    });
  });

  it("normalizes MIME parameters and uses a decoded pathname without its query", async () => {
    fetchMock.mockResolvedValue(
      imageResponse(png, { "Content-Type": " IMAGE/PNG; charset=binary " }),
    );
    const result = await mediaUploadFromUrlTool.handler(
      {
        url: "https://images.example.com/my%20cat.png?signature=source-secret#fragment",
      },
      context,
    );
    expect(result.isError).not.toBe(true);
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file.name).toBe(
      "my cat.png",
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain("#fragment");
  });

  it("keeps names safe, including explicit paths and signed query parameters", async () => {
    await mediaUploadFromUrlTool.handler(
      {
        url: sourceUrl,
        fileName: "..\\cats\\cat-autumn.png?signature=source-secret",
      },
      context,
    );
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file.name).toBe(
      "cat-autumn.png",
    );
  });

  it("uses a stable fallback for undecodable pathname escapes", async () => {
    await mediaUploadFromUrlTool.handler(
      { url: "https://images.example.com/%zz.png?token=secret" },
      context,
    );
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file.name).toBe(
      "image.png",
    );
  });

  it.each([
    "text/html",
    "image/svg+xml",
    "image/avif",
    "application/octet-stream",
    "",
  ])("rejects unsupported MIME %s", async (mime) => {
    fetchMock.mockResolvedValue(
      new Response(png, { headers: mime ? { "Content-Type": mime } : {} }),
    );
    expect(await errorMessage()).toContain("Unsupported image MIME type");
  });

  it.each([
    ["image/png", "<html>not a PNG</html>"],
    ["image/jpeg", "not a JPEG"],
    ["image/gif", "GIF80a1234"],
    ["image/webp", "RIFF0000WAVEdata"],
  ])("rejects a false %s MIME declaration", async (mime, body) => {
    fetchMock.mockResolvedValue(
      new Response(body, { headers: { "Content-Type": mime } }),
    );
    expect(await errorMessage()).toContain("does not match");
  });

  it("rejects an oversized Content-Length before reading the image", async () => {
    const response = imageResponse(png, {
      "Content-Length": String(MAX_FILE_SIZE + 1),
    });
    const reader = vi.spyOn(response.body!, "getReader");
    fetchMock.mockResolvedValue(response);
    expect(await errorMessage()).toContain("10 MB");
    expect(reader).not.toHaveBeenCalled();
    expect(response.bodyUsed).toBe(true);
  });

  it.each([
    undefined,
    "1",
    "garbage",
  ])("limits actual streamed bytes even with Content-Length %s", async (length) => {
    const cancel = vi.fn();
    let chunk = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(chunk++ === 0 ? MAX_FILE_SIZE : 1));
      },
      cancel,
    });
    fetchMock.mockResolvedValue(
      imageResponse(body, length ? { "Content-Length": length } : {}),
    );
    expect(await errorMessage()).toContain("10 MB");
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("accepts an image exactly at the shared 10 MB limit", async () => {
    const bytes = new Uint8Array(MAX_FILE_SIZE);
    bytes.set(png);
    fetchMock.mockResolvedValue(imageResponse(bytes));
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).not.toBe(true);
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file.size).toBe(
      MAX_FILE_SIZE,
    );
  });

  it.each([
    403, 404, 500, 304,
  ])("reports HTTP %i without the source response body", async (status) => {
    fetchMock.mockResolvedValue(
      new Response(status === 304 ? null : "private source-secret", { status }),
    );
    expect(await errorMessage()).toContain(`HTTP ${status}`);
  });

  it.each([null, ""])("rejects empty image responses", async (body) => {
    fetchMock.mockResolvedValue(
      new Response(body, { headers: { "Content-Type": "image/png" } }),
    );
    expect(await errorMessage()).toContain("empty");
  });

  it("reports a 204 response without an image body as empty", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await errorMessage()).toContain("empty");
  });

  it("hides transport exceptions and their signed URL or token", async () => {
    fetchMock.mockRejectedValue(
      new Error(`Failed ${sourceUrl} Authorization: oauth-secret`),
    );
    const message = await errorMessage();
    expect(message).toContain("Image download failed");
    expect(message).not.toContain("oauth-secret");
    expect(message).not.toContain("Error:");
  });

  it("reports interrupted response streams and cancels them", async () => {
    fetchMock.mockResolvedValue(
      imageResponse(
        new ReadableStream({
          start(controller) {
            controller.error(new Error(`Read failed ${sourceUrl}`));
          },
        }),
      ),
    );
    expect(await errorMessage()).toContain("Image download failed");
  });

  it("aborts a hung network request at the download deadline", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () =>
              reject(new DOMException("Aborted source-secret", "AbortError")),
            { once: true },
          );
        }),
    );
    const pending = errorMessage();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await pending).toContain("timed out");
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    "not a URL",
    "/images/cat.png",
  ])("rejects malformed or relative input %s", async (url) => {
    expect(await errorMessage(url)).toContain("Invalid image URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "http://example.com/cat.png",
    "ftp://example.com/cat.png",
    "file:///C:/cat.png",
    "C:\\cat.png",
    "data:image/png;base64,AAA",
    "javascript:alert(1)",
  ])("rejects non-HTTPS input %s", async (url) => {
    expect(await errorMessage(url)).toContain("Only HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "localhost",
    "localhost.",
    "localhost..",
    "test.localhost",
    "printer.local",
    "metadata.google.internal",
    "intranet",
    "home.arpa",
    "127.0.0.1",
    "127.20.30.40",
    "127.1",
    "2130706433",
    "0x7f000001",
    "0177.0.0.1",
    "0.0.0.0",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "[::]",
    "[::1]",
    "[::ffff:127.0.0.1]",
    "[::ffff:c0a8:1]",
    "[fc00::1]",
    "[fd00::1]",
    "[fe80::1]",
    "[ff02::1]",
    "[64:ff9b::a00:1]",
    "[2001:db8::1]",
    "[2002:a00:1::1]",
  ])("rejects a non-public target %s before fetching", async (host) => {
    expect(await errorMessage(`https://${host}/cat.png`)).toContain(
      "targets are not allowed",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "https://user:password@example.com/cat.png",
    "https://user@example.com/cat.png",
  ])("rejects URL credentials", async (url) => {
    expect(await errorMessage(url)).toContain("credentials");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "https://8.8.8.8/cat.png",
    "https://[2606:4700:4700::1111]/cat.png",
    "https://images.example.com/cat.png",
  ])("allows a public target %s", async (url) => {
    expect(
      (await mediaUploadFromUrlTool.handler({ url }, context)).isError,
    ).not.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a validated relative HTTPS redirect without forwarding credentials", async () => {
    const first = new Response(null, {
      status: 302,
      headers: { Location: "/photos/cat.png?signature=redirect-secret" },
    });
    fetchMock
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(imageResponse());
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).not.toBe(true);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://images.example.com/photos/cat.png?signature=redirect-secret",
    );
    expect(vi.mocked(MediaService.upload).mock.calls[0][1].file.name).toBe(
      "cat.png",
    );
    expect(JSON.stringify(result)).not.toContain("redirect-secret");
    for (const [, init] of fetchMock.mock.calls)
      expect(init?.headers).toEqual({
        Accept: ACCEPTED_IMAGE_TYPES.join(", "),
      });
  });

  it.each([
    ["https://127.0.0.1/private", "targets are not allowed"],
    ["//192.168.0.1/private", "targets are not allowed"],
    ["https://[::1]/private", "targets are not allowed"],
    ["http://images.example.com/cat.png", "Only HTTPS"],
    ["https://user:source-secret@images.example.com/cat.png", "credentials"],
    ["file:///etc/passwd", "Only HTTPS"],
  ])("rejects unsafe redirect %s before following it", async (location, message) => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: location } }),
    );
    expect(await errorMessage()).toContain(message);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops redirect loops after three hops", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(null, { status: 302, headers: { Location: sourceUrl } }),
    );
    expect(await errorMessage()).toContain("too many redirects");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("reports redirects with missing Location", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302 }));
    expect(await errorMessage()).toContain("no destination");
  });

  it.each([
    "result",
    "exception",
  ])("reports existing uploader %s failures without leaking secrets", async (mode) => {
    if (mode === "result")
      vi.mocked(MediaService.upload).mockResolvedValue(
        err({ reason: "MEDIA_RECORD_CREATE_FAILED" }),
      );
    else
      vi.mocked(MediaService.upload).mockRejectedValue(
        new Error("R2 secret credentials and stack"),
      );
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("blog media library");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect("structuredContent" in result).toBe(false);
  });

  it("serializes unknown image dimensions as null", async () => {
    vi.mocked(MediaService.upload).mockResolvedValue(
      ok({
        id: 18,
        key: "other.png",
        url: "/images/other.png",
        fileName: "image.png",
        mimeType: "image/png",
        sizeInBytes: png.byteLength,
        width: null,
        height: null,
        createdAt: new Date(),
      }),
    );
    const result = await mediaUploadFromUrlTool.handler(
      { url: sourceUrl },
      context,
    );
    expect(
      McpMediaUploadOutputSchema.parse(
        "structuredContent" in result ? result.structuredContent : null,
      ),
    ).toMatchObject({ width: null, height: null, inUse: false });
  });

  it("uses the standard MCP registration path and requires media:write", async () => {
    const server = new McpServer({ name: "media-test", version: "1.0.0" });
    const readContext: McpToolContext = {
      ...context,
      principal: { ...context.principal, scopes: ["media:read"] },
    };
    for (const tool of mcpMediaTools)
      registerMcpTool(server, readContext, tool);
    const client = new Client({ name: "media-client-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual([
        "media_list",
        "media_get_usage",
        "media_upload_from_url",
        "media_delete",
      ]);
      const result = await client.callTool({
        name: "media_upload_from_url",
        arguments: { url: sourceUrl },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("media:write");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(MediaService.upload).not.toHaveBeenCalled();
      readContext.principal.scopes = ["media:write"];
      const uploaded = await client.callTool({
        name: "media_upload_from_url",
        arguments: { url: sourceUrl },
      });
      expect(uploaded.isError).not.toBe(true);
      expect(
        McpMediaUploadOutputSchema.parse(uploaded.structuredContent),
      ).toMatchObject({ id: 17, url: "/images/stored-cat.png" });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("validates the input shape without adding base64 or local-file arguments", () => {
    expect(McpMediaUploadFromUrlInputSchema.parse({ url: sourceUrl })).toEqual({
      url: sourceUrl,
    });
    expect(
      McpMediaUploadFromUrlInputSchema.safeParse({
        url: sourceUrl,
        fileName: "",
      }).success,
    ).toBe(false);
    expect(
      McpMediaUploadFromUrlInputSchema.safeParse({ fileName: "cat.png" })
        .success,
    ).toBe(false);
    expect(McpMediaUploadFromUrlInputSchema.safeParse({ url: 1 }).success).toBe(
      false,
    );
  });
});

describe("existing MCP media tools", () => {
  it("keeps list output and usage tracking intact", async () => {
    vi.mocked(MediaService.getMediaList).mockResolvedValue({
      items: [
        {
          id: 7,
          key: "old.png",
          url: "/images/old.png",
          fileName: "old.png",
          mimeType: "image/png",
          sizeInBytes: 100,
          width: null,
          height: null,
          createdAt: new Date(),
        },
      ],
      nextCursor: null,
    });
    vi.mocked(MediaService.getLinkedMediaKeys).mockResolvedValue(["old.png"]);
    const result = await mediaListTool.handler({}, context);
    const output = McpMediaListOutputSchema.parse(
      "structuredContent" in result ? result.structuredContent : null,
    );
    expect(output.items[0]).toMatchObject({ key: "old.png", inUse: true });
    expect(MediaService.getMediaList).toHaveBeenCalledWith(context, {});
  });

  it("keeps get-usage output intact", async () => {
    vi.mocked(MediaService.getLinkedPosts).mockResolvedValue([]);
    const result = await mediaGetUsageTool.handler({ key: "old.png" }, context);
    expect(
      McpMediaUsageOutputSchema.parse(
        "structuredContent" in result ? result.structuredContent : null,
      ),
    ).toEqual({ key: "old.png", inUse: false, posts: [] });
  });

  it("keeps delete behavior and its in-use guard intact", async () => {
    vi.mocked(MediaService.deleteImage)
      .mockResolvedValueOnce(ok({ success: true }))
      .mockResolvedValueOnce(err({ reason: "MEDIA_IN_USE" }));
    const result = await mediaDeleteTool.handler({ key: "old.png" }, context);
    expect("structuredContent" in result && result.structuredContent).toEqual({
      key: "old.png",
      deleted: true,
    });
    const blocked = await mediaDeleteTool.handler(
      { key: "linked.png" },
      context,
    );
    expect(blocked.isError).toBe(true);
    expect(blocked.content[0].text).toContain("still referenced");
    expect(MediaService.deleteImage).toHaveBeenCalledWith(context, "old.png");
  });
});
