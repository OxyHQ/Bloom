import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRenderErrorBoundary } from '../assets/character-runtime/render-errors.mjs';

function fixture() {
  const errors = [];
  let polls = 0;
  const gl = {
    NO_ERROR: 0,
    getError() {
      polls++;
      return errors.shift() ?? 0;
    },
  };
  return {
    boundary: createRenderErrorBoundary(gl),
    errors,
    polls: () => polls,
  };
}
test('one driver query covers a nested shared batch, while external probes remain exact', () => {
  const { boundary, errors, polls } = fixture();
  boundary.render(() => {
    for (let i = 0; i < 48; i++)
      boundary.render(() => {
        assert.equal(boundary.context.getError(), 0);
        assert.equal(boundary.context.getError(), 0);
      });
    assert.equal(polls(), 0);
  });
  assert.equal(polls(), 1);
  errors.push(0x500);
  assert.equal(boundary.context.getError(), 0x500);
  assert.equal(polls(), 2);
  boundary.render(() => {});
  assert.equal(polls(), 2, 'an idle tick never synchronizes the driver');
});
test('driver errors reject the complete batch before it can publish, then recover', () => {
  const { boundary, errors } = fixture();
  let published = false;
  assert.throws(() => {
    boundary.render(() => {
      errors.push(0x500, 0x502);
      boundary.context.getError();
    });
    published = true;
  }, /0x500, 0x502/);
  assert.equal(published, false);
  assert.equal(
    boundary.render(() => 42),
    42,
  );
});
test('a throwing native render restores polling and preserves both failures', () => {
  const { boundary, errors } = fixture();
  const failure = new Error('native failed');
  assert.throws(
    () =>
      boundary.render(() => {
        throw failure;
      }),
    (error) => error === failure,
  );
  assert.throws(
    () =>
      boundary.render(() => {
        errors.push(0x502);
        boundary.context.getError();
        throw failure;
      }),
    (error) => {
      assert(error instanceof AggregateError);
      assert.equal(error.errors[0], failure);
      assert.match(error.errors[1].message, /0x502/);
      return true;
    },
  );
  errors.push(0x507);
  assert.equal(boundary.context.getError(), 0x507);
});
