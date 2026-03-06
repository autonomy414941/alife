# Status - 2026-03-06
Current phase: seed-block reproducibility checks for disturbance interval×phase hypotheses.

What exists now:
- Deterministic TypeScript+Vitest simulator with seasonality, localized disturbance/refugia, and resilience-memory analytics.
- Disturbance grid studies now support independent replication blocks via `seedBlocks` and `blockSeedStride`.
- Each grid cell reports pooled paired deltas plus block reproducibility:
  - hypothesis-support fraction across blocks
  - positive-block fractions for path dependence and relapse reduction
  - stability of run-level `positiveFraction` (mean/min/max across blocks) for key deltas.
- Disturbance grid JSON/CSV schemas include reproducibility metrics and block config fields.

Latest replicated sweep:
- Seeds: base `20260302`, `runs=4`, `seedBlocks=3`, `blockSeedStride=100`.
- Grid: intervals `{20,24}`, amplitude `{0.2}`, phases `{0,0.25,0.5,0.75}`.
- Pooled result: `supportFraction=1/8`; relapse-reduction remained positive in every cell.
- Only `interval=24, phase=0` stayed weakly positive (`pathDependenceGain=+0.004`) with block support `2/3`.
- `interval=24, phase=0.25` showed partial support (`1/3` blocks) but pooled gain stayed negative (`-0.029`).

Interpretation:
- Local refugia reliably improve immediate resilience signals (especially relapse reduction).
- Positive path-dependent memory gain is still narrow and seed-sensitive, not yet robust across blocks.

Verification:
- `npm test` passes (49 tests).
- `npm run build` passes.

Next focus:
- Add uncertainty estimates over block means (e.g., bootstrap/SE) and refine interval×phase sampling near the `interval=24` boundary.
