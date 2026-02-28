# Status - 2026-02-28
Current phase: hypothesis-driven disturbance grid analysis.
What exists now:
- Deterministic TypeScript+Vitest artificial-life simulator with eco-evolutionary dynamics, seasonality, localized disturbance/refugia, and analytics/export tooling.
- New grid-study workflow in `src/experiment.ts`: `runDisturbanceGridStudy(...)`.
- The study runs paired-seed global (`radius=-1`, `refugia=0`) vs local-refugia (`radius=2`, `refugia=0.35`) regimes across interval/amplitude grids and reports per-cell paired deltas:
  - `resilienceStabilityDelta`
  - `memoryStabilityDelta`
  - `relapseEventReduction`
  - `turnoverSpikeReduction`
  - `pathDependenceGain` (`memoryDelta - latestDelta`)
  - `hypothesisSupport`
- New study export support in `src/export.ts`:
  - `disturbanceGridStudyToJson(...)`
  - `disturbanceGridStudyToCsv(...)`
  - `DISTURBANCE_GRID_STUDY_CSV_COLUMNS`
- Deterministic tests now cover study invariants, input validation, and study CSV/JSON serialization.

Latest sweep (paired seeds `20260228..20260231`, `runs=4`, `steps=260`, intervals `{24,40}`, amplitudes `{0.2,0.35,0.5}`):
- Local refugia improved latest-event stability in every cell (`latestDelta` mean range `+0.096..+0.488`).
- Local refugia improved memory stability in every cell (`memoryDelta` mean range `+0.049..+0.263`).
- Local refugia lowered relapse-event fraction in every cell (`relapseReduction` mean range `+0.250..+0.500`).
- Path-dependence gain was negative in every cell (`-0.308..-0.040`), so memory improvements were smaller than immediate-buffer improvements in this region.

Verification:
- `npm test` passes (46 tests).
- `npm run build` passes.

Next focus:
- Explain negative path-dependence gain by adding disturbance-timing diagnostics (seasonal phase/event lag) and testing whether cadence/phase regimes can flip path gain positive.
