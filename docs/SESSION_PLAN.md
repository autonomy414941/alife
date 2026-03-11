# Session Plan — 2026-03-11

## Compact Context
- `npm`/TypeScript/vitest repo with working `build`, `test`, and relabel-null smoke-study scripts.
- The canonical anti-evidence is still `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades underperform the matched null on persistent activity at cladogenesis thresholds `1` and `1.2`.
- The best short result is currently `docs/clade_activity_relabel_null_lineage_dispersal_crowding_smoke_2026-03-11.json`, where `lineageHarvestCrowdingPenalty=1` and `lineageDispersalCrowdingPenalty=1` reach `persistentActivityMeanDeltaVsNullMean = +17.928571428571402`.
- `docs/clade_activity_relabel_null_lineage_offspring_settlement_smoke_2026-03-11.json` weakened that short win to `+7.357142857142833`, so the current positive signal is real but fragile.
- In `src/simulation.ts`, harvest, movement, and offspring settlement can already respond to same-lineage crowding, but `resolveEncounters()` still lets agents steal from same-lineage neighbors with no kin-sensitive restraint.
- `test/simulation.test.ts` already has deterministic tests around predation/defense and recent lineage-crowding mechanics, so one more localized interaction test is cheap to add.

## Project State
- The simulation already includes cladogenesis, spatial habitats, trophic and defense tradeoffs, clade-level habitat/interaction coupling, relabel-null studies, and deterministic ecology tests.
- Recent sessions have been pushing one mechanism family: same-lineage crowding in harvest, then dispersal, then offspring settlement, with a short relabel-null smoke after each change.
- The main underdeveloped area is local conflict: shared-cell energy transfer is still lineage-blind even though several other ecology channels are now lineage-aware.

## External Context
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): ecology and spatial structure remain central levers for open-ended evolutionary dynamics in artificial systems. Source: https://pubmed.ncbi.nlm.nih.gov/40298478/
- Scott, Wild, and Gardner, *Kin-discriminating partner choice promotes the evolution of helping* (Evolution, 2025): kin-discriminating interaction rules can raise helping in structured populations; by inference, kin-sensitive encounter rules are a plausible next mechanism here. Source: https://pubmed.ncbi.nlm.nih.gov/39955103/

## Research Gaps
- If same-lineage encounters transfer less energy than cross-lineage encounters, does the current short positive relabel-null delta improve or at least hold without causing runaway population growth?

## Current Anti-Evidence
- No artifact yet shows a positive real-clade advantage on the longer canonical horizon; the `4000`-step relabel-null panel remains negative on persistent activity.
- The only positive result so far is a short `1000`-step smoke, and even that gain weakened when offspring settlement was made lineage-aware.

## Candidate Bets
- A: Add lineage-aware encounter restraint so same-lineage co-occupants steal less from each other, then run a short relabel-null smoke on top of harvest/dispersal crowding.
  Why now: encounters are the clearest remaining lineage-blind local mechanism, and they act directly in the dense stacks created by the current ecology.
  Est. low-context human time: 45m
  Main risk: it may mostly inflate population size instead of improving clade persistence.
- B: Add a lineage-crowding reproduction penalty so crowded kin reproduce less often, then run the same short smoke.
  Why now: reproduction count is still uncoupled from local kin density even after harvest and movement became kin-sensitive.
  Est. low-context human time: 45m
  Main risk: it may suppress turnover and new clade formation more than it helps persistence.
- C: Run the canonical `4000`-step relabel-null panel with `lineageHarvestCrowdingPenalty=1`, `lineageDispersalCrowdingPenalty=1`, and offspring settlement left at `0`.
  Why now: the current short positive signal still needs falsification on the main horizon.
  Est. low-context human time: 30m
  Main risk: it is measurement-only and does not improve the mechanism if the long panel stays negative.

## Selected Bet
Implement lineage-aware encounter restraint. Add one opt-in knob that reduces same-lineage energy theft during `resolveEncounters()`, prove the rule with one deterministic simulation test, and run a 2-point short relabel-null smoke on top of `lineageHarvestCrowdingPenalty=1` and `lineageDispersalCrowdingPenalty=1` with offspring settlement left at `0`. This is the smallest unfinished mechanism change in the current lineage-crowding path, and it targets the most obvious kin-blind way clades can still erode themselves locally.

## Why This Fits The Horizon
- The code change is localized to encounter resolution plus the usual config/export/study wiring, and the repo already has reusable predation tests and smoke-study templates.
- Success is autonomously checkable with one deterministic test, `npm test`, `npm run build`, and a narrow smoke artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_lineage_encounter_restraint_smoke_2026-03-11.json` compares encounter restraint `0` versus `1` while keeping harvest/dispersal crowding at `1` and offspring settlement at `0`.
- Verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-lineage-encounter-restraint-smoke`, plus a deterministic test showing same-lineage theft drops when the new knob is enabled.

## Stop Conditions
- Stop after one encounter-restraint knob, one deterministic test, and one 2-point smoke result; do not also tune reproduction, settlement, or rerun the long-horizon panel in the same session.
- If the change requires broad refactoring outside encounter/config/study plumbing, or the smoke obviously turns into population inflation with no clade signal, record the artifact and stop instead of stacking more mechanics.

## Assumptions / Unknowns
- Assumption: dense same-lineage co-occupancy is common enough that kin-blind theft is materially hurting clade persistence.
- Unknown: whether reducing kin theft improves clade persistence itself or mainly changes population size and turnover.
