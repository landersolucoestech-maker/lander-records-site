# Claude OS

This directory is the canonical Claude/Claude Code control plane for LANDER RECORDS SITE.

It adapts the supplied engineering/automation pack to the real site. Generic engineering capabilities are retained. LANDER CREATORS-only campaign, creator, negotiation, payment, presave, attribution and wave operations are intentionally not activated because those domains do not exist in this repository.

Structure:
- agents/registry.json — orchestrators, investigators, engineers, reviewers and LANDER RECORDS domain agents.
- skills/registry.json — engineering and operational skills.
- rules/ — non-negotiable execution rules.
- commands/ — command routing contract.
- hooks/ — lifecycle gates.
- automation/ — operational automation runtime contract.
- DOMAIN-MAP.md — real product/domain mapping.
- PACK-AUDIT.md — adaptation decisions and coverage.
