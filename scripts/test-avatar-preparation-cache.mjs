import assert from "node:assert/strict";
import test from "node:test";
import {
  createPreparationCache,
  preparationKey,
} from "../assets/character-runtime/preparation-cache.mjs";

const fixture = () => ({
  appearance: new Uint8Array([1, 2, 3]),
  quality: 1,
  key: "scene",
  activities: false,
  points: [
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
});

test("identical appearances keep different contours, quality and activity modes independent", () => {
  const request = fixture();
  const key = preparationKey(request);
  const cache = createPreparationCache();
  cache.set(key, new Uint8Array([40, 50]));
  assert.deepEqual(
    cache.get(preparationKey(structuredClone(request))),
    new Uint8Array([40, 50]),
  );
  for (const patch of [
    { appearance: new Uint8Array([1, 2, 4]) },
    {
      points: [
        [0.5, 0],
        [0, 1],
        [-0.5, 0],
      ],
    },
    { quality: 2 },
    { activities: true },
    { authoredParts: { eyes: "todd" } },
    { authoredParts: { eyes: "clippo" } },
    { authoredParts: { shape: "clippo" } },
    { authoredParts: { accessory: "felipe_beret" } },
    { key: "another-native-scene" },
  ])
    assert.equal(cache.get(preparationKey({ ...request, ...patch })), null);
});

test("authored original parts are cached independently even without a contour", () => {
  const request = {
    ...fixture(),
    points: undefined,
    authoredParts: { eyes: "todd" },
  };
  const cache = createPreparationCache();
  const key = preparationKey(request);
  assert.equal(typeof key, "string");
  cache.set(key, new Uint8Array([5]));
  assert.deepEqual(
    cache.get(preparationKey(structuredClone(request))),
    new Uint8Array([5]),
  );
  assert.equal(
    cache.get(
      preparationKey({
        ...request,
        authoredParts: { accessory: "felipe_beret" },
      }),
    ),
    null,
  );
});

test("cached buffers survive mutation and transfer of both sender and receiver views", () => {
  const cache = createPreparationCache();
  const source = new Uint8Array([7, 8, 9]);
  cache.set("scene", source);
  source.fill(0);
  const received = cache.get("scene");
  assert.deepEqual(received, new Uint8Array([7, 8, 9]));
  received.fill(1);
  structuredClone(received, { transfer: [received.buffer] });
  assert.equal(received.byteLength, 0);
  assert.deepEqual(cache.get("scene"), new Uint8Array([7, 8, 9]));
});

test("byte limit includes identity storage and evicts the least recently used scene", () => {
  const cache = createPreparationCache({ maximumBytes: 24, maximumEntries: 8 });
  cache.set("a", new Uint8Array(10));
  cache.set("b", new Uint8Array(10));
  cache.get("a");
  cache.set("c", new Uint8Array(10));
  assert.equal(cache.get("b"), null);
  assert.ok(cache.get("a"));
  assert.ok(cache.get("c"));
  assert.equal(cache.stats().bytes, 24);
  cache.set("oversized", new Uint8Array(24));
  assert.equal(cache.get("oversized"), null);
  assert.equal(cache.stats().bytes, 24);
});

test("entry limit also bounds tiny scenes and replacement does not inflate memory", () => {
  const cache = createPreparationCache({
    maximumBytes: 128,
    maximumEntries: 2,
  });
  cache.set("a", new Uint8Array([1]));
  cache.set("a", new Uint8Array([2]));
  assert.equal(cache.stats().bytes, 3);
  cache.set("b", new Uint8Array([3]));
  cache.set("c", new Uint8Array([4]));
  assert.equal(cache.stats().entries, 2);
  assert.equal(cache.get("a"), null);
});

test("original presets bypass this contour cache and missing bytes are not retained", () => {
  const key = preparationKey({ ...fixture(), points: undefined });
  assert.equal(key, null);
  const cache = createPreparationCache();
  cache.set(key, new Uint8Array([1]));
  cache.set("empty", new Uint8Array());
  cache.set("failed", null);
  assert.equal(cache.get(key), null);
  assert.deepEqual(cache.stats(), {
    entries: 0,
    bytes: 0,
    maximumBytes: 8 * 1024 * 1024,
    hits: 0,
    misses: 0,
  });
});
