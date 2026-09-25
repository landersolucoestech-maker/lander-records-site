---
name: data-flow-trace
description: "Trace a value from producer to rendered output. (lander-records-site)"
---

# data-flow-trace

## INPUT
Value (e.g. instagram followers on home)

## PRECONDITIONS
- feature-trace done

## PROCEDURE
1. Identify producer (provider/CMS)
2. Identify transformations (normalizer, mapper, sync)
3. Identify stores (graphs/data-flows.json writers/readers)
4. Identify consumers and render rules
5. Check ZERO/NULL/ERROR/STALE handling at each hop

## OUTPUT
Data-flow table

## FAILURE MODES
- Multiple writers → source-of-truth finding

## EVIDENCE REQUIRED
file:line per hop — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
root-cause-analysis
