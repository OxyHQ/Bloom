/** Separate optional activity transport without rounding or resampling authored channels. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function splitMotionTransport(binary, activity) {
  assert(activity === 'base' || activity === 'work');
  assert(binary.length >= 16 && binary.readUInt32LE(0) === 0x464d4142);
  assert.equal(binary.readUInt32LE(4), 0x01003436);
  const metadataLength = binary.readUInt32LE(8);
  const valuesLength = binary.readUInt32LE(12);
  const offset = Math.ceil((16 + metadataLength) / 8) * 8;
  assert.equal(offset + valuesLength * 8, binary.length);
  const original = JSON.parse(binary.toString('utf8', 16, 16 + metadataLength));
  let selected;
  if (original.schema === 'bloom.avatar.motion-bundle') {
    const { computer, computerLoop, ...base } = original;
    selected =
      activity === 'base'
        ? base
        : {
            schema: original.schema,
            version: original.version,
            preset: original.preset,
            computer,
            computerLoop,
          };
  } else {
    assert.equal(original.schema, 'bloom.avatar.catalog-motion-library');
    selected = {
      ...original,
      rigs: original.rigs.map(({ work, ...base }) => (activity === 'base' ? base : { work })),
    };
  }
  const chunks = [],
    ranges = new Map();
  let count = 0;
  function visit(value) {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object') return value;
    if ('$motionF64' in value) {
      const [start, length] = value.$motionF64;
      assert(
        Number.isSafeInteger(start) &&
          Number.isSafeInteger(length) &&
          start >= 0 &&
          length > 0 &&
          start + length <= valuesLength,
      );
      const key = `${start}:${length}`;
      let range = ranges.get(key);
      if (!range) {
        range = [count, length];
        ranges.set(key, range);
        count += length;
        chunks.push(binary.subarray(offset + start * 8, offset + (start + length) * 8));
      }
      return { $motionF64: range };
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        visit(
          key === 'parts' && Array.isArray(child)
            ? child.filter((part) => typeof part.id !== 'string' || !part.id.startsWith('fur:'))
            : child,
        ),
      ]),
    );
  }
  const metadata = Buffer.from(JSON.stringify(visit(selected)));
  const header = Buffer.alloc(Math.ceil((16 + metadata.length) / 8) * 8);
  header.writeUInt32LE(0x464d4142, 0);
  header.writeUInt32LE(0x01003436, 4);
  header.writeUInt32LE(metadata.length, 8);
  header.writeUInt32LE(count, 12);
  metadata.copy(header, 16);
  return Buffer.concat([header, ...chunks]);
}

/** Dev and published runtimes consume identical split bytes; originals remain fidelity oracles. */
export function avatarMotionTransport() {
  const cache = new Map();
  const prefix = '/@bloom-avatar-motion/';
  let root, serving;
  const valid = (filename) =>
    filename.startsWith(root + path.sep) &&
    /\/(packed-motion|catalog-motion)\/[^/]+\.bin$/.test(filename);
  async function resource(filename, activity) {
    const key = `${filename}:${activity}`;
    let request = cache.get(key);
    if (!request) {
      request = readFile(filename)
        .then((bytes) => splitMotionTransport(bytes, activity))
        .catch((error) => {
          cache.delete(key);
          throw error;
        });
      cache.set(key, request);
    }
    return request;
  }
  return {
    name: 'bloom-avatar-motion-transport',
    enforce: 'pre',
    configResolved(config) {
      root = path.resolve(config.root, 'runtime/avatar/assets');
      serving = config.command === 'serve';
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        cache.delete(`${file}:base`);
        cache.delete(`${file}:work`);
      });
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith(prefix)) return next();
        try {
          const [activity, ...pieces] = decodeURIComponent(
            request.url.slice(prefix.length).split('?')[0],
          ).split('/');
          const filename = path.resolve(root, pieces.join('/'));
          if (!valid(filename) || !['base', 'work'].includes(activity)) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.setHeader('Content-Type', 'application/octet-stream');
          response.setHeader('Cache-Control', 'no-cache');
          response.end(await resource(filename, activity));
        } catch (error) {
          next(error);
        }
      });
    },
    async load(id) {
      const [filename, query] = id.split('?');
      const params = new URLSearchParams(query);
      const activity = params.get('avatar-motion');
      if (!params.has('url') || !valid(filename) || !['base', 'work'].includes(activity))
        return null;
      this.addWatchFile(filename);
      if (serving)
        return `export default ${JSON.stringify(prefix + activity + '/' + path.relative(root, filename).split(path.sep).join('/'))};`;
      const reference = this.emitFile({
        type: 'asset',
        name: `${path.basename(path.dirname(filename))}-${path.basename(filename, '.bin')}-${activity}.bin`,
        source: await resource(filename, activity),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
  };
}
