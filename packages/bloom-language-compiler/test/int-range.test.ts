/**
 * `Int` is 64-bit (Swift's); the JS backend keeps it a `number`, exact within ±(2^53 − 1). A dev
 * build traps an `Int` `+`, `-`, `*` (and `+=`, `-=`, `*=`) whose result leaves that range, as Swift
 * traps an overflow; a release build emits the plain arithmetic.
 */
import ts from 'typescript';

const { compileBloomModule } = require('../js/compile') as {
  compileBloomModule: (
    source: string,
    filename: string,
    options?: { dev?: boolean },
  ) => { code: string };
};

const SOURCE = `
public func product(_ a: Int, _ b: Int) -> Int { a * b + 1 }
public func grown(_ a: Int, _ by: Int) -> Int {
  var x = a
  x += by
  return x
}
public func half(_ a: Float, _ i: Int) -> Float {
  var x = a
  x += i
  return x * 0.5
}
`;

type Module = {
  product: (a: number, b: number) => number;
  grown: (a: number, by: number) => number;
  half: (a: number, i: number) => number;
};

function load(dev: boolean): { code: string; module: Module } {
  const { code } = compileBloomModule(SOURCE, 'int-range.bloom', { dev });
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} as Module };
  new Function('module', 'exports', js)(module, module.exports);
  return { code, module: module.exports };
}

it('traps Int arithmetic outside ±(2^53 − 1) in a dev build', () => {
  const { module } = load(true);
  expect(module.product(3, 4)).toBe(13);
  expect(() => module.product(2 ** 40, 2 ** 20)).toThrow(RangeError);
  expect(module.grown(1, 2)).toBe(3);
  expect(() => module.grown(Number.MAX_SAFE_INTEGER, 1)).toThrow('Int overflow');
  // A Float is never checked, an Int widened into one neither.
  expect(module.half(0.5, 2)).toBe(1.25);
});

it('emits the plain arithmetic in a release build', () => {
  const { code, module } = load(false);
  expect(code).not.toContain('$int');
  expect(module.product(2 ** 40, 2 ** 20)).toBe(2 ** 60 + 1);
});
