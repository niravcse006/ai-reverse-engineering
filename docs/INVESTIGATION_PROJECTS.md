# Investigation projects

Storage and behavior as implemented in
`src/application/investigationProject/ProjectStore.ts` and `Workflow.ts`.

## Directory layout

```text
project/
  project.json
  targets/tgt_<id>.json
  jobs/job_<id>.json
  reports/job_<id>.json
  reports/job_<id>.md
  plugins/*.json
```

`project.json` version is `1` (`INVESTIGATION_PROJECT_VERSION`). Other versions
fail parse. There is no automatic migration.

## Commands

See [CLI_REFERENCE.md](CLI_REFERENCE.md).

## Persistence rules

| Event                    | Behavior                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `init-project`           | Creates directories mode `0700` and `project.json` mode `0600`                                                                           |
| `import-target`          | SHA-256 of file bytes. Directories hash `directory:path:mtime`. Empty files refused. Same path + SHA-256 reuses the existing `target_id` |
| `analyze-project`        | Writes a job even if a later stage fails. Completed jobs with the same cache key are reused                                              |
| `resume-job`             | Reloads `jobs/<id>.json`; malformed JSON is an error, not a silent empty job                                                             |
| Corrupted `project.json` | `load_project` error; prior targets are not deleted by the loader                                                                        |

Cache keys include target SHA-256, workflow version, detector version
(`det=`), detected format (`fmt=`), backend list, dynamic authorization, AI
enabled, and optional backend versions. Reuse also requires the stored
`ev_format` title to match the live detector.

`project-status` lists readable jobs and reports `unreadable_jobs` for
malformed or unsafe job files instead of skipping them.

## What analyze-project does not do

- Launch the target
- Launch Ghidra, Hopper, IDA, or Frida
- Load plugin JavaScript
- Treat AI notes as verified facts
