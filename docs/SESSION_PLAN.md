# Session Plan — 2026-03-06

## Compact Context
- The simulator and experiment layer are deterministic with stable seeded sweeps and green tests/build.
- `runDisturbanceGridStudy` already supports `interval×amplitude×phase` plus `seedBlocks` replication.
- Block-mean uncertainty (`mean`, `SE`, `CI95`) and CI-aware summary ranking/classification are implemented.
- Latest fixed check (`seed=20260302`, `runs=2`, `seedBlocks=3`, phases `{0,0.25}`) had `robustPositive=0`, `ambiguous=3`, `robustNegative=1`.
- `relapseEventReduction` is consistently positive, but `pathDependenceGain` is still mostly negative or boundary.
- Current strongest candidate region remains near `interval=24`, low amplitude, phase-sensitive.

## Project State
- Core capability exists: disturbance phase control, paired global/local runs, block reproducibility, CI-aware ranking.
- Recent sessions have converged on uncertainty reduction for path-dependent memory benefit, not adding new mechanics.
- Underdeveloped area: empirical power near the `interval=24` boundary is still low, so ambiguity vs true null is unresolved.

## External Context
- Adaptive Exploration in Lenia with Intrinsic Multi-Objective Ranking (arXiv:2506.02990, 2025-06-03) emphasizes robust ranking pressure for sustained novelty rather than weak mean effects: https://arxiv.org/abs/2506.02990
- Flow-Lenia (arXiv:2506.08569, Artificial Life 31(2), 2025) highlights evaluating emergent dynamics with evolutionary-activity-style metrics across replicated dynamics, reinforcing replication-first evidence before claims of open-endedness: https://arxiv.org/abs/2506.08569

## Research Gaps
- With denser phase sampling around `interval=24` and higher `seedBlocks`, does any cell achieve `pathDependenceGain CI95 low > 0`?
- Are currently ambiguous cells stable top-ranked candidates, or do they collapse when replication depth increases?

## Current Anti-Evidence
- No tested cell has yet reached robust-positive `pathDependenceGain` under CI criteria; current positives are mean-sign or boundary artifacts.
- Evidence is from short-horizon forced disturbance regimes, not sustained endogenous innovation over long horizons.

## Candidate Bets
- A: Run one bounded high-replication phase-neighborhood sweep at `interval=24`, `amplitude=0.2`, then make a CI-based accept/reject call.
  Why now: This directly targets the only remaining boundary zone with existing instrumentation.
  Est. low-context human time: 35m
  Expected information gain: high
  Main risk: Runtime cost may rise without yielding robust-positive cells.
- B: Add CI-width/power diagnostics to disturbance-grid summary (`pathDependenceGain` CI half-width and simple precision threshold flags).
  Why now: It separates “not enough replication” from “likely null.”
  Est. low-context human time: 50m
  Expected information gain: medium
  Main risk: Precision heuristics may be arbitrary without immediate follow-up sweeps.
- C: Add a minimal long-horizon activity probe (rolling net diversification + novelty persistence) for top disturbance cells.
  Why now: Open-endedness claims need ongoing innovation signals, not only resilience deltas.
  Est. low-context human time: >60m
  Expected information gain: high
  Main risk: Scope creep beyond one session.

## Selected Bet
Execute A: run a single higher-replication phase-neighborhood study centered on `interval=24` using current CI-aware outputs, and decide whether any phase is robust-positive (`CI95 low > 0`) or whether the current hypothesis should be downgraded to “no support at tested depth.”

## Why This Fits The Horizon
- No code-path expansion is required; it uses existing deterministic experiment primitives and summary fields.
- Success is autonomously verifiable by fixed-parameter reruns and direct CI classification/ranking outputs.

## Success Evidence
- Artifact: one fixed-parameter summary showing `pathDependenceGainCi95ClassificationCounts` and ranked phase cells for phases `{0,0.125,0.25,0.375,0.5,0.625,0.75,0.875}` at `interval=24`, `amplitude=0.2`.
- Verification command or output: `npm run build && node -e "const {runDisturbanceGridStudy}=require('./dist/experiment.js'); const phases=[0,0.125,0.25,0.375,0.5,0.625,0.75,0.875]; const s=runDisturbanceGridStudy({runs:3,steps:220,analyticsWindow:24,seed:20260306,seedBlocks:6,blockSeedStride:60,intervals:[24],amplitudes:[0.2],phases}).summary; console.log(JSON.stringify({counts:s.pathDependenceGainCi95ClassificationCounts,top:s.pathDependenceGainCi95LowerBoundTopCells.slice(0,3)},null,2));"`

## Stop Conditions
- Stop if one full sweep finishes with `robustPositive=0`; record null-support outcome instead of expanding axes.
- If runtime becomes a blocker, shrink only phase count to `{0,0.125,0.25,0.375}` and keep replication depth fixed.

## Assumptions / Unknowns
- Assumption: normal-approximate CI over block means is acceptable at `seedBlocks=6` for triage decisions.
- Unknown: whether positive path dependence exists in this model region or was previously a low-sample artifact.
