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
