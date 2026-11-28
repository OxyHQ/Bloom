/**
 * Errors and identity: `as? JSError` / `catch let e as JSError` read a thrown JS `Error`;
 * `error.jsValue?["response"]?["data"]?["error"]?.string` reads any thrown object leniently
 * (`none` at a missing key or a value of another type, never a throw); `===` / `!==` compare
 * objects by identity.
 */

// Required, not imported: see bloom.cost.test.tsx.
const m = require('./packages/format-app/Sources/App/ErrorsIdentity.bloom') as {
  Session: new () => object;
  serverMessage: (error: unknown) => string;
  statusOf: (error: unknown) => number | undefined;
  firstString: (v: unknown) => string | undefined;
  describeError: (error: unknown) => string;
  caughtError: () => string;
  sameSession: (a: object, b: object | undefined) => boolean;
  otherSession: (a: object, b: object) => boolean;
  parsedJSON: (text: string) => unknown;
  numberField: (v: unknown) => number | undefined;
  flagsOf: (v: unknown) => boolean[];
  objectKeys: (v: unknown) => string[];
};

it('reads a TS error object leniently', () => {
  const axios = {
    response: { status: 409, data: { error: 'Already posted', code: 'RATE_LIMITED' } },
  };
  expect(m.serverMessage(axios)).toBe('Already posted');
  expect(m.statusOf(axios)).toBe(409);
  // A field of another type, a nested envelope, a primitive, nothing: the fallback, no throw.
  expect(m.serverMessage({ response: { data: { error: { code: 1, message: 'm' } } } })).toBe(
    'Could not save',
  );
  expect(m.serverMessage({ response: { data: 'text' } })).toBe('Could not save');
  expect(m.serverMessage('boom')).toBe('Could not save');
  expect(m.serverMessage(undefined)).toBe('Could not save');
  expect(m.serverMessage(null)).toBe('Could not save');
  expect(m.statusOf({ response: { status: '409' } })).toBeUndefined();
  expect(m.statusOf({ response: { status: 409.5 } })).toBeUndefined();
  // An inherited member is not a key.
  expect(m.serverMessage({ response: { data: Object.create({ error: 'inherited' }) } })).toBe(
    'Could not save',
  );
});

it('reads arrays, numbers, booleans and objects of a JSONValue', () => {
  expect(m.firstString(['a', 'b'])).toBe('a');
  expect(m.firstString({ 0: 'a' })).toBeUndefined();
  expect(m.firstString([1])).toBeUndefined();
  const v = m.parsedJSON('{"n": 2.5, "flags": [true, false, 1], "z": null}');
  expect(m.numberField(v)).toBe(2.5);
  expect(m.flagsOf(v)).toEqual([true, false, false]);
  expect(m.objectKeys(v)).toEqual(['flags', 'n', 'z']);
  expect(m.objectKeys([1])).toEqual([]);
});

it('casts a thrown JS Error to JSError', () => {
  expect(m.describeError(new TypeError('bad'))).toBe('TypeError: bad');
  expect(m.describeError({ message: 'not an Error' })).toBe('?');
  expect(m.caughtError()).toContain('SyntaxError');
});

it('compares objects by identity', () => {
  const a = new m.Session();
  const b = new m.Session();
  expect(m.sameSession(a, a)).toBe(true);
  expect(m.sameSession(a, b)).toBe(false);
  expect(m.sameSession(a, undefined)).toBe(false);
  expect(m.otherSession(a, b)).toBe(true);
  expect(m.otherSession(a, a)).toBe(false);
});
