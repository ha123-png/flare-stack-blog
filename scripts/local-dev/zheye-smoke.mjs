import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { assertSafeLaunch, privatePath, root } from "./guard.mjs";

assertSafeLaunch();
const { chromium } = createRequire(import.meta.url)(
  process.env.LOCAL_PLAYWRIGHT_PATH,
);
const output = path.join(privatePath, "zheye-20261001", "interactions");
fs.mkdirSync(output, { recursive: true });
const report = {
  at: new Date().toISOString(),
  checks: [],
  pages: [],
  errors: [],
  external: [],
  expected503: 0,
  expectedErrors: [],
};
const browser = await chromium.launch({
  headless: true,
  channel: "msedge",
  args: ["--disable-background-networking"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
  colorScheme: "light",
  reducedMotion: "no-preference",
});
await context.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (!["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) {
    report.external.push(u.origin + u.pathname);
    return route.abort();
  }
  return route.continue();
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
let injecting503 = false;
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const value = message.text();
  // This scenario deliberately returns 503. Record only the exact expected
  // search diagnostics in that window; never suppress pageerror/SSR failures.
  if (
    injecting503 &&
    report.expected503 > 0 &&
    (/503/.test(value) ||
      (value.includes("[QueryCache error]") &&
        value.includes("fault_probe_unique_zheye") &&
        value.includes("Failed to search")) ||
      value === "[Unhandled request error] Failed to search")
  ) {
    report.expectedErrors.push(value);
    return;
  }
  report.errors.push(message.text());
});
const check = (name, passed = true) => {
  assert.ok(passed, name);
  report.checks.push(name);
  console.log("PASS " + name);
};
const settle = () => page.waitForTimeout(380);
const shot = async (name) => {
  await settle();
  await page.screenshot({ path: path.join(output, name + ".png") });
};
async function go(route, width = 1440) {
  await page.setViewportSize({ width, height: width < 651 ? 844 : 900 });
  const r = await page.goto("http://localhost:3000" + route, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  assert.equal(r.status(), 200, route);
  await settle();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    route + " overflow",
  );
  report.pages.push({ route, width });
}
const quick = page.locator(".sz-quick-search[open]");
const input = page.locator("#sz-quick-input");
async function openQuick() {
  await page.locator(".sz-search-trigger").click();
  await quick.waitFor();
  await input.waitFor();
}
async function closeQuick() {
  await page.keyboard.press("Escape");
  await quick.waitFor({ state: "hidden" });
  await settle();
}
try {
  await go("/");
  check(
    "Brand and document title are 折页",
    (await page.locator(".sz-header .sz-brand").innerText()).includes("折页") &&
      (await page.title()).includes("折页"),
  );
  check(
    "Windows shortcut is Ctrl K",
    (await page.locator(".sz-search-trigger kbd").innerText()) === "Ctrl K",
  );
  await shot("home-1440");
  const homeChroma = await page
    .locator(".sz-home-row[data-article]")
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((e) => [e.dataset.article, e.dataset.chroma]),
      ),
    );
  check(
    "Unconfigured homepage articles use at least three stable inks",
    new Set(Object.values(homeChroma)).size >= 3,
  );
  const row = page.locator(".sz-home-row").first();
  await row.scrollIntoViewIfNeeded();
  const before = await row.boundingBox();
  const closedClip = await row.evaluate((e) => getComputedStyle(e, "::after").clipPath);
  await row.locator("h3 a").hover();
  await settle();
  const after = await row.boundingBox();
  check(
    "Paper reveals ink without changing row geometry",
    Math.abs(before.height - after.height) < 1 &&
      (await row.evaluate(
        (e, closed) =>
          getComputedStyle(e, "::before").opacity === "1" &&
          getComputedStyle(e, "::after").transform === "none" &&
          getComputedStyle(e, "::after").clipPath !== closed,
        closedClip,
      )),
  );
  await shot("home-paper-hover");
  await page.mouse.move(0, 0);
  await settle();
  check(
    "Ink disappears on pointer exit",
    await row.evaluate((e) => getComputedStyle(e, "::before").opacity === "0"),
  );
  await go("/posts");
  const listChroma = await page
    .locator(".sz-article-row[data-article]")
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((e) => [e.dataset.article, e.dataset.chroma]),
      ),
    );
  check(
    "Home and article index share the same content colors",
    Object.entries(homeChroma).every(
      ([slug, color]) => listChroma[slug] === color,
    ),
  );
  await page.locator(".sz-article-title a").first().focus();
  await settle();
  check(
    "Keyboard reveals the same paper layer",
    await page
      .locator(".sz-article-row")
      .first()
      .evaluate((e) => getComputedStyle(e, "::before").opacity === "1"),
  );
  await shot("articles-paper-focus");
  await page.locator('.sz-desktop-nav a[href="/about"]').focus();
  check(
    "Navigation focus is around its label",
    await page
      .locator('.sz-desktop-nav a[href="/about"] .sz-nav-label')
      .evaluate(
        (e) =>
          e.getBoundingClientRect().height < 45 &&
          getComputedStyle(e).backgroundColor !== "rgba(0, 0, 0, 0)",
      ),
  );
  const originUrl = page.url();
  await openQuick();
  check(
    "Empty quick search has no assigned content ink",
    !(await quick.getAttribute("data-chroma")) &&
      (await quick.evaluate(
        (e) =>
          getComputedStyle(e).borderBottomColor ===
          getComputedStyle(e).borderTopColor,
      )),
  );
  check(
    "Desktop search opens locally and focuses the input",
    page.url() === originUrl &&
      (await input.evaluate((e) => e === document.activeElement)),
  );
  check(
    "Quick surface is bounded, not fullscreen",
    (await quick.boundingBox()).width <= 720,
  );
  check(
    "Dialog locks background scrolling",
    await page.evaluate(() => document.body.style.overflow === "hidden"),
  );
  await input.fill("搜索");
  await page.locator(".sz-quick-result").first().waitFor();
  check(
    "Quick results use real search and cap at five",
    (await page.locator(".sz-quick-result").count()) === 5,
  );
  await shot("quick-search-results");
  check(
    "Unselected results do not color the search shell",
    !(await quick.getAttribute("data-chroma")),
  );
  const quickChroma = await page
    .locator(".sz-quick-result[data-article]")
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((e) => [e.dataset.article, e.dataset.chroma]),
      ),
    );
  const shared = Object.entries(quickChroma).filter(
    ([slug]) => slug in listChroma,
  );
  check(
    "Search results retain the index color for shared articles",
    shared.length > 0 &&
      shared.every(([slug, color]) => color === listChroma[slug]),
  );
  await page.keyboard.press("ArrowDown");
  await settle();
  check(
    "Quick search reveals only the selected article's colored fore-edge",
    (await quick.getAttribute("data-chroma")) ===
      (await page
        .locator(".sz-quick-result.is-active")
        .getAttribute("data-chroma")) &&
      (await page
        .locator(".sz-quick-result.is-active")
        .evaluate(
          (e) =>
            getComputedStyle(e, "::before").opacity === "1" &&
            getComputedStyle(e, "::before").backgroundColor ===
              getComputedStyle(e).getPropertyValue("--sz-ink").trim().replace(/^#([a-f\d]{6})$/i, (_, hex) => `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`) &&
            getComputedStyle(e.closest("dialog")).borderBottomColor ===
              getComputedStyle(e.closest("dialog")).borderTopColor,
        )),
  );
  check(
    "Arrow keys select an accessible result",
    !!(await input.getAttribute("aria-activedescendant")),
  );
  await page.keyboard.press("Control+k");
  check(
    "Repeated shortcut does not stack dialogs",
    (await quick.count()) === 1 && page.url() === originUrl,
  );
  await page.locator(".sz-quick-bottom a").focus();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    assert.ok(await quick.evaluate((e) => e.contains(document.activeElement)));
  }
  check("Native dialog traps Tab focus");
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/post/**");
  check("Enter opens the selected real article", (await quick.count()) === 0);
  await openQuick();
  await input.dispatchEvent("compositionstart");
  await input.fill("中");
  await input.dispatchEvent("keydown", {
    key: "Enter",
    keyCode: 229,
    isComposing: true,
    bubbles: true,
  });
  check("IME confirmation does not navigate", (await quick.count()) === 1);
  await input.dispatchEvent("compositionend");
  await input.fill("zzzz_fold_no_result_2026");
  await page
    .locator(".sz-quick-status")
    .filter({ hasText: "没有匹配文章" })
    .waitFor();
  check("Quick search has a true empty state");
  await quick
    .getByRole("button", { name: "清除搜索内容", exact: true })
    .click();
  check(
    "Clear restores input focus",
    (await input.inputValue()) === "" &&
      (await input.evaluate((e) => e === document.activeElement)),
  );
  await closeQuick();
  check(
    "Escape restores trigger focus and unlocks body",
    (await page
      .locator(".sz-search-trigger")
      .evaluate((e) => e === document.activeElement)) &&
      (await page.evaluate(() => document.body.style.overflow !== "hidden")),
  );
  await openQuick();
  await input.fill("中文");
  await page.locator(".sz-quick-result").first().waitFor();
  await page.locator(".sz-quick-bottom a").click();
  await page.waitForURL("**/search?**");
  check(
    "Full search keeps the query in its URL",
    new URL(page.url()).searchParams.get("q") === "中文",
  );
  await page.keyboard.press("Control+k");
  check(
    "Full search shortcut focuses the existing field",
    (await quick.count()) === 0 &&
      (await page
        .locator("#sz-search-input")
        .evaluate((e) => e === document.activeElement)),
  );

  await go("/about");
  await shot("about-1440");
  await openQuick();
  injecting503 = true;
  await page.route("**/api/search?**", (route) => {
    report.expected503++;
    return route.fulfill({
      status: 503,
      body: "Temporary test failure",
      contentType: "text/plain",
    });
  });
  await input.fill("fault_probe_unique_zheye");
  await quick
    .getByRole("button", { name: "重试搜索", exact: true })
    .waitFor({ timeout: 20000 });
  check("Controlled search failure offers recovery", report.expected503 > 0);
  await page.unroute("**/api/search?**");
  await quick.getByRole("button", { name: "重试搜索", exact: true }).click();
  await page
    .locator(".sz-quick-status")
    .filter({ hasText: "没有匹配文章" })
    .waitFor();
  check("Retry recovers without closing the dialog");
  injecting503 = false;
  await closeQuick();

  await page.evaluate(() => {
    window.__foldTransitionCount = 0;
    if (document.startViewTransition) {
      const native = document.startViewTransition.bind(document);
      document.startViewTransition = (callback) => {
        window.__foldTransitionCount++;
        return native(callback);
      };
    }
  });
  const appearance = page.locator(".sz-desktop-appearance");
  await appearance.locator("summary").click();
  await appearance.getByRole("button", { name: "深色", exact: true }).click();
  await page.waitForTimeout(550);
  check(
    "Theme changes to dark and persists preference",
    await page.evaluate(
      () =>
        document.documentElement.classList.contains("dark") &&
        localStorage.getItem("ui-theme") === "dark",
    ),
  );
  check(
    "Theme snapshot path was exercised",
    await page.evaluate(
      () => !document.startViewTransition || window.__foldTransitionCount > 0,
    ),
  );
  await appearance.locator("summary").click();
  await shot("about-dark-1440");
  await appearance.locator("summary").click();
  await appearance.evaluate((e) => {
    const buttons = e.querySelectorAll("button");
    buttons[0].click();
    buttons[1].click();
    buttons[0].click();
  });
  await page.waitForTimeout(600);
  check(
    "Rapid theme clicks are last-intent-wins",
    await page.evaluate(
      () =>
        document.documentElement.classList.contains("light") &&
        localStorage.getItem("ui-theme") === "light" &&
        !document.documentElement.classList.contains("sz-theme-changing"),
    ),
  );
  await page.evaluate(() => {
    window.__savedFoldVT = document.startViewTransition;
    document.startViewTransition = undefined;
  });
  await appearance.getByRole("button", { name: "深色", exact: true }).click();
  await page.waitForTimeout(500);
  check(
    "No-API fallback still switches and cleans up",
    await page.evaluate(
      () =>
        document.documentElement.classList.contains("dark") &&
        !document.documentElement.classList.contains("sz-theme-fallback"),
    ),
  );
  await page.evaluate(() => {
    document.startViewTransition = window.__savedFoldVT;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const transitionCount = await page.evaluate(
    () => window.__foldTransitionCount,
  );
  await appearance.getByRole("button", { name: "浅色", exact: true }).click();
  check(
    "Reduced motion skips snapshots",
    (await page.evaluate(() => window.__foldTransitionCount)) ===
      transitionCount,
  );
  await appearance.locator("summary").click();
  await openQuick();
  check(
    "Reduced-motion search has no entry animation",
    await quick.evaluate((e) => getComputedStyle(e).animationName === "none"),
  );
  await closeQuick();
  await page.emulateMedia({ reducedMotion: "no-preference" });

  for (const width of [768, 390, 360, 320]) {
    await go("/about", width);
    await shot("about-" + width);
  }
  await go("/", 390);
  await page.locator(".sz-search-trigger").click();
  await page.waitForURL("**/search");
  check(
    "Phone search uses full-page search without a modal",
    (await quick.count()) === 0,
  );
  await page.locator("#sz-search-input").fill("中文");
  await page.locator(".sz-search-result").first().waitFor();
  await shot("search-390");
  await go("/", 768);
  await openQuick();
  await input.fill("CSS");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForURL("**/search?**");
  check(
    "Resizing an open desktop search preserves query on phone",
    new URL(page.url()).searchParams.get("q") === "CSS" &&
      (await quick.count()) === 0,
  );
  await go("/", 1440);
  await settle();
  const sampleSlug = Object.keys(homeChroma)[0];
  await go("/post/" + sampleSlug);
  await page.locator(".sz-post-content").waitFor();
  check(
    "Reading retains the article reverse color",
    (await page.locator(".sz-post").getAttribute("data-chroma")) ===
      homeChroma[sampleSlug],
  );
  const toc = page.locator(".sz-post-toc-desktop");
  check(
    "Desktop TOC is spacious without shrinking the reading column",
    await toc.evaluate(
      (e) =>
        e.getBoundingClientRect().width >= 260 &&
        parseFloat(
          getComputedStyle(e.querySelector(".sz-toc-link")).fontSize,
        ) >= 15 &&
        document.querySelector(".sz-post-content").getBoundingClientRect()
          .width >= 739,
    ),
  );
  await toc.scrollIntoViewIfNeeded();
  await shot("reading-toc-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".sz-post-toc-mobile summary").click();
  check(
    "Phone TOC keeps readable links and touch targets",
    await page
      .locator(".sz-post-toc-mobile .sz-toc-link")
      .first()
      .evaluate(
        (e) =>
          parseFloat(getComputedStyle(e).fontSize) >= 14 &&
          e.getBoundingClientRect().height >= 44,
      ),
  );
  await shot("reading-toc-390");
  await go("/", 1440);
  await settle();
  check(
    "No idle animations remain",
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length === 0,
    ),
  );
  check("No unexpected runtime or console errors", report.errors.length === 0);
  // Reproduce the final-handoff trigger without changing any document bytes.
  const outsideUi = ["docs/zheye-ready-to-push.md", ".husky/pre-commit"].map(
    (file) => {
      const target = path.join(root, file);
      return {
        target,
        stat: fs.statSync(target),
        bytes: fs.readFileSync(target),
      };
    },
  );
  try {
    for (const item of outsideUi)
      fs.utimesSync(item.target, new Date(), new Date());
    await page.waitForTimeout(1600);
    await go("/");
    await go("/post/" + sampleSlug);
    await page.locator(".sz-post-content").waitFor();
    check(
      "Document and hook changes do not poison SSR",
      report.errors.length === 0,
    );
    for (const item of outsideUi)
      assert.deepEqual(fs.readFileSync(item.target), item.bytes);
    check("HMR regression probe leaves document bytes intact");
  } finally {
    for (const item of outsideUi)
      fs.utimesSync(item.target, item.stat.atime, item.stat.mtime);
  }
  check("No external browser requests", report.external.length === 0);
  const health = await context.request.get(
    "http://localhost:3000/__local/health",
  );
  report.health = await health.json();
  check(
    "Local-only and outbound guards are intact",
    report.health.localOnly && report.health.blockedOutbound === 0,
  );
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = String(error);
  await page
    .screenshot({ path: path.join(output, "failure.png") })
    .catch(() => {});
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
