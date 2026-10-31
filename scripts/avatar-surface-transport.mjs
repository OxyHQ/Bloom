/** Production transport omits strand seeds while retaining authored archives.
 * Vertex/index bytes, precision, topology and animation are unchanged. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function surfaceGeometryTransport(original, binary) {
  assert.equal(binary.length, original.buffer.byteLength, 'Geometry transport source length');
  const removed = original.parts
    .flatMap((part) => (part.fur ? [part.fur] : []))
    .sort((a, b) => a.byteOffset - b.byteOffset);
  const chunks = [];
  let end = 0;
  for (const range of removed) {
    assert(range.byteOffset >= end && range.byteOffset + range.byteLength <= binary.length);
    assert.equal(range.byteLength % 4, 0, 'Removing strands preserves vertex alignment');
    chunks.push(binary.subarray(end, range.byteOffset));
    end = range.byteOffset + range.byteLength;
  }
  chunks.push(binary.subarray(end));
  const bytes = Buffer.concat(chunks);
  const manifest = structuredClone(original);
  const relocate = (range) => {
    const start = range.byteOffset;
    for (const omitted of removed) {
      assert(
        start + range.byteLength <= omitted.byteOffset ||
          start >= omitted.byteOffset + omitted.byteLength,
        'Surface data must not overlap strand seeds',
      );
      if (omitted.byteOffset < start) range.byteOffset -= omitted.byteLength;
    }
  };
  for (const part of manifest.parts) {
    relocate(part.vertices);
    for (const indices of part.indices) relocate(indices);
    part.fur = null;
  }
  manifest.buffer.byteLength = bytes.length;
  manifest.buffer.sha256 = createHash('sha256').update(bytes).digest('hex');
  return { manifest, binary: bytes };
}

/** Same bytes in Storybook and built runtime; source fixtures remain inspectable. */
export function avatarSurfaceTransport() {
  const cache = new Map();
  let root;
  let serving = false;
  const prefix = '/@bloom-avatar-surface/';
  async function resource(filename) {
    const stem = filename.replace(/\.(json|bin)$/, '');
    let pending = cache.get(stem);
    if (!pending) {
      pending = Promise.all([readFile(stem + '.json', 'utf8'), readFile(stem + '.bin')])
        .then(([json, bytes]) => surfaceGeometryTransport(JSON.parse(json), bytes))
        .catch((error) => {
          cache.delete(stem);
          throw error;
        });
      cache.set(stem, pending);
    }
    const pair = await pending;
    return filename.endsWith('.json') ? JSON.stringify(pair.manifest) : pair.binary;
  }
  return {
    name: 'bloom-avatar-surface-transport',
    enforce: 'pre',
    configResolved(config) {
      root = path.resolve(config.root, 'runtime/avatar/assets');
      serving = config.command === 'serve';
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (file.startsWith(root + path.sep)) cache.delete(file.replace(/\.(json|bin)$/, ''));
      });
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith(prefix)) return next();
        try {
          const relative = decodeURIComponent(request.url.slice(prefix.length).split('?')[0]);
          const filename = path.resolve(root, relative);
          if (
            !filename.startsWith(root + path.sep) ||
            !/(?:^|\/)geometry(?:-low)?\.(json|bin)$/.test(filename)
          ) {
            response.statusCode = 404;
            response.end();
            return;
          }
          const body = await resource(filename);
          response.setHeader(
            'Content-Type',
            filename.endsWith('.json') ? 'application/json' : 'application/octet-stream',
          );
          response.setHeader('Cache-Control', 'no-cache');
          response.end(body);
        } catch (error) {
          next(error);
        }
      });
    },
    async load(id) {
      const [filename, query] = id.split('?');
      if (
        !query?.split('&').includes('url') ||
        !filename.startsWith(root + path.sep) ||
        !/(?:^|\/)geometry(?:-low)?\.(json|bin)$/.test(filename)
      )
        return null;
      this.addWatchFile(filename);
      if (serving)
        return `export default ${JSON.stringify(prefix + path.relative(root, filename).split(path.sep).join('/'))};`;
      const reference = this.emitFile({
        type: 'asset',
        name: path.basename(filename),
        source: await resource(filename),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
  };
}
