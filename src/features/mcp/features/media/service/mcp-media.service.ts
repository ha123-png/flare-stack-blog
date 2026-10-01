import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import * as MediaService from "@/features/media/service/media.service";
import { getContentTypeFromKey } from "@/features/media/utils/media.utils";
import { serializeMcpDate } from "../../../service/mcp-serialize";

const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Only controlled messages reach the MCP client; never include source URLs. */
export class McpMediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpMediaUploadError";
  }
}

// Validate literal IPs and obvious local hostnames; DNS is not resolved or pinned.
function isPublicHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (host.startsWith("[")) {
    // URL already canonicalizes IPv6. Allow global unicast, excluding special
    // purpose/documentation and transition ranges (including embedded IPv4).
    const [first, second] = host
      .slice(1, -1)
      .split(":")
      .map((part) => parseInt(part || "0", 16));
    return (
      first >= 0x2000 &&
      first <= 0x3fff &&
      first !== 0x2002 &&
      !(first === 0x2001 && (second < 0x200 || second === 0xdb8))
    );
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b, c] = host.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  // Single-label hosts and local/reserved DNS suffixes are never image origins.
  return (
    host.includes(".") &&
    ![
      "localhost",
      "local",
      "localdomain",
      "lan",
      "internal",
      "home",
      "corp",
      "arpa",
      "onion",
      "test",
      "invalid",
    ].some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
  );
}

function publicImageUrl(input: string, base?: URL) {
  let url: URL;
  try {
    url = base ? new URL(input, base) : new URL(input);
  } catch {
    throw new McpMediaUploadError(
      "Invalid image URL. Provide an absolute public HTTPS URL.",
    );
  }
  if (url.protocol !== "https:") {
    throw new McpMediaUploadError("Only HTTPS image URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new McpMediaUploadError(
      "Image URLs must not contain username or password credentials.",
    );
  }
  if (!isPublicHostname(url.hostname)) {
    throw new McpMediaUploadError(
      "Local, private-network and reserved image targets are not allowed.",
    );
  }
  url.hash = "";
  return url;
}

function safeFileName(input: string) {
  const basename = input.split(/[?#]/, 1)[0].split(/[\\/]/).pop() ?? "";
  return Array.from(basename)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127 && !'<>:"|*'.includes(character);
    })
    .join("")
    .trim()
    .replace(/^\.+|[. ]+$/g, "")
    .slice(0, 255);
}

function imageFileName(url: URL, mimeType: string, provided?: string) {
  const extension =
    mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
  if (provided) {
    return safeFileName(provided) || `image.${extension}`;
  }
  let name = "";
  try {
    name = safeFileName(
      decodeURIComponent(url.pathname.split("/").pop() ?? ""),
    );
  } catch {
    // Invalid percent escapes should not prevent importing an otherwise valid URL.
  }
  const inferredType = getContentTypeFromKey(name);
  return name &&
    inferredType === (mimeType === "image/jpg" ? "image/jpeg" : mimeType)
    ? name
    : `image.${extension}`;
}

function hasImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    );
  }
  const header = String.fromCharCode(...bytes.subarray(0, 12));
  if (mimeType === "image/gif") {
    return header.startsWith("GIF87a") || header.startsWith("GIF89a");
  }
  return (
    mimeType === "image/webp" &&
    header.startsWith("RIFF") &&
    header.slice(8, 12) === "WEBP"
  );
}

async function readImageBytes(response: Response) {
  if (!response.body)
    throw new McpMediaUploadError("The image response is empty.");
  const reader = response.body.getReader();
  // One bounded buffer also avoids retaining millions of tiny stream chunks.
  const buffer = new Uint8Array(MAX_FILE_SIZE);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_SIZE) {
        throw new McpMediaUploadError("Image exceeds the 10 MB upload limit.");
      }
      buffer.set(value, size - value.byteLength);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (size === 0) throw new McpMediaUploadError("The image response is empty.");
  return buffer.subarray(0, size);
}

async function downloadImage(input: { url: string; fileName?: string }) {
  let url = publicImageUrl(input.url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  let response: Response | undefined;
  try {
    for (let redirects = 0; ; redirects++) {
      response = await fetch(url.href, {
        method: "GET",
        headers: { Accept: ACCEPTED_IMAGE_TYPES.join(", ") },
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });
      if (!REDIRECT_STATUSES.has(response.status)) break;
      const location = response.headers.get("Location");
      await response.body?.cancel();
      if (!location)
        throw new McpMediaUploadError("Image redirect has no destination URL.");
      if (redirects >= MAX_REDIRECTS)
        throw new McpMediaUploadError(
          "Image URL has too many redirects (maximum 3).",
        );
      url = publicImageUrl(location, url);
    }
    if (!response.ok) {
      throw new McpMediaUploadError(
        `Image source returned HTTP ${response.status}; a successful response is required.`,
      );
    }
    if (!response.body) {
      throw new McpMediaUploadError("The image response is empty.");
    }
    const mimeType =
      response.headers
        .get("Content-Type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase() ?? "";
    if (!ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
      throw new McpMediaUploadError(
        "Unsupported image MIME type. Use JPEG, JPG, PNG, WebP or GIF.",
      );
    }
    if (Number(response.headers.get("Content-Length")) > MAX_FILE_SIZE) {
      throw new McpMediaUploadError("Image exceeds the 10 MB upload limit.");
    }
    const bytes = await readImageBytes(response);
    if (!hasImageSignature(bytes, mimeType)) {
      throw new McpMediaUploadError(
        "Downloaded content does not match its declared image MIME type.",
      );
    }
    const file = new File(
      [bytes],
      imageFileName(url, mimeType, input.fileName),
      { type: mimeType },
    );
    if (file.size > MAX_FILE_SIZE)
      throw new McpMediaUploadError("Image exceeds the 10 MB upload limit.");
    return file;
  } catch (error) {
    if (error instanceof McpMediaUploadError) throw error;
    throw new McpMediaUploadError(
      controller.signal.aborted
        ? "Image download timed out after 30 seconds."
        : "Image download failed. Check that the HTTPS URL is publicly accessible.",
    );
  } finally {
    clearTimeout(timer);
    controller.abort();
    if (response?.body && !response.bodyUsed)
      await response.body.cancel().catch(() => {});
  }
}

export async function uploadMcpMediaFromUrl(
  context: DbContext & { executionCtx: ExecutionContext },
  input: { url: string; fileName?: string },
) {
  const file = await downloadImage(input);
  let result: Awaited<ReturnType<typeof MediaService.upload>>;
  try {
    result = await MediaService.upload(context, { file });
  } catch {
    throw new McpMediaUploadError(
      "Could not upload the image to the blog media library.",
    );
  }
  if (result.error) {
    throw new McpMediaUploadError(
      "Could not save the image record in the blog media library.",
    );
  }
  const item = result.data;
  return {
    id: item.id,
    key: item.key,
    url: item.url,
    fileName: item.fileName,
    mimeType: item.mimeType,
    sizeInBytes: item.sizeInBytes,
    width: item.width ?? null,
    height: item.height ?? null,
    createdAt: serializeMcpDate(item.createdAt),
    inUse: false as const,
  };
}

export async function listMcpMedia(
  context: DbContext,
  input: {
    cursor?: number;
    limit?: number;
    search?: string;
    unusedOnly?: boolean;
  },
) {
  const result = await MediaService.getMediaList(context, input);
  const keys = result.items.map((item) => item.key);
  const linkedKeys = input.unusedOnly
    ? []
    : await MediaService.getLinkedMediaKeys(context, keys);
  const linkedKeySet = new Set(linkedKeys);

  return {
    items: result.items.map((item) => ({
      id: item.id,
      key: item.key,
      url: item.url,
      fileName: item.fileName,
      mimeType: item.mimeType,
      sizeInBytes: item.sizeInBytes,
      width: item.width ?? null,
      height: item.height ?? null,
      createdAt: serializeMcpDate(item.createdAt),
      inUse: linkedKeySet.has(item.key),
    })),
    nextCursor: result.nextCursor,
  };
}

export async function getMcpMediaUsage(context: DbContext, key: string) {
  const posts = await MediaService.getLinkedPosts(context, key);

  return {
    key,
    inUse: posts.length > 0,
    posts,
  };
}
