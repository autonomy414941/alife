# Status - 2026-02-21

Current phase: turnover analytics (interpretable evolution signals).

What exists now:
- Deterministic TypeScript + Vitest artificial life simulation with resources,
  movement/harvest metabolism, aggression encounters, mutation, speciation, and death.
- Persistent clade/species lifecycle history with per-tick timelines,
  cumulative births/deaths, peak population, and extinction tick tracking.
- New derived analytics API: `LifeSimulation.analytics(windowSize)`.
  - Rolling species speciation/extinction/turnover/net-diversification rates.
  - Rolling clade origination/extinction/turnover/net-diversification rates.
  - Extinct lifespan summaries (count/mean/max) and active-age summaries.
- CLI reporting now includes rolling turnover rates during the run and
  final lifespan summary metrics.

Verification:
- `npm test` passes (9 tests).
- `npm run build` passes.
- `npm start` runs through 200 ticks and reports turnover analytics.

Next focus:
- Add a built-in run export (JSON/CSV) for full time-series metrics so turnover,
  diversity, and selection trends can be plotted without custom scripting.
