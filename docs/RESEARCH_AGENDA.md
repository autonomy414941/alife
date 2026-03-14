# Research Agenda

## Current Direction
Over the next month, shift from blind founder-protection sweeps to founder-selection mechanisms and diagnostics that explain why actual clades still trail the relabel-null baseline on the static `cladeHabitatCoupling=0.75` surface. Prioritize one causal review of founder-age losses plus the structural splits and output cleanup needed to compare new establishment mechanisms cheaply, instead of adding another scalar gate on top of founder grace.

## Why This Direction
`newCladeSettlementCrowdingGraceTicks=36` is still the best canonical active-clade win, improving `activeCladeDeltaVsNullMean` from `-36.25` to `-23.75`, but it still leaves the system well below the matched null. The March 14 ecology-gate horizon follow-up improved the active-clade deficit further to `-17` at cladogenesis threshold `1.0`, yet it reduced persistent activity by `28.93` to `48.36` versus founder grace across the canonical comparisons, while `newCladeEncounterRestraintGraceBoost=2` has already been pruned after a mean horizon regression. That combination suggests diminishing returns from the current knob family and a need to understand where losses happen before opening another axis.

## Structural Constraints
`src/activity.ts` (2361 lines) still mixes activity analytics, relabel-null pseudo-clade construction, study runners, and export assembly, and `src/simulation.ts` (2386 lines) still holds most of the agent loop while accumulating `localityFrames` and full `TaxonHistory.timeline` histories that grow with run length. The active study surface remains fragmented across 26 relabel-null entry points, with 17 still bypassing the shared JSON-output helper, which is why March 14 produced malformed or truncated artifacts. At the model level, the matched-null baseline only preserves clade births by tick, and the fixed three-locus genome in a mostly static single-resource world still caps how far establishment tuning alone can push the project goal.

## Revision History
- 2026-03-14: Created the agenda around founder establishment and coexistence retention after habitat coupling became the only durable horizon win and adaptive memory failed at horizon.
- 2026-03-14: Revised the agenda toward founder-selective coexistence after the founder-grace horizon run improved active clades but weakened the short-threshold persistence comparison, indicating that shielding alone is not enough.
- 2026-03-14: Added dead-axis pruning and structural decomposition as explicit monthly work because `cladeInteractionCoupling` remains uniformly negative and the settlement / cladogenesis seam plus smoke wrappers are slowing iteration.
- 2026-03-14: Pruned `newCladeEncounterRestraintGraceBoost` from future canonical stacks after the review artifact showed threshold-`1.0` regression outweighed the threshold-`1.2` rescue on the 4000-step horizon.
- 2026-03-14: Kept the monthly direction on ecology-gated founder selectivity, but elevated wrapper consolidation and artifact hygiene after reviewing the duplicated study surface and the March 14 artifact failures.
- 2026-03-14: Shifted the monthly direction from another founder-selective gate sweep toward founder-age diagnostics, matched-null cleanup, and output hardening after the ecology-gate horizon run improved active-clade deficit but sharply regressed persistent activity.
