import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { assertSafeLaunch, privatePath } from "./guard.mjs";

assertSafeLaunch();
const { chromium } = createRequire(import.meta.url)(
  process.env.LOCAL_PLAYWRIGHT_PATH,
);
const output = path.join(privatePath, "fold-v2", "acceptance");
fs.mkdirSync(output, { recursive: true });
const report = { checks: [], pages: [], errors: [], external: [] };
const browser = await chromium.launch({
  headless: true,
  channel: "msedge",
  args: ["--disable-background-networking"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
  reducedMotion: "no-preference",
  colorScheme: "light",
});
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    report.external.push(url.origin + url.pathname);
    return route.abort();
  }
  return route.continue();
});
await context.addInitScript(() => {
  window.__foldTurns = 0;
  if (typeof document.startViewTransition !== "function") return;
  const original = document.startViewTransition.bind(document);
  document.startViewTransition = (...args) => {
    window.__foldTurns++;
    const turn = original(...args);
    turn.ready.catch(() => {});
    return turn;
  };
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
const check = (name, value = true) => {
  assert.ok(value, name);
  report.checks.push(name);
  console.log("PASS " + name);
};
async function visit(route, width = 1440) {
  await page.setViewportSize({ width, height: width <= 650 ? 844 : 900 });
  const response = await page.goto("http://localhost:3000" + route, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  assert.equal(response.status(), 200, route + " HTTP status");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    route + " horizontal overflow",
  );
  assert.equal(await page.locator("main").count(), 1);
  report.pages.push({ route, width });
}
async function shot(name, fullPage = false) {
  await page.screenshot({ path: path.join(output, name + ".png"), fullPage });
}

try {
  // Obtain expected published dates from the public API rather than example years.
  const posts = [];
  let cursor;
  do {
    const response = await context.request.get(
      "http://localhost:3000/api/posts?limit=50" +
        (cursor ? "&cursor=" + cursor : ""),
    );
    assert.equal(response.status(), 200);
    const data = await response.json();
    posts.push(...data.items);
    cursor = data.nextCursor;
  } while (cursor);
  const yearCounts = new Map();
  for (const post of posts) {
    const year = new Date(post.publishedAt).getUTCFullYear();
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  await visit("/directory");
  await page.waitForFunction(
    (expected) =>
      Number.parseInt(
        document.querySelector('a.sz-directory-entry[href="/posts"] small')
          ?.textContent,
      ) === expected,
    posts.length,
  );
  check(
    "Directory has four editorial chapters",
    (await page.locator(".sz-directory-grid > section").count()) === 4,
  );
  const entries = await page
    .locator('a.sz-directory-entry[href*="/archive#year-"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        year: Number(node.querySelector("span").textContent),
        count: Number.parseInt(node.querySelector("small").textContent),
      })),
    );
  check(
    "Directory years and counts match published CMS data",
    entries.length === yearCounts.size &&
      entries.every((entry) => yearCounts.get(entry.year) === entry.count),
  );
  check(
    "Internal color tags remain hidden",
    !(await page.locator("main").innerText()).includes("_chroma:"),
  );
  check(
    "Six chapters include the index",
    (await page.locator(".sz-desktop-nav > a").count()) === 6,
  );
  check(
    "Current chapter is an index bookmark",
    (await page
      .locator('.sz-desktop-nav a[aria-current="page"]')
      .getAttribute("href")) === "/directory",
  );
  check(
    "Bookmark is a vertical cut-paper mark",
    await page.locator(".sz-nav-indicator").evaluate((node) => {
      const s = getComputedStyle(node);
      return (
        parseFloat(s.height) > parseFloat(s.width) && s.clipPath !== "none"
      );
    }),
  );
  await shot("directory-1440", true);

  const olderYear = entries.at(-1).year;
  await page
    .locator(`a.sz-directory-entry[href="/archive#year-${olderYear}"]`)
    .click();
  await page.waitForURL(`**/archive#year-${olderYear}`);
  const older = page.locator(`#year-${olderYear}`);
  await older
    .locator('.sz-archive-year-toggle[aria-expanded="true"]')
    .waitFor();
  check(
    "Index opens the requested year rather than a hardcoded year",
    await older.locator(".sz-archive-months").isVisible(),
  );
  await older.locator(".sz-archive-year-toggle").click();
  check(
    "Year divider closes its records",
    !(await older.locator(".sz-archive-months").isVisible()),
  );
  await older.locator(".sz-archive-year-index button").first().click();
  check(
    "Month entry unfolds a closed year",
    (await older
      .locator(".sz-archive-year-toggle")
      .getAttribute("aria-expanded")) === "true",
  );
  check(
    "Month index provides 44px touch targets",
    await older
      .locator(".sz-archive-year-index button")
      .evaluateAll((nodes) =>
        nodes.every((node) => node.getBoundingClientRect().height >= 44),
      ),
  );
  await visit("/archive");
  await page
    .locator(".sz-archive-range")
    .filter({ hasText: "全部文章" })
    .waitFor();
  check(
    "Archive includes every published post",
    (await page.locator(".sz-archive-range").innerText()).includes(
      String(posts.length),
    ),
  );
  await shot("archive-1440");
  for (const button of await page
    .locator('.sz-archive-year-toggle[aria-expanded="true"]')
    .all())
    await button.click();
  await page.evaluate(() => scrollTo(0, 0));
  await shot("archive-dividers-1440", true);

  await visit("/");
  check(
    "Logo has three paper leaves",
    (await page.locator(".sz-header .sz-brand-mark i").count()) === 3,
  );
  await page.locator('.sz-desktop-nav a[href="/projects"]').click();
  await page.locator(".sz-project-entry").first().waitFor();
  check(
    "Desktop navigation invokes native page snapshots",
    await page.evaluate(() => window.__foldTurns > 0),
  );
  await page.locator('.sz-desktop-nav a[href="/posts"]').click();
  await page.locator(".sz-article-row").first().waitFor();
  check(
    "Returning to an earlier chapter reverses the fold",
    await page.evaluate(
      () => document.documentElement.dataset.szTurn === "back",
    ),
  );
  const row = page.locator(".sz-article-row").first();
  await row.scrollIntoViewIfNeeded();
  await page.mouse.move(12, 12);
  await page.waitForTimeout(350);
  const before = await row.locator(".sz-article-copy").boundingBox();
  await row.hover();
  await page.waitForTimeout(650);
  const after = await row.locator(".sz-article-copy").boundingBox();
  check(
    "Paper lifts gently without resizing the reading text",
    Math.abs(before.x - after.x) < 0.5 &&
      Math.abs(before.y - after.y - 2) < 0.5 &&
      Math.abs(before.width - after.width) < 0.5 &&
      Math.abs(before.height - after.height) < 0.5,
  );
  check(
    "Paper reverse is a compact corner fold",
    await row.evaluate((node) => {
      const edge = getComputedStyle(node, "::before");
      return (
        edge.opacity === "1" &&
        parseFloat(edge.width) <= 24 &&
        parseFloat(edge.height) === parseFloat(edge.width) &&
        edge.clipPath !== "none"
      );
    }),
  );
  await shot("paper-edge-1440");
  const slug = await row.getAttribute("data-article");
  await visit("/post/" + slug);
  check(
    "Article detail belongs to the writing chapter",
    (await page
      .locator('.sz-desktop-nav a[href="/posts"]')
      .getAttribute("aria-current")) === "page",
  );

  await visit("/directory");
  await page.locator(".sz-desktop-appearance summary").click();
  await page
    .locator(".sz-desktop-appearance")
    .getByRole("button", { name: "深色", exact: true })
    .click();
  await page.locator(".sz-desktop-appearance summary").click();
  await page.waitForTimeout(350);
  await shot("directory-dark-1440", true);
  check(
    "Dark index keeps the paper palette",
    await page
      .locator(".sz-site")
      .first()
      .evaluate(
        (node) => getComputedStyle(node).backgroundColor === "rgb(8, 8, 8)",
      ),
  );
  await page.locator(".sz-desktop-appearance summary").click();
  await page.locator(".sz-desktop-appearance select").selectOption("en");
  await page.getByRole("heading", { name: "Index", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  check(
    "Directory has an English interface",
    (await page
      .getByRole("heading", { name: "Index", exact: true })
      .count()) === 1,
  );
  await page.locator(".sz-desktop-appearance summary").click();
  await page.locator(".sz-desktop-appearance select").selectOption("zh");
  await page.getByRole("heading", { name: "索引", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  await page.locator(".sz-desktop-appearance summary").click();
  await page
    .locator(".sz-desktop-appearance")
    .getByRole("button", { name: "浅色", exact: true })
    .click();
  await page.locator(".sz-desktop-appearance summary").click();

  for (const width of [320, 390, 651, 768, 850, 851, 1024]) {
    for (const route of ["/", "/directory", "/archive", "/projects"])
      await visit(route, width);
  }
  await visit("/directory", 390);
  await shot("directory-390", true);
  await page.getByRole("button", { name: "打开导航菜单" }).click();
  check(
    "Mobile contents contains all six chapters",
    (await page.locator("#sz-mobile-menu > nav > a").count()) === 6,
  );
  await page.locator('#sz-mobile-menu > nav a[href="/archive"]').click();
  await page.locator(".sz-archive-year").first().waitFor();
  check(
    "Mobile chapter choice closes the modal",
    !(await page.locator("#sz-mobile-menu").evaluate((node) => node.open)),
  );
  check(
    "Mobile navigation avoids native page snapshots",
    await page.evaluate(() => window.__foldTurns === 0),
  );
  await page.evaluate(() => scrollTo(0, 0));
  await shot("archive-390");
  await page.locator(".sz-footer").scrollIntoViewIfNeeded();
  await shot("back-cover-390");
  check(
    "Back cover has a direct site-index entry",
    (await page.locator('.sz-footer-index[href="/directory"]').count()) === 1,
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit("/", 1440);
  await page.locator('.sz-desktop-nav a[href="/directory"]').click();
  await page.locator(".sz-directory-grid").waitFor();
  check(
    "Reduced motion disables route snapshots",
    await page.evaluate(() => window.__foldTurns === 0),
  );
  check(
    "Reduced motion disables logo animation",
    await page
      .locator(".sz-header .sz-brand-mark i")
      .last()
      .evaluate((node) => getComputedStyle(node).animationName === "none"),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    document.startViewTransition = undefined;
  });
  await visit("/");
  await page.locator('.sz-desktop-nav a[href="/directory"]').click();
  await page.locator(".sz-directory-grid").waitFor();
  check(
    "Browsers without View Transitions can still navigate",
    await page.evaluate(
      () => typeof document.startViewTransition === "undefined",
    ),
  );

  const noJS = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await noJS.newPage();
  const response = await staticPage.goto("http://localhost:3000/directory");
  check(
    "Directory content and links render on the server",
    response.status() === 200 &&
      (await staticPage.locator(".sz-directory-grid > section").count()) === 4,
  );
  await noJS.close();
  const sitemap = await context.request.get(
    "http://localhost:3000/sitemap.xml",
  );
  check(
    "New index is discoverable in the sitemap",
    (await sitemap.text()).includes("/directory</loc>"),
  );
  check("No browser errors", report.errors.length === 0);
  check("No external browser requests", report.external.length === 0);
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = String(error);
  throw error;
} finally {
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
