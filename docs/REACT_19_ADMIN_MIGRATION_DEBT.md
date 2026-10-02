# React 19 Admin Migration Debt

The strict React Hooks lint probe on 2026-10-02 identified behavior-sensitive legacy patterns in:
- ArtistManager.tsx: client-only portal mounting, filter pagination reset, page clamping, action-menu declaration ordering.
- MediaLibrary.tsx: filter pagination reset.
- PageContentWorkbench.tsx: selection reconciliation.
- PostManager.tsx: client-only portal mounting and pagination/filter reconciliation.
- AdminShell.tsx: localStorage/hash/route-driven UI synchronization.

These rules remain warnings until each component is refactored with targeted behavior tests. They MUST NOT be globally disabled and MUST NOT be represented as resolved. The pack/CI completion report is about Claude OS operation; this application migration debt is tracked separately.
