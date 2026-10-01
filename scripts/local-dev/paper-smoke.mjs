import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { assertSafeLaunch, privatePath } from "./guard.mjs";

assertSafeLaunch();
const { chromium } = createRequire(import.meta.url)(
  process.env.LOCAL_PLAYWRIGHT_PATH,
);
const output = path.join(privatePath, "paper-polish");
fs.mkdirSync(output, { recursive: true });
const report = { checks: [], pages: [], errors: [], external: [] };
const paperColors = [
  "#b79c70",
  "#4c607b",
  "#71836c",
  "#966572",
  "#84718f",
  "#a77b5c",
];
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
page.on("console", (msg) => {
  if (msg.type() === "error") report.errors.push(msg.text());
});
const check = (name, condition) => {
  assert.ok(condition, name);
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
const shot = (name, fullPage = false) =>
  page.screenshot({ path: path.join(output, name + ".png"), fullPage });
const x = async (locator) => (await locator.boundingBox()).x;
try {
  await visit("/");
  await page.mouse.move(12, 12);
  await page.waitForTimeout(800);
  const brand = page.locator(".sz-header .sz-brand");
  const brandLeaves = () =>
    brand
      .locator("i")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).transform),
      );
  const foldedLeaves = await brandLeaves();
  const brandCopyBefore = await brand.locator(".sz-brand-name").boundingBox();
  await page
    .locator(".sz-header")
    .screenshot({ path: path.join(output, "brand-rest.png") });
  await brand.hover();
  await page.waitForTimeout(650);
  const openLeaves = await brandLeaves();
  const brandCopyAfter = await brand.locator(".sz-brand-name").boundingBox();
  check(
    "Brand unfolds to reveal its silver-gray inner face",
    await brand
      .locator("i")
      .nth(1)
      .evaluate((node) => getComputedStyle(node, "::after").opacity === "1"),
  );
  check(
    "Brand opens both leaves after its entrance animation",
    openLeaves[1] !== foldedLeaves[1] && openLeaves[2] !== foldedLeaves[2],
  );
  check(
    "Brand spine and wordmark stay anchored",
    openLeaves[0] === foldedLeaves[0] &&
      Math.abs(brandCopyBefore.x - brandCopyAfter.x) < 0.5 &&
      Math.abs(brandCopyBefore.y - brandCopyAfter.y) < 0.5,
  );
  await page
    .locator(".sz-header")
    .screenshot({ path: path.join(output, "brand-hover.png") });
  await page.mouse.move(12, 12);
  await page.waitForTimeout(650);
  check(
    "Brand closes back to its original silhouette",
    JSON.stringify(await brandLeaves()) === JSON.stringify(foldedLeaves),
  );
  await page.keyboard.press("Tab");
  await brand.focus();
  await page.waitForTimeout(650);
  check(
    "Keyboard focus opens the same brand leaves",
    JSON.stringify(await brandLeaves()) === JSON.stringify(openLeaves),
  );
  await brand.evaluate((node) => node.blur());
  const navLink = page.locator('.sz-desktop-nav a[href="/posts"]');
  await navLink.focus();
  await page.waitForTimeout(400);
  check(
    "Navigation keyboard focus uses an ink stroke without a black fill",
    await navLink
      .locator(".sz-nav-label")
      .evaluate(
        (node) =>
          getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)" &&
          getComputedStyle(node).boxShadow === "none" &&
          getComputedStyle(node, "::after").transform ===
            "matrix(1, 0, 0, 1, 0, 0)",
      ),
  );
  await navLink.evaluate((node) => node.blur());
  await page.getByRole("tab", { name: /四时/ }).click();
  await page.locator(".is-active img").evaluate((img) => img.decode());
  await page.waitForTimeout(550);
  check(
    "Cover retains original color before interaction",
    await page
      .locator(".is-active img")
      .evaluate((img) => getComputedStyle(img).filter === "none"),
  );
  const cover = page.locator(".sz-project-visual .sz-discovery");
  await cover.scrollIntoViewIfNeeded();
  await page.mouse.move(12, 12);
  await page
    .locator(".sz-project-band")
    .screenshot({ path: path.join(output, "spring-original.png") });
  const curlBefore = await cover.evaluate((node) =>
    parseFloat(getComputedStyle(node, "::after").width),
  );
  await cover.hover();
  await page.waitForTimeout(550);
  check(
    "Cover curl unfolds on hover",
    await cover.evaluate(
      (node, initial) =>
        parseFloat(getComputedStyle(node, "::after").width) > initial + 8,
      curlBefore,
    ),
  );
  check(
    "Cover stays in original color on hover",
    await cover
      .locator(".is-active img")
      .evaluate((img) => getComputedStyle(img).filter === "none"),
  );
  check(
    "Spring cover and active bookmark share the moss reverse",
    await page.locator(".sz-project-band").evaluate((node) => {
      const tab = node.querySelector("button.active");
      const cover = node.querySelector(".sz-discovery");
      return (
        getComputedStyle(tab).getPropertyValue("--sz-paper-reverse").trim() ===
          "#71836c" &&
        getComputedStyle(cover)
          .getPropertyValue("--sz-paper-reverse")
          .trim() === "#71836c" &&
        getComputedStyle(tab, "::before").backgroundColor ===
          "rgb(113, 131, 108)" &&
        getComputedStyle(cover, "::after").opacity === "1"
      );
    }),
  );
  await page
    .locator(".sz-project-band")
    .screenshot({ path: path.join(output, "spring-fold-hover.png") });
  await page.mouse.move(12, 12);
  await page.keyboard.press("Tab");
  await cover.focus();
  await page.waitForTimeout(550);
  check(
    "Keyboard focus also unfolds the cover",
    await cover.evaluate(
      (node) => parseFloat(getComputedStyle(node, "::after").width) >= 27,
    ),
  );
  const topic = page.locator(".sz-home-explore .sz-topic-paper").first();
  await topic.hover();
  await page.waitForTimeout(400);
  check(
    "Topic hover uses a short ink stroke without a folded surface",
    await topic.evaluate(
      (node) =>
        getComputedStyle(node, "::before").content === "none" &&
        getComputedStyle(node, "::after").opacity === "1" &&
        parseFloat(getComputedStyle(node, "::after").height) === 1 &&
        getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)",
    ),
  );
  await page.mouse.move(12, 12);
  await page.keyboard.press("Tab");
  await topic.focus();
  await page.waitForTimeout(400);
  check(
    "Topic keyboard focus strengthens the ink stroke",
    await topic.evaluate(
      (node) =>
        getComputedStyle(node, "::after").opacity === "1" &&
        parseFloat(getComputedStyle(node, "::after").height) === 2,
    ),
  );
  await topic.evaluate((node) => node.blur());
  const row = page.locator(".sz-home-row").first();
  const rowIdentity = await row.getAttribute("data-article");
  const paperReverse = await row.evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--sz-paper-reverse").trim(),
  );
  const homeColors = await page
    .locator(".sz-home-row")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        getComputedStyle(node).getPropertyValue("--sz-paper-reverse").trim(),
      ),
    );
  check(
    "Articles use varied colors from the bounded matte palette",
    homeColors.every((color) => paperColors.includes(color)) &&
      new Set(homeColors).size >= 3,
  );
  const copy = row.locator("h3");
  await row.scrollIntoViewIfNeeded();
  await page.mouse.move(12, 12);
  await page.waitForTimeout(500);
  const before = await copy.boundingBox();
  const beforeDocumentY = before.y + (await page.evaluate(() => scrollY));
  await row.hover();
  await page.waitForTimeout(850);
  const after = await copy.boundingBox();
  check(
    "Article gently lifts without changing text size or horizontal alignment",
    Math.abs(before.x - after.x) < 0.5 &&
      Math.abs(before.y - after.y - 2) < 0.5 &&
      Math.abs(before.width - after.width) < 0.5 &&
      Math.abs(before.height - after.height) < 0.5,
  );
  await page.waitForTimeout(600);
  check(
    "Article stays suspended without a repeating animation",
    Math.abs((await copy.boundingBox()).y - after.y) < 0.5,
  );
  check(
    "Article reveals its compact matte paper reverse",
    await row.evaluate((node, expected) => {
      const fold = getComputedStyle(node, "::before");
      return (
        parseFloat(fold.width) <= 26 &&
        parseFloat(fold.height) <= 26 &&
        fold.backgroundImage.includes("linear-gradient") &&
        getComputedStyle(node).getPropertyValue("--sz-paper-reverse").trim() ===
          expected &&
        fold.opacity === "1"
      );
    }, paperReverse),
  );
  check(
    "Article has a visible lift shadow",
    await row.evaluate((node) => getComputedStyle(node).boxShadow !== "none"),
  );
  await page
    .locator(".sz-home-writing")
    .screenshot({ path: path.join(output, "writing-hover.png") });
  await page.mouse.move(12, 12);
  await page.waitForTimeout(650);
  check(
    "Article softly returns to its original position",
    Math.abs(
      (await copy.boundingBox()).y +
        (await page.evaluate(() => scrollY)) -
        beforeDocumentY,
    ) < 0.5,
  );
  await visit("/posts");
  check(
    "The same article keeps its paper color in the full list",
    await page.locator(".sz-article-row").evaluateAll(
      (nodes, identity) => {
        const matching = nodes.find(
          (node) => node.dataset.article === identity.slug,
        );
        return (
          !!matching &&
          getComputedStyle(matching)
            .getPropertyValue("--sz-paper-reverse")
            .trim() === identity.color
        );
      },
      { slug: rowIdentity, color: paperReverse },
    ),
  );
  const article = page.locator(".sz-article-row").nth(1);
  await article.hover();
  await page.waitForTimeout(650);
  check(
    "Full article rows also lift with a compact colored reverse",
    await article.evaluate(
      (node) =>
        getComputedStyle(node).translate === "0px -2px" &&
        parseFloat(getComputedStyle(node, "::before").height) <= 26,
    ),
  );
  await shot("articles-hover");
  for (let index = 0; index < 3; index++) {
    const colorRow = page.locator(".sz-article-row").nth(index);
    await colorRow.hover();
    await page.waitForTimeout(650);
    await colorRow.screenshot({
      path: path.join(output, `paper-color-${index + 1}.png`),
    });
  }
  await page.mouse.move(12, 12);
  await article.locator("h2 a").focus();
  await page.waitForTimeout(650);
  check(
    "Article keyboard focus preserves the paper response",
    await article.evaluate(
      (node) =>
        getComputedStyle(node, "::before").opacity === "1" &&
        getComputedStyle(node).translate === "0px -2px",
    ),
  );
  await visit("/directory");
  check(
    "Directory has a fine heading rule, chapter strokes and short curved edges",
    await page.evaluate(() => {
      const heading = document.querySelector(".sz-directory-heading");
      const chapters = [
        ...document.querySelectorAll(".sz-directory-section-heading"),
      ];
      return (
        getComputedStyle(heading).borderBottomWidth === "1px" &&
        chapters.every(
          (node) =>
            getComputedStyle(node, "::before").borderTopWidth === "1px" &&
            getComputedStyle(node, "::after").borderTopWidth === "1px",
        )
      );
    }),
  );
  for (const section of await page
    .locator(".sz-directory-grid > section")
    .all()) {
    check(
      "Directory heading and entries share their left edge",
      Math.abs(
        (await x(section.locator("h2"))) -
          (await x(section.locator(".sz-directory-entry > span").first())),
      ) < 1,
    );
  }
  const directoryLink = page.locator(".sz-directory-entry").first();
  await directoryLink.hover();
  await page.waitForTimeout(400);
  check(
    "Directory hover uses type emphasis without a filled panel",
    await directoryLink.evaluate(
      (node) =>
        getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)" &&
        getComputedStyle(node.querySelector("span")).textDecorationLine ===
          "underline" &&
        getComputedStyle(node).translate === "2px",
    ),
  );
  await page.mouse.move(12, 12);
  await shot("directory-1440", true);
  await visit("/archive");
  const yearLinks = page.locator(".sz-archive-jump a");
  check(
    "Archive begins with exactly one active year",
    (await page
      .locator('.sz-archive-jump a[aria-current="location"]')
      .count()) === 1,
  );
  const secondYear = yearLinks.nth(1);
  await secondYear.click();
  check(
    "Archive year navigation updates its current marker",
    (await secondYear.getAttribute("aria-current")) === "location",
  );
  const yearToggle = page.locator(".sz-archive-year-toggle").nth(1);
  await yearToggle.hover();
  await page.waitForTimeout(400);
  check(
    "Archive year hover stays transparent and emphasizes its label",
    await yearToggle.evaluate(
      (node) =>
        getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)" &&
        getComputedStyle(
          node.querySelector(".sz-archive-year-number"),
          "::after",
        ).transform === "matrix(1, 0, 0, 1, 0, 0)",
    ),
  );
  check(
    "Month navigation is ordered by short rules",
    await page
      .locator(".sz-archive-year-index button")
      .first()
      .evaluate(
        (node) =>
          getComputedStyle(node).borderBottomWidth === "1px" &&
          getComputedStyle(node, "::before").borderTopWidth === "1px",
      ),
  );
  await shot("archive-1440");
  await visit("/projects/yingtian");
  check(
    "Project labels share their left edge",
    Math.abs(
      (await x(page.locator(".sz-project-description h2"))) -
        (await x(page.locator(".sz-project-writing h2"))),
    ) < 1,
  );
  check(
    "Project prose and notes share their left edge",
    Math.abs(
      (await x(page.locator(".sz-project-description p"))) -
        (await x(page.locator(".sz-project-notes > p"))),
    ) < 1,
  );
  const external = page.getByRole("link", { name: "打开作品", exact: true });
  await page.keyboard.press("Tab");
  await external.focus();
  check(
    "Project link focus fits its text",
    (await external.boundingBox()).width < 180,
  );
  check(
    "Empty notes have one concise message",
    (await page.locator(".sz-project-notes > p").count()) === 1,
  );
  await page
    .locator(".sz-project-body")
    .screenshot({ path: path.join(output, "project-body-1440.png") });
  await visit("/projects");
  const palette = ["#4c607b", "#71836c", "#a77b5c"];
  const coverLinks = page.locator(".sz-project-list .sz-discovery");
  for (let index = 0; index < palette.length; index++) {
    const projectCover = coverLinks.nth(index);
    await projectCover.hover();
    await page.waitForTimeout(550);
    check(
      "Project cover " +
        (index + 1) +
        " keeps original color and its own reverse",
      await projectCover.evaluate(
        (node, expected) =>
          getComputedStyle(node)
            .getPropertyValue("--sz-paper-reverse")
            .trim() === expected &&
          getComputedStyle(node, "::after").opacity === "1" &&
          getComputedStyle(node.querySelector("img")).filter === "none",
        palette[index],
      ),
    );
  }
  await visit("/about");
  check(
    "About work links open the real websites",
    JSON.stringify(
      await page
        .locator(".sz-colophon-work")
        .evaluateAll((nodes) =>
          nodes.map((node) => [
            node.getAttribute("href"),
            node.getAttribute("target"),
          ]),
        ),
    ) ===
      JSON.stringify([
        ["https://zhiyi.szweb.ren/", "_blank"],
        ["https://seasons.szweb.ren/?season=spring", "_blank"],
        ["https://yingtian.szweb.ren/", "_blank"],
      ]),
  );
  check(
    "About introduction has a quieter scale",
    await page
      .locator(".sz-colophon-lead")
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize) <= 24),
  );
  await shot("about-1440", true);
  for (const width of [320, 390, 768, 1024]) {
    for (const route of [
      "/",
      "/posts",
      "/projects",
      "/projects/seasons",
      "/directory",
      "/archive",
      "/about",
    ]) {
      await visit(route, width);
      if (width === 390)
        await shot(
          route === "/"
            ? "home-390"
            : route.slice(1).replaceAll("/", "-") + "-390",
          route !== "/archive",
        );
      if (width === 390 && route === "/archive") {
        const yearBoxes = await page
          .locator(".sz-archive-jump a")
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              x: node.getBoundingClientRect().x,
              y: node.getBoundingClientRect().y,
            })),
          );
        check(
          "Mobile years form two ordered rows of three",
          yearBoxes.length === 6 &&
            yearBoxes[0].y === yearBoxes[2].y &&
            yearBoxes[3].y === yearBoxes[5].y &&
            yearBoxes[0].x === yearBoxes[3].x &&
            yearBoxes[3].y > yearBoxes[0].y,
        );
      }
    }
  }
  await visit("/");
  await page.locator(".sz-desktop-appearance summary").click();
  await page
    .locator(".sz-desktop-appearance")
    .getByRole("button", { name: "深色", exact: true })
    .click();
  await page.locator(".sz-desktop-appearance summary").click();
  await page.getByRole("tab", { name: /四时/ }).click();
  check(
    "Dark mode preserves original cover color",
    await page
      .locator(".is-active img")
      .evaluate((node) => getComputedStyle(node).filter === "none"),
  );
  await shot("home-dark", true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await row.hover();
  check(
    "Reduced motion keeps the article still",
    await row.evaluate(
      (node) =>
        getComputedStyle(node).translate === "none" &&
        getComputedStyle(node).transitionDuration === "0s",
    ),
  );
  check(
    "Reduced motion removes corner transitions",
    await cover.evaluate(
      (node) => getComputedStyle(node, "::after").transitionDuration === "0s",
    ),
  );
  await topic.hover();
  check(
    "Reduced motion keeps topic feedback still",
    await topic.evaluate((node) => getComputedStyle(node).translate === "none"),
  );
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await topic.focus();
  await page.waitForTimeout(120);
  check(
    "High contrast retains an explicit keyboard outline",
    await topic.evaluate(
      (node) =>
        getComputedStyle(node).outlineWidth === "2px" &&
        getComputedStyle(node).outlineStyle === "solid",
    ),
  );
  await topic.evaluate((node) => node.blur());
  await page.emulateMedia({ forcedColors: "none" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await row.hover();
  await page.waitForTimeout(650);
  check(
    "Dark mode retains the article's paper color and visible lift",
    await row.evaluate((node, expected) => {
      return (
        getComputedStyle(node).getPropertyValue("--sz-paper-reverse").trim() ===
          expected &&
        getComputedStyle(node, "::before").opacity === "1" &&
        getComputedStyle(node).boxShadow !== "none"
      );
    }, paperReverse),
  );
  await page
    .locator(".sz-home-writing")
    .screenshot({ path: path.join(output, "writing-hover-dark.png") });
  await page.locator(".sz-desktop-appearance summary").click();
  await page
    .locator(".sz-desktop-appearance")
    .getByRole("button", { name: "浅色", exact: true })
    .click();
  await page.locator(".sz-desktop-appearance summary").click();
  check("No browser errors", report.errors.length === 0);
  check("No external requests", report.external.length === 0);
  report.pass = true;
} catch (error) {
  report.pass = false;
  report.failure = String(error);
  await shot("failure", true).catch(() => {});
  throw error;
} finally {
  fs.writeFileSync(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
