# Status - 2026-03-06
Current phase: CI-aware decision logic for disturbance interval×phase reproducibility.

What exists now:
- Deterministic TypeScript+Vitest simulator with disturbance phase control and seed-block replication (`seedBlocks`, `blockSeedStride`).
- Disturbance-grid reproducibility tracks block-mean uncertainty (`mean`, `SE`, `CI95`) for `pathDependenceGain`, `memoryStabilityDelta`, and `relapseEventReduction`.
- Disturbance-grid summary now includes CI-aware decision outputs for `pathDependenceGain`:
  - `pathDependenceGainCi95ClassificationCounts` (`robustPositive`, `ambiguous`, `robustNegative`)
  - `pathDependenceGainCi95LowerBoundTopCells` (deterministic top-5 ranking by CI95 lower bound)
- Deterministic tests now lock CI classification/ranking behavior and JSON export mapping.

Latest CI-ranked check:
- Sweep: `seed=20260302`, `runs=2`, `seedBlocks=3`, `blockSeedStride=40`, `steps=180`, `window=24`.
- Grid: intervals `{20,24}`, amplitude `{0.2}`, phases `{0,0.25}`.
- CI classes: `robustPositive=0`, `ambiguous=3`, `robustNegative=1`.
- Best CI-lower-bound cell was `interval=20, phase=0.25` (`CI95 low=-0.082`), still ambiguous.
- Pooled mean support was `2/4`, but CI support (`CI95 low > 0`) was `0/4`.

Interpretation:
- Mean-sign support can overstate evidence at low block counts.
- CI-lower-bound ranking gives a stable shortlist while separating robust negatives from boundary cells.

Verification:
- `npm test` passes (49 tests).
- `npm run build` passes.

Next focus:
- Increase `seedBlocks` and phase density near `interval=24` and check whether any cell reaches `pathDependenceGain CI95 low > 0`.
