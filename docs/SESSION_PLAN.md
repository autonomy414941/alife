# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75` is still the only canonical 4000-step persistence win, but every canonical habitat-coupled panel still trails the matched null on active clades.
- `adaptiveCladeHabitatMemoryRate=0.2` is not a safe baseline: on the 4000-step horizon it reduced persistent activity by `29.57` versus the static habitat baseline and slightly worsened the active-clade deficit.
- `newCladeSettlementCrowdingGraceTicks=36` improved the canonical static-habitat active-clade delta from `-36.25` to `-23.75`, but it worsened the threshold-`1.0` / `50`-tick persistent delta by `16.30`.
- `newCladeEncounterRestraintGraceBoost=2` gave a smaller short-run lift on the same static habitat + founder-grace stack, moving `activeCladeDeltaVsNullMean` from `-28.5` to `-27.25` while keeping matched birth schedules.
- `cladogenesisEcologyAdvantageThreshold=0.1` remains the best older non-founder short-run active-clade result (`-26.5`), but it sharply reduced persistent activity versus the best short stack.
- `src/simulation.ts` (`2473` lines) and `src/activity.ts` (`2695` lines) remain the main structural bottlenecks, and many relabel-null smoke-study files differ only in constants.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder establishment / early competition | 4 | 956169d |
| Habitat-coupled persistence / memory | 4 | 56c9e6c |
| Disturbance openings | 1 | d2d8fac |
| Repo hygiene | 1 | b831476 |

Dominant axis: Founder establishment / early competition (4/10, tied with habitat-coupled persistence / memory)
Underexplored axes: cladogenesis quality gates, clade-age diagnostics, dead-knob reverts, relabel-null harness refactors

## Project State
- The repo has repeatable smoke studies, horizon validators, tests, and JSON artifacts for matched relabel-null comparisons.
- Recent sessions shifted from disturbance openings and habitat memory into founder grace and newborn-only early-competition relief.
- The main gap is now selective coexistence: founder support can improve horizon active-clade counts, but no canonical run yet improves both persistence and concurrent active clades against the matched null.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can create priority effects unless niche differentiation also shifts, which supports pairing founder grace with a founder-quality filter instead of adding more unconditional shielding.

## Research Gaps
- Does pairing `newCladeSettlementCrowdingGraceTicks=36` with `cladogenesisEcologyAdvantageThreshold=0.1` recover the threshold-`1.0` / `50`-tick persistence loss while keeping the improved active-clade delta on the static habitat baseline?
- Does the short-run `newCladeEncounterRestraintGraceBoost=2` gain survive the canonical 4000-step horizon, or is it another smoke-only founder-support artifact?

## Current Anti-Evidence
- The best current canonical founder-support panel still ends at `activeCladeDeltaVsNullMean=-23.75`, so the system still supports fewer concurrent active clades than a birth-matched relabeled null.
- Recent wins are still tradeoff-shaped: founder grace improves horizon active clades, but it loses the threshold-`1.0` / `50`-tick persistent comparison, and adaptive memory collapsed at horizon.

## Bet Queue
1. [synthesize] Combine founder grace with a cladogenesis ecology gate on the static habitat baseline
2. [validate] Horizon-validate newborn encounter restraint on top of founder grace
3. [split] Extract settlement / founding / early-competition logic from `src/simulation.ts`

### Bet 1: [synthesize] Combine Founder Grace With A Cladogenesis Ecology Gate
Run one bounded relabel-null smoke comparison on `cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0`, and `newCladeSettlementCrowdingGraceTicks=36`, comparing `cladogenesisEcologyAdvantageThreshold=-1` versus `0.1`. The founder-grace horizon result says raw shielding helps active clades but can admit weak founders, so the next high-leverage test is whether a modest founder-quality gate repairs persistence without giving back the active-clade gain.

#### Success Evidence
- A new smoke artifact keeps `birthScheduleMatchedAllSeeds=true`, keeps `persistentActivityMeanDeltaVsNullMean` positive, and improves `activeCladeDeltaVsNullMean` versus the no-gate founder-grace short-run mark of `-28.5`.

#### Stop Conditions
- Stop after one two-point smoke (`-1`, `0.1`); do not tune multiple ecology thresholds.
- Stop if the comparison requires changing core simulation behavior rather than composing existing knobs.

### Bet 2: [validate] Horizon-Validate Newborn Encounter Restraint On Top Of Founder Grace
Add a canonical 4000-step comparison for `newCladeEncounterRestraintGraceBoost=0` versus `2` on the static habitat + founder-grace baseline. This is the newest post-founding competition mechanic, and validating it now is the fastest way to avoid spending more sessions tuning a smoke-only signal.

#### Success Evidence
- A new horizon artifact contains all canonical comparison rows, keeps matched birth schedules, and shows an explicit active-clade delta improvement versus the boost-`0` baseline.

#### Stop Conditions
- Stop after one horizon comparison and its test.
- Stop if the work expands beyond a thin wrapper over the existing horizon-study pattern.

### Bet 3: [split] Extract Settlement / Founding / Early-Competition Logic From `src/simulation.ts`
Move the settlement-context builder, founder-grace lookups, newborn encounter-restraint boost, and new-clade founding seam out of `LifeSimulation` into dedicated helpers while preserving behavior. Current feature bets keep landing in the same simulation region, so splitting that seam is the shortest path to faster iteration on the coexistence axis.

#### Success Evidence
- `src/simulation.ts` shrinks materially, the extracted seam lives outside `LifeSimulation`, and the existing settlement/simulation tests still pass without artifact changes.

#### Stop Conditions
- Stop if disturbance or analytics code needs to move too.
- Stop if behavior changes are required to make the split compile; this bet is refactor-only.

## Assumptions / Unknowns
- Assumption: the founder-grace horizon tradeoff is caused by low-quality founder retention rather than unrelated habitat-coupling drift.
- Unknown: `cladeInteractionCoupling` may be genuinely dead or merely baseline-dependent; the only current evidence is a uniformly negative sweep on the older uncoupled stack.
