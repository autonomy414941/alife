# Session Plan — 2026-03-06

## Compact Context
- The simulator is deterministic and already supports seeded paired experiments with strong test coverage.
- `runDisturbanceGridStudy` now spans `interval×amplitude×phase` and supports independent replication via `seedBlocks` and `blockSeedStride`.
- Reproducibility now includes block-level uncertainty (`mean`, `SE`, `95% CI`) for key paired deltas.
- Latest compact uncertainty sweep found three robustly negative path-dependence cells and one boundary cell at `interval=24, phase=0.25` with CI crossing zero.
- Current support decisions still rely mostly on pooled mean-sign checks, not CI-aware ranking.
- `npm test` and `npm run build` are green (49 tests).

## Project State
- Disturbance-memory instrumentation is mature: phase control, block replication, uncertainty fields, and synchronized JSON/CSV/test plumbing exist.
- Recent sessions have consistently narrowed from broad disturbance effects toward reproducibility of path-dependent memory gain near `interval=24`.
- The key gap is decision logic: there is no built-in CI-based cell ranking/classification to separate robust positives from boundary noise.

## External Context
- Adaptive Exploration in Lenia reports that intrinsic multi-objective ranking can sustain novelty search pressure, making robust ranking signals central to open-ended exploration loops: https://arxiv.org/abs/2506.02990
- ASAL++ reports improved novelty/coherence from evolving targets in automated alife search, reinforcing the need for reliable acceptance criteria before promoting regimes: https://arxiv.org/abs/2509.22447

## Research Gaps
- In the current disturbance grid, which cells remain supportive when the criterion is `pathDependenceGain CI95 lower bound > 0` instead of `mean > 0`?
- Does CI-lower-bound ranking keep `interval=24` as top candidate, or does the current signal collapse under uncertainty-aware ordering?

## Candidate Bets
- A: Add CI-aware support classification and ranking to disturbance-grid summary outputs (counts + top cells by `pathDependenceGain` CI lower bound).
  Why now: Uncertainty metrics exist, but they are not yet converted into an actionable decision layer.
  Est. low-context human time: 45m
  Expected information gain: high
  Main risk: Over-expanding summary schema beyond a minimal, testable slice.
- B: Add a bounded phase-neighborhood sweep harness (`interval=24`, finer phases) that emits a CI-ranked table artifact for status updates.
  Why now: The only plausible boundary behavior is phase-localized and needs denser sampling.
  Est. low-context human time: 35m
  Expected information gain: medium
  Main risk: More data without CI-aware decision rules may still be ambiguous.
- C: Replace normal-approximation CIs with bootstrap CIs for block means.
  Why now: Small `seedBlocks` make normal approximations fragile.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: Computational/runtime/test complexity exceeds one-session horizon.

## Selected Bet
Implement A: add a minimal CI-aware decision layer to `runDisturbanceGridStudy` summary so each run reports robust-positive / ambiguous / robust-negative cell counts and a ranked shortlist by `pathDependenceGain` CI lower bound. Keep scope to types, experiment aggregation, export mapping, and deterministic tests.

## Why This Fits The Horizon
- Scope is constrained to existing disturbance-grid aggregation paths; no new simulation mechanics are required.
- Success is autonomously verifiable with deterministic tests plus a fixed seeded study that yields stable ranking/classification outputs.

## Success Evidence
- Disturbance-grid `summary` includes CI-based classification counts and ranked cell identifiers (interval, amplitude, phase, CI bounds).
- Verification command or output: `npm test && npm run build`, plus a fixed seeded `runDisturbanceGridStudy(...)` check showing deterministic CI-ranked top cell(s).

## Stop Conditions
- Stop if CI-aware ranking requires redesigning unrelated analytics/reporting layers outside disturbance-grid summary/export.
- If ranking design thrashes, shrink to classification counts + single best-cell record and lock with tests.

## Assumptions / Unknowns
- Assume block means are acceptable replication units for CI-based regime ranking in this phase.
- Unknown whether the boundary near `interval=24` is phase-driven alone or masked by interval×amplitude interactions at current sample sizes.
