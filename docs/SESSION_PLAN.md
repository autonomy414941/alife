# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75` with `adaptiveCladeHabitatMemoryRate=0` remains the current canonical habitat baseline for founder-support work.
- `newCladeSettlementCrowdingGraceTicks=36` improved the canonical active-clade deficit versus the matched null from `-36.25` to `-23.75` at cladogenesis threshold `1.0`, but it worsened the threshold-`1.0` / `50`-tick persistent-activity comparison by `16.30`.
- `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace is the best current selective mechanism signal: in smoke it improved `activeCladeDeltaVsNullMean` from `-28.5` to `-25.25` while keeping `persistentActivityMeanDeltaVsNullMean` positive.
- `newCladeEncounterRestraintGraceBoost=2` was pruned on 2026-03-14 because its `+1.25` smoke active-clade gain reversed to a mean horizon regression of `-1.75`.
- `cladeInteractionCoupling` stayed negative across its sweep from `0` to `1`, with `persistentActivityMeanDeltaVsNullMean` ranging from `-67.89` to `-162.46`.
- `src/activity.ts` (`2695` lines) and `src/simulation.ts` (`2386` lines) remain oversized, and the relabel-null study surface is still spread across many near-identical wrappers and `package.json` scripts.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder establishment / early competition | 6 | 7f74892 |
| Simulation seam extraction | 2 | aa3baae |
| Habitat helper extraction | 1 | 56c9e6c |
| Test stabilization | 1 | 87a3d46 |

Dominant axis: Founder establishment / early competition (6/10)
Underexplored axes: relabel-null diagnostics, dead-knob reverts, wrapper consolidation, disturbance openings

## Project State
- The repo has repeatable smoke studies, canonical 4000-step horizon validators, review scripts, and tests for matched relabel-null comparisons.
- Recent sessions concentrated on founder establishment and early competition: founder grace survived horizon validation better than older short-stack knobs, and encounter-restraint grace has now been pruned.
- The main gap is still selective coexistence that beats the matched null on concurrent active clades, plus the structural study-surface friction that slows diagnosis and pruning.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can entrench priority effects unless niche differentiation also shifts, which supports testing founder grace with ecology gating rather than adding more unconditional shielding.

## Research Gaps
- Does `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace keep the `-23.75` active-clade horizon gain while reducing the threshold-`1.0` / `50`-tick persistence regression?
- Are founder-grace losses concentrated in young clades or in later crowding, and can that be exposed without widening `src/activity.ts` further?

## Current Anti-Evidence
- The best current canonical founder-support panel still ends below the matched null on active clades (`activeCladeDeltaVsNullMean=-23.75`), so the system still supports fewer concurrent clades than a birth-matched relabeling.
- Recent gains are still fragile: founder grace trades threshold-`1.0` persistence for active-clade improvement, encounter-restraint grace failed at horizon, and the ecology-gate rescue exists only at smoke scale.

## Bet Queue
- [validate] Horizon-validate founder grace plus `cladogenesisEcologyAdvantageThreshold=0.1` on the static habitat baseline
- [split] Extract relabel-null diagnostics and aggregate builders from `src/activity.ts`
- [revert] Retire `cladeInteractionCoupling` from the active experiment surface and package scripts

### Bet 1: [validate] Horizon-Validate Founder Grace With A Cladogenesis Ecology Gate
Run one canonical 4000-step comparison for `cladogenesisEcologyAdvantageThreshold=-1` versus `0.1` on the static habitat + founder-grace baseline. This is the highest-leverage mechanism bet because it directly tests whether founder support can become selective coexistence instead of broader shielding.

#### Success Evidence
- A new horizon artifact or test captures both points with matched birth schedules and shows whether `0.1` improves `activeCladeDeltaVsNullMean` versus the founder-grace `-23.75` baseline and/or recovers threshold-`1.0` persistent activity.

#### Stop Conditions
- Stop after one two-point horizon comparison (`-1`, `0.1`); do not tune multiple ecology thresholds.
- Stop if the comparison requires changing core simulation behavior rather than composing existing knobs.

### Bet 2: [split] Extract Relabel-Null Diagnostics And Aggregate Builders From `src/activity.ts`
Move one coherent relabel-null seam out of `src/activity.ts`, preferably the diagnostics and aggregate builders that every new validation or investigation currently edits. This directly attacks the largest remaining analytics bottleneck without changing study semantics.

#### Success Evidence
- `src/activity.ts` shrinks materially, the extracted seam lives in dedicated helpers or modules, and existing relabel-null tests still pass without output-shape changes.

#### Stop Conditions
- Stop if the split requires new metrics or export-schema changes.
- Stop once one coherent seam is isolated; do not attempt a full `activity.ts` decomposition in one session.

### Bet 3: [revert] Retire `cladeInteractionCoupling` From The Active Experiment Surface
Remove or demote `cladeInteractionCoupling` from the experiment surface used for new coexistence bets. Its sweep stayed negative across every tested value, so keeping it prominent increases actor time spent on a dead axis instead of on founder-selective mechanisms.

#### Success Evidence
- The dead knob is absent from active scripts / docs / tests for future bets or clearly archived behind compatibility coverage, and the remaining build or tests stay green.

#### Stop Conditions
- Stop if removal would invalidate unrelated artifact readers or historical comparisons.
- Stop before deleting archival code that is still needed to interpret past JSON artifacts.

## Assumptions / Unknowns
- Assumption: the founder-grace ecology-gate smoke gain is not just a short-horizon artifact from suppressing noisy founders.
- Unknown: the threshold-`1.0` persistence regression may still come from later-life crowding rather than weak-founder admission.
- Unknown: `cladeInteractionCoupling` may still need archival code even if it should leave the active experiment surface.
