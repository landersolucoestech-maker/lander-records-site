# Capability registry

control-plane/registry.json lists every component (agents, subagents, auditors, reviewers, guardians, integrationAgents, skills, workflows, gates, sensors) with its path. runtime/pack.mjs fails on unregistered or missing components.
