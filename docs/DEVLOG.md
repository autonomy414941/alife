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

## 2026-02-23 (session 11)
- Implemented radius-k locality analytics focused on meso-scale patch structure.
- Extended simulation config with `localityRadius` (default `2`) and added new analytics fields:
  - `localityRadius` (state): neighborhood dominant-share mean/std, neighborhood richness,
    center-dominant alignment.
  - `localityRadiusTurnover` (rolling): changed neighborhood-dominant fraction and per-cell
    neighborhood turnover dispersion.
- Updated locality frame generation to compute neighborhood dominant species maps from
  de-duplicated toroidal neighborhoods, keeping behavior deterministic on small wrapped grids.
- Extended CSV export (`src/export.ts`) with new locality-radius columns.
- Updated CLI output (`src/index.ts`) to report patch metrics in single-run and experiment mode.
- Added deterministic tests:
  - neighborhood-scale locality state metrics
  - rolling neighborhood-dominant turnover metrics.
- Ran verification: `npm test`, `npm run build`, single-run CLI smoke, and experiment CLI smoke.

Observed:
- New patch metrics surface different structure than cell-level locality in the same runs
  (example: high cell-level dominance can coexist with lower neighborhood dominance +
  moderate center-alignment), which is the intended meso-scale signal.
- CLI experiment summaries now show directly comparable `locality` vs `patch` aggregates,
  making dispersal/biome effects easier to interpret without external post-processing.

Thinking:
- This session was observability-heavy by design and now gives a clear meso-scale readout.
- Next session should prioritize a behavior/ecology addition that can be evaluated with these
  new patch metrics (e.g., trait-mediated habitat preference or resource specialization).

## 2026-02-23 (session 12)
- Added a new ecology behavior: species-level habitat preference tied to biome fertility.
- Extended `SimulationConfig` in `src/types.ts` with:
  - `habitatPreferenceStrength`
  - `habitatPreferenceMutation`
- Implemented in `src/simulation.ts`:
  - `speciesHabitatPreference` state initialized from each species' occupied fertility.
  - Movement now scores cells by `resource * habitatMatchEfficiency` (not raw resource only).
  - Harvest is scaled by habitat match efficiency.
  - During speciation, child species preference shifts using a deterministic signal from
    child-vs-parent genome mutation (no extra RNG draws, so baseline deterministic trajectories stay stable).
- Added deterministic tests in `test/simulation.test.ts`:
  - foraging penalty when a species is far from its preferred fertility.
  - patch-structure stabilization check comparing `habitatPreferenceStrength=0` vs `4`
    with radius-k metrics.
- Verification run:
  - `npm test` (25 tests)
  - `npm run build`
  - `npm start -- --steps 30 --report-every 10 --window 15 --seed 20260223`
  - seeded sweep via `npx tsx -e ...` for metric deltas.

Observed:
- In an 8-run seeded sweep (`steps=90`, `window=30`), adding strong habitat preference
  (`strength=4`) versus neutral (`0`) shifted patch metrics substantially:
  - patch dominant-turnover mean: `0.2866 -> 0.1652`
  - patch dominant-share mean: `0.7314 -> 0.9253`
  - patch center-dominant alignment mean: `0.7552 -> 0.9688`
- Interpretation: species-level habitat matching creates more stable and coherent meso-scale
  territories under dispersal pressure, not just cell-level noise changes.

Thinking:
- This is the first explicit niche-specialization mechanic; it is simple and already measurable.
- Next behavior step should add a cost side (demography or survival tradeoff) so specialization
  does not trivially ratchet toward locked-in dominance in long runs.

## 2026-02-23 (session 13)
- Added a specialization tradeoff mechanic in `src/simulation.ts`.
- Extended `SimulationConfig` in `src/types.ts` with `specializationMetabolicCost`.
- Implemented per-turn metabolic upkeep penalty proportional to species specialization load:
  `specializationLoad = abs(habitatPreference - 1)` and
  `penalty = specializationMetabolicCost * specializationLoad * metabolism`.
- Set default `specializationMetabolicCost` to `0.08` to keep the effect present but moderate.
- Added deterministic tests in `test/simulation.test.ts`:
  - direct penalty math check for an extreme-preference species
  - multi-seed patch-metric comparison (`seeds 20260223..20260226`) confirming the tradeoff reduces patch dominance and raises patch turnover under strong habitat preference.
- Verified with `npm test` (27 tests) and `npm run build`.
- Ran seeded sweep (`runs=8`, `steps=120`, `window=30`) comparing no-tradeoff vs tradeoff.

Observed:
- With `habitatPreferenceStrength=4`, adding `specializationMetabolicCost=0.08` shifted
  meso-scale structure away from lock-in while preserving species richness:
  - active species mean: `190.50 -> 190.63`
  - patch dominant-share mean: `0.2408 -> 0.2340`
  - patch turnover mean: `0.2376 -> 0.2502`
  - patch center-alignment mean: `0.3721 -> 0.3322`
- Population mean dropped moderately (`979.63 -> 955.63`), indicating a real demographic cost.

Thinking:
- Habitat specialization now has explicit upside and downside, which makes niche outcomes less one-directional.
- Next improvement should add another ecological dimension (trophic or disturbance dynamics)
  so diversity is supported by interacting pressures rather than one tradeoff axis.

## 2026-02-23 (session 14)
- Added a second ecology axis in `src/simulation.ts`: species-level trophic strategy.
- Extended `SimulationConfig` in `src/types.ts` with:
  - `predationPressure`
  - `trophicForagingPenalty`
  - `trophicMutation`
- Implemented trophic mechanics:
  - species trophic level is initialized from genome signal (high aggression + low harvest bias).
  - per-turn abiotic harvest is scaled by trophic foraging efficiency (`1 - penalty * trophicLevel`).
  - encounter stealing now includes a trophic-gap multiplier to represent predation pressure.
  - speciation now propagates trophic tendency using mutation-derived drift.
- Added deterministic tests in `test/simulation.test.ts`:
  - high-trophic species harvest less under equal abiotic resources.
  - predation pressure amplifies predator energy gain in shared-cell encounters.
- Stabilized an existing mechanism test by disabling trophic knobs inside
  `uses specialization upkeep to counter habitat-lock patch dominance`, keeping that test focused.
- Verified with `npm test` (29 tests) and `npm run build`.
- Ran seeded sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`) comparing trophic off vs defaults.

Observed:
- Trophic defaults (`predationPressure=0.35`, `trophicForagingPenalty=0.35`) changed regime metrics versus neutral (`0/0`):
  - active species mean: `193.38 -> 180.88`
  - patch dominant-share mean: `0.1999 -> 0.2129`
  - patch turnover mean: `0.3164 -> 0.2618`
  - mean aggression: `0.8475 -> 0.8550`
- Interpretation: top-down pressure is now materially present; it increases persistence of stronger local dominants and slightly raises aggressive trait prevalence.

Thinking:
- The trophic axis is now real and measurable, but currently asymmetric: pressure increases faster than prey-side counterplay.
- Next session should add prey defense/escape or encounter-risk mitigation tied to heritable traits to create balanced coevolution rather than one-sided dominance.

## 2026-02-23 (session 15)
- Added prey-side anti-predator adaptation in `src/simulation.ts` as a species-level defense axis.
- Extended `SimulationConfig` in `src/types.ts` with:
  - `defenseMitigation`
  - `defenseForagingPenalty`
  - `defenseMutation`
- Implemented defense mechanics:
  - initialized per-species defense level from genome signal (low aggression + higher metabolism).
  - reduced encounter stealing against defended prey (`defenseMitigation`).
  - added defense-linked foraging penalty (`defenseForagingPenalty`) to enforce a tradeoff.
  - propagated defense tendency through speciation via mutation-linked drift (`defenseMutation`).
- Added deterministic tests in `test/simulation.test.ts`:
  - defense mitigation lowers predator transfer in shared-cell encounters.
  - defense foraging tradeoff lowers harvest for high-defense species.
- Updated focused comparison tests to pin defense knobs to `0` when isolating other mechanics.
- Verified with `npm test` (31 tests) and `npm run build`.
- Ran seeded sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`) comparing defense off vs defaults.

Observed:
- Defense defaults (`mitigation=0.45`, `foragingPenalty=0.2`, `mutation=0.16`) shifted regime metrics versus defense-off:
  - active species mean: `180.88 -> 194.25`
  - patch dominant-share mean: `0.2129 -> 0.2500`
  - patch turnover mean: `0.2618 -> 0.2276`
  - mean aggression: `0.8550 -> 0.8288`
- Interpretation: prey defense counter-pressure is materially active and suppresses average aggression, but currently increases patch-level persistence.

Thinking:
- The ecology axis is now less one-sided than pure trophic pressure.
- Next session should rebalance toward measurement by exporting strategy-axis observability (habitat/trophic/defense distributions) to validate whether this regime shift reflects stable coevolution or emergent lock-in.

## 2026-02-23 (session 16)
- Implemented direct strategy-axis observability in `src/simulation.ts` analytics output.
- Extended `EvolutionAnalyticsSnapshot` in `src/types.ts` with a new `strategy` block:
  - `activeSpecies`
  - per-axis stats for habitat preference, trophic level, and defense level:
    `mean`, `stdDev`, `min`, `max`, `weightedMean` (population-weighted).
- Wired strategy metrics into CSV export in `src/export.ts` with stable column additions.
- Updated CLI reporting in `src/index.ts`:
  - single-run progress/final lines now include strategy mean and weighted mean.
  - experiment mode now reports aggregate strategy means and weighted means.
- Added deterministic tests:
  - `test/simulation.test.ts`: exact strategy-axis analytics in a controlled two-species setup.
  - `test/export.test.ts`: strategy CSV column/value alignment.
- Verified with `npm test` (32 tests) and `npm run build`.
- Ran seeded sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`) to capture strategy telemetry.

Observed:
- Strategy metrics now appear directly in runtime analytics/export rather than being inferred from indirect population/patch signals.
- Sweep result with current defaults:
  - strategy mean: `h=1.02, t=0.59, d=0.27`
  - strategy weighted mean: `h=1.01, t=0.61, d=0.25`
- Weighted trophic mean above unweighted mean suggests higher-abundance species are currently somewhat more trophic than the species-average baseline.

Thinking:
- Coevolution claims are now measurable directly from exported time-series.
- Next depth should return to simulation dynamics: add environment forcing (seasonality or disturbance) and test whether strategy distributions track forcing cycles versus collapsing to fixed points.

## 2026-02-23 (session 17)
- Added ecological seasonality forcing to `src/simulation.ts`.
- Extended `SimulationConfig` in `src/types.ts` with:
  - `seasonalCycleLength`
  - `seasonalRegenAmplitude`
  - `seasonalFertilityContrastAmplitude`
- Implemented two forcing channels:
  - regeneration multiplier oscillation (`resourceRegen` scaled by seasonal wave)
  - dynamic fertility-contrast scaling (`effectiveFertility = 1 + (base-1)*contrastMultiplier`)
- Wired forcing observability into analytics with a new `forcing` block:
  - `cycleLength`, `phase`, `wave`, `regenMultiplier`, `fertilityContrastMultiplier`
- Extended per-tick CSV export in `src/export.ts` with forcing columns.
- Extended CLI in `src/index.ts`:
  - new flags `--season-cycle`, `--season-regen-amp`, `--season-contrast-amp`
  - forcing signals printed in single-run and experiment reporting
  - experiment mode now passes forcing config into each run.
- Added deterministic tests:
  - `test/simulation.test.ts`: seasonal regen waveform/resource accumulation + forcing phase checks
  - `test/simulation.test.ts`: fertility-contrast expansion/collapse across a 4-tick cycle
  - `test/export.test.ts`: forcing CSV column/value checks
- Verified with `npm test` (34 tests) and `npm run build`.
- Ran comparison sweeps and CSV analyses for baseline vs seasonal forcing.

Observed:
- Sweep (`runs=8`, `steps=120`, `window=30`, seeds `20260223..20260230`) under seasonal forcing (`cycle=60`, `regenAmp=0.45`, `contrastAmp=0.7`) shifted turnover regime:
  - species net diversification mean: `+0.58 -> -0.07`
  - species extinction rate mean: `1.25 -> 1.99`
  - final active species mean: `194.25 -> 184.25`
- In a 240-step single-seed CSV (`seed=20260223`), forcing increased strategy variability:
  - weighted habitat mean std: `0.0106 -> 0.0179`
  - weighted trophic mean std: `0.0650 -> 0.0740`
- Forcing telemetry behaved as expected:
  - regen multiplier ranged `0.55..1.45`
  - fertility-contrast multiplier ranged `0.30..1.70`.

Thinking:
- Seasonality is now an explicit, measurable ecological driver that can be toggled and swept.
- Next useful depth is punctuated disturbance (rare shocks) plus resilience diagnostics so we can separate periodic adaptation from collapse/recovery dynamics.
