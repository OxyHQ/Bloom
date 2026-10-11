import { sha256 } from './sha256.mjs';
/** Internal adapter for the pinned, unmodified original Character WASM ABI.
 * The public activity API binds its renderer permanently. This controller bit
 * selects both render and input branches; it does not replace geometry or pose.
 * Any upstream binary change requires re-disassembly and real-render validation.
 */
export const CONTROLLER_WASM_SHA256 =
  'c15f3692305c1385a12524e877199ba279b8d53e6bd37a9e533d626f12fcb94b';
const OFFSET = Object.freeze({ mode: 3015, ready: 74640, type: 74772 });
const CHARACTER_TYPE = 4001288;
// Read-only, null-terminated identity literals in this exact WASM image.
// func1726 compares the requested and prepared identity strings, then stores
// only the numeric original signature profile in the reaction controller.
const SIGNATURE_IDENTITIES = Object.freeze({
  blue_beret: 6968,
  alfred: 34630,
  purple_heart: 4922,
  lime_frog: 22673,
  coral_monocle: 28480,
  gus: 8835,
  blue_spectacles: 12573,
  lime_headphones: 12137,
});
const IDENTITY_OFFSETS = [73396, 73792];

export function createControllerModeAdapter(wasmUrl) {
  let memory;
  let verified = false;
  let rejectInstantiation;
  const failure = new Promise((_, reject) => {
    rejectInstantiation = reject;
  });
  // A mocked module factory need not invoke instantiateWasm.
  failure.catch(() => {});
  const characters = new WeakMap();

  const instantiateWasm = (imports, receiveInstance) => {
    void (async () => {
      const response = await fetch(
        typeof wasmUrl === 'function' ? wasmUrl() : wasmUrl,
      );
      if (!response.ok)
        throw new Error(`Character WASM fetch failed: ${response.status}`);
      const bytes = await response.arrayBuffer();
      const digest = await sha256(bytes);
      if (digest !== CONTROLLER_WASM_SHA256)
        throw new Error(
          'Character controller ABI: original WASM integrity mismatch',
        );
      const { instance } = await WebAssembly.instantiate(bytes, imports);
      if (!(instance.exports.Vd instanceof WebAssembly.Memory))
        throw new Error(
          'Character controller ABI: missing original memory export',
        );
      memory = instance.exports.Vd;
      verified = true;
      receiveInstance(instance);
    })().catch(rejectInstantiation);
    return {};
  };

  function register(character, activities, source) {
    characters.set(character, {
      activities: activities === true,
      bound: characters.get(source)?.bound === true,
    });
  }
  function unregister(character) {
    characters.delete(character);
  }
  function layout(character) {
    const record = characters.get(character);
    if (!record?.activities || !verified || !memory || character.isDeleted?.())
      throw new Error(
        'Character controller ABI: unsupported or deleted character',
      );
    // Read a fresh view after every possible memory growth. Embind's outer
    // handle owns one pointer to the native implementation, not the impl itself.
    const view = new DataView(memory.buffer);
    const handle = character.$$?.ptr;
    if (
      !Number.isInteger(handle) ||
      handle <= 0 ||
      handle % 4 ||
      handle + 4 > view.byteLength
    )
      throw new Error('Character controller ABI: invalid Embind handle');
    const impl = view.getUint32(handle, true);
    if (
      !impl ||
      impl % 4 ||
      impl + OFFSET.type + 4 > view.byteLength ||
      view.getUint32(impl + OFFSET.type, true) !== CHARACTER_TYPE ||
      view.getUint8(impl + OFFSET.ready) > 1 ||
      view.getUint8(impl + OFFSET.mode) > 1
    )
      throw new Error('Character controller ABI: invalid pinned native layout');
    return { record, view, address: impl + OFFSET.mode };
  }
  function markBound(character) {
    const { record, view, address } = layout(character);
    if (view.getUint8(address) === 1) record.bound = true;
  }
  function controllerMode(character, enabled) {
    const { record, view, address } = layout(character);
    if (!record.bound)
      throw new Error(
        'Character controller ABI: activity Restore must bind before selecting a controller',
      );
    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean')
        throw new TypeError('Character controller mode must be boolean');
      view.setUint8(address, enabled ? 1 : 0);
    }
    return view.getUint8(address) === 1;
  }
  function controllerState(character) {
    const { record, view, address } = layout(character);
    if (!record.bound)
      throw new Error(
        'Character controller ABI: activity Restore must bind before reading state',
      );
    const impl = address - OFFSET.mode;
    const phase = view.getUint8(impl + 3008 + 35160);
    const activity = view.getUint32(impl + 3008 + 35136, true);
    const episodeId = view.getBigUint64(impl + 3008 + 35128, true);
    if (phase > 3 || activity > 9)
      throw new Error(
        'Character controller ABI: invalid pinned activity state',
      );
    // Original func1124 starts Stop at phase3. Original func786 clears phase,
    // current activity and episode only after its authored 3D outro finishes.
    // copyActivityRestore reflects the requested state immediately, too early.
    return {
      phase,
      activity,
      episodeId,
      settled: phase === 0 && activity === 0 && episodeId === 0n,
    };
  }
  function controllerWithSignature(character, identity, operation) {
    const { record, view, address } = layout(character);
    if (!record.bound)
      throw new Error(
        'Character controller ABI: activity Restore must bind before selecting a signature',
      );
    const pointer = SIGNATURE_IDENTITIES[identity];
    if (!Object.hasOwn(SIGNATURE_IDENTITIES, identity))
      throw new TypeError(
        'Character controller signature must name an original body',
      );
    if (typeof operation !== 'function')
      throw new TypeError(
        'Character controller signature operation must be synchronous',
      );
    const literal = new TextEncoder().encode(`${identity}\0`);
    if (
      pointer + literal.length > view.byteLength ||
      !literal.every((byte, i) => view.getUint8(pointer + i) === byte)
    )
      throw new Error(
        'Character controller ABI: invalid pinned signature literal',
      );
    const impl = address - OFFSET.mode;
    const saved = IDENTITY_OFFSETS.map((offset) =>
      new Uint8Array(memory.buffer, impl + offset, 12).slice(),
    );
    // Borrow immutable native strings only for the synchronous native call.
    // Restore the complete libc++ string objects (including any owning heap
    // pointers) before rendering, state serialization, or destruction can run.
    // Keeping HERE in the appearance would also override transplanted materials.
    try {
      for (const offset of IDENTITY_OFFSETS) {
        const at = impl + offset;
        view.setUint32(at, pointer, true);
        view.setUint32(at + 4, identity.length, true);
        view.setUint32(at + 8, 0x80000000 | (identity.length + 1), true);
      }
      const result = operation();
      if (result && typeof result.then === 'function')
        throw new TypeError(
          'Character controller signature operation must be synchronous',
        );
      return result;
    } finally {
      // Native calls may grow memory, invalidating the earlier DataView.
      IDENTITY_OFFSETS.forEach((offset, i) =>
        new Uint8Array(memory.buffer, impl + offset, 12).set(saved[i]),
      );
    }
  }
  function controllerSignature(character, identity) {
    return controllerWithSignature(character, identity, () =>
      character.playReaction(2),
    );
  }
  return {
    instantiateWasm,
    failure,
    register,
    unregister,
    markBound,
    controllerMode,
    controllerState,
    controllerSignature,
    controllerWithSignature,
  };
}
