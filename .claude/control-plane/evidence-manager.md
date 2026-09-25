# Evidence manager

runtime/evidence.mjs is the only way to create evidence: executed commands (exit code, output hash, excerpt, commit, fingerprint) or recorded independent reviews. Caller-asserted PASS is rejected. Fresh = fingerprint equals current workspace.
