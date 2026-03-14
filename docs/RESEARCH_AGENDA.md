# Research Agenda

## Current Direction
Over the next month, test whether founder support can become founder selectivity on the static `cladeHabitatCoupling=0.75` baseline, and simplify the study surface enough to make that verdict cheap to repeat. Prioritize one decisive horizon validation of `cladogenesisEcologyAdvantageThreshold=0.1`, then reduce wrapper duplication and split the remaining analytics / reproduction seams so later sessions can pivot to broader ecological mechanisms if this line stalls.

## Why This Direction
`newCladeSettlementCrowdingGraceTicks=36` is still the best canonical active-clade improvement on the static habitat baseline, moving `activeCladeDeltaVsNullMean` from `-36.25` to `-23.75` at cladogenesis threshold `1.0`, but it did not uniformly improve persistence across thresholds. The best selective follow-up remains the founder-grace ecology-gate smoke result, which improved `activeCladeDeltaVsNullMean` from `-28.5` to `-25.25` while keeping `persistentActivityMeanDeltaVsNullMean` positive; by contrast, `newCladeEncounterRestraintGraceBoost=2` regressed at horizon and `cladeInteractionCoupling` has already been archived as a dead axis.

## Structural Constraints
`src/activity.ts` (2361 lines) still mixes simulation execution, matched-null construction, diagnostics, and multiple study runners, while `src/simulation.ts` (2386 lines) still owns most of the agent loop after only partial settlement / cladogenesis extraction. The active study surface is overgrown with 23 relabel-null wrapper files and 24 `study:` scripts, and artifact generation is brittle enough to leave non-machine-readable outputs. At the model level, `Genome` is still a fixed three-locus schema over a mostly static single-resource environment, which limits how far coexistence tuning alone can push the project goal.

## Revision History
- 2026-03-14: Created the agenda around founder establishment and coexistence retention after habitat coupling became the only durable horizon win and adaptive memory failed at horizon.
- 2026-03-14: Revised the agenda toward founder-selective coexistence after the founder-grace horizon run improved active clades but weakened the short-threshold persistence comparison, indicating that shielding alone is not enough.
- 2026-03-14: Added dead-axis pruning and structural decomposition as explicit monthly work because `cladeInteractionCoupling` remains uniformly negative and the settlement / cladogenesis seam plus smoke wrappers are slowing iteration.
- 2026-03-14: Pruned `newCladeEncounterRestraintGraceBoost` from future canonical stacks after the review artifact showed threshold-`1.0` regression outweighed the threshold-`1.2` rescue on the 4000-step horizon.
- 2026-03-14: Kept the monthly direction on ecology-gated founder selectivity, but elevated wrapper consolidation and artifact hygiene after reviewing the duplicated study surface and the March 14 artifact failures.
