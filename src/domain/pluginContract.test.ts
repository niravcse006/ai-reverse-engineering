import { describe, expect, it } from "vitest";

import {
  dangerousPluginPermissions,
  validatePluginManifest,
} from "./pluginContract.js";

const validManifest = {
  name: "example-strings",
  version: "1.0.0",
  kind: "format-handler",
  description: "Extract strings from a registered format.",
  entry: "handlers/strings.js",
  permissions: ["read-target"],
  trusted: false,
};

describe("plugin contract", () => {
  it("accepts a complete untrusted manifest", () => {
    const result = validatePluginManifest(validManifest);
    expect(result.ok).toBe(true);
  });

  it("rejects parent-directory entries and absolute paths", () => {
    expect(
      validatePluginManifest({ ...validManifest, entry: "../escape.js" }).ok,
    ).toBe(false);
    expect(
      validatePluginManifest({ ...validManifest, entry: "/tmp/plugin.js" }).ok,
    ).toBe(false);
  });

  it("rejects manifests that claim to be trusted", () => {
    expect(validatePluginManifest({ ...validManifest, trusted: true }).ok).toBe(
      false,
    );
  });

  it("names permissions that require operator authorization", () => {
    const result = validatePluginManifest({
      ...validManifest,
      permissions: ["read-target", "network", "dynamic-analysis"],
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(dangerousPluginPermissions(result.value)).toEqual([
        "network",
        "dynamic-analysis",
      ]);
  });
});
