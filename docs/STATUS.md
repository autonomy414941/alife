# Status - 2026-03-07
Current phase: locality-axis confirmation at fixed disturbance schedule (`interval=24`, `amplitude=0.2`, `phase=0.375`, `steps=320`).

What exists now:
- Deterministic simulator + disturbance grid with phase control, seed-block replication, and CI95 decision summaries.
- Fixed-cell horizon sweep helper (`runPathDependenceHorizonSweep`) and prior anti-evidence artifact (`docs/horizon_path_dependence_2026-03-06.json`).
- New locality sweep artifact: `docs/locality_regime_sweep_2026-03-07.json`.

Latest locality-regime result:
- Sweep config: `runs=2`, `seedBlocks=4`, `blockSeedStride=80`, `window=24`, `seed=20260307`.
- Matrix: `radius in {1,3}`, `refugia in {0.2,0.35,0.5}` at fixed `interval=24`, `amplitude=0.2`, `phase=0.375`.
- CI classes: `robustPositive=1/6`, `ambiguous=5/6`, `robustNegative=0/6`.
- Best cell: `radius=1`, `refugia=0.35`, `mean=+0.1739`, `CI95=[+0.0319,+0.3159]`, `relapseEventReduction=+0.4808`.
- All 6 cells kept positive `relapseEventReduction` means (`+0.4038` to `+0.4808`).

Interpretation:
- Locality structure can rescue path dependence in this previously failing disturbance schedule.
- The effect is narrow in the tested matrix; neighboring locality settings stayed CI-ambiguous.

Verification:
- `npm run build` passes.
- `npm test` passes (51 tests).

Next focus:
- Confirm robustness of `radius=1`, `refugia=0.35` with higher `seedBlocks` and nearby locality values.
- Then test whether this locality-mediated gain survives amplitude changes.
