import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { assertSafeLaunch, privatePath } from "./guard.mjs";

assertSafeLaunch();
const { chromium } = createRequire(import.meta.url)(
  process.env.LOCAL_PLAYWRIGHT_PATH,
);
const output = path.join(privatePath, "refinement");
fs.mkdirSync(output, { recursive: true });
const report = { checks: [], pages: [], errors: [], external: [] };
const browser = await chromium.launch({
  headless: true,
  channel: "msedge",
  args: ["--disable-background-networking"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  colorScheme: "light",
  reducedMotion: "reduce",
});
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    report.external.push(url.origin);
    return route.abort();
  }
  return route.continue();
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
const check = (name, value) => {
  assert.ok(value, name);
  report.checks.push(name);
  console.log("PASS " + name);
};
async function visit(route, width = 1440) {
  await page.setViewportSize({ width, height: width <= 650 ? 844 : 900 });
  const response = await page.goto("http://localhost:3000" + route, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert.equal(response.status(), 200, route);
  check(
    route + " fits " + width,
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  report.pages.push({ route, width });
}
async function shot(name, fullPage = false) {
  await page.screenshot({ path: path.join(output, name + ".png"), fullPage });
}
async function save() {
  const response = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().includes("_serverFn"),
  );
  await page
    .getByRole("button", { name: "应用更改", exact: true })
    .first()
    .click();
  assert.equal((await response).status(), 200);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}
let originals;
async function openEditor() {
  await visit("/admin/settings");
  await page.locator('input[name="site.projects.0.title"]').waitFor();
}
try {
  await visit("/");
  check(
    "English browser starts in Chinese",
    (await page.locator("html").getAttribute("lang")) === "zh",
  );
  check(
    "Projects follow the chosen order",
    JSON.stringify(
      await page.getByRole("tab").locator("strong").allTextContents(),
    ) === JSON.stringify(["知意", "四时 · 借一刻", "英田数控"]),
  );
  check(
    "Welcome is concise",
    (await page.locator(".sz-cover-title").textContent()).includes(
      "写下思考，也让想法成形。",
    ),
  );
  await shot("home-1440", true);
  await page.locator(".sz-project-band").scrollIntoViewIfNeeded();
  await shot("stage-zhiyi-1440");
  await page.getByRole("tab", { name: /四时/ }).click();
  const spring = page.locator(".is-active img");
  await spring.evaluate((img) => img.decode());
  check(
    "Cat cover is the real spring capture",
    (await spring.getAttribute("src")).includes("seasons-spring.webp"),
  );
  await page.mouse.move(20, 20);
  await shot("stage-spring-1440");
  await page.getByRole("tab", { name: /英田/ }).click();
  await page.locator(".is-active img").evaluate((img) => img.decode());
  await shot("stage-yingtian-1440");
  const articles = await page
    .locator(".sz-home-row h3 a,.sz-aside-entry")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  check(
    "Recent and popular writing do not repeat",
    new Set(articles).size === articles.length,
  );
  for (const width of [1440, 390])
    for (const route of [
      "/projects",
      "/projects/zhiyi",
      "/projects/seasons",
      "/projects/yingtian",
      "/directory",
      "/archive",
      "/friend-links",
      "/about",
    ]) {
      await visit(route, width);
      for (const img of await page.locator("main img").all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate((node) => node.decode());
      }
      await page.evaluate(() => scrollTo(0, 0));
      await shot(
        route.slice(1).replaceAll("/", "-") + "-" + width,
        route !== "/archive",
      );
    }
  for (const width of [320, 390, 768, 1024]) {
    await visit("/", width);
    await page.getByRole("tab", { name: /四时/ }).click();
    await page.locator(".sz-project-band").scrollIntoViewIfNeeded();
    await shot("spring-" + width);
  }
  await visit("/friend-links");
  check(
    "My sites contains three actual URLs",
    (await page.locator(".sz-own-sites nav a").count()) === 3,
  );
  await visit("/projects/seasons");
  check(
    "Season experience opens in spring",
    (
      await page.getByRole("link", { name: "打开作品" }).getAttribute("href")
    ).endsWith("?season=spring"),
  );
  check(
    "Detail preserves full color",
    await page
      .locator(".sz-art--entered img")
      .evaluate((node) => getComputedStyle(node).filter === "none"),
  );

  // Same URL, in both orders, verifies cookie choice survives the HTML cache.
  for (const locale of ["en", "zh", "en", "zh"]) {
    await context.addCookies([
      { name: "LOCALE", value: locale, url: "http://localhost:3000" },
    ]);
    await visit("/directory");
    check(
      "Rendered cache serves " + locale,
      (await page.locator("html").getAttribute("lang")) === locale,
    );
  }

  const login = await context.request.post(
    "http://localhost:3000/api/auth/sign-in/email",
    {
      headers: { Origin: "http://localhost:3000" },
      data: {
        email: "admin@local.invalid",
        password: "LocalFixture-Only-2026!",
      },
    },
  );
  assert.equal(login.status(), 200, "Local fixture sign-in");
  await openEditor();
  originals = await page
    .locator(
      'input[name^="site.projects"],textarea[name^="site.projects"],select[name^="site.projects"],input[name^="site.welcome"],textarea[name^="site.welcome"]',
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => ({ name: node.name, value: node.value })),
    );
  const selected = await page
    .locator("fieldset")
    .first()
    .getByRole("checkbox")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.checked)
        .map((node) => node.closest("label").textContent.trim()),
    );
  originals.push({ selected });
  fs.writeFileSync(
    path.join(output, "restore-project-settings.json"),
    JSON.stringify(originals, null, 2),
  );
  await page.locator('input[name="site.projects.0.title"]').fill("知意 · 验收");
  await page
    .locator('input[name="site.projects.0.leadSlug"]')
    .fill("edge-blog-in-a-weekend");
  await page
    .locator('input[name="site.welcome.title"]')
    .fill("写下思考，也让想法成形。验收");
  await page
    .locator("fieldset")
    .first()
    .getByRole("checkbox", { name: "Cloudflare", exact: true })
    .check();
  await page
    .locator("fieldset")
    .first()
    .getByRole("checkbox", { name: "TypeScript", exact: true })
    .check();
  await save();
  await openEditor();
  check(
    "Project and welcome survive a fresh load",
    (await page.locator('input[name="site.projects.0.title"]').inputValue()) ===
      "知意 · 验收" &&
      (
        await page.locator('input[name="site.welcome.title"]').inputValue()
      ).endsWith("验收"),
  );
  await shot("admin-project-editor-1440", true);
  await visit("/projects/zhiyi");
  const notes = await page
    .locator(".sz-project-writing a")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  const tagged = await context.request
    .get("http://localhost:3000/api/posts?tagName=Cloudflare&limit=50")
    .then((r) => r.json());
  check(
    "Selected tags aggregate actual published writing",
    tagged.items.every((post) => notes.includes("/post/" + post.slug)),
  );
  check(
    "Opening article appears once across matching tags",
    notes.filter((url) => url.endsWith("edge-blog-in-a-weekend")).length === 1,
  );
  check(
    "Multiple tags never duplicate an article",
    new Set(notes).size === notes.length,
  );
  await shot("project-linked-notes-1440", true);
  await visit("/post/edge-blog-in-a-weekend");
  check(
    "Article links back to its project",
    (await page
      .locator('.sz-post-projects a[href="/projects/zhiyi"]')
      .count()) === 1,
  );
  await visit("/directory");
  check(
    "Directory reads saved project data",
    (await page.locator("main").innerText()).includes("知意 · 验收"),
  );
  await visit("/friend-links");
  check(
    "My sites reads saved project data",
    (await page.locator(".sz-own-sites").innerText()).includes("知意 · 验收"),
  );
  await openEditor();
  await page
    .getByRole("button", { name: "下移知意 · 验收", exact: true })
    .click();
  await save();
  await visit("/");
  check(
    "Reordering persists across all displays",
    (await page.getByRole("tab").locator("strong").allTextContents())[0] ===
      "四时 · 借一刻",
  );
  await openEditor();
  await page
    .getByRole("button", { name: "上移知意 · 验收", exact: true })
    .click();
  for (const item of originals.filter((item) => item.name))
    await page.locator(`[name="${item.name}"]`).evaluate((node, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        node instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : node instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(node, value);
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, item.value);
  const field = page.locator("fieldset").first();
  for (const name of ["Cloudflare", "TypeScript"])
    if (!selected.includes(name))
      await field.getByRole("checkbox", { name, exact: true }).uncheck();
  await save();
  originals = null;
  await visit("/");
  check(
    "Restored review data after save tests",
    (await page.getByRole("tab").locator("strong").allTextContents())[0] ===
      "知意",
  );
  check("No unexpected runtime errors", report.errors.length === 0);
  check("All review assets stay local", report.external.length === 0);
  report.pass = true;
} catch (error) {
  report.pass = false;
  report.failure = String(error);
  await shot("failure", true).catch(() => {});
  throw error;
} finally {
  if (originals)
    console.log(
      "Review settings were changed during the failed test; restore them before finishing.",
    );
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
