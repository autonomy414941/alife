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

## 2026-02-21 (session 7)
- Added a new ecological nutrient-cycle mechanic in `src/simulation.ts`.
- Extended `SimulationConfig` with:
  - `decompositionBase`
  - `decompositionEnergyFraction`
- Implemented end-of-tick biomass recycling: each dead agent now contributes
  local resources (`base + positive_energy * fraction`), clamped by `maxResource`.
- Added deterministic test coverage in `test/simulation.test.ts` proving a survivor
  gains energy on tick N+1 by harvesting nutrients produced by a death on tick N.
- Ran verification: `npm test` (17 tests), `npm run build`, and CLI smoke run.

Observed:
- In the controlled 1x1 test world, one starvation death produced a measurable
  next-tick energy rebound for the surviving agent, confirming cross-tick nutrient carryover.
- Existing deterministic and export/experiment tests remained stable, so the mechanic
  integrated without breaking telemetry or sweep workflows.

Thinking:
- The simulation now has a simple matter loop (death -> resource -> harvest), which adds
  local ecological memory and can buffer starvation cascades.
- Next useful depth is spatial heterogeneity so recycled nutrients interact with persistent
  niches instead of a mostly homogeneous substrate.

## 2026-02-22 (session 8)
- Implemented persistent spatial heterogeneity via biome fertility in `src/simulation.ts`.
- Extended `SimulationConfig` (`src/types.ts`) with:
  - `biomeBands`
  - `biomeContrast`
- Added deterministic per-cell fertility map construction and applied it to:
  - resource regeneration (`resourceRegen * fertility`)
  - dead-agent nutrient recycling (`decomposition * fertility`)
- Added two read accessors for instrumentation/tests:
  - `getResource(x, y)`
  - `getBiomeFertility(x, y)`
- Added deterministic tests in `test/simulation.test.ts`:
  - per-cell regeneration reflects fertility heterogeneity
  - decomposition yield scales with local fertility.
- Ran verification: `npm test` (19 tests), `npm run build`, and seeded experiment run.

Observed:
- Experiment sweep (`runs=8`, `steps=120`, seeds `20260222..20260271`) with biomes enabled:
  - extinction rate: 0.00
  - final population mean: 859.25
  - final active species mean: 174.13
  - final species speciation/extinction rates: 1.63 / 1.57
- Direct comparison using identical seeds against uniform resources (`biomeContrast=0`):
  - mean dominant species share increased from 0.175 -> 0.221 with biomes
  - mean speciation rate increased from 1.08 -> 1.63
  - mean extinction rate increased slightly from 1.49 -> 1.57

Thinking:
- Biomes are now creating stronger local selective gradients and faster taxon churn,
  but we still quantify dynamics globally.
- Next step should add explicit spatial-locality analytics so we can distinguish
  true patch-structure from global turbulence.

## 2026-02-22 (session 9)
- Added spatial-locality analytics to `LifeSimulation.analytics(...)`.
  - New `locality`: occupied-cell fraction, mean dominant-species share, dominance dispersion,
    and mean local species richness.
  - New `localityTurnover`: rolling dominant-cell change fraction and per-cell turnover dispersion.
- Implemented internal per-tick locality frame tracking (tick 0 baseline + each step) so
  rolling locality turnover is deterministic and directly windowed.
- Extended `src/types.ts` and `src/export.ts` so locality metrics are part of all analytics
  payloads and per-tick CSV exports.
- Updated CLI output (`src/index.ts`) to show locality signals in single-run logs and
  experiment aggregates.
- Added deterministic tests in `test/simulation.test.ts` for:
  - static per-cell dominance/richness metrics
  - rolling dominant-species turnover dispersion.
- Verified with `npm test` (21 tests), `npm run build`, and CLI smoke runs.

Observed:
- Paired sweep (`runs=8`, `steps=120`, seeds `20260222..20260271`, window=30) shows
  stronger locality structuring with biomes vs uniform fertility:
  - local dominance mean: 0.640 -> 0.688 (+0.047)
  - local dominance std-dev: 0.276 -> 0.302 (+0.026)
  - per-cell turnover-dispersion std-dev: 0.092 -> 0.118 (+0.026)
  - occupied-cell fraction: 0.9997 -> 0.9334 (-0.0663)
- Interpretation: biome heterogeneity is not only increasing global turnover/speciation;
  it is also increasing spatial concentration and unevenness of local regime changes.

Thinking:
- Current locality metrics are cell-granular and can be noisy when occupancy is sparse.
- Next step should add neighborhood-scale (radius-k) locality summaries to test whether
  niche boundaries remain stable when measured above single-cell resolution.

## 2026-02-22 (session 10)
- Added neighborhood-aware dispersal pressure to movement in `src/simulation.ts`.
- Extended `SimulationConfig` in `src/types.ts` with:
  - `dispersalPressure`
  - `dispersalRadius`
- Introduced a per-step occupancy grid and updated movement flow so occupancy is adjusted immediately when agents move or die during their turn.
- Updated destination scoring to include weighted neighborhood crowding (Manhattan radius-k with distance decay), creating explicit local dispersal pressure instead of food-only movement.
- Added deterministic test coverage in `test/simulation.test.ts` that compares identical seeds with and without dispersal pressure and verifies increased short-horizon spatial spread.
- Verified with `npm test` (22 tests), `npm run build`, and CLI smoke runs.

Observed:
- Single-run and experiment CLI paths remain stable after the mechanic change.
- Paired sweep (`runs=8`, `steps=120`, seeds `20260222..20260271`) comparing `dispersalPressure=0` to default `0.8`:
  - occupied-cell fraction: 0.9334 -> 0.9094 (-0.0241)
  - mean local dominant-species share: 0.6875 -> 0.6317 (-0.0558)
  - mean dominant-cell turnover fraction: 0.7839 -> 0.7099 (-0.0740)
- Interpretation: dispersal pressure reduced dominant-species lock-in and lowered cell-to-cell regime churn over this window, while slightly concentrating occupancy.

Thinking:
- The new mechanic now gives neighborhood density a direct causal role in movement, not just a measured consequence.
- Next step should be radius-k locality analytics so we can tell whether the lower turnover reflects smoother patch boundaries or larger coherent territories.
