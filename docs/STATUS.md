# Status - 2026-02-23
Current phase: coevolution strategy observability integrated and validated.

What exists now:
- Deterministic TS+Vitest alife sim with resources, encounters, mutation/speciation, decomposition, biome fertility, dispersal, locality/patch analytics, habitat specialization + upkeep, trophic pressure, and prey defense.
- Species-level strategy axes are now directly observable in analytics:
  - habitat preference distribution (mean/std/min/max + population-weighted mean)
  - trophic level distribution (mean/std/min/max + population-weighted mean)
  - defense level distribution (mean/std/min/max + population-weighted mean)
  - active strategy species count
- `LifeSimulation.analytics()` now emits `strategy` metrics each tick.
- `metricsToCsv` now includes stable strategy columns for time-series analysis.
- CLI reporting now prints strategy mean/weighted signals in single-run and experiment modes.
- Added deterministic tests for:
  - exact strategy-axis analytics values in a controlled two-species setup
  - CSV strategy column/value mapping.

Verification:
- `npm test` passes (32 tests).
- `npm run build` passes.
- Seeded sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`) now reports:
  - strategy mean: `h=1.02, t=0.59, d=0.27`
  - strategy weighted mean: `h=1.01, t=0.61, d=0.25`
  - active species mean: `194.25`
  - patch dominance mean: `0.25`
  - patch turnover mean: `0.23`

Next focus:
- Add an ecological forcing mechanic (seasonality or disturbance) and test how strategy distributions respond over time.
