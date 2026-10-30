# License and attribution

## This project

REA-authored code is MIT, copyright 2026 morluto. See [LICENSE](../LICENSE).
This working copy retains that license and copyright. New investigation-project
files are contributed under the same MIT terms.

Commercial engines (IDA, Hopper, JEB) are not licensed by REA. Obtain them
yourself if you use those backends.

## Third-party notices already in tree

Follow [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and `licenses/`.
Do not strip NOTICE files from npm dependencies or derived parsers.

## Research candidates (not vendored here)

| Project        | License verified in this pass                  | Bundled?                 |
| -------------- | ---------------------------------------------- | ------------------------ |
| Ghidra         | Apache-2.0 (public / existing REA docs)        | No                       |
| radare2        | Mostly LGPL-3.0; some plugins GPL              | No                       |
| Rizin          | LGPL-3.0                                       | No                       |
| Cutter         | GPL-3.0 (public summaries)                     | No                       |
| angr           | BSD-2-Clause (public summaries)                | No                       |
| FLOSS          | Apache-2.0 (LICENSE.txt fetched)               | No                       |
| RetDec         | MIT (LICENSE fetched); limited maintenance     | No                       |
| JADX / apktool | Apache-2.0 (public 2026 notes + REA docs)      | No                       |
| Frida          | wxWindows / LGPL family (existing REA notices) | Optional npm extra only  |
| MobSF docs     | GPL-3.0                                        | No; integration rejected |

## Attribution for this working copy

- Upstream source: https://github.com/morluto/rea
- Snapshot commit: `17ceb77ca5f2632faab8de01da4babff680eac48`
- Do not present this checkout as the official `rea-agents` npm publication
  unless it is built and published from this tree on purpose.
