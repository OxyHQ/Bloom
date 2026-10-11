import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRenderErrorBoundary } from '../assets/character-runtime/render-errors.mjs';
import { createSharedProgramPool } from '../assets/character-runtime/shared-programs.mjs';
import { createSharedTexturePool } from '../assets/character-runtime/shared-textures.mjs';

test('cached GL dispatch traverses each adapter once, preserves calls and live properties', () => {
  const calls = [];
  let width = 64;
  let lookups = 0;
  const native = {
    NO_ERROR: 0,
    get drawingBufferWidth() {
      return width;
    },
    getParameter() {
      return 0;
    },
    getError() {
      return 0;
    },
    viewport(...args) {
      assert.equal(this, native);
      calls.push(args);
    },
  };
  const observed = new Proxy(native, {
    get(target, key) {
      if (key === 'viewport') lookups++;
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const boundary = createRenderErrorBoundary(observed);
  const programs = createSharedProgramPool(boundary.context);
  const textures = createSharedTexturePool(programs.context);
  boundary.render(() => {
    for (let i = 0; i < 1000; i++) textures.context.viewport(i, 2, 64, 64);
  });
  assert.equal(lookups, 1, 'cached dispatch never re-enters the inner getter');
  assert.deepEqual(
    calls,
    Array.from({ length: 1000 }, (_, i) => [i, 2, 64, 64]),
  );
  assert.equal(textures.context.drawingBufferWidth, 64);
  width = 128;
  assert.equal(textures.context.drawingBufferWidth, 128);
  assert.equal(boundary.context.getError, boundary.context.getError);
  textures.dispose();
  programs.dispose();
});
