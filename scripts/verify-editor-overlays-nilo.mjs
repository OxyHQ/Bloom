// Nilo routes with local-only account/API fixtures and a seeded offline document.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const consumer = resolve(process.env.NILO_ROOT);
const require = createRequire(join(consumer, 'package.json'));
const browserRequire = createRequire(join(resolve(process.env.MENTION_ROOT), 'package.json'));
const { chromium } = browserRequire('@playwright/test');
const Y = require('yjs');
const { writeDocument } = require('@oxy.so/bloom-editor/yjs');
const applyLabel =
  process.env.EDITOR_LONG_LABELS === '1'
    ? 'Änderungen am ausgewählten Hyperlink übernehmen'
    : 'Apply';
const origin = process.env.NILO_ORIGIN ?? 'http://localhost:8128';
const output = resolve(process.env.BASELINE_OUTPUT ?? 'docs/audits/issue-663/baseline/nilo');
mkdirSync(output, { recursive: true });
const date = '2026-11-08T06:00:00.000Z';
const user = {
  id: 'baseline-user',
  username: 'baseline-user',
  kind: 'personal',
  name: { displayName: 'Baseline Viewer' },
  email: 'viewer@example.test',
  avatar: null,
  verified: false,
  privacy: { isPrivate: false },
  counts: { followers: 0, following: 0, posts: 0 },
  locale: 'en',
};
const workspace = {
  id: 'baseline-workspace',
  name: 'Product workspace',
  avatar: null,
  ownerId: user.id,
  isPersonal: true,
  archivedAt: null,
  createdAt: date,
  updatedAt: date,
  role: 'owner',
};
const pageData = {
  id: 'baseline-document',
  workspaceId: workspace.id,
  teamspaceId: null,
  parentId: null,
  ownerId: user.id,
  title: 'Project brief',
  icon: null,
  cover: null,
  coverPosition: 50,
  publishedAt: null,
  publishSlug: null,
  publishIndexing: false,
  restricted: false,
  template: false,
  archived: false,
  favorited: false,
  order: 0,
  createdAt: date,
  updatedAt: date,
  databaseId: null,
  properties: {},
  fullWidth: false,
  smallText: false,
  font: 'default',
  mode: 'document',
  locked: false,
};
const database = {
  id: 'baseline-database',
  workspaceId: workspace.id,
  teamspaceId: null,
  name: 'Projects',
  icon: null,
  cover: null,
  ownerId: user.id,
  schema: {
    properties: [
      { id: 'name', name: 'Name', type: 'text' },
      {
        id: 'effort',
        name: 'Effort level',
        type: 'select',
        config: {
          options: [
            { id: 'medium', name: 'Medium', color: 'yellow' },
            { id: 'small', name: 'Small', color: 'green' },
          ],
        },
      },
    ],
  },
  isInline: false,
  parentPageId: null,
  archived: false,
  locked: false,
  systemKey: null,
  createdAt: date,
  updatedAt: date,
};
const view = {
  id: 'baseline-table',
  databaseId: database.id,
  name: 'Table',
  type: 'table',
  isDefault: true,
  filters: { kind: 'group', combinator: 'and', filters: [] },
  sorts: [],
  groupBy: null,
  hiddenProperties: [],
  frozenProperties: [],
  pageSize: 50,
  config: {},
  order: 0,
  createdAt: date,
  updatedAt: date,
};
const rowNames = [
  'Improve website copy',
  'Create new illustrations',
  'Social media post',
  'Create new videos',
  'Revise value props',
  'Create competitor list',
  'Launch new home page',
];
const rows = rowNames.map((title, index) => ({
  id: `baseline-row-${index}`,
  workspaceId: workspace.id,
  parentId: null,
  databaseId: database.id,
  title,
  icon: null,
  cover: null,
  ownerId: user.id,
  archived: false,
  order: index,
  properties: { effort: { optionId: index % 2 ? 'small' : 'medium' } },
  createdAt: date,
  updatedAt: date,
}));
const empty = false;
const report = {
  sourceSha: execFileSync('git', ['-C', consumer, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  presetVersion: require('@oxy.so/app-preset/package.json').version,
  sourceDiff: execFileSync('git', ['-C', consumer, 'diff', '--stat'], { encoding: 'utf8' }).trim(),
  bloomVersion: JSON.parse(readFileSync(require.resolve('@oxy.so/bloom/package.json'), 'utf8'))
    .version,
  observedAt: new Date().toISOString(),
  mode: 'development Metro; synthetic account/API; seeded offline document; no production API traffic',
  origin,
  frames: [],
  errors: [],
  unexpected: [],
  requests: [],
  checks: {},
};
const doc = new Y.Doc();
const ids = Array.from({ length: 30 }, (_, index) => `baseline-block-${index}`);
writeDocument(doc, {
  root: ids,
  blocks: Object.fromEntries(
    ids.map((id, index) => [
      id,
      {
        id,
        type: index === 0 ? 'heading_1' : 'paragraph',
        props: {},
        text: [
          {
            text:
              index === 0
                ? 'Project overview'
                : `Section ${index}: Define the scope, preserve the shared composition and verify the complete workflow.`,
            marks: [],
          },
        ],
        children: [],
      },
    ]),
  ),
});
const update = [...Y.encodeStateAsUpdate(doc)];
const expiresAt = new Date(Date.now() + 7200000).toISOString();
const token = [
  Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'),
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      userId: user.id,
      sessionId: 'baseline-session',
      exp: Math.floor(Date.now() / 1000) + 7200,
    }),
  ).toString('base64url'),
  'fixture',
].join('.');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
  colorScheme: process.env.THEME ?? 'light',
  deviceScaleFactor: 1,
  ...(process.env.EDITOR_POINTER === 'coarse' ? { isMobile: true, hasTouch: true } : {}),
});
await context.routeWebSocket(
  (url) => url.host !== new URL(origin).host,
  (socket) => socket.close(),
);
await context.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();
  if (url.origin === origin) {
    if (path === '/__baseline_seed')
      return route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Fixture preparation</title>',
      });
    return route.continue();
  }
  report.requests.push(`${method} ${url.origin}${path}`);
  const headers = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  };
  const json = (body) => route.fulfill({ json: body, headers });
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (url.hostname === 'api.oxy.so') {
    if (path === '/accounts') return json({ accounts: [] });
    if (path === '/apps/assertions')
      return json({
        assertion: 'fixture-assertion',
        applicationId: 'fixture-app',
        platform: 'web',
        expiresAt,
      });
    if (path === '/session/device/directory')
      return json({
        deviceId: 'fixture-device',
        revision: 1,
        activeContextId: 'fixture-context',
        principals: [
          {
            id: 'fixture-principal',
            userId: user.id,
            authuser: 0,
            user,
            contexts: [
              {
                id: 'fixture-context',
                accountId: user.id,
                kind: 'personal',
                relationship: 'self',
                account: user,
                onDevice: true,
                available: true,
                active: true,
                lastUsedAt: Date.now(),
              },
            ],
          },
        ],
        updatedAt: Date.now(),
      });
    if (path === '/session/device/add')
      return route.fulfill({
        status: 503,
        headers,
        json: { message: 'Fixture does not register devices' },
      });

    if (path.startsWith('/auth/oauth/client/'))
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
    if (path === '/session/device/token')
      return json({
        accessToken: token,
        expiresAt,
        userId: user.id,
        sessionId: 'baseline-session',
        nextDeviceSecret: 'fixture-only',
        user,
      });
    if (path.startsWith('/session/user/') || path === '/users/me' || path === `/users/${user.id}`)
      return json(user);
    if (path.includes('/session/sessions') || path.startsWith('/session/device/sessions/'))
      return json([]);
    if (path === '/users/by-ids') return json({ users: [user] });
    if (path === '/safety/supervision') return json({ self: null, children: [], invitations: [] });
    if (path.includes('settings') || path.includes('preferences') || path.includes('entitlements'))
      return json({ language: 'en', theme: 'light', colorPreset: 'yellow' });
  }
  if (url.hostname === 'nilo-fixture.invalid') {
    if (method === 'POST' && path === `/pages/${pageData.id}/visit`)
      return route.fulfill({ status: 204, headers });
    if (method === 'GET') {
      if (path === '/workspaces') return json({ workspaces: [workspace] });
      if (path === `/workspaces/${workspace.id}`) return json({ workspace });
      if (path === `/workspaces/${workspace.id}/teamspaces`) return json({ teamspaces: [] });
      if (path === '/pages') return json({ pages: [pageData] });
      if (path === '/pages/shared') return json({ shared: [] });
      if (path === '/pages/recent') return json({ pages: [] });
      if (path === `/pages/${pageData.id}`) return json({ page: pageData, role: 'owner' });
      if (path === `/pages/${pageData.id}/breadcrumb`) return json({ breadcrumb: [] });
      if (path === `/pages/${pageData.id}/follow`) return json({ following: false });
      if (path === `/pages/${pageData.id}/backlinks`) return json({ backlinks: [] });
      if (path === `/pages/${pageData.id}/permissions`)
        return json({
          pageId: pageData.id,
          role: 'owner',
          restricted: false,
          restrictedFrom: null,
          openToWorkspace: true,
          grants: [],
        });
      if (path === `/pages/${pageData.id}/comments`) return json({ comments: [] });
      if (path === `/workspaces/${workspace.id}/members`)
        return json({ members: [{ userId: user.id, role: 'owner', user }] });
      if (path === '/notifications/vapid-public-key') return json({ publicKey: null });
      if (path === `/databases/${database.id}/automations`) return json({ automations: [] });
      if (path === '/notifications/unread-count') return json({ count: 0 });
      if (path === '/databases') return json({ databases: [database] });
      if (path === `/databases/${database.id}`)
        return json({ database, views: [view], role: 'owner' });
      if (path === `/databases/${database.id}/views`) return json({ views: [view] });
      if (path === `/databases/${database.id}/rows`)
        return json({
          rows: empty ? [] : rows,
          total: empty ? 0 : rows.length,
          cursor: null,
          view,
        });
      if (path === `/databases/${database.id}/templates`) return json({ templates: [] });
    }
  }
  report.unexpected.push(`${method} ${url.origin}${path}`);
  return route.abort();
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(error.message));
page.on('console', async (message) => {
  if (message.type() === 'error') {
    for (const arg of message.args()) {
      try {
        const stack = await arg.evaluate((value) => value?.stack);
        if (stack) report.errors.push(stack);
      } catch {}
    }
  }
  if (message.type() === 'error' && message.args().length)
    report.errors.push(message.text().split('\n')[0]);
});
async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: false });
  report.frames.push({
    name,
    url: page.url(),
    ...(await page.evaluate(() => ({
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      documentWidth: document.documentElement.scrollWidth,
      // Record visible text, excluding hidden app content.
      body: document.body.innerText.slice(0, 3500),
      regions: [
        ...document.querySelectorAll(
          '[data-bloom-screen-viewport],[data-bloom-panel-index],[data-testid="table-title-header"],[data-testid="database-view-toolbar"],[role="tablist"],[role="columnheader"],h1,h2',
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
            tag: node.tagName,
            testID: node.getAttribute('data-testid'),
            role: node.getAttribute('role'),
            text: node.matches('h1,h2,[role="columnheader"]') ? node.textContent : null,
            viewport: node.getAttribute('data-bloom-screen-viewport'),
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            padding: css.padding,
            fontSize: css.fontSize,
            lineHeight: css.lineHeight,
            scrollTop: node.scrollTop,
          };
        }),
    }))),
  });
}
try {
  await page.goto(`${origin}/__baseline_seed`);
  await page.evaluate(
    async ({ user, token, expiresAt, workspaceId, pageId, update }) => {
      localStorage.setItem(
        'oxy.auth.v1',
        JSON.stringify({
          sessionId: 'baseline-session',
          userId: user.id,
          deviceId: 'fixture-device',
          deviceSecret: 'fixture-only',
        }),
      );
      localStorage.setItem('oxy.auth.token.v1', JSON.stringify({ accessToken: token, expiresAt }));
      localStorage.setItem('nilo:account', user.id);
      localStorage.setItem(
        'workspace-store',
        JSON.stringify({ state: { currentWorkspaceId: workspaceId }, version: 0 }),
      );
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('nilo-documents', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          const updates = db.createObjectStore('updates', { keyPath: 'seq', autoIncrement: true });
          updates.createIndex('page', 'pageId');
          db.createObjectStore('pages', { keyPath: 'pageId' });
        };
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['updates', 'pages'], 'readwrite');
          tx.objectStore('updates').add({ pageId, data: new Uint8Array(update) });
          tx.objectStore('pages').put({ pageId, dirty: false });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { user, token, expiresAt, workspaceId: workspace.id, pageId: pageData.id, update },
  );
  await page.goto(`${origin}/p/${pageData.id}`);
  if (process.env.EDITOR_DIALOG === '1')
    await page.getByRole('button', { name: 'Open editor fixture', exact: true }).click();
  await page.getByText('Project overview', { exact: true }).first().waitFor({ timeout: 120000 });
  await page.setViewportSize({ width: 390, height: 844 });
  const paragraph = page
    .locator('[contenteditable=true]')
    .filter({ hasText: 'Section 1: Define' })
    .first();
  const select = async (start, end) => {
    await paragraph.focus();
    await paragraph.evaluate(
      (node, [start, end]) => {
        const at = (offset) => {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let text;
          let last;
          while ((text = walker.nextNode())) {
            last = text;
            if (offset <= text.length) return [text, offset];
            offset -= text.length;
          }
          return [last, last.length];
        };
        const range = document.createRange();
        range.setStart(...at(start));
        range.setEnd(...at(end));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
      },
      [start, end],
    );
    await page.waitForTimeout(300);
  };
  await select(0, 7);
  report.checks.before = await page.getByRole('button').allTextContents();
  await capture('selection-390');
  if (process.env.EDITOR_CUSTOM_THEME === '1') {
    const bold = page.getByRole('button', { name: 'Bold', exact: true });
    await bold.hover();
    await page.waitForTimeout(300);
    report.checks.customTheme = await bold.evaluate((n) => ({
      foreground: getComputedStyle(n).color,
      background: getComputedStyle(n).backgroundColor,
    }));
    assert.equal(report.checks.customTheme.foreground, 'rgb(72, 13, 47)');
    assert.equal(report.checks.customTheme.background, 'rgba(143, 31, 92, 0.22)');
    await capture('custom-theme-hover');
  }

  await page.getByRole('button', { name: 'Bold', exact: true }).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  report.checks.afterKeyboardEntry = await page.evaluate(() => ({
    active: document.activeElement?.outerHTML,
    selection: window.getSelection()?.toString(),
  }));
  report.checks.linkButtonsAfterEntry = await page
    .getByRole('button', { name: 'Link', exact: true })
    .count();
  await capture('keyboard-entry-390');
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    'Bold',
  );
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  report.checks.keyboardActivation = [];
  for (const key of ['Space', 'Enter']) {
    await bold.focus();
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
    assert.equal(await bold.getAttribute('aria-pressed'), 'true');
    if (process.env.EDITOR_CUSTOM_THEME === '1') {
      assert.equal(
        await bold.evaluate((n) => getComputedStyle(n).backgroundColor),
        'rgba(143, 31, 92, 0.22)',
      );
      assert.equal(await bold.evaluate((n) => getComputedStyle(n).color), 'rgb(72, 13, 47)');
    }

    assert.equal(await page.evaluate(() => window.getSelection()?.toString()), 'Section');
    await bold.focus();
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
    assert.equal(await bold.getAttribute('aria-pressed'), 'false');
    report.checks.keyboardActivation.push(key);
  }

  await select(0, 7);
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  const url = page.getByRole('textbox', { name: 'Link', exact: true });
  if (process.env.EDITOR_CUSTOM_THEME === '1') {
    report.checks.customApplyAccent = await page
      .getByRole('button', { name: applyLabel, exact: true })
      .evaluate((n) => getComputedStyle([...n.querySelectorAll('span')].at(-1) ?? n).color);
    assert.equal(report.checks.customApplyAccent, 'rgb(143, 31, 92)');
  }

  if (process.env.EDITOR_LONG_LABELS === '1') {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.waitForTimeout(300);
    report.checks.longLabels = await page
      .getByRole('dialog', { name: 'Formatting', exact: true })
      .evaluate((n) => ({
        rect: n.getBoundingClientRect().toJSON(),
        buttons: [...n.querySelectorAll('button')].map((b) => ({
          label: b.getAttribute('aria-label'),
          rect: b.getBoundingClientRect().toJSON(),
          font: getComputedStyle(b).fontSize,
        })),
      }));
    for (const button of report.checks.longLabels.buttons) {
      assert.ok(button.rect.left >= 0 && button.rect.right <= 320);
      assert.equal(button.rect.height, 44);
      assert.equal(button.font, '16px');
    }
    await capture('long-labels-lg-320');
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await url.fill(`${origin}/__editor-link/original`);
  await select(11, 17);
  report.checks.linkDraftCancelled = (await url.count()) === 0;
  assert.equal(report.checks.linkDraftCancelled, true);
  await select(0, 7);
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  await url.fill(`${origin}/__editor-link/original`);
  await page.getByRole('button', { name: applyLabel, exact: true }).click();
  await page.waitForTimeout(300);
  report.checks.afterApply = await paragraph.evaluate((n) => n.innerHTML);
  await capture('apply-new-selection-390');
  assert.equal(await paragraph.locator('a').textContent(), 'Section');
  await select(3, 3);
  const openLink = page.getByRole('link', { name: 'Open', exact: true });
  report.checks.inlineHref = await openLink.getAttribute('href');
  assert.equal(report.checks.inlineHref, `${origin}/__editor-link/original`);
  if (process.env.EDITOR_CUSTOM_THEME === '1') {
    report.checks.customOpenAccent = await openLink.evaluate(
      (n) => getComputedStyle([...n.querySelectorAll('span')].at(-1) ?? n).color,
    );
    assert.equal(report.checks.customOpenAccent, 'rgb(143, 31, 92)');
  }

  await capture('existing-link-caret-390');
  await context.route(`${origin}/__editor-link/**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Fixture link destination</title>',
    }),
  );
  await page.evaluate(() => {
    window.__linkOpenCalls = [];
    const open = window.open.bind(window);
    window.open = (...args) => {
      window.__linkOpenCalls.push(args[0]);
      return open(...args);
    };
  });
  report.checks.linkActivation = [];
  for (const [kind, options] of [
    ['ordinary', {}],
    ['control', { modifiers: ['Control'] }],
    ['middle', { button: 'middle' }],
  ]) {
    const opened = context.waitForEvent('page', { timeout: 5000 });
    await openLink.click(options);
    const popup = await opened;
    await popup.waitForLoadState('domcontentloaded');
    const href = popup.url();
    await popup.close();
    const calls = await page.evaluate(() => window.__linkOpenCalls);
    report.checks.linkActivation.push({ kind, href, calls });
    assert.equal(href, `${origin}/__editor-link/original`);
    assert.equal(calls.length, 1, 'only ordinary activation uses app routing');
  }

  const pageCountBeforeRemove = context.pages().length;
  await page.getByRole('button', { name: 'Remove link', exact: true }).click();
  assert.equal(await paragraph.locator('a').count(), 0);
  assert.equal(context.pages().length, pageCountBeforeRemove);
  await paragraph.press('Control+z');
  await select(3, 3);
  assert.equal(
    await paragraph.locator('a').getAttribute('href'),
    `${origin}/__editor-link/original`,
  );
  report.checks.removeWithoutNavigation = true;
  await paragraph.press('Control+k');
  await page.waitForTimeout(300);
  report.checks.existingDraft = await url.inputValue();
  assert.equal(report.checks.existingDraft, `${origin}/__editor-link/original`);
  await url.evaluate((n) => (n.dataset.editorIdentity = 'retained'));
  // Use the actual scroll owner that contains the paragraph when present.
  const scrollTarget = await paragraph.evaluateHandle((n) => {
    for (let p = n.parentElement; p; p = p.parentElement)
      if (p.scrollHeight > p.clientHeight && /auto|scroll/.test(getComputedStyle(p).overflowY))
        return p;
    return null;
  });
  assert.ok(await scrollTarget.evaluate((n) => !!n));
  await scrollTarget.evaluate((n) => (n.scrollTop += 35));
  await page.waitForTimeout(300);
  assert.equal(await url.getAttribute('data-editor-identity'), 'retained');
  assert.equal(await url.inputValue(), `${origin}/__editor-link/original`);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.waitForTimeout(300);
  assert.equal(await url.getAttribute('data-editor-identity'), 'retained');
  assert.equal(await url.inputValue(), `${origin}/__editor-link/original`);
  await page.setViewportSize({ width: 390, height: 844 });
  await scrollTarget.evaluate((n) => (n.scrollTop = 0));
  report.checks.scrollResizeRetainsDraft = true;

  await url.fill('not a link');
  await page.getByRole('button', { name: applyLabel, exact: true }).click();
  report.checks.invalidDraft = {
    value: await url.inputValue(),
    invalid: await url.getAttribute('aria-invalid'),
  };
  assert.equal(report.checks.invalidDraft.invalid, 'true');
  await url.fill(`${origin}/__editor-link/edited`);
  await page.getByRole('button', { name: applyLabel, exact: true }).click();
  await page.waitForTimeout(300);
  assert.equal(await paragraph.locator('a').getAttribute('href'), `${origin}/__editor-link/edited`);
  await paragraph.press('Control+z');
  await page.waitForTimeout(300);
  report.checks.undoHref = await paragraph.locator('a').getAttribute('href');
  assert.equal(report.checks.undoHref, `${origin}/__editor-link/original`);
  await select(3, 3);
  await paragraph.press('Control+k');
  await url.fill('https://example.test/cancelled');
  await url.press('Escape');
  await page.waitForTimeout(300);
  report.checks.escape = {
    drafts: await url.count(),
    selection: await page.evaluate(() => window.getSelection()?.toString()),
  };
  assert.equal(report.checks.escape.drafts, 0);
  assert.equal(report.checks.escape.selection, 'Section');
  await page.getByRole('button', { name: 'Bold', exact: true }).focus();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  report.checks.outerEscape = {
    panels: await page.getByRole('dialog', { name: 'Formatting', exact: true }).count(),
    selection: await page.evaluate(() => window.getSelection()?.toString()),
  };
  assert.equal(report.checks.outerEscape.panels, 0);
  await select(20, 20);
  await select(0, 7);
  assert.equal(await page.getByRole('dialog', { name: 'Formatting', exact: true }).count(), 1);
  report.checks.reselectDismissedRange = true;
  await page.getByRole('button', { name: 'Bold', exact: true }).focus();
  await page.keyboard.press('Escape');

  if (process.env.EDITOR_DIALOG === '1') {
    assert.equal(
      await page.getByRole('dialog', { name: 'Editor test dialog', exact: true }).count(),
      1,
    );
    report.checks.parentDialogRetained = true;
    await capture('editor-dialog-after-inner-escape');
  } else {
    await select(11, 17);
    await paragraph.press('Control+k');
    await url.fill('https://example.test/unrelated');
    await page.evaluate(() => {
      const field = document.createElement('input');
      field.dataset.testid = 'unrelated-field';
      document.body.appendChild(field);
      field.focus();
    });
    await page.waitForTimeout(300);
    report.checks.unrelatedFocus = {
      drafts: await url.count(),
      active: await page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
    };
    assert.equal(report.checks.unrelatedFocus.drafts, 0);
    assert.equal(report.checks.unrelatedFocus.active, 'unrelated-field');
    await page.getByTestId('unrelated-field').evaluate((n) => n.remove());
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await select(11, 17);
      await page.getByRole('button', { name: 'Text color', exact: true }).click();
      await page.waitForTimeout(300);
      report.checks[`palette${width}`] = await page
        .getByRole('dialog', { name: 'Formatting', exact: true })
        .evaluate((n) => ({
          rect: n.getBoundingClientRect().toJSON(),
          buttons: [...n.querySelectorAll('button')].map((b) => ({
            label: b.getAttribute('aria-label'),
            rect: b.getBoundingClientRect().toJSON(),
          })),
        }));
      const palette = report.checks[`palette${width}`];
      assert.ok(palette.rect.left >= 0 && palette.rect.right <= width);
      for (const item of palette.buttons) {
        if (process.env.EDITOR_POINTER === 'coarse')
          assert.ok(item.rect.width >= 44 && item.rect.height >= 44, `coarse target ${item.label}`);
        assert.ok(item.rect.left >= 0 && item.rect.right <= width);
        assert.ok(item.rect.top >= palette.rect.top && item.rect.bottom <= palette.rect.bottom);
      }
      await capture(`palette-${width}`);
      await page.getByRole('button', { name: 'Color: Red', exact: true }).click();
    }
  }
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
