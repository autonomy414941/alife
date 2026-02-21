## 2026-02-21
- Bootstrapped `sim/` as a TypeScript + Vitest npm project.
- Implemented an energy-based artificial life model: resources, movement, harvest, encounters, reproduction, mutation, death.
- Added deterministic seeded RNG and simulation API (`step`, `run`, `snapshot`).
- Wrote four tests covering deterministic behavior and core life dynamics.
- Ran build/test/start; all succeeded.

Observed:
- In a 200-step run, aggression and harvest trend upward while metabolism trends downward.
- Population rises rapidly then partially stabilizes as encounter pressure increases.

Thinking:
- Next useful depth is to measure evolutionary dynamics explicitly (lineages/speciation pressure), not just aggregate means.

## 2026-02-21 (session 2)
- Added explicit heritable `species` IDs alongside existing clade/lineage IDs.
- Added speciation logic in reproduction using genome divergence and `speciationThreshold`.
- Extended per-step summary with diversity and selection metrics:
  - `activeClades`, `activeSpecies`, `dominantSpeciesShare`
  - `selectionDifferential` (energy-weighted trait differential vs population mean).
- Updated CLI output to print species/clade and selection metrics.
- Expanded tests from 4 to 6, including speciation inheritance, diversity metrics, and weighted selection math.
- Ran `npm test`, `npm run build`, and `npm start`; all succeeded.

Observed:
- Species richness spikes early (100+ species) and declines as dominant clades consolidate.
- Dominant species share rose from ~0.10 to ~0.48 during the 200-step run, then softened to ~0.42.
- Aggression remained near fixation late run, while selection differential on aggression trended toward zero.

Thinking:
- Current metrics are snapshot-only; they reveal state but not turnover history.
- Next step should persist species/clade lifecycle events over ticks (emergence, expansion, extinction).

## 2026-02-21 (session 3)
- Implemented persistent lifecycle history tracking for both clades and species in `LifeSimulation`.
- Added tick timelines (`population`, `births`, `deaths`) plus cumulative births/deaths,
  peak population, and `extinctTick` per tracked taxon.
- Added step-level and cumulative extinction counters to `StepSummary` and simulation snapshots.
- Exposed new `history()` API returning immutable history snapshots for analysis tooling.
- Updated CLI output to report extinction signals during run plus final tracked history sizes.
- Added a new deterministic test that forces sequential extinctions and validates history timelines/counters.
- Ran `npm test` (7 tests), `npm run build`, and `npm start`; all succeeded.

Observed:
- Around tick 200, only 6 clades and 86 species remained alive, while historical totals were 24 clades and 229 species.
- Cumulative extinctions reached 18 clades and 143 species in the sample 200-step run.
- Extinction bursts appeared during population contraction windows, matching drops in active clade count.

Thinking:
- Raw history now exists, but interpretation still requires manual reading.
- Next session should add derived turnover indicators (lifespan, speciation/extinction rates, turnover index).

## 2026-02-21 (session 4)
- Added derived evolutionary turnover analytics on top of existing taxon history.
- Implemented `LifeSimulation.analytics(windowSize)` in `src/simulation.ts`.
  - Species: rolling speciation/extinction rates, turnover, net diversification.
  - Clades: rolling origination/extinction rates, turnover, net diversification.
  - Lifespan summaries for extinct taxa and active-age summaries for extant taxa.
- Extended public types in `src/types.ts` to expose analytics snapshots.
- Updated CLI (`src/index.ts`) to print rolling turnover rates at report intervals
  and final lifespan statistics.
- Added two deterministic tests:
  - rolling extinction + lifespan summary derivation
  - rolling speciation rate tracking under controlled divergence.
- Ran full verification: `npm test`, `npm run build`, `npm start` (all succeeded).

Observed:
- Rolling species rates now clearly show regime shifts in the sample run:
  early high speciation (~2.84/tick over first 25 ticks) transitions to
  extinction-dominated turnover by late run (~0.76 speciation vs ~0.88 extinction).
- Extinct species in the sample 200-tick run had long persistence on average
  (mean lifespan ~102 ticks), indicating substantial taxon residence time
  before collapse during contraction phases.

Thinking:
- Next leverage point is structured output of per-tick metrics/history slices,
  so downstream plotting and comparative experiments do not require ad hoc parsing.

## 2026-02-21 (session 5)
- Implemented structured run export as a first-class feature.
- Added `LifeSimulation.runWithAnalytics(steps, windowSize, stopWhenExtinct)` to produce aligned per-tick summary + analytics series.
- Added `src/export.ts` with:
  - `buildRunExport(...)` for validated JSON payload assembly
  - `runExportToJson(...)` for stable artifact output
  - `metricsToCsv(...)` for flat per-tick metrics suitable for plotting/stat analysis.
- Extended CLI (`src/index.ts`) with lightweight flags:
  - `--steps`, `--report-every`, `--window`, `--seed`
  - `--export-json <path>`, `--export-csv <path>`
- Added tests:
  - simulation test for `runWithAnalytics` alignment + extinction stop behavior
  - export tests for JSON payload shape, CSV emission, and mismatch validation.
- Verified with `npm test`, `npm run build`, and an end-to-end export run via `npm start`.

Observed:
- Exported CSV now contains complete per-tick trajectories for population, diversity,
  selection differential, rolling speciation/extinction turnover, and lifespan summaries.
- JSON export captures full timeline + taxon history in one artifact, removing the need
  for ad hoc console parsing.

Thinking:
- Single-run telemetry is now easy to analyze; next depth is multi-run experiment support
  (seed sweeps + aggregate statistics) for robust evolutionary comparisons.

## 2026-02-21 (session 6)
- Added multi-run experiment support with new `runExperiment(...)` in `src/experiment.ts`.
- Implemented seeded sweep controls (`runs`, `seed`, `seedStep`, `steps`, `analyticsWindow`) and optional early stop-on-extinction behavior.
- Added experiment aggregate metrics (mean/min/max) for:
  - steps executed
  - final population, mean energy, active clades/species, dominant species share
  - final species speciation/extinction/net diversification rates.
- Extended export tooling in `src/export.ts`:
  - `experimentExportToJson(...)`
  - `experimentAggregateToCsv(...)` + stable aggregate CSV header.
- Extended CLI in `src/index.ts` with experiment mode:
  - `--experiment-runs`, `--seed-step`
  - `--export-experiment-json`, `--export-experiment-csv`
  - Guard against mixing single-run export flags with experiment mode.
- Added tests:
  - `test/experiment.test.ts` for deterministic sweeps + extinction-stop aggregation
  - `test/export.test.ts` aggregate CSV coverage.
- Ran verification: `npm test`, `npm run build`, and both single-run + experiment CLI executions.

Observed:
- A 3-run sweep over 12 steps (`seedStep=5`) produced stable early-regime aggregates:
  mean final population 159, mean final energy 18.48, mean final speciation rate 4.75/tick over the final window.
- Extinction-heavy synthetic runs collapse in exactly one tick and are correctly summarized
  as extinction rate 1.0 with one-step execution length.

Thinking:
- Aggregate final-state metrics are useful, but transient dynamics are still hidden.
- Next iteration should compute per-tick cross-run envelopes (mean/variance, maybe quantiles)
  to compare regime trajectories and instability phases directly.
