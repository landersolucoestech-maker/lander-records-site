# Contracts

JSON Schema (draft-07) for every record the pack produces or consumes. `runtime/pack.mjs` validates findings (`findings/*.json`), evidence (`evidence/*.json`) and agent front matter against these with ajv (already a devDependency).

| Contract | Validates |
|---|---|
| `finding.schema.json` | Finding |
| `evidence.schema.json` | Evidence record |
| `agent.schema.json` | Agent definition (front matter of .claude/agents/**.md) |
| `subagent.schema.json` | Subagent definition |
| `mission.schema.json` | Mission |
| `task.schema.json` | Task |
| `handoff.schema.json` | Handoff between agents |
| `change.schema.json` | Change set (one atomic commit cluster) |
| `test.schema.json` | Test obligation |
| `integration.schema.json` | Integration health record |
| `external-identity.schema.json` | External identity link |
| `metric.schema.json` | Metric observation |
| `lead.schema.json` | Lead (contact submission) as implemented by app/api/contact/route.ts |
| `incident.schema.json` | Incident |
| `release.schema.json` | Release record |

Product data shapes observed in the application (payloads, envelopes, cache rows) live in `../schemas/`, not here.
