# Status - 2026-03-06
Current phase: horizon-escalation falsification at `interval=24`, `amplitude=0.2`, `phase=0.375`.

What exists now:
- Deterministic simulator + disturbance grid with phase control, seed-block replication, and CI95 decision summaries.
- New helper `runPathDependenceHorizonSweep(...)` for fixed-cell horizon sweeps over `steps[]`.
- Session artifact: `docs/horizon_path_dependence_2026-03-06.json`.

Latest horizon-escalation result:
- Sweep: `runs=3`, `seedBlocks=6`, `blockSeedStride=60`, `window=24`, `seed=20260306`.
- `steps=220`: `mean=+0.0063`, `CI95=[-0.0722,+0.0849]`, `classification=ambiguous`.
- `steps=320`: `mean=-0.1314`, `CI95=[-0.1861,-0.0767]`, `classification=robustNegative`.
- `steps=420`: `mean=-0.1751`, `CI95=[-0.2175,-0.1327]`, `classification=robustNegative`.

Interpretation:
- Longer horizons did not rescue the candidate cell; increasing horizon strengthened negative path-dependence evidence.
- The delayed-memory rescue hypothesis for this boundary cell is falsified at tested depth.

Verification:
- `npm test` passes (51 tests).
- `npm run build` passes.

Next focus:
- Stop phase/horizon retesting of this boundary cell.
- Shift to a new mechanism axis (locality radius/refugia or amplitude regime) and seek any cell with `pathDependenceGain CI95 low > 0`.
