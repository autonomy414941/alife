# Session Plan — 2026-03-06

## Compact Context
- The simulator and experiment stack are deterministic; tests/build are currently green.
- `runDisturbanceGridStudy` already supports `interval×amplitude×phase` with `seedBlocks` replication and CI95 over block means.
- Latest high-rep neighborhood at `interval=24`, `amplitude=0.2`, phases every `0.125` found `robustPositive=0`, `ambiguous=4`, `robustNegative=4`.
- `relapseEventReduction` is consistently positive, but `pathDependenceGain` has not shown CI-robust positivity.
- Best recent candidate (`phase=0.375`) had near-zero mean and CI crossing zero, so it is unresolved, not supported.

## Project State
- Current capabilities are strong for paired global/local comparisons and CI-based accept/reject decisions.
- Recent sessions have concentrated on phase tuning and uncertainty tightening around the same `interval=24` boundary.
- Underdeveloped area: horizon sensitivity is still weakly tested, despite known delayed-disturbance dynamics in this codebase.

## External Context
- Hamedanchi & Hintze, *Non-Spatial Hash Chemistry as a Minimalistic System for Open-Ended Evolution* (2024) reports novelty-growth evidence only under long-running dynamics, cautioning against short-horizon claims: https://arxiv.org/abs/2404.18027
- Gravina et al., *Automating the Search for Artificial Life with Foundation Models* (2024) shows that structured search over parameter space finds regimes humans miss, supporting targeted axis expansion beyond phase-only tuning: https://arxiv.org/abs/2412.17799

## Research Gaps
- At the current best candidate cell (`interval=24`, `amplitude=0.2`, `phase=0.375`), does increasing horizon (`steps`) move `pathDependenceGain` from CI-ambiguous to CI-robust-positive, or does it converge to null/negative?
- If horizon escalation fails, is the boundary signal likely a sampling artifact rather than a delayed-memory effect?

## Current Anti-Evidence
- After denser phase sampling and deeper replication, there is still zero CI-robust-positive cell for `pathDependenceGain`.
- The evidence basis is endpoint disturbance-response deltas, not sustained open-ended innovation trajectories.

## Candidate Bets
- A: Run a fixed-parameter horizon-escalation falsification at the best candidate cell (`steps={220,320,420}`) and compare CI95 lower bounds.
  Why now: It directly tests the strongest remaining alternative explanation (delayed-memory emergence).
  Est. low-context human time: 35m
  Expected information gain: high
  Main risk: Extra runtime with the same no-support conclusion.
- B: Run a small amplitude-shift check at the same interval/phase (`amplitude={0.2,0.35,0.5}`) with fixed replication depth.
  Why now: It tests whether stronger shocks are required for path-dependent gains.
  Est. low-context human time: 45m
  Expected information gain: medium
  Main risk: Confounds amplitude with survivability collapse and reduces interpretability.
- C: Add a minimal horizon-sweep helper in code to automate repeated runs and emit per-horizon CI summaries.
  Why now: It compounds future sessions by removing manual experiment scripting.
  Est. low-context human time: >60m
  Expected information gain: medium
  Main risk: Tooling work may consume the session before generating new evidence.

## Selected Bet
Execute A: perform one bounded horizon-escalation sweep at the current best candidate cell and make a CI-based decision on whether delayed effects rescue the hypothesis. If no horizon produces `CI95 low > 0`, treat this axis as no-support and shift to another mechanism next session.

## Why This Fits The Horizon
- It uses existing experiment code and CI outputs with no schema or API changes.
- Success is fully autonomous: deterministic rerun, machine-checkable CI values, and a binary support/no-support decision.

## Success Evidence
- Artifact: one JSON summary keyed by `steps` with `mean`, `ci95Low`, `ci95High`, and CI classification for `pathDependenceGain`.
- Verification command or output: `npm run build && node -e "const {runDisturbanceGridStudy}=require('./dist/experiment.js'); const steps=[220,320,420]; const out=steps.map(s=>{const r=runDisturbanceGridStudy({runs:3,steps:s,analyticsWindow:24,seed:20260306,seedBlocks:6,blockSeedStride:60,intervals:[24],amplitudes:[0.2],phases:[0.375]}); const u=r.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty; const c=u.ci95Low>0?'robustPositive':(u.ci95High<0?'robustNegative':'ambiguous'); return {steps:s,mean:u.mean,ci95Low:u.ci95Low,ci95High:u.ci95High,classification:c};}); console.log(JSON.stringify(out,null,2));"`

## Stop Conditions
- Stop after evaluating all three horizons once; do not add new axes in the same session.
- If runtime is too high, shrink to `steps={220,360}` and preserve replication depth (`runs=3`, `seedBlocks=6`) for comparability.

## Assumptions / Unknowns
- Assumption: `phase=0.375` is still the most informative single-cell probe for delayed-memory emergence at `interval=24`.
- Unknown: whether longer horizons expose genuine delayed path dependence or simply amplify extinction/turnover noise.
