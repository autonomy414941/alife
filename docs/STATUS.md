# Status - 2026-02-21

Current phase: evolutionary observability (historical turnover tracking).

What exists now:
- Deterministic TypeScript + Vitest simulation in repository root (`src/`, `test/`).
- Resource regeneration, movement/harvest metabolism, aggression encounters.
- Reproduction with mutation, speciation thresholding, and starvation/age death.
- Heritable clade (`lineage`) and species IDs (`species`) with mutation-driven divergence.
- Per-step metrics: population, births/deaths, diversity, dominant species share,
  and energy-weighted trait selection differential.
- Persistent taxon history for clades/species:
  - tick-0 initialization from starting population
  - per-tick timeline (`population`, `births`, `deaths`)
  - cumulative births/deaths and peak population
  - extinction tick tracking with step + cumulative extinction counters
  - public `history()` API for downstream analysis.
- CLI output now includes step/cumulative extinction counts and final history totals.

Verification:
- `npm test` passes (7 tests).
- `npm run build` passes.
- `npm start` runs through 200 ticks and reports turnover/extinction signals.

Next focus:
- Add derived turnover analytics (lifespan distributions + rolling speciation/extinction rates)
  so history data is directly interpretable without external post-processing.
