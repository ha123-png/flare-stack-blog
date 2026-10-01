import app from "../../src/server";
export {
  CommentModerationWorkflow, ExportWorkflow, ImportWorkflow,
  PostAutoSnapshotWorkflow, PostProcessWorkflow, ScheduledPublishWorkflow,
  PasswordHasher, RateLimiter,
} from "../../src/server";

const realFetch = globalThis.fetch.bind(globalThis);
let blockedOutbound = 0;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    blockedOutbound++;
    console.warn(JSON.stringify({ layer: "worker", event: "outbound_blocked", host: url.hostname }));
    throw new Error("LOCAL ONLY: Worker outbound networking is disabled");
  }
  // Do not let workerd follow a localhost redirect to an external destination.
  const response = await realFetch(input, { ...init, redirect: "manual" });
  const location = response.headers.get("location");
  if (location && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(location, url).hostname)) {
    blockedOutbound++;
    throw new Error("LOCAL ONLY: external redirect is disabled");
  }
  return response;
}) as typeof fetch;

const csp = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000",
  "frame-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');

export default {
  async fetch(request, env, ctx) {
    if ((env as Env & { LOCAL_DEV_ONLY?: string }).LOCAL_DEV_ONLY !== "szweb-local-v1" || env.ENVIRONMENT !== "dev") {
      return new Response("LOCAL ONLY: invalid runtime environment", { status: 503 });
    }
    const url = new URL(request.url);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return new Response("Local host required", { status: 403 });
    // Fixture SVGs need no image transformation or OAuth/SSR routing.
    const fixtureKey = url.pathname.slice('/images/'.length);
    if (url.pathname.startsWith('/images/') && ['asset/local-fixtures/home-banner.svg', 'asset/local-fixtures/avatar.svg', 'local-fixtures/diagram.svg', 'local-fixtures/long-infographic.svg'].includes(fixtureKey)) {
      const object = await env.R2.get(fixtureKey);
      if (!object) return new Response('Local fixture image missing', { status: 404 });
      return new Response(object.body, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Security-Policy': csp, 'X-Local-Sandbox': 'szweb-local-v1' } });
    }
    if (url.pathname === "/__local/health") return Response.json({ localOnly: true, config: "wrangler.local.jsonc", persistence: ".wrangler/state-szweb", blockedOutbound, ai: "mock", smtp: "disabled", oauth: "disabled", webhook: "disabled" });
    if (url.pathname.startsWith("/oauth/") || url.pathname.startsWith("/mcp") || /\/auth\/(sign-in\/social|callback)/.test(url.pathname)) {
      return new Response("LOCAL ONLY: external OAuth and MCP disabled", { status: 403 });
    }
    const response = await app.fetch(request, env, ctx);
    const guarded = new Response(response.body, response);
    guarded.headers.set("Content-Security-Policy", csp);
    guarded.headers.set("X-Local-Sandbox", "szweb-local-v1");
    return guarded;
  },
  async queue(batch, env, ctx) {
    const messages = batch.messages.filter(message => {
      const type = (message.body as { type?: string })?.type;
      if (type === "EMAIL" || type === "WEBHOOK") { message.ack(); return false; }
      return true;
    });
    if (messages.length) await app.queue({ ...batch, messages }, env, ctx);
  },
} satisfies ExportedHandler<Env>;
