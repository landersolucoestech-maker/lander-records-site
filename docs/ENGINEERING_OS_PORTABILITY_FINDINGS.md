# Engineering OS portability findings

These findings belong to the current Lander Records brownfield mission and describe the two independently reproduced Windows `fsync` failures. They are not evidence imported from another workspace.

## ACEO-PORT-001 — HIGH — backup file flushed through a read-only handle

- Status: resolved on 2026-09-13 and covered by the native Windows regression suite.
- File: `.codex/runtime/lib/store.mjs`, `atomicWrite()` backup phase.
- Root cause: the copied backup is reopened with flag `r` before `fs.fsyncSync()`. On Windows, `FlushFileBuffers` requires a writable handle and Node reports `EPERM` for this descriptor.
- Affected platform: Windows; reproduced in this worktree on Windows 11/Node 24.15.0. Synced folders make the leftover temporary artifacts more visible but are not the cause.
- Producer: `atomicWrite()` when replacing an existing JSON target with `backup: true`.
- Consumers: `writeJson()` callers such as discovery/project-profile writes and every runtime path that requests a backup.
- Affected flow: atomic state/config update after the backup copy and before backup rename or target replacement.
- Expected behavior: backup data is durably flushed, renamed to `<target>.bak`, and the new target replaces the old target.
- Actual behavior: `fs.fsyncSync()` raises `EPERM`; the operation aborts and can leave `<target>.bak.tmp-*` behind.
- Correction: open the backup as `r+` on Windows before flushing; retain `r` on platforms where read-only file flush is supported.
- Tests: add an ACEO runtime regression that performs two atomic writes, validates current and backup revisions, and rejects residual partial-backup files.
- Regression risk: low; the correction changes only the Windows handle access mode, while content and rename ordering stay unchanged.
- Resolution evidence: backup handles use `r+` on Windows, temporary backup files are cleaned on failure, and adversarial tests 33, 36, 37 and 38 cover successful replacement plus injected pre- and post-publication failures.

## ACEO-PORT-002 — MEDIUM — unsupported directory flush attempted on Windows

- Status: resolved on 2026-09-13 and covered by the native Windows regression suite.
- File: `.codex/runtime/lib/store.mjs`, `fsyncDirectory()`.
- Root cause: the POSIX directory durability barrier is attempted unconditionally. Windows directory handles do not support `fs.fsyncSync()` and return `EPERM`; the catch-all then hides both this known incompatibility and unexpected POSIX failures.
- Affected platform: Windows; reproduced in this worktree on Windows 11/Node 24.15.0.
- Producer: `fsyncDirectory()` after atomic target rename.
- Consumers: every `atomicWrite()` call, including the authoritative state store and localhost guardian state.
- Affected flow: final durability barrier for atomic JSON writes.
- Expected behavior: use a supported directory durability barrier where available and complete atomic replacement on Windows without generating a known `EPERM`.
- Actual behavior: Windows generates `EPERM`, which is swallowed; on other platforms the same catch-all can also hide a real durability failure.
- Correction: explicitly skip unsupported directory `fsync` on `win32`; retain and enforce the directory flush on POSIX so unexpected errors propagate.
- Tests: the atomic replacement regression above must execute natively on Windows and in Linux CI.
- Regression risk: medium-low; Windows retains atomic rename semantics without claiming an unavailable directory durability guarantee, while POSIX becomes stricter by surfacing real flush failures.
- Resolution evidence: directory `fsync` is skipped explicitly on Windows, retained on POSIX, and post-rename failures are reported as `COMMIT_DURABILITY_UNCERTAIN` with `retrySafe: false`.
