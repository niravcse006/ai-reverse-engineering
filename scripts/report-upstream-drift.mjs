#!/usr/bin/env node
/**
 * Report commits on morluto/rea that are not in this snapshot.
 * This never merges, fetches git objects, or writes the working tree.
 */
const SNAPSHOT = "17ceb77ca5f2632faab8de01da4babff680eac48";
const UPSTREAM = "morluto/rea";
const url = `https://api.github.com/repos/${UPSTREAM}/compare/${SNAPSHOT}...main`;

const response = await fetch(url, {
  headers: { accept: "application/vnd.github+json", "user-agent": "rea-upstream-drift" },
});
if (!response.ok) {
  console.error(`Unable to compare ${UPSTREAM}: HTTP ${String(response.status)}`);
  console.error(`Pinned snapshot: ${SNAPSHOT}`);
  process.exitCode = 1;
  process.exit();
}
const comparison = await response.json();
const commits = Array.isArray(comparison.commits) ? comparison.commits : [];
console.log(`Pinned snapshot: ${SNAPSHOT}`);
console.log(`Upstream tip: ${String(comparison.commits?.at(-1)?.sha ?? comparison.merge_base_commit?.sha ?? "unknown")}`);
console.log(`Ahead: ${String(comparison.ahead_by ?? commits.length)}  Behind: ${String(comparison.behind_by ?? 0)}`);
console.log("This script does not merge. Review each commit before porting.");
for (const commit of commits) {
  const sha = String(commit.sha ?? "").slice(0, 7);
  const subject = String(commit.commit?.message ?? "").split("\n")[0];
  console.log(`${sha} ${subject}`);
}
