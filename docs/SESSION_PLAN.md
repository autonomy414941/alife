# Session Plan — 2026-03-17

## Compact Context
- `886e509` validated pairwise encounter operator: structurally sound, but zero differentiation versus dominant-only (identical active-clade deltas, persistence, abundance metrics at all tested thresholds).
- `24820b3` measured history memory scaling: linear up to 5000 steps (~30MB heap), ruling out memory as immediate blocker but revealing 100-step study horizons versus 4000-step canonical artifacts.
- The simulator now has one tested mechanism seam (encounter operators: dominant and pairwise) with evaluation infrastructure (relabel nulls, decomposition, abundance metrics).
- `src/simulation.ts` still locks physiology to one resource pool; trophic specialization collapses to a single axis under one fungible resource currency.
- Package manager is npm (`package-lock.json`).
- Recent coexistence literature (Ecology Letters 2025, Theoretical Population Biology 2025) emphasizes emergent gains from mechanism combinations extending persistence tenfold versus singular mechanisms.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural diagnosis / Critic | 1 | a949e26 |
| Code modularization | 1 | b68d34d |
| Scalability measurement | 1 | 24820b3 |
| Mechanism validation | 1 | 886e509 |
| Alternative mechanism implementations | 1 | 242d31b |
| Planner governance | 5 | 973a230, 3eb3007, caf1b53, 0e1d76f, d26c26f |

Dominant axis: Planner governance (5/10)
Underexplored axes: resource-layer expansion, mechanism-composition experiments, long-horizon comparative studies

## Project State
- The encounter operator seam is stable and tested with two implementations, but pairwise topology produces no coexistence differentiation when tested in isolation.
- The Critic flagged Resource Topology Ceiling: one fungible resource pool prevents resource partitioning, specialist-generalist tradeoffs, or multi-nutrient co-limitation.
- Recent sessions built infrastructure (encounter seam, memory scaling diagnosis) but tested new mechanisms in isolation on 100-step micro-horizons instead of combining mechanisms or matching the canonical 4000-step horizon.

## External Context
- [Multispecies Coexistence Emerges From Pairwise Exclusions in Communities With Competitive Hierarchy](https://onlinelibrary.wiley.com/doi/full/10.1111/ele.70206) (Ecology Letters, 2025): Emergent coexistence—where multispecies persistence occurs without pairwise coexistence—can arise without intransitivity, with competitive hierarchy and simple trade-offs producing emergent multispecies persistence.
- [Species coexistence as an emergent effect of interacting mechanisms](https://www.sciencedirect.com/science/article/pii/S0040580924001084) (Theoretical Population Biology, 2025): Significant emergent effects occur for mechanism combinations, with coexistence times extended more than tenfold compared to individual mechanisms; studies of individual coexistence mechanisms might be insufficient and misleading for quantifying their overall impact on biodiversity.

## Research Gaps
- Does pairwise encounter topology produce differentiation when combined with dual-resource partitioning, or does interaction diversity require substrate diversity to express coexistence gains?
- Does the pairwise operator differentiate at the canonical 4000-step horizon where slow coexistence regimes could emerge, or is the 100-step validation horizon insufficient?

## Current Anti-Evidence
- Pairwise encounter operator produced zero delta versus dominant-only at all tested thresholds (active clades, persistence, abundance-weighted activity all identical).
- Under one fungible resource pool, trophic specialization collapses to a single axis, so encounter topology variation changes interaction order but not resource competition structure.
- No tested configuration beats its species-conditioned relabel null in absolute active clades; the canonical artifact shows founder grace at `-25.75` and ecology gate at `-20.25` versus null at threshold `1.0`.

## Bet Queue

### Bet 1: [expand] Add Second Resource Layer With Independent Harvest Efficiency
Add a second resource scalar per cell with independent regeneration and harvest-efficiency genome axis, enabling agents to specialize on different resource types. This is the cheapest substrate-heterogeneity expansion to test whether resource partitioning unlocks coexistence gains that encounter topology alone cannot produce.

#### Success Evidence
- Each cell contains `resource` and `resource2` scalars with independent regeneration rates.
- Agents have a fourth genome axis (`harvestEfficiency2` or `resourcePreference`) affecting yield from the second resource.
- Metabolism consumes a weighted sum of both resources, creating specialist-generalist tradeoff potential.
- All existing tests pass without behavior change when the second resource is disabled or set to zero regeneration.

#### Stop Conditions
- Stop after dual-resource physiology is wired and tested, even if no study artifact is produced yet.
- Stop if the work starts redesigning the entire harvest/metabolism system instead of adding one parallel resource channel.

### Bet 2: [validate] Run 2×2 Factorial Pilot: Encounter Topology × Resource Layers At Canonical Horizon
Run a small factorial comparison (dominant vs. pairwise encounter × single-resource vs. dual-resource) at the canonical 4000-step horizon with matched null, testing whether mechanism combinations produce synergistic coexistence gains.

#### Success Evidence
- One artifact comparing four conditions (dominant+single, dominant+dual, pairwise+single, pairwise+dual) with active-clade deltas, persistence, and abundance-weighted metrics at the canonical 4000-step horizon.
- Includes species-conditioned relabel null for each condition.

#### Stop Conditions
- Stop after one 2×2 factorial artifact, even if results show no interaction effect.
- Stop if dual-resource is not yet implemented; defer this bet to a future session.

### Bet 3: [investigate] Diagnose Pairwise Nullity: Dominance Hierarchy Stability Versus Energy Transfer Magnitude
The pairwise operator produced zero differentiation despite structural differences. Run targeted diagnostics to measure whether: (1) aggression hierarchies remain stable across resolution orders, (2) per-pair energy transfer magnitudes are too small to affect survival, or (3) spatial/demographic homogeneity prevents interaction diversity.

#### Success Evidence
- One diagnostic artifact measuring aggression-rank stability, mean per-encounter transfer magnitude, and spatial clustering of high-aggression agents for both dominant and pairwise operators.
- Clear statement of which mechanism explains the null result.

#### Stop Conditions
- Stop after one diagnostic artifact with clear causal identification.
- Stop if the work starts redesigning encounter resolution instead of measuring existing behavior.

### Bet 4: [validate] Re-run Pairwise Comparison At Canonical 4000-Step Horizon With Matched Config
The encounter operator comparative study ran at 100 steps with short burn-in, far below the canonical 4000-step horizon. Re-run the comparison at the canonical horizon with matched configuration to test whether differentiation emerges in slow-forming coexistence regimes.

#### Success Evidence
- One artifact comparing dominant versus pairwise at 4000 steps with the canonical founder-grace configuration stack, including species-conditioned relabel null.

#### Stop Conditions
- Stop after one long-horizon comparative artifact.
- Stop if the work starts tuning additional parameters instead of matching the canonical configuration exactly.

## Assumptions / Unknowns
- Assumption: dual-resource partitioning is simpler to implement than spatial refugia, behavioral complexity, or recombination, and provides the cleanest test of whether substrate heterogeneity unlocks interaction-topology gains.
- Unknown: whether pairwise topology differentiates at the canonical 4000-step horizon or whether the 100-step validation was long enough to capture steady-state outcomes.
- Unknown: whether the pairwise nullity is due to stable dominance hierarchies, negligible transfer magnitudes, or homogeneous spatial distribution.
- Observation: the dominant exploration axis remains planner governance (5/10 commits), while mechanism-composition experiments and long-horizon comparative studies remain at zero despite the literature emphasizing emergent gains from mechanism combinations.
