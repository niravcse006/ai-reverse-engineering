import { describe, expect, it } from "vitest";

import { elf, fat, pe } from "./binaryTarget.fixture.js";
import {
  detectRegisteredFormat,
  extractPrintableStrings,
} from "./formatRegistry.js";

describe("format registry", () => {
  it("refuses empty files", () => {
    const result = detectRegisteredFormat({
      bytes: new Uint8Array(),
      fileName: "empty.bin",
      fileSize: 0,
    });
    expect(result).toMatchObject({
      ok: true,
      value: { format: "empty", supported: false },
    });
  });

  it("detects ELF, PE, WASM, DEX, and ZIP families", () => {
    expect(
      detectRegisteredFormat({
        bytes: elf(2, 1, 183),
        fileName: "lib.so",
        fileSize: 64,
        hostArchitecture: "arm64",
      }),
    ).toMatchObject({
      ok: true,
      value: { format: "elf", executable: true, architecture: "arm64" },
    });
    expect(
      detectRegisteredFormat({
        bytes: pe(0x8664),
        fileName: "app.exe",
        fileSize: 1024,
        hostArchitecture: "x64",
      }),
    ).toMatchObject({
      ok: true,
      value: { format: "pe", executable: true },
    });
    expect(
      detectRegisteredFormat({
        bytes: Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
        fileName: "module.wasm",
        fileSize: 8,
      }),
    ).toMatchObject({ ok: true, value: { format: "wasm", supported: true } });
    expect(
      detectRegisteredFormat({
        bytes: Buffer.from("dex\n035\0"),
        fileName: "classes.dex",
        fileSize: 8,
      }),
    ).toMatchObject({ ok: true, value: { format: "dex" } });
    expect(
      detectRegisteredFormat({
        bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]),
        fileName: "app.apk",
        fileSize: 6,
      }),
    ).toMatchObject({ ok: true, value: { format: "apk" } });
    expect(
      detectRegisteredFormat({
        bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        fileName: "lib.jar",
        fileSize: 4,
      }),
    ).toMatchObject({ ok: true, value: { format: "jar" } });
  });

  it("uses file names for JavaScript and TypeScript without executing them", () => {
    expect(
      detectRegisteredFormat({
        bytes: Buffer.from("export const x = 1;\n"),
        fileName: "main.ts",
        fileSize: 20,
      }),
    ).toMatchObject({
      ok: true,
      value: { format: "typescript", executable: false },
    });
  });

  it("names universal Mach-O when FAT slices sit outside the probe prefix", () => {
    const complete = fat([0x0100000c]);
    const result = detectRegisteredFormat({
      bytes: complete.subarray(0, 28),
      fileName: "true",
      fileSize: complete.length,
      hostArchitecture: "arm64",
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        format: "mach-o-universal",
        supported: true,
        executable: true,
        architecture: null,
        confidence: "derived",
      },
    });
    expect(result.ok && result.value.diagnostic).toContain("inspect-macho");
  });

  it("returns a diagnostic for unsupported bytes", () => {
    const result = detectRegisteredFormat({
      bytes: Buffer.from("not a binary"),
      fileName: "notes.txt",
      fileSize: 12,
    });
    expect(result.ok && result.value.supported).toBe(false);
    expect(result.ok && result.value.diagnostic).toContain(
      "No registered magic",
    );
  });

  it("extracts printable strings and ignores short noise", () => {
    const bytes = Buffer.from("ab\0HelloWorld\0xy\0/usr/lib/libc.so\0");
    expect(extractPrintableStrings(bytes)).toEqual([
      "HelloWorld",
      "/usr/lib/libc.so",
    ]);
  });
});
