# Status - 2026-03-02
Current phase: controlled disturbance phase-offset experiments and interval×phase mapping.

What exists now:
- Deterministic TypeScript+Vitest simulator with eco-evolutionary dynamics, seasonality, and localized disturbance/refugia.
- Disturbance scheduler now has explicit `disturbancePhaseOffset` control (wrapped to `[0,1)`), with analytics/export visibility.
- Disturbance grid studies now sweep `interval × amplitude × phase` (`phases` axis) with paired seeded global-vs-local comparisons.
- Grid JSON/CSV schemas include per-cell `phase`; run metrics CSV includes `disturbance_phase_offset`.
- CLI supports `--disturbance-phase` and prints disturbance offset in summaries.

Latest sweep (phase-enabled):
- Seeds `20260302..20260305`, `runs=4`, `steps=260`, `window=26`.
- Grid: intervals `{20,24}`, amplitude `{0.2}`, phases `{0,0.25,0.5,0.75}`.
- Result: `supportFraction=1/8`; only (`interval=24`, `phase=0`) was positive (`pathDependenceGain=+0.131`).
- Remaining cells stayed negative (`pathDependenceGain=-0.308..-0.032`).

Interpretation:
- Explicit phase control works and enables direct causal checks of cadence-vs-phase hypotheses.
- Positive path-gain appears phase-selective and narrow in this seed block.
- Local refugia still reduce relapse and lag broadly, but memory gain beyond immediate buffering remains inconsistent.

Verification:
- `npm test` passes (48 tests).
- `npm run build` passes.

Next focus:
- Add interval×phase replication sweeps across multiple seed blocks and report per-cell reproducibility (`positiveFraction` stability across blocks).
