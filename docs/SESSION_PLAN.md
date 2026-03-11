# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager; the repo already has `build`, `test`, and relabel-null study scripts wired for bounded verification.
- The canonical anti-evidence is still `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades trail matched pseudo-clades on persistent activity (`-317.6` at cladogenesis threshold `1`, `-247.3` at `1.2` for `minSurvivalTicks=50`).
- Recent short sweeps show habitat coupling helped but did not flip the sign (`persistentActivityMeanDeltaVsNullMean` about `-39.9` at coupling `0.75`), while interaction coupling mostly worsened the short panel (down to about `-162.5` at coupling `1`).
- The latest shipped mechanism, lineage harvest self-limitation, materially improved the short threshold-`1` smoke from `-90.7` to `-18.3` while preserving matched birth schedules across all seeds.
- In `src/simulation.ts`, harvest can now respond to same-lineage crowding, but destination scoring still uses food minus generic neighborhood crowding only.

## Project State
- The simulation already has cladogenesis, spatial habitats, trophic and defense tradeoffs, disturbance/resilience analytics, relabel-null clade studies, and deterministic tests around recent ecology levers.
- Recent sessions have moved from clade/null measurement into lineage-mediated habitat, interaction, and harvest mechanics, then checked each lever with short sweeps or smoke studies.
- The underdeveloped area is lineage-aware movement: local over-clustering by kin is still only penalized after arrival, not during destination choice.

## External Context
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): ecology plus spatial structure are central levers for changing phylogenetic outcomes in ALife systems. Source: https://pubmed.ncbi.nlm.nih.gov/40069409/
- Wiegand et al., *Observed abundance-dependent aggregation promotes species coexistence at lower latitudes* (Nature, 2025): neighborhood-scale crowding and aggregation can have a stabilizing effect on coexistence, which makes movement rules around local kin density a plausible bounded lever here. Source: https://www.nature.com/articles/s41586-025-09361-2

## Research Gaps
- If agents avoid destinations with high same-lineage neighborhood occupancy, on top of the new harvest crowding penalty, does the short relabel-null delta move from `-18.3` toward non-negative without collapsing population size?

## Current Anti-Evidence
- Actual clades still lose to matched pseudo-clades on the canonical `4000`-step relabel-null panel, so current lineage structure is not yet doing more persistence work than the relabeled null.
- The best recent gain is only a `1000`-step smoke result; no current artifact shows a positive real-clade advantage on the longer horizon.

## Candidate Bets
- A: Add a lineage-aware dispersal penalty to destination scoring, then run a short relabel-null smoke with `lineageHarvestCrowdingPenalty=1` held constant.
  Why now: harvest self-limitation already helped materially, and movement is the next local ecological path that is still lineage-blind.
  Est. low-context human time: 45m
  Main risk: the change may only thin or fragment the population instead of preserving more clades.
- B: Run a short combined smoke for `cladeHabitatCoupling=0.75` plus `lineageHarvestCrowdingPenalty=1`.
  Why now: those are the two best short-horizon levers so far.
  Est. low-context human time: 30m
  Main risk: it is partly measurement-only and any gain would be hard to attribute.
- C: Extend kin crowding from harvest into both movement and encounter transfer in one pass.
  Why now: local kin feedback may need to act on both abiotic and biotic competition.
  Est. low-context human time: >60m
  Main risk: too many coupled effects for one bounded session.

## Selected Bet
Implement lineage-aware dispersal aversion. Add one opt-in `lineageDispersalCrowdingPenalty` that subtracts same-lineage neighborhood crowding from destination scores, reuse the existing same-lineage crowding kernel, prove the movement effect with one deterministic unit test, and run a 2-point short relabel-null smoke with harvest crowding already enabled. This is the smallest mechanism change that directly tests whether the recent harvest-side improvement was limited by lineage-blind movement.

## Why This Fits The Horizon
- The code change is localized to destination scoring and nearby turn plumbing that already computes occupancy and same-lineage crowding.
- Success is autonomously checkable with one deterministic test, `npm test`, `npm run build`, and a narrow smoke artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_lineage_dispersal_crowding_smoke_2026-03-11.json` compares dispersal penalty `0` versus `1` while keeping `lineageHarvestCrowdingPenalty=1`.
- Verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-lineage-dispersal-crowding-smoke`, with `persistentActivityMeanDeltaVsNullMean` higher at dispersal penalty `1` than at `0`.

## Stop Conditions
- Stop after one new config knob, one deterministic dispersal test, and one 2-point smoke result; do not also tune habitat coupling or long-horizon panels in the same session.
- If the smoke worsens the delta or causes obvious population collapse, record the artifact and stop instead of tuning multiple formulas.

## Assumptions / Unknowns
- Assumption: the short harvest-side improvement indicates local same-lineage over-clustering is a real bottleneck rather than measurement noise.
- Unknown: whether movement-side kin avoidance helps on its own or only when paired with harvest self-limitation.
