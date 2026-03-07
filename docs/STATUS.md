# Status - 2026-03-07
Current phase: replication-depth check of the locality candidate at fixed disturbance schedule (`interval=24`, `amplitude=0.2`, `phase=0.375`, `steps=320`).

What exists now:
- Deterministic disturbance studies with seed-block CI95 reproducibility summaries and horizon sweep tooling.
- Locality artifacts:
  - coarse matrix: `docs/locality_regime_sweep_2026-03-07.json`
  - candidate neighborhood replication: `docs/locality_candidate_neighborhood_2026-03-07.json`

Latest candidate-neighborhood result:
- Sweep config: `runs=2`, `seedBlocks=8`, `blockSeedStride=80`, `window=24`, `seed=20260307`.
- Cells: `radius=1`, `refugia in {0.30,0.35,0.40}`.
- CI classes: `robustPositive=0/3`, `ambiguous=3/3`, `robustNegative=0/3`.
- All three cells were numerically identical:
  - `pathDependenceGain mean=+0.0875`, `CI95=[-0.0148,+0.1898]`
  - `relapseEventReduction mean=+0.5144`

Interpretation:
- The prior robust-positive claim at `radius=1`, `refugia=0.35` (from lower replication depth) did not hold under this higher-depth check.
- This neighborhood did not probe true continuity: with `radius=1`, targeted area is 5 cells and `floor(5*(1-refugia))=3` for all `{0.30,0.35,0.40}`, producing the same effective disturbance pattern.

Verification:
- `npm run build` passes.
- `npm test` passes (51 tests).

Next focus:
- Add/evaluate locality neighborhoods that cross affected-cell thresholds (or use a larger disturbance radius) so refugia sweeps test distinct effective regimes.
- Re-test for CI-robust-positive support before amplitude-transfer experiments.
