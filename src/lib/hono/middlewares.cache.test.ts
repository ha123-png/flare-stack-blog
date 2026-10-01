import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "zh" }));
vi.mock("@/paraglide/runtime", () => ({ getLocale: () => state.locale }));
vi.mock("@/lib/auth/auth.server", () => ({ getAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
import { cacheMiddleware } from "./middlewares";

describe("HTML cache language isolation", () => {
  const saved = new Map<string, Response>();
  const pending: Promise<unknown>[] = [];
  const executionCtx = {
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    passThroughOnException: vi.fn(),
    props: {},
    exports: {} as ExecutionContext["exports"],
  };
  beforeEach(() => {
    saved.clear();
    pending.length = 0;
    state.locale = "zh";
    vi.stubGlobal("caches", {
      default: {
        match: async (request: Request) => saved.get(request.url)?.clone(),
        put: async (request: Request, response: Response) => {
          saved.set(request.url, response);
        },
      },
    });
  });
  it("serves each locale from its own cache on repeated requests", async () => {
    let renders = 0;
    const app = new Hono().use(cacheMiddleware).get("/directory", (c) => {
      renders++;
      return c.html(
        state.locale === "zh" ? "<h1>索引</h1>" : "<h1>Index</h1>",
        200,
        { "Cache-Control": "public, max-age=60" },
      );
    });
    for (const locale of ["en", "zh", "en", "zh"]) {
      state.locale = locale;
      const response = await app.request(
        "https://szweb.ren/directory",
        {},
        { ENVIRONMENT: "prod" },
        executionCtx,
      );
      await Promise.all(pending);
      expect(await response.text()).toContain(
        locale === "zh" ? "索引" : "Index",
      );
      expect(response.headers.get("Content-Language")).toBe(locale);
      expect(response.headers.get("Vary")).toContain("Cookie");
    }
    expect(renders).toBe(2);
  });
  it("leaves development and private responses uncached", async () => {
    const app = new Hono()
      .use(cacheMiddleware)
      .get("/admin", (c) =>
        c.html("private", 200, { "Cache-Control": "private, no-store" }),
      )
      .get("/", (c) =>
        c.html("preview", 200, { "Cache-Control": "public, max-age=60" }),
      );
    await app.request(
      "https://szweb.ren/admin",
      {},
      { ENVIRONMENT: "prod" },
      executionCtx,
    );
    await app.request(
      "https://szweb.ren/",
      {},
      { ENVIRONMENT: "dev" },
      executionCtx,
    );
    await Promise.all(pending);
    expect(saved.size).toBe(0);
  });
});
