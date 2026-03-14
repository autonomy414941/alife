# Research Agenda

## Current Direction
Over the next month, use the validated `cladeHabitatCoupling=0.75` baseline to turn founder support into selective coexistence rather than broader shielding. Prioritize bounded bets that pair founder establishment relief with founder-quality or early-competition filters, while pruning clearly dead axes and reducing the settlement/cladogenesis iteration bottleneck.

## Why This Direction
The 4000-step founder-grace horizon run materially improved `activeCladeDeltaVsNullMean` on the static habitat baseline (`-36.25` to `-23.75`), but it also lost the threshold-`1.0` / `50`-tick persistence edge (`-16.30` versus static habitat). That makes the next leverage point founder selectivity, not more unconditional grace. `adaptiveCladeHabitatMemoryRate=0.2` regressed at horizon, `cladeInteractionCoupling` stayed negative across its sweep, and the best older non-founder short-run active-clade signal is still the ecology gate.

## Structural Constraints
`src/simulation.ts` still keeps settlement scoring, founder grace, encounter restraint, and cladogenesis decisions in one seam, so most coexistence bets edit the same monolithic region. `src/activity.ts` is also over 2000 lines, and many `src/clade-activity-relabel-null-*-smoke-study.ts` files are thin wrappers around the same study runner, which makes the experiment surface grow faster than the code can stay modular.

## Revision History
- 2026-03-14: Created the agenda around founder establishment and coexistence retention after habitat coupling became the only durable horizon win and adaptive memory failed at horizon.
- 2026-03-14: Revised the agenda toward founder-selective coexistence after the founder-grace horizon run improved active clades but weakened the short-threshold persistence comparison, indicating that shielding alone is not enough.
- 2026-03-14: Added dead-axis pruning and structural decomposition as explicit monthly work because `cladeInteractionCoupling` remains uniformly negative and the settlement/cladogenesis seam plus smoke wrappers are slowing iteration.
