# Status - 2026-03-06
Current phase: block-level uncertainty instrumentation for disturbance interval×phase reproducibility.

What exists now:
- Deterministic TypeScript+Vitest simulator with seasonality, localized disturbance/refugia, and resilience-memory analytics.
- Disturbance grid studies support independent replication blocks via `seedBlocks` and `blockSeedStride`.
- Reproducibility now includes block-mean uncertainty estimates (mean, SE, 95% CI) for:
  - `pathDependenceGain`
  - `memoryStabilityDelta`
  - `relapseEventReduction`
- Disturbance grid JSON/CSV schemas include the new uncertainty fields.
- Deterministic tests cover single-block collapse behavior (`SE=0`, `CI=mean`), multi-block invariants, and CSV mapping.

Latest uncertainty check:
- Sweep: `seed=20260302`, `runs=2`, `seedBlocks=3`, `blockSeedStride=40`.
- Grid: intervals `{20,24}`, amplitude `{0.2}`, phases `{0,0.25}`.
- Path-dependence block-mean CI was strictly negative in 3/4 cells.
- `interval=24, phase=0.25` stayed ambiguous (`mean=-0.077`, `CI=[-0.210,+0.057]`).

Interpretation:
- Uncertainty fields now separate robust negatives from near-zero boundary cells.
- Weak pooled effects should not be treated as support unless CI lower bounds clear zero.

Verification:
- `npm test` passes (49 tests).
- `npm run build` passes.

Next focus:
- Run a denser phase sweep near `interval=24` and rank cells by `pathDependenceGain` CI lower bound.
