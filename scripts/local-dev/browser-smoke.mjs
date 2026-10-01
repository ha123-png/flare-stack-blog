import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { assertSafeLaunch, privatePath } from './guard.mjs';

assertSafeLaunch();
const runtime = process.env.LOCAL_PLAYWRIGHT_PATH;
if (!runtime) throw new Error('Set LOCAL_PLAYWRIGHT_PATH to the installed Playwright package');
const { chromium } = createRequire(import.meta.url)(runtime);
const output = path.join(privatePath, 'browser');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--disable-background-networking'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', reducedMotion: 'reduce', colorScheme: 'light' });
const evidence = { at: new Date().toISOString(), requests: [], responses: [], failures: [], errors: [], external: [], pages: [] };
const page = await context.newPage();
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    evidence.external.push({ origin: url.origin, path: url.pathname });
    await route.abort('blockedbyclient');
    return;
  }
  await route.continue();
});
page.on('request', r => evidence.requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }));
const pendingResponses = [];
page.on('response', r => {
  const item = { url: r.url(), status: r.status() };
  evidence.responses.push(item);
  if (r.status() >= 400) pendingResponses.push(r.text().then(body => { item.body = body.slice(0, 8000); }).catch(() => {}));
});
page.on('requestfailed', r => evidence.failures.push({ url: r.url(), error: r.failure()?.errorText }));
page.on('pageerror', e => evidence.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') evidence.errors.push(m.text()); });
async function check(name, route, text) {
  if (route !== null) {
    const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    assert.equal(response?.status(), 200, `${name} HTTP`);
  }
  await page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 20000 });
  // Exercise article images below the fold, including the long lazy-loaded SVG.
  if (name === 'post') {
    for (const img of await page.locator('img[loading="lazy"]').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(element => element.decode());
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  const measurements = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, dark: document.documentElement.classList.contains('dark'), brokenImages: Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')) }));
  evidence.pages.push({ name, url: page.url(), title: await page.title(), ...measurements });
  assert.equal(evidence.external.length, 0, 'External browser request detected; stop local dev server for investigation');
  console.log(`Browser PASS: ${name}`);
}
try {
  await check('home', '/', '把个人博客搬到边缘运行');
  await check('posts', '/posts', '把个人博客搬到边缘运行');
  await check('post', '/post/edge-blog-in-a-weekend', '把个人博客搬到边缘运行');
  await check('search', '/search?q=中文', '中文分词');
  assert.ok(await page.locator('h2').count(), 'Search must render a result');
  await check('friends', '/friend-links', '友');
  await check('login', '/login', '登录');
  await check('register', '/register', '注册');
  await page.setViewportSize({ width: 390, height: 844 });
  await check('mobile', '/', '把个人博客搬到边缘运行');
  assert.ok(evidence.pages.at(-1).scrollWidth <= 392, 'Mobile horizontal overflow');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const theme = page.getByRole('button', { name: /^主题：/ });
  for (let count = 0; count < 3 && !(await page.locator('html').getAttribute('class'))?.includes('dark'); count++) await theme.click();
  await check('dark', null, '把个人博客搬到边缘运行');
  assert.equal(evidence.pages.at(-1).dark, true);
  assert.deepEqual(evidence.errors, [], 'Browser runtime/console errors');
  assert.deepEqual(evidence.failures, [], 'Failed browser requests');
  assert.deepEqual(evidence.responses.filter(x => x.status >= 400), [], 'Failed browser resources');
  assert.deepEqual(evidence.pages.flatMap(x => x.brokenImages), [], 'Broken fixture images');
  evidence.pass = true;
} catch (error) {
  evidence.pass = false;
  evidence.failure = String(error);
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await Promise.all(pendingResponses);
  fs.writeFileSync(path.join(output, 'network-and-pages.json'), JSON.stringify(evidence, null, 2));
  await browser.close();
}
