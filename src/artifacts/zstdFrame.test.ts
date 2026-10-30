import { expect, it } from "vitest";
import { zstdCompressSync } from "node:zlib";

import {
  completeZstdFrameLength,
  inspectZstdFrame,
} from "../compression/zstdFrame.js";

it("accepts a complete native Zstandard frame and classifies truncated prefixes", () => {
  const frame = zstdCompressSync(Buffer.from("ordinary CCOB marker"));
  expect(inspectZstdFrame(frame)).toEqual({
    kind: "complete",
    length: frame.length,
  });
  expect(completeZstdFrameLength(frame)).toBe(frame.length);
  expect(inspectZstdFrame(frame.subarray(0, -1))).toEqual({
    kind: "truncated",
  });
  expect(completeZstdFrameLength(frame.subarray(0, -1))).toBeUndefined();
  expect(inspectZstdFrame(Buffer.from("28b52ffd", "hex"))).toEqual({
    kind: "truncated",
  });
  expect(
    inspectZstdFrame(
      Buffer.from(
        "28b52ffddf339d0000686d656d626572206279746573200100e1995f",
        "hex",
      ),
    ),
  ).toEqual({ kind: "invalid" });
  expect(inspectZstdFrame(Buffer.from("not a Zstandard frame"))).toEqual({
    kind: "invalid",
  });
  expect(completeZstdFrameLength(Buffer.from("not a Zstandard frame"))).toBe(
    undefined,
  );
});
