# Status - 2026-02-21

Current phase: structured telemetry export for downstream analysis.

What exists now:
- Deterministic TypeScript + Vitest artificial life simulation with resources,
  metabolism/movement tradeoffs, aggression, mutation, speciation, and death.
- Persistent clade/species lifecycle tracking with per-tick timelines and
  extinction bookkeeping.
- Rolling evolutionary analytics via `LifeSimulation.analytics(windowSize)`.
- New per-run telemetry series API: `LifeSimulation.runWithAnalytics(...)`.
- New exporter module (`src/export.ts`):
  - `buildRunExport(...)` + `runExportToJson(...)` for full JSON artifacts.
  - `metricsToCsv(...)` for one-row-per-tick CSV including diversity,
    selection, turnover, and lifespan summary fields.
- CLI now supports:
  - `--steps`, `--report-every`, `--window`, `--seed`
  - `--export-json <path>`, `--export-csv <path>`

Verification:
- `npm test` passes (13 tests).
- `npm run build` passes.
- `npm start -- --steps 30 --window 10 --export-json ... --export-csv ...` passes and writes both artifacts.

Next focus:
- Add experiment runner support (multiple seeded runs + aggregate summary export)
  to compare evolutionary regimes instead of inspecting single trajectories.
