// Capture unmodified consumer source with explicitly synthetic, local-only data.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const consumer = resolve(process.env.MENTION_ROOT);
const origin = process.env.MENTION_ORIGIN ?? 'http://localhost:8127';
const output = resolve(process.env.BASELINE_OUTPUT ?? 'docs/audits/issue-663/baseline/mention');
const require = createRequire(join(consumer, 'package.json'));
const { chromium, expect } = require('@playwright/test');
mkdirSync(output, { recursive: true });
const author = {
  id: '019e23ee-2d68-7000-8001-000000000001',
  username: 'baseline-fixture',
  name: { displayName: 'Composition baseline' },
};
const posts = Array.from({ length: 40 }, (_, index) => ({
  id: `019e23ee-2d68-7000-8000-${String(index + 1).padStart(12, '0')}`,
  user: author,
  authors: [],
  attachments: {},
  content: {
    text: `Baseline post ${index + 1}\n${'A line of variable-height content.\n'.repeat(index % 5)}`,
  },
  metadata: {
    visibility: 'public',
    createdAt: '2026-11-08T06:00:00.000Z',
    updatedAt: '2026-11-08T06:00:00.000Z',
  },
  engagement: { likes: 0, downvotes: 0, boosts: 0, replies: 0 },
  viewerState: {
    isOwner: false,
    isCollaborator: false,
    isLiked: false,
    isDownvoted: false,
    isBoosted: false,
    isSaved: false,
  },
  permissions: { canReply: true, canDelete: false, canPin: false, canViewSources: false },
}));
const report = {
  sourceSha: execFileSync('git', ['-C', consumer, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  bloomVersion: JSON.parse(readFileSync(require.resolve('@oxy.so/bloom/package.json'), 'utf8'))
    .version,
  observedAt: new Date().toISOString(),
  mode: 'development Metro; synthetic anonymous data; no production API traffic',
  origin,
  frames: [],
  errors: [],
  unexpected: [],
  checks: {},
};
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
  colorScheme: 'light',
  deviceScaleFactor: 1,
});
await context.routeWebSocket(
  (url) => url.host !== new URL(origin).host,
  (socket) => socket.close(),
);
await context.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.origin === origin) return route.continue();
  const method = request.method();
  const path = url.pathname;
  const headers = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': '*',
  };
  const json = (body) => route.fulfill({ json: body, headers });
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (url.hostname === 'api.syra.fm' && method === 'GET' && path === '/api/rooms/live-users')
    return json({ liveUsers: [] });
  if (url.hostname === 'api.oxy.so') {
    if (method === 'POST' && path === '/stickers/resolve') return json({ stickers: [] });
    if (method === 'GET' && path.startsWith('/auth/oauth/client/'))
      return json({
        application: {
          id: 'fixture-app',
          name: 'Read-only baseline',
          type: 'internal',
          isOfficial: true,
          isInternal: true,
          clientId: path.split('/').pop(),
          scopes: [],
        },
      });
    if (method === 'GET' && (path === '/session/user' || path === '/users/me'))
      return route.fulfill({ status: 401, json: { error: 'No synthetic session' }, headers });
    if (method === 'GET' && (path.startsWith('/profiles/') || path === `/users/${author.id}`))
      return json(author);
  }
  if (url.hostname === 'api.mention.earth') {
    if (method === 'GET') {
      if (path === '/') return json({ status: 'ok' });
      if (path === '/feed/mtn') return json({ items: posts, hasMore: false });
      if (path.startsWith('/feed/item/')) {
        const post = posts.find((post) => path.endsWith(post.id));
        return route.fulfill({ status: post ? 200 : 404, json: post ?? {}, headers });
      }
      if (path.startsWith('/feed/replies/')) return json({ items: [], hasMore: false });
      if (path.startsWith('/feed/thread-continuations/')) return json({ items: [] });
      if (path === '/trending') return json({ trending: [], count: 0 });
      if (path === '/recommendations') return json({ recommendations: [], hasMore: false });
      if (path === '/lanes') return json({ data: [] });
    }
    if (
      method === 'POST' &&
      (['/telemetry/web', '/feed/mtn/interactions'].includes(path) ||
        /^\/statistics\/post\/[^/]+\/view$/.test(path))
    )
      return route.fulfill({ status: 204, headers });
  }
  report.unexpected.push(`${method} ${url.origin}${path}`);
  return route.abort();
});
await context.addInitScript(() => {
  const sources = ['explore', 'trending', 'following'];
  const ids = ['baseline-1', 'baseline-2', 'baseline-3'];
  const state = {
    syncEnabled: false,
    order: ids,
    panels: Object.fromEntries(
      sources.map((source, index) => [
        ids[index],
        { source, width: 390, resizable: true, appearance: 'solid' },
      ]),
    ),
  };
  localStorage.setItem(
    'mention:deck:workspace',
    JSON.stringify({
      version: 1,
      state: { records: { anonymous: { state, base: null, revision: 0, dirty: false } } },
    }),
  );
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && message.args().length)
    report.errors.push(message.text().split('\n')[0]);
});
async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: false });
  const measurements = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    scroll: { x: scrollX, y: scrollY },
    documentWidth: document.documentElement.scrollWidth,
    regions: [
      ...document.querySelectorAll(
        '[data-testid^="mention-shell"],[data-bloom-screen-viewport],[role="tablist"]',
      ),
    ]
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width && box.height;
      })
      .map((node) => {
        const box = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        return {
          id: node.getAttribute('data-testid'),
          viewport: node.getAttribute('data-bloom-screen-viewport'),
          role: node.getAttribute('role'),
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          borderRadius: css.borderRadius,
          padding: css.padding,
          overflow: css.overflow,
        };
      }),
    rows: [...document.querySelectorAll('[data-post-uri]')].slice(0, 12).map((node) => {
      const box = node.getBoundingClientRect();
      return {
        uri: node.getAttribute('data-post-uri'),
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }),
  }));
  report.frames.push({ name, url: page.url(), ...measurements });
}
try {
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.locator('[data-post-uri]').first().waitFor({ timeout: 90000 });
  const shell = await page.getByTestId('mention-shell').elementHandle();
  report.checks.shellDomIdentity = [];
  for (const width of [1440, 1024, 768, 390, 320, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await expect(page.locator('[data-post-uri]').first()).toBeAttached();
    await page.waitForTimeout(500);
    report.checks.shellDomIdentity.push({
      width,
      same: await shell.evaluate(
        (node) =>
          node.isConnected && node === document.querySelector('[data-testid="mention-shell"]'),
      ),
    });
    await capture(
      `feed-${width}${report.frames.some((frame) => frame.name === `feed-${width}`) ? '-return' : ''}`,
    );
  }
  await page.mouse.move(650, 500);
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  const selected = await page.evaluate(() => {
    const row = [...document.querySelectorAll('[data-post-uri]')].find((node) => {
      const box = node.getBoundingClientRect();
      return box.top > 100 && box.top < innerHeight - 150;
    });
    if (!row) throw Error('No visible row');
    const target = row.querySelector('[tabindex="0"]');
    if (!target) throw Error('No post keyboard target');
    target.focus();
    return {
      uri: row.getAttribute('data-post-uri'),
      top: row.getBoundingClientRect().top,
      scroll: scrollY,
    };
  });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/p\//);
  await capture('detail-1440');
  await page.goBack();
  await expect
    .poll(() =>
      page.evaluate(
        (uri) =>
          [...document.querySelectorAll('[data-post-uri]')].some(
            (node) =>
              node.getAttribute('data-post-uri') === uri &&
              node.getBoundingClientRect().bottom > 0 &&
              node.getBoundingClientRect().top < innerHeight,
          ),
        selected.uri,
      ),
    )
    .toBe(true);
  report.checks.scrollReturn = { before: selected, after: await page.evaluate(() => scrollY) };
  await capture('feed-scroll-return');
  await page.goto(`${origin}/deck`);
  await page.getByTestId('mention-shell-panels-baseline-1').waitFor({ timeout: 60000 });
  await capture('deck-1440');
  const first = page.getByTestId('mention-shell-panels-baseline-1');
  await first.getByText(posts[0].content.text, { exact: true }).first().click();
  await expect(first.getByRole('heading', { name: 'Post', exact: true })).toBeVisible();
  await capture('deck-detail-1440');
  await first.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(first.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page).not.toHaveURL(/\/deck$/);
  await capture('deck-to-tablet');
  report.checks.deckCompactRedirect = true;
  report.status =
    report.errors.length || report.unexpected.length ? 'captured with exceptions' : 'captured';
} catch (error) {
  report.status = 'incomplete';
  report.failure = error.message;
  await capture('failure');
  process.exitCode = 1;
} finally {
  writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      status: report.status,
      frames: report.frames.length,
      errors: report.errors,
      unexpected: report.unexpected,
      failure: report.failure,
    }),
  );
  await browser.close();
}
