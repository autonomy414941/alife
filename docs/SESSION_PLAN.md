# Session Plan — 2026-03-14

## Compact Context
- `cladeHabitatCoupling=0.75`, `adaptiveCladeHabitatMemoryRate=0`, and `newCladeSettlementCrowdingGraceTicks=36` remain the current founder-support baseline.
- On the canonical 4000-step panel, founder grace improved `activeCladeDeltaVsNullMean` at cladogenesis threshold `1.0` from `-36.25` to `-23.75`, but it did not dominate persistence across thresholds.
- The best selective follow-up signal is still smoke-only: raising `cladogenesisEcologyAdvantageThreshold` from `-1` to `0.1` moved `activeCladeDeltaVsNullMean` from `-28.5` to `-25.25` while keeping `persistentActivityMeanDeltaVsNullMean` positive.
- `newCladeEncounterRestraintGraceBoost=2` is pruned; its `+1.25` smoke gain reversed to a mean horizon regression of `-1.75`.
- `cladeInteractionCoupling` is already archived, and the committed disturbance-opening horizon comparison still showed large active-clade deficits despite persistence improvement.
- `src/activity.ts` (2361 lines), `src/simulation.ts` (2386 lines), 23 relabel-null wrapper files, and 24 `study:` scripts are the main code-health drag on new mechanism work.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Founder-selective coexistence | 4 | f7fd21d |
| Simulation seam extraction | 2 | aa3baae |
| Experiment surface pruning / archival | 1 | 1c36a23 |
| Relabel-null threshold extraction | 1 | 15998c4 |
| Verification stability | 1 | 87a3d46 |
| Structural critique / planning | 1 | 011ba42 |

Dominant axis: Founder-selective coexistence (4/10)
Underexplored axes: wrapper consolidation, artifact hygiene, disturbance-mediated recolonization, evolvable trait-space expansion

## Project State
- The repo has repeatable smoke, horizon, review, and matched relabel-null studies with tests covering the recent founder-grace and encounter-restraint work.
- Recent sessions mostly explored founder-support axes and their pruning; settlement helpers and relabel-null thresholds were extracted, but the core file bottlenecks remain.
- The important gap is still a canonical verdict on ecology-gated founder selectivity, plus enough study-surface cleanup to make the next mechanism branch cheaper than the last one.

## External Context
- Inference from [Morita & Yamamichi, 2024, Proceedings of the Royal Society B](https://pubmed.ncbi.nlm.nih.gov/39561793/): arrival-time advantages can entrench priority effects unless niche differentiation also shifts, which supports testing founder grace with ecology gating rather than adding more unconditional shielding.

## Research Gaps
- Does `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace still beat the `-23.75` threshold-`1.0` active-clade delta on the 4000-step panel without sacrificing the better threshold-`1.2` persistence cases?
- Can one table-driven study harness preserve artifact shape and test coverage while removing the most duplicated wrapper family?

## Current Anti-Evidence
- Even the best canonical founder-support stack still ends below the matched null on concurrent active clades (`activeCladeDeltaVsNullMean=-23.75` at threshold `1.0`), so the system still supports fewer coexisting clades than relabeled births.
- The representational ceiling is still low: genomes mutate only `metabolism`, `harvest`, and `aggression` in a mostly static single-resource environment, so coexistence gains may plateau before richer ecological novelty appears.

## Bet Queue
- [validate] Run the canonical 4000-step founder-grace vs founder-grace-plus-ecology-gate comparison on the static habitat baseline
- [refactor] Collapse the founder-establishment relabel-null smoke / horizon wrappers into a table-driven harness
- [split] Extract matched-null pseudo-clade construction and relabel-null seed builders from `src/activity.ts`

### Bet 1: [validate] Horizon-Validate Founder Grace Plus An Ecology Gate
Run one canonical 4000-step comparison for `cladogenesisEcologyAdvantageThreshold=-1` versus `0.1` on the static habitat + founder-grace baseline. This is the decisive mechanism bet because the smoke gain is the last promising founder-selective signal that has not yet faced the full matched-null horizon panel.

#### Success Evidence
- A new horizon artifact or test captures both points with matched birth schedules and shows whether `0.1` improves `activeCladeDeltaVsNullMean` versus the founder-grace `-23.75` baseline and whether threshold-`1.0` persistence recovers.

#### Stop Conditions
- Stop after one two-point horizon comparison (`-1`, `0.1`) on the current founder-grace baseline.
- Stop if the comparison requires stacking extra knobs or changing core simulation semantics.

### Bet 2: [refactor] Table-Drive The Founder-Establishment Wrapper Family
Collapse the most duplicated relabel-null study family into shared definitions instead of keeping separate smoke / horizon wrappers for each nearby founder-establishment variant. This is the smallest refactor that materially reduces the 23-wrapper surface without depending on new mechanism results.

#### Success Evidence
- At least one duplicated wrapper family is replaced by shared harness code, artifact names stay stable, and the relevant existing tests still pass.

#### Stop Conditions
- Stop once one coherent wrapper family is table-driven; do not rewrite every historical study in one session.
- Stop if preserving current artifact filenames or exports becomes unclear.

### Bet 3: [split] Extract Relabel-Null Matched-Schedule Builders From `src/activity.ts`
Move the pseudo-clade construction and relabel-null seed-building seam out of `src/activity.ts`. This directly reduces the file that every new validation or diagnostic bet still edits, while staying independent of the mechanism outcome of Bet 1.

#### Success Evidence
- `src/activity.ts` shrinks materially, the matched-null builders live in a dedicated module, and existing relabel-null tests still pass without schema changes.

#### Stop Conditions
- Stop after one coherent seam is isolated; do not redesign metrics or export schemas.
- Stop if the extraction starts pulling unrelated activity-analysis code into the same change.

## Assumptions / Unknowns
- Assumption: the smoke-scale ecology-gate gain is not just a short-horizon artifact from suppressing weak founders.
- Unknown: the current study tooling can leave non-machine-readable artifacts; `docs/clade_activity_relabel_null_new_clade_encounter_restraint_review_2026-03-14.json` includes an npm log preamble and the untracked `docs/clade_activity_relabel_null_disturbance_opening_horizon_2026-03-14.json` is truncated.
