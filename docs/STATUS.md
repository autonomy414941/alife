# Status - 2026-03-06
Current phase: CI-based accept/reject closure for the `interval=24` phase neighborhood.

What exists now:
- Deterministic simulator + disturbance grid with phase control and seed-block replication.
- Per-cell reproducibility includes block-mean uncertainty (`mean`, `SE`, `CI95`) for key paired deltas.
- Study summary includes CI classification/ranking plus explicit decision fields:
  - `pathDependenceGainCi95ClassificationCounts`
  - `pathDependenceGainCi95RobustPositiveFraction`
  - `pathDependenceGainCi95Decision`
  - `pathDependenceGainCi95LowerBoundTopCells`

Latest high-rep phase-neighborhood check:
- Sweep: `seed=20260306`, `runs=3`, `seedBlocks=6`, `blockSeedStride=60`, `steps=220`, `window=24`.
- Grid: `interval=24`, `amplitude=0.2`, phases `{0,0.125,0.25,0.375,0.5,0.625,0.75,0.875}`.
- CI classes: `robustPositive=0`, `ambiguous=4`, `robustNegative=4`.
- Decision: `pathDependenceGainCi95Decision=noSupport` (`robustPositiveFraction=0`).
- Best CI-lower-bound cell was `phase=0.375` (`mean=+0.006`, `CI95=[-0.072,+0.085]`), still ambiguous.

Interpretation:
- No robust-positive path-dependence signal remained after deeper replication.
- The prior `interval=24` boundary hypothesis is currently unsupported at tested depth/horizon.

Verification:
- `npm test` passes (49 tests).
- `npm run build` passes.

Next focus:
- Shift from phase-only tuning to hypothesis revision: test whether longer horizons or different disturbance amplitude/locality regimes can produce robust-positive path dependence.
