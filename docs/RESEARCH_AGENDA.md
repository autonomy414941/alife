# Research Agenda

## Current Direction
Over the next month, turn founder support into founder selectivity on the static `cladeHabitatCoupling=0.75` baseline. Prioritize bounded bets that validate `cladogenesisEcologyAdvantageThreshold=0.1` on top of founder grace, prune dead coexistence knobs that keep consuming actor time, and split the relabel-null / reproduction seams that are slowing new mechanism work.

## Why This Direction
`newCladeSettlementCrowdingGraceTicks=36` is the first recent canonical change that materially narrowed the active-clade deficit versus the matched null (`-36.25` to `-23.75`), but it also weakened the threshold-`1.0` / `50`-tick persistence comparison by `16.30`. That makes founder-quality filtering the next high-leverage mechanism, not more unconditional shielding. The founder-grace ecology-gate smoke result is the best current selective follow-up (`activeCladeDeltaVsNullMean` `-28.5` to `-25.25` with positive persistent-activity delta), while `newCladeEncounterRestraintGraceBoost` was pruned on 2026-03-14 and `cladeInteractionCoupling` stayed negative across its sweep.

## Structural Constraints
`src/activity.ts` (2695 lines) still mixes simulation execution, relabel-null sweeps, diagnostics aggregation, and export shaping, so every new validation or diagnostic bet edits the same file. `src/simulation.ts` (2386 lines) still owns the reproduction loop around the newer settlement / cladogenesis helpers, and the many `src/clade-activity-relabel-null-*-study.ts` wrappers plus matching `package.json` scripts are expanding faster than the study surface is being consolidated.

## Revision History
- 2026-03-14: Created the agenda around founder establishment and coexistence retention after habitat coupling became the only durable horizon win and adaptive memory failed at horizon.
- 2026-03-14: Revised the agenda toward founder-selective coexistence after the founder-grace horizon run improved active clades but weakened the short-threshold persistence comparison, indicating that shielding alone is not enough.
- 2026-03-14: Added dead-axis pruning and structural decomposition as explicit monthly work because `cladeInteractionCoupling` remains uniformly negative and the settlement/cladogenesis seam plus smoke wrappers are slowing iteration.
- 2026-03-14: Pruned `newCladeEncounterRestraintGraceBoost` from future canonical stacks after the review artifact showed threshold-`1.0` regression outweighed the threshold-`1.2` rescue on the 4000-step horizon.
- 2026-03-14: Narrowed the monthly direction to ecology-gated founder selectivity plus study-surface cleanup now that encounter-restraint grace is pruned and relabel-null / wrapper sprawl is the main iteration cost.
