/** Lossless transport for authored motion channels. Float64 views retain every
 * exported number and share one backing buffer, including duplicate channels. */
export function decodeMotionBinary(buffer: ArrayBuffer): unknown {
  const header = new DataView(buffer);
  if (
    buffer.byteLength < 16 ||
    header.getUint32(0, true) !== 0x464d4142 ||
    header.getUint32(4, true) !== 0x01003436
  )
    throw Error('Invalid avatar motion binary header');
  const metadataLength = header.getUint32(8, true);
  const valuesLength = header.getUint32(12, true);
  const valuesOffset = Math.ceil((16 + metadataLength) / 8) * 8;
  if (!metadataLength || valuesOffset + valuesLength * 8 !== buffer.byteLength)
    throw Error('Invalid avatar motion binary length');
  const metadata = new TextDecoder('utf-8', { fatal: true }).decode(
    new Uint8Array(buffer, 16, metadataLength),
  );
  const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  const shared = new Map<string, Float64Array>();
  return JSON.parse(metadata, (_key, value: unknown) => {
    if (value === null || typeof value !== 'object' || !('$motionF64' in value)) return value;
    const range = value.$motionF64;
    if (
      Object.keys(value).length !== 1 ||
      !Array.isArray(range) ||
      range.length !== 2 ||
      !range.every(Number.isSafeInteger) ||
      range[0] < 0 ||
      range[1] < 1 ||
      range[0] + range[1] > valuesLength
    )
      throw Error('Invalid avatar motion channel range');
    const key = `${range[0]}:${range[1]}`;
    let channel = shared.get(key);
    if (!channel) {
      const offset = valuesOffset + range[0] * 8;
      channel = littleEndian
        ? new Float64Array(buffer, offset, range[1])
        : Float64Array.from({ length: range[1] }, (_, i) =>
            header.getFloat64(offset + i * 8, true),
          );
      shared.set(key, channel);
    }
    return channel;
  });
}
