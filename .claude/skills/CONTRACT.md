# Skill Contract
Every registered Claude skill MUST declare or inherit: purpose/trigger, exact inputs/target, deterministic procedure, validation, evidence, failure/recovery, idempotency/retry rule, approval boundary and completion condition. Unsupported external capability MUST return CAPABILITY_UNAVAILABLE and MUST NOT simulate success.
