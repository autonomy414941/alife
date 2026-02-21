# Status - 2026-02-21
Current phase: multi-run experiment sweeps with aggregate regime summaries.

What exists now:
- Deterministic TypeScript + Vitest artificial life simulation with resources,
  mutation/speciation, clade/species history, and rolling turnover analytics.
- Single-run telemetry export:
  - `buildRunExport(...)` + `runExportToJson(...)`
  - `metricsToCsv(...)` (one row per tick).
- New experiment sweep engine in `src/experiment.ts`:
  - Executes multiple runs across a seeded sweep (`seed`, `seedStep`).
  - Captures per-run final summary + final turnover snapshot.
  - Aggregates mean/min/max metrics across runs.
- New experiment export support in `src/export.ts`:
  - `experimentExportToJson(...)`
  - `experimentAggregateToCsv(...)` (one aggregate row).
- CLI experiment mode:
  - `--experiment-runs <n>`, `--seed-step <n>`
  - `--export-experiment-json <path>`, `--export-experiment-csv <path>`.
- New tests cover deterministic sweeps, extinction-stop aggregation, and
  aggregate CSV emission.

Verification:
- `npm test` passes (16 tests).
- `npm run build` passes.
- `npm start -- --steps 12 --window 4 --experiment-runs 3 --seed-step 5 --export-experiment-json ... --export-experiment-csv ...` passes.

Next focus:
- Add per-tick cross-run aggregation (mean/variance trajectories by tick) so
  we can compare transient evolutionary dynamics, not only final-state summaries.
