/** RFC 8878 Zstandard magic number, little-endian. */
const ZSTD_MAGIC = 0xfd2f_b528;
const ZSTD_MAGIC_BYTES = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

const dictionaryIdBytes = (flag: number): number =>
  flag === 0 ? 0 : flag === 1 ? 1 : flag === 2 ? 2 : 4;

const frameContentSizeBytes = (
  flag: number,
  singleSegment: boolean,
): number => {
  if (flag === 0) return singleSegment ? 1 : 0;
  if (flag === 1) return 2;
  if (flag === 2) return 4;
  return 8;
};

export type ZstdFrameInspection =
  | { kind: "complete"; length: number }
  | { kind: "truncated" }
  | { kind: "invalid" };

/**
 * Classify one Zstandard frame prefix. Native Node 22 decompressors may emit
 * partial output for an incomplete frame instead of failing, so callers must
 * distinguish truncation from reserved or foreign bytes.
 */
export const inspectZstdFrame = (bytes: Buffer): ZstdFrameInspection => {
  if (bytes.length < 4) {
    return ZSTD_MAGIC_BYTES.subarray(0, bytes.length).equals(bytes)
      ? { kind: "truncated" }
      : { kind: "invalid" };
  }
  if (bytes.readUInt32LE(0) !== ZSTD_MAGIC) return { kind: "invalid" };
  if (bytes.length < 5) return { kind: "truncated" };
  const descriptor = bytes[4]!;
  // Unused_bit and Reserved_bit must be zero (RFC 8878).
  if ((descriptor & 0x18) !== 0) return { kind: "invalid" };
  const singleSegment = (descriptor & 0x20) !== 0;
  const contentChecksum = (descriptor & 0x04) !== 0;
  let offset = 5;
  if (!singleSegment) {
    if (offset >= bytes.length) return { kind: "truncated" };
    offset += 1;
  }
  offset += dictionaryIdBytes(descriptor & 0x03);
  offset += frameContentSizeBytes(descriptor >> 6, singleSegment);
  if (offset > bytes.length) return { kind: "truncated" };
  for (;;) {
    if (offset + 3 > bytes.length) return { kind: "truncated" };
    const header =
      bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);
    offset += 3;
    const last = (header & 1) === 1;
    const type = (header >> 1) & 3;
    const size = header >> 3;
    if (type === 3) return { kind: "invalid" };
    const content = type === 1 ? 1 : size;
    if (offset + content > bytes.length) return { kind: "truncated" };
    offset += content;
    if (last) break;
  }
  if (contentChecksum) {
    if (offset + 4 > bytes.length) return { kind: "truncated" };
    offset += 4;
  }
  return { kind: "complete", length: offset };
};

/**
 * Return the byte length of one complete Zstandard frame, or undefined when the
 * prefix is truncated, reserved, or not a frame.
 */
export const completeZstdFrameLength = (bytes: Buffer): number | undefined => {
  const inspection = inspectZstdFrame(bytes);
  return inspection.kind === "complete" ? inspection.length : undefined;
};
