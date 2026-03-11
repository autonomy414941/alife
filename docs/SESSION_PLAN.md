# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager, and the repo already has `build`, `test`, and relabel-null study scripts for bounded verification.
- The canonical anti-evidence is still `docs/clade_activity_relabel_null_2026-03-10.json`: at `4000` steps, actual clades remain below the matched null on persistent activity (`-317.6` at cladogenesis threshold `1`, `-247.3` at `1.2` for `minSurvivalTicks=50`).
- Recent short studies moved the threshold-`1` relabel-null delta from `-90.7` with no lineage crowding, to `-18.3` with harvest crowding, to `+17.9` with harvest crowding plus adult lineage-aware dispersal.
- In `src/simulation.ts`, adult movement and harvest now respond to same-lineage neighborhood density, but `reproduce()` still places offspring by a uniform random pick among the parent cell and four adjacent cells.
- Clade habitat and interaction coupling exist, but short sweeps stayed non-positive overall, so the strongest fresh momentum is still the new lineage-crowding path.

## Project State
- The simulation already has cladogenesis, spatial habitats, trophic and defense tradeoffs, clade-level couplings, relabel-null studies, and deterministic unit tests around recent ecology mechanics.
- Recent sessions have been moving from clade/null measurement into lineage-mediated local competition, then validating each new lever with tight smoke studies.
- The underdeveloped area is intergenerational spatial spread: births can immediately re-cluster kin even when adult turns now avoid and self-limit same-lineage crowding.

## External Context
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): ecology and spatial structure are core open-endedness levers in evolving simulations, and strong ecology remains detectable even in spatial systems. Source: https://pubmed.ncbi.nlm.nih.gov/40298478/
- Orgeron and Asllani, *Habitat fragmentation promotes spatial scale separation under resource competition* (Journal of Theoretical Biology, 2026): competition plus dispersal and spatial heterogeneity can drive segregation that may act as a precursor to divergence and diversity. Source: https://pubmed.ncbi.nlm.nih.gov/41478589/

## Research Gaps
- If offspring settlement penalizes nearby same-lineage crowding instead of picking a birth cell uniformly at random, does the current short positive relabel-null delta improve or at least hold without shrinking births or population size?

## Current Anti-Evidence
- No current artifact shows a positive real-clade advantage on the longer canonical horizon; the only positive signal so far is the new `1000`-step smoke with adult kin-crowding enabled.
- The current birth rule can recreate dense kin clusters every generation, so the system still has a lineage-blind channel that may be erasing the new short-horizon gain.

## Candidate Bets
- A: Add lineage-aware offspring settlement scoring during reproduction, then run a short relabel-null smoke on top of `lineageHarvestCrowdingPenalty=1` and `lineageDispersalCrowdingPenalty=1`.
  Why now: adult kin-crowding just produced the first positive short delta, but births still undo that signal by respawning offspring uniformly next to parents.
  Est. low-context human time: 45m
  Main risk: stronger settlement bias may reduce local mixing enough to lower turnover or future speciation.
- B: Run the canonical `4000`-step relabel-null panel with both lineage crowding knobs enabled.
  Why now: the short positive smoke now needs falsification on the longer horizon that still defines the main anti-evidence.
  Est. low-context human time: 30m
  Main risk: it is measurement-only and may not explain what to change next if the long panel stays negative.
- C: Add same-lineage encounter restraint so dominant agents steal less from kin than from non-kin, then smoke test it on top of the current crowding knobs.
  Why now: encounter transfer is still lineage-blind and can cannibalize clade persistence even after movement and harvest were improved.
  Est. low-context human time: 45m
  Main risk: it may only inflate energy retention or population size without improving clade persistence.

## Selected Bet
Implement lineage-aware offspring settlement. Add one opt-in reproduction knob that scores the existing birth-neighbor options using the same local ecology already shaping adult movement, including same-lineage crowding, prove the effect with one deterministic reproduction test, and run a 2-point short relabel-null smoke with harvest and adult dispersal crowding held at `1`. This is the smallest mechanism change that extends the new kin-crowding signal across generations instead of only within adult turns.

## Why This Fits The Horizon
- The code change is localized to `reproduce()` and nearby occupancy plumbing, with reusable crowding logic already present in `src/simulation.ts`.
- Success is autonomously checkable with one deterministic test, `npm test`, `npm run build`, and a narrow smoke artifact.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_lineage_offspring_settlement_smoke_2026-03-11.json` compares offspring settlement penalty `0` versus `1` while keeping `lineageHarvestCrowdingPenalty=1` and `lineageDispersalCrowdingPenalty=1`.
- Verification command or output: `npm test && npm run build && npm run study:clade-activity-relabel-null-lineage-offspring-settlement-smoke`, with `persistentActivityMeanDeltaVsNullMean` at settlement penalty `1` at least matching or exceeding the current `+17.9` short baseline.

## Stop Conditions
- Stop after one new offspring-settlement knob, one deterministic reproduction test, and one 2-point smoke result; do not also tune encounter rules or rerun the long-horizon panel in the same session.
- If occupancy plumbing for births grows beyond a small local change, or the smoke clearly worsens the delta, record the artifact and stop instead of stacking more formulas.

## Assumptions / Unknowns
- Assumption: random adjacent offspring placement is materially re-clustering lineages and partially canceling the new adult kin-crowding gains.
- Unknown: whether intergenerational settlement bias improves clade persistence on its own or only matters once the longer-horizon panel is rerun.
