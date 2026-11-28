// Records what the TypeScript runtime (`stdlib/Bloom/runtime.ts`, `routing.ts`) answers for a
// grid of inputs, so the Swift standard library's tests compare against the same strings.
//
//   node --no-warnings Tests/BloomTests/Fixtures/make-intl-fixtures.mjs
//
// Node 22.6+ (type stripping; Node 24 does it by default). Every locale and time zone is
// passed explicitly: nothing depends on the machine's own. The output records Node's ICU and
// CLDR versions, which the Swift side's ICU may not share.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const stdlib = join(here, '../../../../../../../stdlib/Bloom');
const rt = await import(pathToFileURL(join(stdlib, 'runtime.ts')).href);

// routing.ts imports the language package for its view; its path functions do not need it.
const scratch = mkdtempSync(join(tmpdir(), 'bloom-routing-'));
const routingSource = readFileSync(join(stdlib, 'routing.ts'), 'utf8').replace(
  /^import \{ type Child, Embed \} from '@oxy\.so\/bloom-language';$/m,
  "type Child = unknown; const Embed = (x: unknown) => x;",
);
writeFileSync(join(scratch, 'routing.ts'), routingSource);
const routing = await import(pathToFileURL(join(scratch, 'routing.ts')).href);

const locales = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ar-EG', 'pt-BR', 'zh-CN', 'hi-IN', 'ru-RU'];
const zones = ['UTC', 'America/New_York'];
const styles = ['omitted', 'short', 'medium', 'long', 'full'];
const instants = [
  Date.UTC(2026, 10, 26, 18, 30, 0, 0),
  Date.UTC(2024, 1, 29, 5, 7, 9, 123),
  Date.UTC(2027, 0, 1, 0, 0, 0, 0),
  Date.UTC(1999, 6, 4, 23, 59, 59, 999),
];

const dates = [];
for (const ms of instants)
  for (const locale of locales)
    for (const timeZone of zones)
      for (const date of styles)
        for (const time of styles)
          dates.push({ ms, locale, timeZone, date, time, text: rt.formatDate(ms, locale, date, time, timeZone) });

const units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
const values = [0, 1, -1, 2, -2, 3, -5, 11, -45];
const relative = [];
for (const locale of locales)
  for (const unit of units)
    for (const value of values)
      relative.push({ value, unit, locale, text: rt.formatRelative(value, unit, locale, 'long') });

// `Date.formatted(.relative)` and `.abbreviated` (Time.bloom), as the TS emit runs them:
// Bloom's `rounded()` is `Math.round`, its `floor()` `Math.floor`.
function relativeText(seconds, locale) {
  const size = Math.abs(seconds);
  const f = (v, u) => rt.formatRelative(Math.round(v), u, locale, 'long');
  if (size < 60) return f(seconds, 'second');
  if (size < 3600) return f(seconds / 60, 'minute');
  if (size < 86400) return f(seconds / 3600, 'hour');
  if (size < 604800) return f(seconds / 86400, 'day');
  if (size < 2629800) return f(seconds / 604800, 'week');
  if (size < 31557600) return f(seconds / 2629800, 'month');
  return f(seconds / 31557600, 'year');
}
function abbreviatedText(ago) {
  const s = Math.abs(ago);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  if (s < 31557600) return `${Math.floor(s / 604800)}w`;
  return `${Math.floor(s / 31557600)}y`;
}
const deltas = [0, 0.4, -0.5, 0.5, 1.5, 30, -59.6, 59.4, 90, -150, 3599, 3600, -5400, 86399, 86400, -129600, 604799,
  604800, -1209600, 2629799, 2629800, -7889400, 31557599, 31557600, -94672800, 315576000];
const relativeDates = [];
for (const locale of ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ar-EG'])
  for (const seconds of deltas) relativeDates.push({ seconds, locale, text: relativeText(seconds, locale) });
const abbreviated = deltas.map((seconds) => ({ seconds, text: abbreviatedText(-seconds) }));

const isoInstants = [...instants, 0, -1, 1.7, -0.5, 1e12 + 0.999, Date.UTC(10000, 0, 1), Date.UTC(-1, 5, 3, 4, 5, 6, 7), Date.UTC(99, 0, 1) - 100 * 365.2425 * 86400000, 8.64e15, -8.64e15];
const iso = isoInstants.map((ms) => ({ ms, text: rt.isoString(ms) }));
const isoInputs = [
  '2026-11-26T18:30:00.000Z', '2026-11-26T18:30:00Z', '2026-11-26T18:30Z', '2026-11-26', '2026-11', '2026',
  '2026-11-26T18:30:00.1234Z', '2026-11-26T18:30:00+01:00', '2026-11-26T18:30:00-05:30', '2026-11-26T18:30:00.5-0230',
  '+002026-11-26T18:30:00Z', '-000001-01-01T00:00:00Z', '2026-11-26t18:30:00z', '2026-11-26T24:00:00Z',
  '2026-02-30T00:00:00Z', '2026-13-01', 'not a date', '', '2026-11-26T18:30:00.000+00:00',
];
// Local-time forms (`2026-11-26T18:30`) depend on the machine's zone: tested in Swift with UTC.
const parse = isoInputs.map((text) => ({ text, ms: rt.parseISO(text) ?? null }));

const numbers = [0, 1, -1, 0.5, 1.5, 2.5, -2.5, 1234.5, 1234.5678, 1000000, 0.125, 999.95, 1e21, 123456789.987];
const numberFormats = [];
for (const locale of locales)
  for (const n of numbers)
    for (const digits of [0, 1, 2])
      numberFormats.push({ n, locale, digits, text: rt.formatNumber(n, locale, digits, digits) });
const compactNumbers = [0, 7, 999, 1000, 1234, 9999, 12345, 99999, 123456, 999999, 1234567, 1e9 + 5e7, 2.5e12, -1500];
const compact = [];
for (const locale of locales)
  for (const n of compactNumbers) compact.push({ n, locale, text: rt.formatCompact(n, locale) });

const pluralLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pt-PT', 'ja', 'zh', 'ko', 'ar', 'ru', 'uk', 'pl', 'cs', 'he', 'hi', 'tr', 'nl', 'sv', 'ca', 'ro', 'lt', 'lv', 'ga', 'cy', 'sl', 'id', 'vi', 'th'];
const pluralNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14, 19, 20, 21, 22, 25, 100, 101, 102, 111, 1000000, 0.5, 1.5, 1.1, 2.3, 0.1, 10.0];
const plural = [];
for (const locale of pluralLocales)
  for (const n of pluralNumbers) plural.push({ n, locale, category: rt.pluralCategory(n, locale) });

const urlInputs = [
  'https://api.mention.earth', 'HTTPS://API.Mention.Earth:443/a/./b/../c?x=1#frag', 'http://a.b:8080/path%20x?q=a b&r=é#f g',
  'https://a.b/ä/ö?ü=1', 'https://user:pass@a.b/x', 'https://a.b?x', 'https://a.b#y', 'mailto:someone@example.com',
  'demo://post/42', 'demo://Post/42?x=1', 'file:///tmp/a b.txt', 'https://a.b/a\\b', 'https://a.b/%7euser/', 'https://a.b//double//slash',
  'not a url', '/relative', 'https://', 'http://[::1]:3000/x', 'https://a.b:99999', ' https://a.b/trim ', 'https://a.b/x?y="z"&<w>',
  'https://mañana.com/path', 'ws://a.b', 'https://a.b/..', 'https://a.b/%2e%2E/c', 'https://EXAMPLE.com./x', 'https://a.b/x?#',
];
const parsed = urlInputs.map((text) => ({ text, parts: rt.parseURL(text, '') ?? null }));
const base = 'https://a.b/c/d?q=1#f';
const relInputs = ['../x', '/y', '?z=2', '#g', '', 'e', './', '//other.host/p', 'https://x.y/z', 'g/../../../h', '.', '..', 'mailto:x@y'];
const resolved = relInputs.map((text) => ({ text, base, parts: rt.parseURL(text, base) ?? null }));
const componentInputs = ['a b', 'a+b', "!'()*-._~", 'é/ñ?&=#', '😀', '%', '100%', 'a%20b', '%E0%A4%A', '%C3%A9', '+', ''];
const components = componentInputs.map((text) => ({
  text,
  encoded: rt.encodeComponent(text),
  decoded: rt.decodeComponent(text),
}));

const numberTexts = [0, -0, 1, -1, 0.1, 1.5, 1e21, 1e20, 123456789012345680000, 1e-6, 1e-7, 1.2345e-7, 5e-324, 1.7976931348623157e308,
  0.000001234, 100, 1e100, -1e-100, 12345.678, 2 ** 53, 0.30000000000000004].map((n) => ({ n, text: rt.stringOfNumber(n) }));
const jsonSamples = [
  { a: 1, b: [true, false, null], c: { d: 'x\n"y"\\\u0001\u001f\u007f é 😀 /' }, e: [], f: {}, g: 1.5, '2': 'two', '10': 'ten', '-1': 'neg', '01': 'zero-one' },
  [1, 'a', [], {}, [[]], -0, 1e21],
  'plain',
  42,
  null,
];
const json = [];
for (const value of jsonSamples)
  for (const indent of [0, 2, 4]) json.push({ value: JSON.stringify(value), indent, text: rt.stringifyJSON(rt.parseJSON(JSON.stringify(value)), indent) });

const table = { root: 'feed', routes: { feed: [], post: ['id'], profile: ['user', 'tab'], settings: [] } };
const routes = [
  'feed', { tag: 'post', id: '42' }, { tag: 'post', id: 'a b/c?d' }, { tag: 'profile', user: 'nate', tab: 'likes' }, 'settings', { tag: 'post', id: 'ñ😀' },
].map((route) => ({ route, path: routing.routePath(route, table) }));
const paths = [
  '/', '', '/post/42', 'post/42', 'demo://post/42', 'https://mention.earth/post/42?x=1', 'https://mention.earth/', '/post/42#top',
  '/post', '/post/42/extra', '/unknown/1', '/profile/nate/likes', '//post//42//', 'demo://', '/post/a%20b%2Fc', 'myapp://settings',
  'HTTPS://host/post/7',
].map((path) => ({ path, route: routing.routeOfPath(path, table) ?? null }));

const regexCases = [
  ['@(\\w+)', '', 'hi @nate and @ana_b!'],
  ['(?<user>\\w+)@(?<host>[a-z.]+)', 'i', 'Mail NATE@oxy.so or ana@x.io'],
  ['\\s+', '', '  a  b\tc  '],
  ['(\\d)', '', 'a1b2c3'],
  ['', '', 'abc'],
  ['x*', '', 'axxb'],
  ['^b', 'm', 'a\nb\nbc'],
  ['a.c', 's', 'a\nc abc'],
  ['(a)|(b)', '', 'ab'],
  ['[', '', 'x'],
];
const regexes = regexCases.map(([pattern, flags, text]) => {
  const error = rt.regexError(pattern, flags) ?? null;
  if (error) return { pattern, flags, text, error: true, matches: [], replaced: '', split: [] };
  return {
    pattern, flags, text, error: false,
    matches: rt.regexMatches(pattern, flags, text, 0),
    replaced: rt.regexReplace(pattern, flags, text, '[$&|$1|$$|$<user>]'),
    split: rt.regexSplit(pattern, flags, text),
  };
});

rt.registerCatalog('en', { 'feed.title': 'Home', 'feed.count': { one: '{count} post', other: '{count} posts' }, greeting: 'Hello, {name}! {missing} {count}' });
rt.registerCatalog('es', { 'feed.title': 'Inicio', 'feed.count': { one: '{count} publicación', many: '{count} de publicaciones', other: '{count} publicaciones' } });
rt.registerCatalog('es-MX', { 'feed.title': 'Inicio (MX)' });
rt.registerCatalog('ar', { 'feed.count': { zero: 'لا منشورات', one: 'منشور', two: 'منشوران', few: '{count} منشورات', many: '{count} منشورًا', other: '{count} منشور' } });
const localized = [];
for (const locale of ['en-US', 'es-ES', 'es-MX', 'ar-EG', 'fr-FR'])
  for (const [key, args, count] of [['feed.title', {}, null], ['feed.count', {}, 1], ['feed.count', {}, 5], ['feed.count', {}, 1000000], ['feed.count', {}, 0], ['feed.count', {}, 2], ['feed.count', {}, 1.5], ['greeting', { name: 'Ana' }, null], ['greeting', { name: 'Ana' }, 3], ['missing.key', {}, null]]) {
    rt.setPreferredLocale(locale);
    localized.push({ locale, key, args, count, text: rt.localize(key, args, count ?? undefined) });
  }

const out = {
  generator: 'Tests/BloomTests/Fixtures/make-intl-fixtures.mjs',
  node: process.versions.node,
  icu: process.versions.icu,
  cldr: process.versions.cldr,
  tz: process.versions.tz,
  dates,
  relative,
  relativeDates,
  abbreviated,
  iso,
  parse,
  numberFormats,
  compact,
  plural,
  urls: { parsed, resolved, components },
  numberTexts,
  json,
  routing: { table, routes, paths },
  regexes,
  localized,
};
writeFileSync(join(here, 'intl-fixtures.json'), `${JSON.stringify(out)}\n`);
console.log(`wrote ${dates.length} dates, ${relative.length} relative, ${plural.length} plural, ${parsed.length + resolved.length} urls`);
