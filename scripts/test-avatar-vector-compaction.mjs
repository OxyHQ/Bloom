import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { compactVectorAsset } from "./avatar-vector/compact-assets.mjs";

test("removes only unused exporter adjacency from otherwise constant-free data", () => {
  const data = {
    parts: [
      {
        role: "body",
        points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
        faces: [[0, 1, 2]],
        edges: [[0, 1, 0, -1]],
      },
    ],
    clips: {
      idle: { parts: [{ translation: { samples: [0, 0, 0, 1, 0, 0] } }] },
    },
  };
  const expected = structuredClone(data);
  expected.parts[0].edges = [];
  assert.deepEqual(compactVectorAsset(data, "shape"), expected);
});
test("every shipped vector omits adjacency payload and has accurate manifest bytes", () => {
  const directory = fileURLToPath(
    new URL("../src/agent-avatar/vector-assets/", import.meta.url),
  );
  const manifest = JSON.parse(
    fs.readFileSync(directory + "manifest.json", "utf8"),
  );
  for (const record of manifest.files) {
    const raw = fs.readFileSync(directory + record.file, "utf8");
    assert.equal(Buffer.byteLength(raw), record.bytes, record.file);
    const data = JSON.parse(JSON.parse(raw).data);
    for (const part of data.parts)
      assert.deepEqual(part.edges, [], `${record.file}/${part.id}`);
  }
});
