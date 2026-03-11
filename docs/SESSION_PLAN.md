# Session Plan — 2026-03-11

## Compact Context
- `npm` is the package manager; the repo already has build/test coverage plus CLI studies for the relabel-null baseline and the habitat/interaction coupling sweeps.
- `src/simulation.ts` already supports cladogenesis plus lineage-level habitat and interaction inheritance, but movement and abiotic resource competition still use identity-blind crowding.
- `docs/clade_activity_relabel_null_2026-03-10.json` shows actual clades still underperform matched pseudo-clades on the `4000`-step relabel-null panel at cladogenesis thresholds `1` and `1.2`.
- `docs/clade_activity_relabel_null_clade_habitat_coupling_sweep_2026-03-11.json` improves the short-panel delta from about `-90.7` at coupling `0` to about `-40` at `0.75-1`, but never turns positive.
- `docs/clade_activity_relabel_null_clade_interaction_coupling_sweep_2026-03-11.json` is mostly worse than baseline, reaching about `-162.5` at coupling `1`.
- Recent tests already prove habitat and interaction coupling can change deterministic local outcomes, so the next bet can focus on one new ecological mechanic plus a short falsifier.

## Project State
- The simulation now has rapid speciation/cladogenesis, spatial habitat structure, trophic and defense tradeoffs, and lineage-level inherited ecology.
- Recent sessions have been moving from clade/null measurement into lineage-mediated ecology, then checking each lever with sweep artifacts.
- The important gap is local self-limitation: common lineages are not penalized more than non-kin neighbors during movement or abiotic harvesting.

## External Context
- Moreno, Rodriguez-Papa, and Dolson, *Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure* (Artificial Life, 2025): stronger ecology and spatial structure should leave stronger phylogenetic signatures in artificial-life systems. Source: https://direct.mit.edu/artl/article/31/2/129/130570/Ecology-Spatial-Structure-and-Selection-Pressure
- DeFilippis et al., *Frequency-dependent assembly processes determine the coexistence and relative abundance of tropical plant species* (Nature, 2025): coexistence was associated with stronger self-limitation than heterospecific effects; by inference, a lineage-local self-limitation term is a plausible bounded mechanism to test here. Source: https://www.nature.com/articles/s41586-025-09229-5

## Research Gaps
- If agents pay an extra local harvest penalty from same-lineage neighbors, does the short relabel-null delta move upward from the current negative baseline without collapsing population size?

## Current Anti-Evidence
- On the canonical `4000`-step relabel-null panel, actual clades still trail matched pseudo-clades at cladogenesis thresholds `1` and `1.2`.
- The two newest lineage-ecology levers changed the gap, but neither produced a positive actual-vs-null result on the short sweep panel.

## Candidate Bets
- A: Add a lineage-local crowding/self-limitation term to abiotic harvest, then verify it with one deterministic unit test and a short relabel-null `0` vs high-penalty comparison.
  Why now: current crowding is identity-blind even though clade persistence is the project bottleneck.
  Est. low-context human time: 45m
  Main risk: the penalty may only reduce population size instead of preserving more clades.
- B: Add kin-avoidance to destination scoring using neighborhood same-lineage occupancy instead of only total occupancy.
  Why now: the movement code already computes neighborhood crowding, so lineage-aware dispersal is a bounded extension.
  Est. low-context human time: 45m
  Main risk: movement-only changes may be too weak to move the relabel-null result.
- C: Retest high habitat-coupling endpoints (`0`, `0.75`, `1`) on the `4000`-step relabel-null panel.
  Why now: habitat coupling is the only recent lever that improved the short-panel null gap at all.
  Est. low-context human time: 30m
  Main risk: it is measurement-only and does not add the missing mechanism.

## Selected Bet
Implement lineage-local self-limitation on abiotic harvest. Add one opt-in config knob that penalizes resource intake from same-lineage local density more than generic occupancy, prove the effect in a deterministic test, and run a narrow `0` vs high-penalty relabel-null smoke on the existing `1000`-step panel. This is the smallest mechanism change that directly tests whether rare-clade advantage helps real clades beat the matched null.

## Why This Fits The Horizon
- The change is localized to one existing scoring path plus one nearby deterministic test and one narrow study invocation.
- Success is autonomously verifiable with `npm test`, `npm run build`, and one small JSON artifact comparing baseline versus penalized short-panel outcomes.

## Success Evidence
- A new artifact such as `docs/clade_activity_relabel_null_lineage_crowding_smoke_2026-03-11.json` exists and compares relabel-null outcomes for penalty `0` versus a high penalty.
- Verification command or output: `npm test && npm run build` plus a short smoke run showing whether `persistentActivityMeanDeltaVsNullMean` moves upward under the new penalty.

## Stop Conditions
- Stop after one new config knob, one deterministic test, and one short 2-point smoke result; do not add both harvest-side and movement-side variants in the same session.
- If the smoke run is flat or population-collapsing, record the artifact and stop instead of tuning multiple formulas.

## Assumptions / Unknowns
- Assumption: translating species-level negative frequency dependence from the literature into lineage-level self-limitation is a useful first proxy in this model.
- Unknown: whether kin self-limitation improves clade persistence or only redistributes turnover among species inside the same few surviving clades.
