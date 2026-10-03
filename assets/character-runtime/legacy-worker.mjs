// Shared preparation worker. Only copies of completed scenes are deformed;
// the recovered engine, packaged meshes and native manifests remain intact.
import createModule from "./orbit-characters.mjs";
import { decodeAppearance, encodeAppearance } from "./appearance-codec.mjs";
import { composeAuthoredParts } from "./authored-parts.mjs";
import { sha256 } from "./sha256.mjs";
import {
  deformLegacyAssembly,
  inspectLegacyAssembly,
  legacyAttachmentOffset,
} from "./legacy-geometry.mjs";
const engine = createModule({
  locateFile: (file) => new URL(file, import.meta.url).href,
});
const digest = (value) =>
  sha256(typeof value === "string" ? new TextEncoder().encode(value) : value);
// Cache only identities, never the large prepared buffers. The same face with
// no accessories tells us exactly which meshes belong to eyes and eyewear.
const faceIdentities = new Map();
async function accessoryTransforms(module, data, source) {
  const appearance = decodeAppearance(data.appearance);
  // The editor selects one accessory. Preserve any unknown multi-accessory
  // state rather than guessing which of its pieces should move together.
  if (appearance.accessories.length !== 1) return {};
  const translate = legacyAttachmentOffset(
    data.points,
    appearance.accessories[0],
  );
  if (!translate || translate.every((value) => Math.abs(value) < 1e-6))
    return {};
  appearance.accessories = [];
  appearance.accessoryColors = {};
  if (appearance.model) appearance.model.accessories = {};
  const bytes = encodeAppearance(appearance);
  const key = `${await digest(bytes)}:${data.quality}:${data.activities}`;
  let names = faceIdentities.get(key);
  if (!names) {
    const base = module.orbitPrepareAssembly(
      bytes,
      data.quality,
      `${data.key}:attachment-base`,
      data.activities,
    );
    if (!base.bytes)
      throw new Error(base.error || "Accessory reference preparation failed");
    names = new Set(
      inspectLegacyAssembly(base.bytes)
        .parts.slice(1)
        .map((part) => part.name),
    );
    faceIdentities.set(key, names);
    if (faceIdentities.size > 32)
      faceIdentities.delete(faceIdentities.keys().next().value);
  }
  // Do not move anything unless every original face mesh survives unchanged.
  const current = new Set(source.parts.slice(1).map((part) => part.name));
  if ([...names].some((name) => !current.has(name))) return {};
  const attachments = source.parts
    .slice(1)
    .filter((part) => !names.has(part.name))
    .map((part) => ({ part: part.part, translate }));
  const attachmentKeys = {};
  for (const attachment of attachments)
    attachmentKeys[attachment.part] = await digest(
      JSON.stringify([source.parts[attachment.part].name, translate]),
    );
  return { attachments, attachmentKeys };
}
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      const module = await engine;
      const result = module.orbitPrepareAssembly(
        data.appearance,
        data.quality,
        data.key,
        data.activities,
      );
      if (result.bytes && data.points) {
        const source = inspectLegacyAssembly(result.bytes);
        const geometryKey = await digest(
          JSON.stringify([source.body.name, data.points]),
        );
        result.bytes = deformLegacyAssembly(result.bytes, {
          points: data.points,
          geometryKey,
          ...(await accessoryTransforms(module, data, source)),
        });
      }
      if (
        result.bytes &&
        (data.authoredParts?.shape === "clippo" ||
          data.authoredParts?.eyes === "clippo")
      ) {
        const { composeClippoAssembly } = await import("./clippo-geometry.mjs");
        result.bytes = await composeClippoAssembly(module, result.bytes, data);
      }
      if (result.bytes && data.authoredParts)
        result.bytes = await composeAuthoredParts(module, result.bytes, data);
      self.postMessage(
        { id: data.id, ...result },
        result.bytes ? [result.bytes.buffer] : [],
      );
    } catch (error) {
      self.postMessage({ id: data.id, error: String(error), milliseconds: 0 });
    }
  });
};
