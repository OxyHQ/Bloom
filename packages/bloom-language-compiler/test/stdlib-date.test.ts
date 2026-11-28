/**
 * The standard library's `Date`: Swift's API (`Date(timeIntervalSince1970:)`, `try? Date(_:strategy:)`,
 * `timeIntervalSince1970`, `+`/`-`, `==`, `<`) over a plain JS `Date`, which crosses to TS and back
 * as itself, as Swift's `Date` bridges to `NSDate`.
 */

// Required, not imported: see bloom.cost.test.tsx.
const d = require('./packages/format-app/Sources/App/Dates.bloom') as {
  make: (s: number) => Date;
  makeMs: (ms: number) => Date;
  parsed: (text: string) => Date | undefined;
  seconds: (d: Date) => number;
  later: (d: Date, by: number) => Date;
  earlier: (d: Date, by: number) => Date;
  moved: (d: Date, by: number) => Date;
  between: (a: Date, b: Date) => number;
  same: (a: Date, b: Date) => boolean;
  before: (a: Date, b: Date) => boolean;
  nowIsRecent: () => boolean;
  sameStamp: (a: number, b: number) => boolean;
};

it('is a JS Date, made by its initializers', () => {
  const at = d.make(1_700_000_000);
  expect(at).toBeInstanceOf(Date);
  expect(at.getTime()).toBe(1_700_000_000_000);
  expect(d.makeMs(1234).getTime()).toBe(1234);
  expect(d.nowIsRecent()).toBe(true);
});

it('parses ISO 8601 as Date.parse does, none when it cannot', () => {
  for (const text of ['2026-11-26T18:30:00Z', '2026-11-26', '2026-11-26T18:30:00.123+02:00']) {
    expect(d.parsed(text)?.getTime()).toBe(Date.parse(text));
  }
  expect(d.parsed('not a date')).toBeUndefined();
});

it('reads, moves and compares instants', () => {
  const a = new Date(10_000);
  expect(d.seconds(a)).toBe(10);
  expect(d.later(a, 5).getTime()).toBe(15_000);
  expect(d.earlier(a, 5).getTime()).toBe(5_000);
  expect(d.moved(a, -1).getTime()).toBe(9_000);
  expect(d.between(new Date(20_000), a)).toBe(10);
  expect(d.same(new Date(5), new Date(5))).toBe(true);
  expect(d.same(new Date(5), new Date(6))).toBe(false);
  expect(d.before(new Date(5), new Date(6))).toBe(true);
  expect(d.sameStamp(1, 1)).toBe(true);
  expect(d.sameStamp(1, 2)).toBe(false);
});

it('takes and gives the JS Date TS code holds', () => {
  const fromTS = new Date('2026-11-26T18:30:00Z');
  const back = d.later(fromTS, 60);
  expect(back).toBeInstanceOf(Date);
  expect(back.toISOString()).toBe('2026-11-26T18:31:00.000Z');
  expect(fromTS.toISOString()).toBe('2026-11-26T18:30:00.000Z');
});
