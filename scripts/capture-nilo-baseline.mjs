// Unmodified Nilo routes with local-only account/API fixtures and a seeded offline document.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const consumer = resolve(process.env.NILO_ROOT);
const require = createRequire(join(consumer, 'package.json'));
const browserRequire = createRequire(join(resolve(process.env.MENTION_ROOT), 'package.json'));
const { chromium, expect } = browserRequire('@playwright/test');
const Y = require('yjs');
const { writeDocument } = require('@oxy.so/bloom-editor/yjs');
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
      { id: 'name', name: 'Name', type: 'title' },
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
let empty = false;
const report = {
  sourceSha: execFileSync('git', ['-C', consumer, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
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
      if (path === '/teamspaces') return json({ teamspaces: [] });
      if (path === '/pages') return json({ pages: [pageData] });
      if (path === '/pages/shared' || path === '/pages/recent') return json({ pages: [] });
      if (path === `/pages/${pageData.id}`) return json({ page: pageData, role: 'owner' });
      if (path === `/pages/${pageData.id}/breadcrumb`) return json({ breadcrumb: [] });
      if (path === `/pages/${pageData.id}/comments`) return json({ comments: [] });
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
page.on('console', (message) => {
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
      body: document.body.innerText.slice(0, 3500),
      regions: [
        ...document.querySelectorAll(
          '[data-bloom-screen-viewport],[data-bloom-panel-index],[role="tablist"],[role="columnheader"],h1,h2',
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
  await page.goto(`${origin}/db/${database.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.getByText('Improve website copy', { exact: true }).first().waitFor({ timeout: 60000 });
  await capture('database-populated-1440');
  for (const width of [1024, 768, 390, 320, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.waitForTimeout(500);
    await capture(`database-populated-${width}`);
  }
  empty = true;
  await page.reload();
  await page.getByText('Projects', { exact: true }).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1000);
  await capture('database-empty-1440');
  await page.goto(`${origin}/p/${pageData.id}`);
  await page.getByText('Project overview', { exact: true }).first().waitFor({ timeout: 60000 });
  await capture('document-1440');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await capture('document-390');
  report.status =
    report.errors.length || report.unexpected.length ? 'captured with exceptions' : 'captured';
} catch (error) {
  report.status = 'incomplete';
  report.failure = error.message;
  await capture('failure');
  process.exitCode = 1;
} finally {
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
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
