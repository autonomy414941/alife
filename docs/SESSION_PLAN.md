# Session Plan — 2026-03-06

## Compact Context
- The simulator is deterministic (seeded) and already tracks disturbance, seasonality, locality/refugia, and resilience-memory analytics.
- `runDisturbanceGridStudy` now evaluates `interval×amplitude×phase` with independent replication blocks via `seedBlocks` and `blockSeedStride`.
- Latest replicated sweep (`seed=20260302`, `runs=4`, `seedBlocks=3`) kept pooled support at `1/8`; only `interval=24, phase=0` stayed weakly positive.
- Relapse-event reduction is robustly positive across all sampled cells/blocks; path-dependent memory gain is narrow and seed-sensitive.
- Reproducibility outputs currently include support/positive fractions but not uncertainty intervals over block means.
- Baseline health is good: `npm test` and `npm run build` pass (49 tests).

## Project State
- The codebase has mature disturbance-grid experiment plumbing (types, aggregation, JSON/CSV export, deterministic tests).
- Recent sessions focused on separating cadence vs phase effects, then adding seed-block reproducibility checks.
- The key underdeveloped area is statistical confidence for block-level effects, especially around the `interval=24` boundary signal.

## External Context
- [Automating the Search for Artificial Life with Foundation Models (ASAL), arXiv:2412.17799](https://arxiv.org/abs/2412.17799) shows recent momentum toward automated alife search loops; this increases the value of reliable, uncertainty-aware scoring signals.
- [The AI Scientist-v2, arXiv:2504.08066](https://arxiv.org/abs/2504.08066) emphasizes autonomous experiment iteration with replication/ablation gates; aligns with adding explicit confidence criteria before accepting weak effects.

## Research Gaps
- For `interval=24, phase=0`, does a block-level uncertainty interval for `pathDependenceGain` stay above zero, or is the current positive mean indistinguishable from noise?
- Around the phase boundary (`0` to `0.25`), does uncertainty-aware reporting change which cells are considered reproducibly supportive?

## Candidate Bets
- A: Add block-level uncertainty estimates (SE and 95% CI) for key paired deltas in disturbance-grid outputs, exports, and tests.
  Why now: Reproducibility scaffolding exists; uncertainty is the missing piece called out in current status.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: Over-scoping metrics beyond a minimal, testable set.
- B: Run a finer `interval=24` phase sweep (e.g., `0, 0.125, 0.25, 0.375`) using existing block replication and update status conclusions.
  Why now: The only weak positive signal is phase-localized.
  Est. low-context human time: 35m
  Expected information gain: medium
  Main risk: Interpretation remains ambiguous without confidence intervals.
- C: Add an experiment-mode comparison for paired-seed vs unpaired-seed variance to quantify variance reduction assumptions.
  Why now: Paired comparisons are central to current claims.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: API/test surface expansion is too large for one session.

## Selected Bet
Implement A: add minimal uncertainty metrics over seed-block summaries for disturbance-grid paired deltas (at least `pathDependenceGain`, `memoryStabilityDelta`, `relapseEventReduction`), wire them through types and CSV/JSON export, and lock behavior with deterministic tests.

## Why This Fits The Horizon
- It is bounded to one subsystem (`experiment.ts` + related types/export/tests) with no new runtime dependencies.
- Success is autonomously verifiable through deterministic unit tests and build checks, without human judgment calls.

## Success Evidence
- Disturbance-grid outputs include new uncertainty fields for selected paired deltas (e.g., SE and CI bounds) at cell and/or summary level.
- Verification command: `npm test && npm run build` (with updated `test/experiment.test.ts` assertions for uncertainty invariants).

## Stop Conditions
- Stop if adding uncertainty requires redesigning unrelated analytics schemas beyond disturbance-grid reproducibility fields.
- If CI implementation becomes ambiguous, shrink scope to SE-only + clear TODO note in code/tests rather than thrashing.

## Assumptions / Unknowns
- Assume seed blocks are treated as independent replication units for uncertainty calculations.
- Unknown whether normal-approximation CI is sufficient at current block counts (`seedBlocks` often small); this may require a later bootstrap-specific pass.
