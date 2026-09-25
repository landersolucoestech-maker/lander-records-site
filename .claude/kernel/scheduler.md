# Scheduler

Within a session: sequential loop over the READY queue; independent read-only audits may run as parallel subagents; writers never share files. Across sessions: state is persisted (findings, evidence, mission, state/*.yml) so the next session resumes with `controller.mjs status`. Product-level schedules that exist in the site: hosting cron every 6h for /api/cron/integrations.
