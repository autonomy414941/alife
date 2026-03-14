# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75` is still the only canonical 4000-step persistence win, but every canonical habitat-coupled panel still trails the matched null on active clades.
- `adaptiveCladeHabitatMemoryRate=0.2` is not a safe baseline: on the 4000-step horizon it reduced persistent activity by `29.57` versus the static habitat baseline and slightly worsened the active-clade deficit.
- `newCladeSettlementCrowdingGraceTicks=36` improved the canonical static-habitat active-clade delta from `-36.25` to `-23.75`, but it worsened the threshold-`1.0` / `50`-tick persistent delta by `16.30`.
- `docs/clade_activity_relabel_null_new_clade_encounter_restraint_review_2026-03-14.json` now prunes `newCladeEncounterRestraintGraceBoost=2` from future canonical stacks: the short smoke gain (`+1.25` active clades versus founder grace) reversed to a mean horizon regression of `-1.75`, with threshold `1.0` actual active clades rising by `4` while the matched null rose by `8.25`.
- `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace improved the short-run active-clade delta from `-28.5` to `-25.25` while keeping `persistentActivityMeanDeltaVsNullMean` positive, making it the current best selective-coexistence smoke signal on the founder-grace stack.
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
- Recent sessions validated founder grace on the canonical horizon, and the encounter-restraint review now points more toward founder-quality gating than additional unconditional shielding.
- The main gap is still selective coexistence: founder support can improve horizon active-clade counts, but no canonical run yet shows a founder-selective mechanism that beats the `-23.75` active-clade mark while also preserving persistence.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can create priority effects unless niche differentiation also shifts, which supports pairing founder grace with a founder-quality filter instead of adding more unconditional shielding.

## Research Gaps
- Does pairing `newCladeSettlementCrowdingGraceTicks=36` with `cladogenesisEcologyAdvantageThreshold=0.1` recover the threshold-`1.0` / `50`-tick persistence loss while keeping the improved active-clade delta on the canonical 4000-step horizon?
- Do clade-age-bucket diagnostics show whether the founder-grace threshold-`1.0` persistence loss is concentrated in rapidly churning young clades or in later crowding among established clades?

## Current Anti-Evidence
- The best current canonical founder-support panel still ends at `activeCladeDeltaVsNullMean=-23.75`, so the system still supports fewer concurrent active clades than a birth-matched relabeled null.
- Recent wins are still tradeoff-shaped: founder grace improves horizon active clades but loses the threshold-`1.0` / `50`-tick persistent comparison, and the encounter-restraint review showed a larger threshold-`1.0` regression (`-4.25`) than threshold-`1.2` rescue (`+0.75`).
- The founder-grace ecology-gate result is still smoke-only, so the most selective short-run signal has not yet survived horizon validation.

## Bet Queue
1. [validate] Horizon-validate founder grace plus a cladogenesis ecology gate
2. [split] Continue extracting settlement / founding / early-competition logic from `src/simulation.ts`
3. [investigate] Add clade-age-bucket diagnostics to relabel-null studies on the habitat baseline

### Bet 1: [validate] Horizon-Validate Founder Grace With A Cladogenesis Ecology Gate
Add a canonical 4000-step comparison for `cladogenesisEcologyAdvantageThreshold=-1` versus `0.1` on the static habitat + founder-grace baseline. The smoke result improved `activeCladeDeltaVsNullMean` from `-28.5` to `-25.25` while staying positive on persistence, so the next high-leverage question is whether founder selectivity survives the full horizon where unconditional shielding traded away persistence.

#### Success Evidence
- A new horizon artifact contains all canonical comparison rows, keeps matched birth schedules, and either improves `activeCladeDeltaVsNullMean` versus the founder-grace `-23.75` baseline or materially reduces the threshold-`1.0` / `50`-tick persistence loss that founder grace introduced.

#### Stop Conditions
- Stop after one two-point horizon comparison (`-1`, `0.1`); do not tune multiple ecology thresholds.
- Stop if the comparison requires changing core simulation behavior rather than composing existing knobs.

### Bet 2: [split] Continue Extracting Settlement / Founding / Early-Competition Logic From `src/simulation.ts`
Move the remaining settlement scoring, founder-grace lookups, newborn encounter-restraint boost, and new-clade founding seam out of `LifeSimulation` into dedicated helpers while preserving behavior. Recent coexistence bets still edit the same simulation region, so finishing that seam is the shortest path to faster iteration on the founder-selective axis.

#### Success Evidence
- `src/simulation.ts` shrinks materially again, the extracted seam lives outside `LifeSimulation`, and the existing settlement/simulation tests still pass without artifact changes.

#### Stop Conditions
- Stop if disturbance or analytics code needs to move too.
- Stop if behavior changes are required to make the split compile; this bet is refactor-only.

### Bet 3: [investigate] Add Clade-Age-Bucket Diagnostics To The Founder-Grace Habitat Baseline
Extend the relabel-null diagnostics with a coarse age-bucket split so the next horizon comparisons can tell whether the founder-grace threshold-`1.0` persistence loss comes from young clades failing immediately after establishment or from older clades collapsing later under crowding.

#### Success Evidence
- One bounded diagnostic lands on the existing founder-grace habitat baseline, and at least one comparison or test shows the new age buckets separate early versus late clade loss without changing simulation behavior.

#### Stop Conditions
- Stop if the diagnostic requires reworking the matched-null study shape across unrelated artifacts.
- Stop if the buckets cannot be added without changing simulation outcomes.

## Assumptions / Unknowns
- Assumption: the founder-grace horizon tradeoff is caused by low-quality founder retention rather than unrelated habitat-coupling drift.
- Unknown: the founder-grace ecology gate may still collapse at horizon if short-run improvement was mostly suppressing noisy weak clades rather than stabilizing durable coexistence.
- Unknown: the founder-grace threshold-`1.0` persistence loss may be concentrated in young clades, but the current diagnostics only expose aggregate loss modes.
