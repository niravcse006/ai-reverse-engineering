# Research report

Research date: 2026-10-29. Claims below are marked **verified**, **partially
verified**, **experimental**, **unverified**, or **unsupported**.

## Method

- Inspected the local REA tree and the upstream GitHub/README/installation pages.
- Fetched official repository and license pages for candidate tools.
- Did not run those external tools in this environment unless already present.
- Did not invent benchmark numbers.

## AI-assisted reverse engineering

### REA (this project)

- URL: https://github.com/morluto/rea
- Maintenance: **verified** active on 2026-10-29 (commit `17ceb77…`)
- License: MIT (**verified** from `LICENSE`)
- Role: local CLI/MCP analysis platform. It does not embed a production LLM.
- Compatibility: this working copy starts from that tree.

### Reverse Engineer Anything skill

- URL: https://github.com/OfficialTanishSharma/reverse-engineer-anything
- Status: **partially verified**. The official REA skill lives in
  `.agents/skills/reverse-engineer-anything/` and is published through
  skills.sh as `morluto/rea`. A similarly named third-party skill is not a
  substitute for the packaged MCP server.
- Integration: keep the bundled skill; do not replace REA tools with prompt
  text alone.

### Agent frameworks and MCP servers

REA already implements MCP (`@modelcontextprotocol/server@2.3.1`) and client
setup for Claude Code, Codex, Cursor, Gemini CLI, and others
(`src/application/SupportedClients.ts`). Additional agent frameworks are
**unsupported** as in-process planners. The architecture keeps reasoning in
the external agent.

## Binary analysis and decompilation

| Project | URL | License | Maintenance | Formats / capabilities | Integration |
| --- | --- | --- | --- | --- | --- |
| Ghidra | https://github.com/NationalSecurityAgency/ghidra | Apache-2.0 (**partially verified** from public 2026 summaries and existing REA docs) | **partially verified** public 2026 release notes cite 12.1.4 | Native decompile, many processors | **Already integrated** as optional BYO install |
| radare2 | https://github.com/radareorg/radare2 | Mostly LGPL-3.0; some plugins GPL (**verified** from project license docs) | **partially verified** public 2026 notes cite 6.2.4 | Disassembly, scripting, debug | Not a first-class REA provider. `r2` PATH probe only |
| Rizin | https://github.com/rizinorg/rizin | LGPL-3.0 (**verified** GitHub license) | **verified** active project | CLI analysis and debug | **Already integrated** via `REA_RIZIN_COMMAND` |
| Cutter | https://github.com/rizinorg/cutter | GPL-3.0 (**partially verified** public summaries) | **partially verified** public 2026 notes cite v2.5.0 | GUI on Rizin | **Already integrated** as a live-bridge, not a headless default |
| angr | https://github.com/angr/angr | BSD-2-Clause (**partially verified** public summaries) | **unverified** in this pass beyond repository existence | Symbolic execution | **Deferred**. No `src/` references |
| FLOSS | https://github.com/mandiant/flare-floss | Apache-2.0 (**verified** LICENSE.txt) | **verified** active repository | Obfuscated-string recovery | **Deferred**. Overlaps built-in strings; valuable later as optional BYO |
| RetDec | https://github.com/avast/retdec | MIT (**verified** LICENSE) | **verified** limited maintenance mode | LLVM decompiler | **Deferred**. High integration cost, limited maintenance |

Hopper and IDA are proprietary. REA already supports them as optional local
engines and grants no license.

## Platform-specific tools

| Area | Candidates | Finding |
| --- | --- | --- |
| Android | JADX, apktool, MobSF, Frida | JADX and apktool are already optional REA backends. Frida is optional. MobSF is a full product; its docs repo publishes GPL-3.0. **Rejected** as a vendored integration |
| iOS / macOS | Hopper, native Mach-O readers, Apple application graphs | Already present. Hopper remains macOS/Linux BYO |
| Windows PE / .NET | In-process PE/managed readers, ILSpy path, IDA/Ghidra | Already present. dnSpyEx/ILSpy stay optional BYO |
| ELF / Linux | Header parsers, Ghidra, objdump, GDB | Already present |
| JS / TS / Electron | Built-in JS application analysis | Already present and needs no native engine |
| WebAssembly | WABT-backed inspect commands | Already present |
| Firmware | binwalk/unblob/uImage/ESP readers | U-Boot/ESP/FIT support exists; binwalk/unblob remain BYO |

## Symbolic execution, debug, and instrumentation

- Frida: optional npm extra, wxWindows/LGPL family. **Already integrated**, never auto-spawned by project analysis.
- GDB / pwndbg / pwntools: BYO adapters exist.
- angr: **deferred**.
- Dynamic analysis in the new workflow: **skipped** unless `--authorize-dynamic` is set, and even then the project workflow does not launch the target.

## Distinctions

- **Verified:** licenses and repository pages fetched or present in this tree.
- **Partially verified:** widely published 2026 version/license notes that were not re-downloaded as release artifacts.
- **Experimental:** none claimed for new integrations.
- **Unverified:** live angr release status and MobSF application LICENSE beyond the docs repository.
- **Unsupported:** automatic execution of unknown binaries; in-process exploit generation; claiming a backend works merely because npm installed.

## Selection summary

Integrate only what fits REA's Evidence contracts and licenses:

- Keep Ghidra/Hopper/IDA/Kuna/JADX/Rizin/Frida as optional backends.
- Implement project persistence, reports, and an optional AI client here.
- Defer angr, FLOSS, and RetDec.
- Reject MobSF as a bundled engine.
- Keep AI reasoning outside or behind an explicit, keyless-by-default interface.
