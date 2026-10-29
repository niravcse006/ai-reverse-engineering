import { claimsExecutableHeader, parseExecutableHeader } from "./binaryTarget.js";
import { hasZipSignature, zipRootPackageFormat } from "./zipPackageFormat.js";
import { err, ok, type Result } from "./result.js";

/** Formats the investigation registry can name from bytes and a file name. */
export const REGISTERED_FORMATS = [
  "elf",
  "pe",
  "mach-o",
  "mach-o-universal",
  "dos-mz",
  "zip",
  "apk",
  "ipa",
  "jar",
  "hap",
  "wasm",
  "dex",
  "javascript",
  "typescript",
  "source-repository",
  "directory",
  "empty",
  "unknown",
] as const;

export type RegisteredFormat = (typeof REGISTERED_FORMATS)[number];

export interface FormatDetection {
  readonly format: RegisteredFormat;
  readonly architecture: string | null;
  readonly executable: boolean;
  readonly managed: boolean;
  readonly confidence: "observed" | "derived" | "inferred";
  readonly diagnostic: string;
  readonly supported: boolean;
}

export interface FormatDetectionInput {
  readonly bytes: Uint8Array;
  readonly fileName: string;
  readonly fileSize: number;
  readonly directory?: boolean;
  readonly hostArchitecture?: NodeJS.Architecture;
}

const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d]);
const DEX_MAGIC = Buffer.from("dex\n");

const extensionOf = (fileName: string): string => {
  const base = fileName.split(/[/\\]/u).pop() ?? fileName;
  const index = base.lastIndexOf(".");
  return index <= 0 ? "" : base.slice(index).toLowerCase();
};

const detection = (
  format: RegisteredFormat,
  diagnostic: string,
  extras: Partial<FormatDetection> = {},
): FormatDetection => ({
  format,
  architecture: extras.architecture ?? null,
  executable: extras.executable ?? false,
  managed: extras.managed ?? false,
  confidence: extras.confidence ?? "observed",
  diagnostic,
  supported: extras.supported ?? (format !== "unknown" && format !== "empty"),
});

const javascriptExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
]);
const typescriptExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);

/**
 * Identify a target from a bounded prefix, size, and name. This does not
 * execute the file or unpack archives.
 */
export const detectRegisteredFormat = (
  input: FormatDetectionInput,
): Result<FormatDetection, string> => {
  if (input.directory === true)
    return ok(
      detection(
        "source-repository",
        "Directory targets are treated as source or application trees. Use analyze-javascript-application for extracted JavaScript or Electron trees.",
        { confidence: "inferred", executable: false, supported: true },
      ),
    );
  if (!Number.isSafeInteger(input.fileSize) || input.fileSize < 0)
    return err("File size must be a non-negative safe integer.");
  if (input.fileSize === 0)
    return ok(
      detection("empty", "The target is empty and cannot be analyzed.", {
        supported: false,
        confidence: "observed",
      }),
    );
  const bytes = Buffer.from(input.bytes);
  const extension = extensionOf(input.fileName);
  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(WASM_MAGIC))
    return ok(
      detection("wasm", "WebAssembly module magic was observed.", {
        executable: true,
      }),
    );
  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(DEX_MAGIC))
    return ok(
      detection(
        "dex",
        "Dalvik executable magic was observed. Use inspect-android-package or JADX when those backends are installed.",
        { executable: true },
      ),
    );
  if (hasZipSignature(bytes)) {
    const zipFormat = zipRootPackageFormat(input.fileName);
    if (zipFormat === "apk")
      return ok(
        detection(
          "apk",
          "ZIP local header and .apk name selected the Android package family. Archive members are not extracted during detection.",
        ),
      );
    if (zipFormat === "ipa")
      return ok(
        detection(
          "ipa",
          "ZIP local header and .ipa name selected an iOS application archive. Archive members are not extracted during detection.",
        ),
      );
    if (zipFormat === "hap")
      return ok(
        detection(
          "hap",
          "ZIP local header and Harmony package extension were observed.",
        ),
      );
    if (extension === ".jar")
      return ok(
        detection(
          "jar",
          "ZIP local header and .jar name selected a Java archive. Members are not extracted during detection.",
        ),
      );
    return ok(
      detection(
        "zip",
        "ZIP signature was observed. Use extract-artifact or a format-specific inspector before treating members as executables.",
      ),
    );
  }
  if (claimsExecutableHeader(bytes, input.fileSize)) {
    const parsed = parseExecutableHeader(
      bytes,
      input.hostArchitecture ?? "arm64",
      input.fileSize,
    );
    if (parsed.ok) {
      const format =
        parsed.value.format === "mach-o-universal"
          ? "mach-o-universal"
          : parsed.value.format === "mach-o"
            ? "mach-o"
            : parsed.value.format === "elf"
              ? "elf"
              : parsed.value.format === "pe"
                ? "pe"
                : "dos-mz";
      const managed =
        parsed.value.format === "pe" ? parsed.value.managed : false;
      return ok(
        detection(format, "Executable header facts were recovered.", {
          architecture: parsed.value.architecture,
          executable: true,
          managed,
        }),
      );
    }
    const fatPrefixIncomplete =
      parsed.error === "FAT slice identity is outside the bounded prefix";
    return ok(
      detection(
        fatPrefixIncomplete ? "mach-o-universal" : "unknown",
        fatPrefixIncomplete
          ? "Universal Mach-O magic was observed, but FAT slice headers are outside the bounded prefix. Use inspect-macho on the imported path for a full-file read."
          : `Bytes claim an executable header family, but parsing failed: ${parsed.error}`,
        {
          supported: fatPrefixIncomplete,
          executable: fatPrefixIncomplete,
          confidence: "derived",
        },
      ),
    );
  }
  if (javascriptExtensions.has(extension))
    return ok(
      detection(
        "javascript",
        "The file name selected a JavaScript source or bundle. Content was not executed.",
        { confidence: "derived" },
      ),
    );
  if (typescriptExtensions.has(extension))
    return ok(
      detection(
        "typescript",
        "The file name selected a TypeScript source file. Content was not executed.",
        { confidence: "derived" },
      ),
    );
  return ok(
    detection(
      "unknown",
      `No registered magic or extension matched ${extension || "the unnamed file"}. Use a format-specific command or supply a documented header hint.`,
      { supported: false, confidence: "inferred" },
    ),
  );
};

/** Extract printable ASCII runs without interpreting them as code. */
export const extractPrintableStrings = (
  bytes: Uint8Array,
  minimumLength = 4,
  limit = 256,
): readonly string[] => {
  const collected: string[] = [];
  let current = "";
  for (const value of bytes) {
    const printable = value >= 0x20 && value <= 0x7e;
    if (printable) {
      current += String.fromCharCode(value);
      continue;
    }
    if (current.length >= minimumLength) collected.push(current);
    current = "";
    if (collected.length >= limit) return collected;
  }
  if (current.length >= minimumLength && collected.length < limit)
    collected.push(current);
  return collected;
};
