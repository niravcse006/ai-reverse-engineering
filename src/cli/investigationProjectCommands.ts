import { z } from "incur";
import type { Logger } from "pino";

import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisInputError } from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { validatePluginManifest } from "../domain/pluginContract.js";
import { localPathStringSchema } from "../domain/localPath.js";
import type { JsonValue } from "../domain/jsonValue.js";
import { CLI_COMMANDS } from "../cliCommandNames.js";
import { logCliCommand } from "../cliLogging.js";
import { withCommandCancellation } from "./commandCancellation.js";
import type { CliInstance } from "./types.js";
import { aiProviderStatus } from "../application/investigationProject/AiProvider.js";
import { probeAnalysisBackends } from "../application/investigationProject/BackendProbe.js";
import {
  createInvestigationProject,
  listInvestigationJobs,
  loadInvestigationJob,
  loadInvestigationProject,
} from "../application/investigationProject/ProjectStore.js";
import {
  importInvestigationTarget,
  inspectInvestigationTarget,
  runInvestigationWorkflow,
} from "../application/investigationProject/Workflow.js";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { investigationProjectPaths } from "../application/investigationProject/ProjectStore.js";

const cliError = (error: AnalysisError): JsonValue => ({
  error: "Analysis failed",
  ...projectAnalysisError(error),
});

const projectPathOptions = z.object({
  project: localPathStringSchema.describe("Investigation project directory"),
});

/** Register investigation-project commands that persist local analysis work. */
export const registerInvestigationProjectCommands = (
  cli: CliInstance,
  logger: Logger,
  environment: Readonly<Record<string, string | undefined>>,
): void => {
  cli.command(CLI_COMMANDS.initProject, {
    description: "Create a local investigation project directory",
    args: z.object({
      path: localPathStringSchema.describe("Project directory to create"),
    }),
    options: z.object({
      name: z.string().min(1).optional().describe("Project display name"),
    }),
    run: ({ args, options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.initProject, async () => {
          void signal;
          const created = await createInvestigationProject(
            args.path,
            options.name ?? "investigation",
          );
          return created.ok ? created.value : cliError(created.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.importTarget, {
    description: "Import a target into an investigation project without executing it",
    args: z.object({
      path: localPathStringSchema.describe("Target file or directory"),
    }),
    options: projectPathOptions,
    run: ({ args, options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.importTarget, async () => {
          const imported = await importInvestigationTarget(
            options.project,
            args.path,
            signal,
          );
          return imported.ok
            ? {
                target: imported.value.target,
                format: imported.value.format,
                backends: imported.value.backends,
              }
            : cliError(imported.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.inspectTarget, {
    description:
      "Detect format, hash, and available backends without executing the target",
    args: z.object({
      path: localPathStringSchema.describe("Target file or directory"),
    }),
    options: projectPathOptions,
    run: ({ args, options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.inspectTarget, async () => {
          void signal;
          const inspected = await inspectInvestigationTarget(
            options.project,
            args.path,
          );
          return inspected.ok ? inspected.value : cliError(inspected.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.analyzeProject, {
    description:
      "Run the static investigation workflow for an imported target",
    options: z.object({
      project: localPathStringSchema.describe("Investigation project directory"),
      target: z.string().min(1).describe("Imported target id"),
      authorizeDynamic: z
        .boolean()
        .default(false)
        .describe("Record authorization for later dedicated dynamic commands"),
    }),
    run: ({ options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.analyzeProject, async () => {
          const analyzed = await runInvestigationWorkflow(
            options.project,
            options.target,
            {
              authorizeDynamic: options.authorizeDynamic,
              environment,
              signal,
            },
          );
          return analyzed.ok
            ? {
                job: analyzed.value.job,
                format: analyzed.value.format,
                report: analyzed.value.job.report_paths,
                limitations: analyzed.value.job.limitations,
              }
            : cliError(analyzed.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.generateReport, {
    description: "Regenerate Markdown and JSON reports for a completed job",
    options: z.object({
      project: localPathStringSchema.describe("Investigation project directory"),
      job: z.string().min(1).describe("Job id"),
    }),
    run: ({ options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.generateReport, async () => {
          const analyzed = await loadInvestigationJob(options.project, options.job);
          if (!analyzed.ok) return cliError(analyzed.error);
          const rerun = await runInvestigationWorkflow(
            options.project,
            analyzed.value.target_id,
            { resumeJobId: options.job, environment, signal },
          );
          return rerun.ok
            ? rerun.value.job.report_paths
            : cliError(rerun.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.resumeJob, {
    description: "Resume an interrupted or failed investigation job",
    options: z.object({
      project: localPathStringSchema.describe("Investigation project directory"),
      job: z.string().min(1).describe("Job id"),
    }),
    run: ({ options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.resumeJob, async () => {
          const existing = await loadInvestigationJob(options.project, options.job);
          if (!existing.ok) return cliError(existing.error);
          const resumed = await runInvestigationWorkflow(
            options.project,
            existing.value.target_id,
            { resumeJobId: options.job, environment, signal },
          );
          return resumed.ok ? resumed.value.job : cliError(resumed.error);
        }),
      ),
  });

  cli.command(CLI_COMMANDS.listPlugins, {
    description: "Validate plugin manifests in a project without loading code",
    options: projectPathOptions,
    run: ({ options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.listPlugins, async () => {
          void signal;
          const project = await loadInvestigationProject(options.project);
          if (!project.ok) return cliError(project.error);
          const directory = investigationProjectPaths(options.project).plugins;
          let entries: string[] = [];
          try {
            entries = await readdir(directory);
          } catch {
            return { plugins: [], ai: aiProviderStatus(environment) };
          }
          const plugins = [];
          for (const entry of entries) {
            if (!entry.endsWith(".json")) continue;
            try {
              const parsed = JSON.parse(
                await readFile(join(directory, entry), "utf8"),
              );
              const validated = validatePluginManifest(parsed);
              plugins.push(
                validated.ok
                  ? { file: entry, ok: true, manifest: validated.value }
                  : { file: entry, ok: false, issues: validated.error },
              );
            } catch (cause) {
              plugins.push({
                file: entry,
                ok: false,
                issues: [
                  {
                    path: [],
                    message:
                      cause instanceof Error ? cause.message : "Invalid JSON",
                  },
                ],
              });
            }
          }
          return { plugins, ai: aiProviderStatus(environment) };
        }),
      ),
  });

  cli.command(CLI_COMMANDS.projectStatus, {
    description: "Show project targets, jobs, backends, and AI provider status",
    options: projectPathOptions,
    run: ({ options }) =>
      withCommandCancellation((signal) =>
        logCliCommand(logger, CLI_COMMANDS.projectStatus, async () => {
          void signal;
          const project = await loadInvestigationProject(options.project);
          if (!project.ok) return cliError(project.error);
          const jobs = await listInvestigationJobs(options.project);
          if (!jobs.ok) return cliError(jobs.error);
          return {
            project: project.value,
            jobs: jobs.value.map((job) => ({
              job_id: job.job_id,
              target_id: job.target_id,
              status: job.status,
              cache_key: job.cache_key,
              report_paths: job.report_paths,
            })),
            backends: await probeAnalysisBackends(environment),
            ai: aiProviderStatus(environment),
          };
        }),
      ),
  });
};
