// The standard library's JS primitives (ADR 0002, section 3). Only the standard
// library's `.bloom` files see these, through their `extern module "./runtime"`;
// app code never does. Each export is small and typed: the Bloom declaration of
// each one states its type, and tsc checks the crossing.

// ---- strings ----------------------------------------------------------------

type Segmenter = { segment(s: string): Iterable<{ segment: string }> };
const IntlWithSegmenter = Intl as unknown as {
  Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter;
};
let graphemeSegmenter: Segmenter | undefined;

/** The user-perceived characters of `s` (extended grapheme clusters). */
export function characters(s: string): readonly string[] {
  if (IntlWithSegmenter.Segmenter) {
    graphemeSegmenter ??= new IntlWithSegmenter.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(graphemeSegmenter.segment(s), (x) => x.segment);
  }
  return Array.from(s);
}

export function indexOf(s: string, sub: string, from: number): number {
  return s.indexOf(sub, from);
}

export function lastIndexOf(s: string, sub: string): number {
  return s.lastIndexOf(sub);
}

export function replaceAll(s: string, target: string, replacement: string): string {
  return s.split(target).join(replacement);
}

export function padStart(s: string, length: number, pad: string): string {
  return s.padStart(length, pad);
}

export function padEnd(s: string, length: number, pad: string): string {
  return s.padEnd(length, pad);
}

export function repeatString(s: string, count: number): string {
  return count > 0 ? s.repeat(count) : '';
}

export function compareStrings(a: string, b: string, locale: string): number {
  return a.localeCompare(b, locale || undefined);
}

export function trimStart(s: string): string {
  return s.trimStart();
}

export function trimEnd(s: string): string {
  return s.trimEnd();
}

export function formatNumber(
  n: number,
  locale: string,
  minFraction: number,
  maxFraction: number,
): string {
  return n.toLocaleString(locale || undefined, {
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction,
  });
}

export function formatCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale || undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function stringOfNumber(n: number): string {
  return String(n);
}

// ---- collections --------------------------------------------------------------

export function sortedBy<T>(xs: readonly T[], before: (a: T, b: T) => boolean): readonly T[] {
  return [...xs].sort((a, b) => (before(a, b) ? -1 : before(b, a) ? 1 : 0));
}

export function uniqueStrings(xs: readonly string[]): readonly string[] {
  return [...new Set(xs)];
}

export function arrayOfRange(from: number, to: number, step: number): readonly number[] {
  const out: number[] = [];
  if (step > 0) for (let i = from; i < to; i += step) out.push(i);
  else if (step < 0) for (let i = from; i > to; i += step) out.push(i);
  return out;
}

export function setOf<T>(xs: readonly T[]): ReadonlySet<T> {
  return new Set(xs);
}

export function setValues<T>(s: ReadonlySet<T>): readonly T[] {
  return [...s];
}

export function union<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return new Set([...a, ...b]);
}

export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return new Set([...a].filter((x) => b.has(x)));
}

export function subtracting<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> {
  return new Set([...a].filter((x) => !b.has(x)));
}

// ---- math ---------------------------------------------------------------------

export const PI = Math.PI;
export const E = Math.E;
export const sqrt = Math.sqrt;
export const cbrt = Math.cbrt;
export const pow = Math.pow;
export const exp = Math.exp;
export const log = Math.log;
export const log2 = Math.log2;
export const log10 = Math.log10;
export const sin = Math.sin;
export const cos = Math.cos;
export const tan = Math.tan;
export const asin = Math.asin;
export const acos = Math.acos;
export const atan = Math.atan;
export const atan2 = Math.atan2;
export const hypot = (a: number, b: number): number => Math.hypot(a, b);
export const random = Math.random;
export const isFiniteNumber = (n: number): boolean => Number.isFinite(n);
export const isNaNNumber = (n: number): boolean => Number.isNaN(n);
export const truncate = Math.trunc;

/** A uniformly distributed integer in `from..<to`. */
export function randomInt(from: number, to: number): number {
  return from + Math.floor(Math.random() * (to - from));
}

// ---- time ---------------------------------------------------------------------

export function nowMs(): number {
  return Date.now();
}

/** A monotonic clock, in milliseconds. */
export function monotonicMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Milliseconds since 1970 for an ISO 8601 string; `undefined` when it is not one. */
export function parseISO(s: string): number | undefined {
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? undefined : ms;
}

export function isoString(ms: number): string {
  return new Date(ms).toISOString();
}

export function formatDate(
  ms: number,
  locale: string,
  date: string,
  time: string,
  timeZone: string,
): string {
  const options: Intl.DateTimeFormatOptions = {};
  if (date !== 'omitted') options.dateStyle = date as Intl.DateTimeFormatOptions['dateStyle'];
  if (time !== 'omitted') options.timeStyle = time as Intl.DateTimeFormatOptions['timeStyle'];
  if (timeZone) options.timeZone = timeZone;
  return new Intl.DateTimeFormat(locale || undefined, options).format(ms);
}

export function formatRelative(value: number, unit: string, locale: string, style: string): string {
  return new Intl.RelativeTimeFormat(locale || undefined, {
    numeric: 'auto',
    style: style as Intl.RelativeTimeFormatStyle,
  }).format(value, unit as Intl.RelativeTimeFormatUnit);
}

/** The calendar fields of `ms` in the device's time zone (UTC with `utc`). */
export function dateParts(
  ms: number,
  utc: boolean,
): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly weekday: number;
} {
  const d = new Date(ms);
  return utc
    ? {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        weekday: d.getUTCDay() + 1,
      }
    : {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
        weekday: d.getDay() + 1,
      };
}

export function dateFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  utc: boolean,
): number {
  return utc
    ? Date.UTC(year, month - 1, day, hour, minute, second)
    : new Date(year, month - 1, day, hour, minute, second).getTime();
}

export function currentLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

export function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ---- URL ----------------------------------------------------------------------

export type URLParts = {
  readonly href: string;
  readonly scheme: string;
  readonly host: string;
  readonly port: string;
  readonly path: string;
  readonly query: string;
  readonly fragment: string;
};

function parts(u: URL): URLParts {
  return {
    href: u.href,
    scheme: u.protocol.replace(/:$/, ''),
    host: u.hostname,
    port: u.port,
    path: u.pathname,
    query: u.search.replace(/^\?/, ''),
    fragment: u.hash.replace(/^#/, ''),
  };
}

/** `s` as an absolute URL (resolved against `base` when given); `undefined` when it is not one. */
export function parseURL(s: string, base: string): URLParts | undefined {
  try {
    return parts(base ? new URL(s, base) : new URL(s));
  } catch {
    return undefined;
  }
}

export function encodeComponent(s: string): string {
  return encodeURIComponent(s);
}

export function decodeComponent(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

// ---- JSON ---------------------------------------------------------------------

/** A JSON value as `JSON.parse` returns it: decoded by the derived `Codable` functions. */
export type JSONValue = unknown;

export function parseJSON(text: string): JSONValue {
  return JSON.parse(text) as JSONValue;
}

export function stringifyJSON(value: JSONValue, indent: number): string {
  return JSON.stringify(value, null, indent > 0 ? indent : undefined) ?? 'null';
}

/** `null`, `bool`, `number`, `string`, `array`, `object` or `absent`. */
export function jsonKind(value: JSONValue): string {
  if (value === undefined) return 'absent';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'boolean':
      return 'bool';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    default:
      return 'object';
  }
}

export function jsonMember(value: JSONValue, key: string): JSONValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, JSONValue>)[key]
    : undefined;
}

export function jsonKeys(value: JSONValue): readonly string[] {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value)
    : [];
}

export function jsonItems(value: JSONValue): readonly JSONValue[] {
  return Array.isArray(value) ? (value as JSONValue[]) : [];
}

/** `value` when it is one of `cases` (an enum's cases, which are their names at runtime). */
export function jsonOneOf<T>(value: JSONValue, cases: readonly T[]): T | undefined {
  return cases.includes(value as T) ? (value as T) : undefined;
}

/** An enum case as JSON: its name. */
export function jsonOfCase<T>(value: T): JSONValue {
  return value;
}

export function jsonString(value: JSONValue): string {
  return value as string;
}

export function jsonNumber(value: JSONValue): number {
  return value as number;
}

export function jsonBool(value: JSONValue): boolean {
  return value as boolean;
}

export function jsonOfString(s: string): JSONValue {
  return s;
}

export function jsonOfNumber(n: number): JSONValue {
  return n;
}

export function jsonOfBool(b: boolean): JSONValue {
  return b;
}

export function jsonNull(): JSONValue {
  return null;
}

export function jsonAbsent(): JSONValue {
  return undefined;
}

export function jsonOfArray(xs: readonly JSONValue[]): JSONValue {
  return xs;
}

/** An object of `entries`; absent values (`undefined`) are left out, as `JSON.stringify` would. */
export function jsonOfObject(entries: Readonly<Record<string, JSONValue>>): JSONValue {
  const out: Record<string, JSONValue> = {};
  for (const key of Object.keys(entries)) {
    if (entries[key] !== undefined) out[key] = entries[key];
  }
  return out;
}

// ---- HTTP ---------------------------------------------------------------------

export type HTTPReply = {
  readonly status: number;
  readonly text: string;
  readonly headers: Readonly<Record<string, string>>;
};

/** One request over `fetch`; rejects on a network failure or when `signal` aborts. */
export async function request(
  method: string,
  url: string,
  headers: Readonly<Record<string, string>>,
  body: string | undefined,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<HTTPReply> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = timeoutMs > 0 ? setTimeout(abort, timeoutMs) : undefined;
  try {
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    const text = await response.text();
    const out: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      out[key] = value;
    });
    return { status: response.status, text, headers: out };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

/** The status of an `HTTPError` (thrown by `HTTPClient`), or `undefined`. */
export function errorStatus(error: unknown): number | undefined {
  const status =
    error !== null && typeof error === 'object'
      ? (error as { status?: unknown }).status
      : undefined;
  return typeof status === 'number' ? status : undefined;
}

/** The body of an `HTTPError`, or `undefined`. */
export function errorBody(error: unknown): string | undefined {
  const body =
    error !== null && typeof error === 'object' ? (error as { body?: unknown }).body : undefined;
  return typeof body === 'string' ? body : undefined;
}

/** The response of an `HTTPError` (the standard library's, or a TS client's). */
interface ErrorResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly text: string;
}

/**
 * The `HTTPError` an error is (`as? HTTPError`): one `HTTPClient` threw, or a TS client's
 * whose `response` has a numeric status (Axios's: `response.data`, `response.headers`), its
 * body as text; else `undefined`.
 */
export function httpErrorFrom(
  error: unknown,
): { status: number; body: string; message: string; response: ErrorResponse } | undefined {
  if (error === null || typeof error !== 'object') return undefined;
  const e = error as {
    status?: unknown;
    body?: unknown;
    message?: unknown;
    response?: { status?: unknown; data?: unknown; headers?: unknown; text?: unknown };
  };
  const message = typeof e.message === 'string' ? e.message : '';
  const response = e.response;
  if (typeof e.status === 'number' && typeof e.body === 'string' && response !== undefined) {
    return e as { status: number; body: string; message: string; response: ErrorResponse };
  }
  if (response === null || typeof response !== 'object' || typeof response.status !== 'number') {
    return undefined;
  }
  const data = response.data ?? response.text;
  const text = typeof data === 'string' ? data : data === undefined ? '' : JSON.stringify(data);
  const headers: Record<string, string> = {};
  if (response.headers !== null && typeof response.headers === 'object') {
    for (const [name, value] of Object.entries(response.headers as Record<string, unknown>)) {
      if (typeof value === 'string') headers[name.toLowerCase()] = value;
    }
  }
  const status = response.status;
  return { status, body: text, message, response: { status, headers, text } };
}

// ---- concurrency --------------------------------------------------------------

/** Resolves after `ms`; rejects with a `CancellationError` when `signal` aborts first. */
export function sleepMs(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(cancellation());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(cancellation());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function cancellation(): Error {
  const error = new Error('The task was cancelled');
  error.name = 'CancellationError';
  return error;
}

export type TaskHandle<T> = {
  readonly value: Promise<T>;
  readonly signal: AbortSignal;
  cancel(): void;
};

/** Starts `work` now, with a signal that `cancel()` aborts. */
export function spawn<T>(work: (signal: AbortSignal) => Promise<T>): TaskHandle<T> {
  const controller = new AbortController();
  const value = work(controller.signal);
  // An unawaited task's failure is not an unhandled rejection: it is read through `value`.
  value.catch(() => undefined);
  return { value, signal: controller.signal, cancel: () => controller.abort() };
}

export function awaitAll<T>(values: readonly Promise<T>[]): Promise<readonly T[]> {
  return Promise.all(values);
}

export function isCancellation(error: unknown): boolean {
  return (
    error instanceof Error && (error.name === 'CancellationError' || error.name === 'AbortError')
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    error !== null &&
    typeof error === 'object' &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

/** A broadcast channel of values, for `AsyncStream`. */
export type Channel<T> = {
  send(value: T): void;
  finish(): void;
  listen(each: (value: T) => void, done: () => void): () => void;
};

export function channel<T>(): Channel<T> {
  const listeners = new Set<{ each: (value: T) => void; done: () => void }>();
  let finished = false;
  return {
    send(value) {
      if (!finished) for (const l of listeners) l.each(value);
    },
    finish() {
      finished = true;
      for (const l of listeners) l.done();
      listeners.clear();
    },
    listen(each, done) {
      if (finished) {
        done();
        return () => undefined;
      }
      const l = { each, done };
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

// ---- regular expressions ----------------------------------------------------

export type RegexMatch = {
  readonly text: string;
  readonly start: number;
  readonly groups: readonly string[];
  readonly named: Readonly<Record<string, string>>;
};

const compiled = new Map<string, RegExp>();

function regex(pattern: string, flags: string): RegExp {
  const key = `${flags}/${pattern}`;
  let re = compiled.get(key);
  if (!re) {
    re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
    compiled.set(key, re);
  }
  re.lastIndex = 0;
  return re;
}

/** `undefined` when `pattern` is a valid expression; its error otherwise. */
export function regexError(pattern: string, flags: string): string | undefined {
  try {
    new RegExp(pattern, flags);
    return undefined;
  } catch (error) {
    return errorMessage(error);
  }
}

export function regexMatches(
  pattern: string,
  flags: string,
  s: string,
  limit: number,
): readonly RegexMatch[] {
  const re = regex(pattern, flags);
  const out: RegexMatch[] = [];
  for (const m of s.matchAll(re)) {
    out.push({
      text: m[0],
      start: m.index ?? 0,
      groups: m.slice(1).map((g) => g ?? ''),
      named: (m.groups ?? {}) as Record<string, string>,
    });
    if (limit > 0 && out.length >= limit) break;
  }
  return out;
}

export function regexReplace(
  pattern: string,
  flags: string,
  s: string,
  replacement: string,
): string {
  return s.replace(regex(pattern, flags), replacement);
}

export function regexSplit(pattern: string, flags: string, s: string): readonly string[] {
  return s.split(new RegExp(pattern, flags.replace('g', '')));
}

// ---- logging ------------------------------------------------------------------

type Sink = (level: string, subsystem: string, category: string, message: string) => void;

let sink: Sink | undefined;

/** Routes every `Logger` line to `next` (a crash reporter, a test): `undefined` restores the console. */
export function setLogSink(next: Sink | undefined): void {
  sink = next;
}

export function logLine(level: string, subsystem: string, category: string, message: string): void {
  if (sink) {
    sink(level, subsystem, category, message);
    return;
  }
  const line = `[${subsystem}${category ? `:${category}` : ''}] ${message}`;
  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
    case 'notice':
      console.info(line);
      break;
    case 'warning':
      console.warn(line);
      break;
    default:
      console.error(line);
  }
}

export function isDevelopment(): boolean {
  return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
}

declare const __DEV__: boolean | undefined;

// ---- localization -------------------------------------------------------------

type Catalog = Readonly<Record<string, string | Readonly<Record<string, string>>>>;

const catalogs = new Map<string, Catalog>();
let preferred: string | undefined;

/** Registers the strings of `locale` (`bloom build` registers the package's catalogs). */
export function registerCatalog(locale: string, catalog: unknown): void {
  catalogs.set(locale, catalog as Catalog);
}

export function setPreferredLocale(locale: string): void {
  preferred = locale || undefined;
}

export function preferredLocale(): string {
  return preferred ?? currentLocale();
}

function lookup(
  key: string,
  locale: string,
): string | Readonly<Record<string, string>> | undefined {
  const exact = catalogs.get(locale)?.[key];
  if (exact !== undefined) return exact;
  const language = locale.split('-')[0] ?? locale;
  const general = catalogs.get(language)?.[key];
  if (general !== undefined) return general;
  return catalogs.get('en')?.[key];
}

/** The string for `key` in the preferred locale, its `{name}`s replaced; the key itself when missing. */
export function localize(
  key: string,
  args: Readonly<Record<string, string>>,
  count: number | undefined,
): string {
  const locale = preferredLocale();
  const found = lookup(key, locale);
  let text: string;
  if (found === undefined) text = key;
  else if (typeof found === 'string') text = found;
  else {
    const category = count === undefined ? 'other' : new Intl.PluralRules(locale).select(count);
    text = found[category] ?? found.other ?? key;
  }
  return text.replace(
    /\{(\w+)\}/g,
    (whole, name: string) =>
      args[name] ?? (name === 'count' && count !== undefined ? String(count) : whole),
  );
}

export function pluralCategory(n: number, locale: string): string {
  return new Intl.PluralRules(locale || undefined).select(n);
}

// ---- storage ------------------------------------------------------------------

/** Where a store's strings live: `kv` (`KeyValueStore`), `secure` (`SecureStore`), `file` (`FileStore`). */
export type StorageBackend = {
  get(name: string, key: string): string | undefined;
  set(name: string, key: string, value: string | undefined): void;
  keys(name: string): readonly string[];
};

function webStorage(prefix: string): StorageBackend | undefined {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  if (!ls) return undefined;
  const full = (name: string, key: string) => `${prefix}:${name}:${key}`;
  return {
    get: (name, key) => ls.getItem(full(name, key)) ?? undefined,
    set: (name, key, value) =>
      value === undefined ? ls.removeItem(full(name, key)) : ls.setItem(full(name, key), value),
    keys: (name) => {
      const start = `${prefix}:${name}:`;
      const out: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k?.startsWith(start)) out.push(k.slice(start.length));
      }
      return out;
    },
  };
}

function memoryStorage(): StorageBackend {
  const data = new Map<string, Map<string, string>>();
  const of = (name: string) => {
    let m = data.get(name);
    if (!m) {
      m = new Map();
      data.set(name, m);
    }
    return m;
  };
  return {
    get: (name, key) => of(name).get(key),
    set: (name, key, value) =>
      value === undefined ? of(name).delete(key) : of(name).set(key, value),
    keys: (name) => [...of(name).keys()],
  };
}

// ---- native store backends ---------------------------------------------------
//
// On Android and iOS the stores persist through Bloom's native module, `BloomStorage`
// (`Storage.bloom`'s `extern native` interface, reached through its generated bridge):
// `kv` in SQLite, `secure` in the keystore/keychain, `file` in the app's files. A build
// with `--with-expo` has no Bloom native modules; there they persist through the Expo
// modules that build lists (below), which this file alone names and the generated build
// resolves to nothing on the web. Every call is synchronous, as the stores' interface is.

declare const require: (id: string) => unknown;

type SQLiteDatabase = {
  execSync(source: string): void;
  runSync(source: string, params: readonly (string | null)[]): unknown;
  getFirstSync<T>(source: string, params: readonly string[]): T | null;
  getAllSync<T>(source: string, params: readonly string[]): T[];
};
type SecureStoreModule = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  deleteItemAsync(key: string): Promise<void>;
};
type FsEntry = { exists: boolean; name: string; uri: string };
type FsFile = FsEntry & {
  textSync(): string;
  writeSync(text: string): void;
  create(options?: { intermediates?: boolean; overwrite?: boolean }): void;
  delete(): void;
};
type FsDirectory = FsEntry & {
  list(): FsEntry[];
  create(options?: { intermediates?: boolean; idempotent?: boolean }): void;
};
type FileSystemModule = {
  File: new (...parts: (string | FsDirectory)[]) => FsFile;
  Directory: new (...parts: (string | FsDirectory)[]) => FsDirectory;
  Paths: { document: FsDirectory };
};

/** The app runs on React Native (Android, iOS), not in a browser or Node. */
function onNative(): boolean {
  return (globalThis as { navigator?: { product?: string } }).navigator?.product === 'ReactNative';
}

/** `kv`: one SQLite table, `(name, key) → value`. */
export function sqliteStorage(db: SQLiteDatabase): StorageBackend {
  db.execSync(
    'CREATE TABLE IF NOT EXISTS bloom_kv (name TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (name, key))',
  );
  return {
    get: (name, key) =>
      db.getFirstSync<{ value: string }>('SELECT value FROM bloom_kv WHERE name = ? AND key = ?', [
        name,
        key,
      ])?.value ?? undefined,
    set: (name, key, value) => {
      if (value === undefined)
        db.runSync('DELETE FROM bloom_kv WHERE name = ? AND key = ?', [name, key]);
      else
        db.runSync('INSERT OR REPLACE INTO bloom_kv (name, key, value) VALUES (?, ?, ?)', [
          name,
          key,
          value,
        ]);
    },
    keys: (name) =>
      db
        .getAllSync<{ key: string }>('SELECT key FROM bloom_kv WHERE name = ? ORDER BY key', [name])
        .map((r) => r.key),
  };
}

/** A name or key as the keystore accepts it (`[A-Za-z0-9._-]`): its UTF-8 bytes in hex. */
function hex(s: string): string {
  let out = '';
  for (const byte of new TextEncoder().encode(s)) out += byte.toString(16).padStart(2, '0');
  return out;
}

/**
 * `secure`: each secret under `bloom.<name>.<key>` (hex), and each store's key list under
 * `bloom.<name>`. The keystore can only delete asynchronously, so a key leaves the list
 * first (synchronously): a removed secret is gone at once, and across a restart.
 */
export function secureStorage(store: SecureStoreModule): StorageBackend {
  const lists = new Map<string, string[]>();
  const listOf = (name: string): string[] => {
    let list = lists.get(name);
    if (!list) {
      const text = store.getItem(`bloom.${hex(name)}`);
      try {
        list = text ? (JSON.parse(text) as string[]) : [];
      } catch {
        list = [];
      }
      lists.set(name, list);
    }
    return list;
  };
  const saveList = (name: string, list: string[]) => {
    lists.set(name, list);
    store.setItem(`bloom.${hex(name)}`, JSON.stringify(list));
  };
  const slot = (name: string, key: string) => `bloom.${hex(name)}.${hex(key)}`;
  return {
    get: (name, key) =>
      listOf(name).includes(key) ? (store.getItem(slot(name, key)) ?? undefined) : undefined,
    set: (name, key, value) => {
      const list = listOf(name);
      if (value === undefined) {
        if (!list.includes(key)) return;
        saveList(
          name,
          list.filter((k) => k !== key),
        );
        void store.deleteItemAsync(slot(name, key)).catch(() => {});
        return;
      }
      store.setItem(slot(name, key), value);
      if (!list.includes(key)) saveList(name, [...list, key]);
    },
    keys: (name) => [...listOf(name)],
  };
}

/** `file`: each store a directory of the app's documents, each path one file (its name percent-encoded). */
export function fileStorage(fs: FileSystemModule): StorageBackend {
  const dirOf = (name: string) =>
    new fs.Directory(fs.Paths.document, 'bloom', encodeURIComponent(name));
  const fileOf = (name: string, path: string) => new fs.File(dirOf(name), encodeURIComponent(path));
  return {
    get: (name, path) => {
      const file = fileOf(name, path);
      return file.exists ? file.textSync() : undefined;
    },
    set: (name, path, value) => {
      const file = fileOf(name, path);
      if (value === undefined) {
        if (file.exists) file.delete();
        return;
      }
      if (!file.exists) file.create({ intermediates: true });
      file.writeSync(value);
    },
    keys: (name) => {
      const dir = dirOf(name);
      return dir.exists ? dir.list().map((entry) => decodeURIComponent(entry.name)) : [];
    },
  };
}

/** The native backend of `kind`, or `undefined` off native or when its module is missing. */
function nativeStorage(kind: string): StorageBackend | undefined {
  if (!onNative()) return undefined;
  try {
    switch (kind) {
      case 'kv':
        return sqliteStorage(
          (
            require('expo-sqlite') as { openDatabaseSync(name: string): SQLiteDatabase }
          ).openDatabaseSync('bloom-kv.db'),
        );
      case 'secure':
        return secureStorage(require('expo-secure-store') as SecureStoreModule);
      case 'file':
        return fileStorage(require('expo-file-system') as FileSystemModule);
    }
  } catch (error) {
    console.warn(`Bloom: the ${kind} store keeps its values in memory only (${String(error)})`);
  }
  return undefined;
}

const backends: Record<string, StorageBackend> = {};

/**
 * Installs the backend of `kind` (a test's, an app's own). By default the web keeps values
 * in `localStorage`, Android and iOS in SQLite, the keystore and the app's documents, and
 * tests in memory.
 */
export function setStorageBackend(kind: string, backend: StorageBackend): void {
  backends[kind] = backend;
}

function backend(kind: string): StorageBackend {
  let found = backends[kind];
  if (!found) {
    found = webStorage(`bloom.${kind}`) ?? nativeStorage(kind) ?? memoryStorage();
    backends[kind] = found;
  }
  return found;
}

export function storageGet(kind: string, name: string, key: string): string | undefined {
  return backend(kind).get(name, key);
}

export function storageSet(
  kind: string,
  name: string,
  key: string,
  value: string | undefined,
): void {
  backend(kind).set(name, key, value);
}

export function storageKeys(kind: string, name: string): readonly string[] {
  return backend(kind).keys(name);
}

const nativeKinds: Record<string, boolean> = {};

/**
 * `kind` is kept by the native module: on Android or iOS, in a build that links it (a
 * `bloom build` without `--with-expo`), and with no backend installed for it
 * (`setStorageBackend`, a test's or an app's own, wins).
 */
export function storageIsNative(kind: string): boolean {
  if (kind in backends) return false;
  let native = nativeKinds[kind];
  if (native === undefined) {
    native = false;
    if (onNative()) {
      try {
        native = (require('./NativeBloomStorageBridge') as { isAvailable(): boolean }).isAvailable();
      } catch {
        native = false;
      }
    }
    nativeKinds[kind] = native;
  }
  return native;
}

// ---- actors -------------------------------------------------------------------

/** Each actor's last queued call (settled or not): the next one starts after it. */
const actorTails = new WeakMap<object, Promise<unknown>>();

/**
 * An actor's method: `work` starts once the actor's earlier calls have ended (whether
 * they returned or threw), so its methods run one at a time, in call order.
 */
export function actorQueue<A, T>(actor: A, work: () => T | Promise<T>): Promise<T> {
  const key = actor as object;
  const previous = actorTails.get(key) ?? Promise.resolve();
  const next = previous.then(work, work);
  actorTails.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

// ---- refresh ------------------------------------------------------------------

/**
 * `.refreshable { … }`'s binding: a pull writes `true`, which sets the view's refreshing
 * state and runs the action; its end (or failure) clears the state, ending the spinner.
 */
export function refreshRun(
  state: readonly [boolean, (value: boolean) => void],
  action: () => Promise<void> | void,
): readonly [boolean, (value: boolean) => void] {
  const [refreshing, set] = state;
  return [
    refreshing,
    (next) => {
      if (!next || refreshing) return;
      set(true);
      Promise.resolve()
        .then(action)
        .catch(() => {})
        .finally(() => set(false));
    },
  ];
}
