import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import writeFileAtomic from "write-file-atomic";

import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import { isPathWithinRoot } from "../../domain/localPath.js";
import { err, ok, type Result } from "../../domain/result.js";
import { investigationProjectPaths } from "./ProjectStore.js";

export interface WrittenInvestigationReports {
  readonly json: string;
  readonly markdown: string;
}

export const writeInvestigationReports = async (
  projectRoot: string,
  jobId: string,
  contents: { readonly json: string; readonly markdown: string },
): Promise<Result<WrittenInvestigationReports, AnalysisInputError>> => {
  if (!/^[A-Za-z0-9_]+$/u.test(jobId))
    return err(
      new AnalysisInputError(
        "generate_report",
        { userMessage: "Job id contains unsupported characters." },
        [{ path: ["job_id"], reason: "invalid_format", message: "Use a safe job id." }],
      ),
    );
  const paths = investigationProjectPaths(projectRoot);
  const jsonPath = join(paths.reports, `${jobId}.json`);
  const markdownPath = join(paths.reports, `${jobId}.md`);
  if (
    !isPathWithinRoot(paths.reports, jsonPath) ||
    !isPathWithinRoot(paths.reports, markdownPath)
  )
    return err(
      new AnalysisInputError(
        "generate_report",
        { userMessage: "Report path escaped the project root." },
        [{ path: ["job_id"], reason: "invalid_value" }],
      ),
    );
  await mkdir(paths.reports, { recursive: true, mode: 0o700 });
  await writeFileAtomic(jsonPath, contents.json, { encoding: "utf8", mode: 0o600 });
  await writeFileAtomic(markdownPath, contents.markdown, {
    encoding: "utf8",
    mode: 0o600,
  });
  return ok({ json: jsonPath, markdown: markdownPath });
};
