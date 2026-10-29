import { z } from "zod";

import { err, ok, type Result } from "./result.js";

export const PLUGIN_KINDS = [
  "format-handler",
  "analysis-backend",
  "ai-provider",
  "workflow-stage",
  "report-generator",
  "integration",
] as const;

export type PluginKind = (typeof PLUGIN_KINDS)[number];

export const PLUGIN_PERMISSIONS = [
  "read-target",
  "write-artifacts",
  "spawn-backend",
  "network",
  "dynamic-analysis",
  "ai-request",
] as const;

export type PluginPermission = (typeof PLUGIN_PERMISSIONS)[number];

const pluginNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9-]*$/u, "Plugin names must be lowercase kebab-case.");

const pluginVersionSchema = z
  .string()
  .min(1)
  .regex(/^\d+\.\d+\.\d+$/u, "Plugin versions must be MAJOR.MINOR.PATCH.");

const pluginEntrySchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes("\0"), "Plugin entry cannot contain NUL.")
  .refine(
    (value) => !value.startsWith("/") && !/^[A-Za-z]:[\\/]/u.test(value),
    "Plugin entry must be a relative path.",
  )
  .refine(
    (value) =>
      !value.split(/[/\\]/u).some((part) => part === ".." || part === ""),
    "Plugin entry cannot traverse parent directories.",
  );

export const pluginManifestSchema = z.object({
  name: pluginNameSchema,
  version: pluginVersionSchema,
  kind: z.enum(PLUGIN_KINDS),
  description: z.string().min(1).max(500),
  entry: pluginEntrySchema,
  permissions: z.array(z.enum(PLUGIN_PERMISSIONS)),
  trusted: z.literal(false),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

export interface PluginValidationIssue {
  readonly path: readonly string[];
  readonly message: string;
}

/**
 * Validate plugin metadata without loading or executing the entry. Plugins
 * are untrusted until a human reviews them; `trusted` must be false.
 */
export const validatePluginManifest = (
  value: unknown,
): Result<PluginManifest, readonly PluginValidationIssue[]> => {
  const parsed = pluginManifestSchema.safeParse(value);
  if (parsed.success) return ok(parsed.data);
  return err(
    parsed.error.issues.map((issue) => ({
      path: issue.path.map((part) => String(part)),
      message: issue.message,
    })),
  );
};

/** Permissions that require explicit operator authorization before use. */
export const dangerousPluginPermissions = (
  manifest: PluginManifest,
): readonly PluginPermission[] =>
  manifest.permissions.filter(
    (permission) =>
      permission === "spawn-backend" ||
      permission === "network" ||
      permission === "dynamic-analysis",
  );
