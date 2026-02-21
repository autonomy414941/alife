# Status - 2026-02-21
Current phase: ecology expansion after telemetry baseline.

What exists now:
- Deterministic TypeScript + Vitest artificial life simulation with resources,
  movement, encounters, mutation/speciation, and taxon history/turnover analytics.
- Single-run export (`runExportToJson`, `metricsToCsv`) plus seeded multi-run
  experiment sweeps (`runExperiment`, aggregate CSV/JSON export).
- New nutrient-cycle mechanic in `src/simulation.ts`:
  - `decompositionBase` + `decompositionEnergyFraction` in `SimulationConfig`.
  - Dead agents now recycle biomass into local cell resources at end-of-tick.
  - Recycling is capped by `maxResource`, creating localized post-mortem pulses.
- New deterministic test confirms survivors can harvest recycled nutrients on
  the following tick.

Verification:
- `npm test` passes (17 tests).
- `npm run build` passes.
- `npm start -- --steps 20 --report-every 10 --seed 123` passes.

Next focus:
- Add spatial heterogeneity (resource biomes or seasonal regen waves) and
  measure whether clade/species turnover becomes patch-structured.
