# Session Plan — 2026-03-15

## Compact Context
- `a70776b` added the non-species-conditioned relabel null and species-versus-clade decomposition helpers; `test/clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study.test.ts` now asserts `nonSpeciesConditionedNull`.
- `662767d` added abundance-weighted activity metrics, and the canonical founder-grace / ecology-gate horizon artifact has now been refreshed at `docs/clade_activity_relabel_null_founder_grace_ecology_gate_horizon_2026-03-15.json` with `decomposition`, `nonSpeciesConditionedNull`, and abundance-aware summaries surfaced from current code.
- The strongest current anti-evidence is absolute: under stricter habitat-plus-crowding matching, founder grace gained `+9` versus static habitat at cladogenesis threshold `1.0` but still sat at `-25.75` active clades versus null, while the best ecology gate only improved to `-17` and gave back large persistent-activity gains.
- The refreshed canonical founder-grace / ecology-gate artifact did not rescue the story: at cladogenesis threshold `1.0` and survival `50`, ecology gating improved species-conditioned active-clade delta only from `-23.75` to `-20.25` while persistent activity delta collapsed from `35.49` to `3.79`; the non-species-conditioned null stayed positive for both arms (`+6` founder grace, `+10.75` ecology gate).
- `src/simulation.ts` (1989 lines), `src/activity.ts` (1967 lines), and `src/types.ts` (1280 lines) remain the main leverage points; encounter resolution is still a dominant-versus-all collapse.
- `TaxonHistory.timeline` and per-tick `localityFrames` are still always-on full histories, so every long-horizon study pays both simulation and replay cost.
- Package manager is npm (`package-lock.json`).

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Planner / backlog governance | 5 | d26c26f |
| Evaluation surface / null fidelity | 2 | a70776b |
| Runtime / study-surface refactors | 2 | 77de075 |
| Metric instrumentation | 1 | 662767d |
| Mechanism-surface expansion | 0 | n/a |
| Scalability measurement | 0 | n/a |

Dominant axis: Planner / backlog governance (5/10)
Underexplored axes: mechanism-surface expansion, scalability measurement

## Project State
- The project already has relabel-null studies, founder-context-matched nulls, a non-species-conditioned null implementation, and abundance-weighted activity metrics.
- Recent sessions mostly improved planning docs, tightened evaluation honesty, and extracted study/runtime plumbing rather than adding a new coexistence mechanism family.
- The important gap is the mechanism surface itself: encounters are still dominant-only, physiology is single-currency, and the planner is still mostly choosing among scalar `SimulationConfig` knobs.

## External Context
- [Species coexistence as an emergent effect of interacting mechanisms](https://www.sciencedirect.com/science/article/pii/S0040580924001084) (Theoretical Population Biology, 2025): coexistence times increase far more when mechanisms are combined than when any one mechanism is tuned in isolation, which argues against continuing one-knob sweeps as the main search strategy.
- [Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure](https://direct.mit.edu/artl/article/doi/10.1162/artl_a_00470/128541/Ecology-Spatial-Structure-and-Selection-Pressure) (Artificial Life, 2025): spatial interaction structure leaves measurable phylogenetic signatures, which is directly relevant because this simulator still collapses encounters to one dominant occupant per cell.

## Research Gaps
- How should planning weigh the split exposed by `docs/clade_activity_relabel_null_founder_grace_ecology_gate_horizon_2026-03-15.json`, where the species-conditioned matched null stays negative in absolute active clades but the non-species-conditioned null is positive for both founder grace and ecology gating?
- Does extracting encounter resolution behind a pluggable matchup kernel create a practical seam for richer coexistence mechanisms without first rewriting the whole simulator?

## Current Anti-Evidence
- No tested stack beats its species-conditioned null in absolute active clades on the canonical horizon surface: founder grace remains `-23.75` to `-25.75` depending on matching strictness, and the refreshed ecology gate only improves to `-20.25` at threshold `1.0` / survival `50` and `-19.25` at threshold `1.2` while sacrificing persistent activity.
- The simulator is still locked to a one-resource, dominant-only, clonal, one-step local decision architecture, so the current positive results are limited to scalar retuning inside a mechanism family that may be unable to express the coexistence structures the project is claiming to pursue.

## Bet Queue
- [validate] Refresh the canonical founder-grace / ecology-gate horizon artifact so the already-landed decomposition and abundance-aware summaries feed back into planning
- [validate] [Absolute-Versus-Null Fixation] The optimization loop credits interventions for improving delta-versus-null (founder grace +9 vs static habitat) while ignoring that both arms sit far below zero in absolute active clades (founder grace -25.75, static habitat -34.75). Under that objective surface the Planner can win on relative gains while the system as a whole continues losing to the null baseline, which means reported progress does not necessarily mean the system is approaching genuinely positive diversification. Intervention: add co-equal absolute active-clade targets or minimum viability floors alongside delta metrics, and surface both "better than the alternative" and "better than null" as distinct success criteria. Dimension: Feedback Loops.
- [strategize] [Single-Mechanism Tuning Ceiling] The current research surface sweeps numeric and boolean fields in `SimulationConfig` (founder grace ticks, crowding penalties, clade coupling scalars), while the architecture remains locked to one resource pool, three genome axes, greedy one-step movement, dominant-only encounters, and clonal inheritance. No amount of Planner optimization inside that parameter surface can discover whether the system needs multi-resource constraints, interaction-type diversity, recombination, or alternative encounter resolutions because those mechanism classes are not knobs to turn. Intervention: replace the axis-specific sweep wrappers with composable mechanism slots for resources, inheritance, encounters, and settlement so studies can compare whole operator families instead of only retuning single-mechanism constants. Dimension: Assumptions.
- [refactor] [Interaction Topology] `resolveEncounters()` collapses every occupied cell to one aggression-sorted dominant that steals energy from every other occupant with the same transfer rule. Within that architecture the system cannot express pair-specific matchups, non-transitive competition, coalition effects, mutual kills, or context-dependent encounter outcomes because every multispecies contest reduces to a single linear dominance order. Intervention: replace dominant-versus-all resolution with a pairwise encounter scheduler or matchup kernel keyed by participant traits and neighborhood context, and allow multiple outcome types beyond one-way theft. Dimension: Expressiveness.

### Bet 1: [validate] Refresh Canonical Founder-Grace Artifact
Regenerate the canonical founder-grace / ecology-gate horizon artifact from current code so the planner stops relying on the March 14 export that predates non-species-conditioned decomposition reporting. The point is not new mechanics; it is to get one honest canonical artifact that exposes both null families, species-versus-clade decomposition, and the new abundance-aware summaries before more claims are made about the founder-grace line.

#### Success Evidence
- One fresh canonical horizon artifact includes `decomposition`, `nonSpeciesConditionedNull`, and abundance-aware summary fields, and planner-facing docs reference that artifact instead of the stale March 14 export.

#### Stop Conditions
- Stop after one canonical artifact and any minimal tests or fixture updates needed to keep it reproducible.
- Stop if the work starts redesigning study schemas or adding new mechanisms instead of refreshing reporting.

### Bet 2: [validate] Promote Absolute And Viability Floors
Make absolute active-clade outcomes and abundance-aware viability floors co-equal with delta-versus-null improvements in the founder-grace / ecology-gate study surface. The anti-evidence is that the project can currently claim progress while still losing badly to null in absolute terms, so this bet hardens the selection loop against that failure mode rather than adding another optimistic scalar sweep.

#### Success Evidence
- The canonical comparison output exposes absolute active-clade outcomes and explicit pass/fail criteria for both relative improvement and better-than-null viability, with deterministic coverage for the new summary logic.

#### Stop Conditions
- Stop after the study outputs and tests clearly separate relative wins from absolute viability.
- Stop if the work starts inventing new diversity metrics beyond the absolute and abundance-aware gates needed for this decision surface.

### Bet 3: [strategize] Define A Minimal Mechanism Slot Seam
Design the smallest code-near mechanism-slot seam that would let the simulator compare more than one encounter, settlement, inheritance, or resource operator family without rewriting the whole runtime. The target is a precise plan tied to current insertion points in `src/simulation.ts`, `src/simulation-reproduction.ts`, and related study harnesses, because the project needs a buildable seam rather than another broad wishlist.

#### Success Evidence
- A concrete implementation sketch names the first slot boundary, the affected runtime entry points, and the smallest backwards-compatible config or interface changes needed to support one alternate operator family.

#### Stop Conditions
- Stop after one buildable seam is specified; do not redesign the entire simulator architecture.
- Stop if the work drifts into a broad mechanism manifesto without naming concrete code insertion points.

### Bet 4: [refactor] Extract Encounter Resolution Behind A Matchup Kernel
Refactor `resolveEncounters()` so the existing dominant-only rule becomes one implementation behind a narrower matchup kernel or scheduler interface. This is the first concrete mechanism seam because encounter topology directly limits coexistence structure, and it can be isolated more cleanly than a full multi-resource or inheritance rewrite.

#### Success Evidence
- The current encounter behavior is preserved behind a pluggable kernel boundary, `src/simulation.ts` shrinks accordingly, and existing encounter-related tests still pass without schema drift.

#### Stop Conditions
- Stop after behavior-preserving extraction of the dominant-only encounter rule behind a seam.
- Stop if the work starts introducing a full alternate encounter model before the seam is stable and tested.

## Assumptions / Unknowns
- Assumption: encounter topology is the smallest high-leverage mechanism seam because it sits directly on the current dominant-only coexistence ceiling without requiring an immediate physiology or inheritance rewrite.
- Observation: the refreshed canonical horizon artifact narrowed ambiguity but not the anti-evidence. It surfaced a real evaluation split between species-conditioned and non-species-conditioned nulls, but the core species-conditioned coexistence story stayed negative.
- Assumption: promoting absolute and abundance-aware viability criteria will prevent the planner from over-crediting relative improvements that still lose to null.
- Unknown: whether the cleanest mechanism-slot seam should be runtime pluggability, static interface implementations, or a hybrid that keeps the current config surface stable while opening one alternate operator family.
