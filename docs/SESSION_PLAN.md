# Session Plan — 2026-03-16

## Compact Context
- Dual-resource substrate landed (`0a069b9`): cells have `resources` and `resources2` with independent regeneration, agents have `harvestEfficiency2` genome axis, harvest operates through efficiency-weighted shares.
- Canonical 4000-step pairwise comparison confirmed zero differentiation (`1d4c357`): both dominant and pairwise operators produce identical active-clade deltas (0 at all thresholds).
- Nullity diagnostics (`55f33e7`) identified the cause: energy transfers identical (delta 0.005), aggression hierarchies stable (Kendall tau ~0.65), spatial clustering unchanged — encounter order does not affect who wins under fungible energy.
- No tested configuration beats species-conditioned relabel null in absolute active clades; canonical founder-grace sits at `-25.75`.
- Package manager is npm (`package-lock.json`).

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural diagnosis / Critic | 2 | 5b7056a, a949e26 |
| Mechanism validation (long-horizon comparative) | 1 | 1d4c357 |
| Diagnostic investigation | 1 | 55f33e7 |
| Substrate expansion (dual-resource) | 1 | 0a069b9 |
| Planner governance | 1 | 8f6d22f |
| Code modularization | 1 | b68d34d |
| Scalability measurement | 1 | 24820b3 |
| Mechanism validation (micro-horizon) | 1 | 886e509 |
| Alternative mechanism implementation | 1 | 242d31b |

Dominant axis: Structural diagnosis / Critic (2/10)
Underexplored axes: mechanism-combination experiments (0 commits despite literature emphasis and agenda pivot), trajectory metrics, non-transitive encounter operators

## Project State
- The encounter operator seam is stable with two implementations (dominant, pairwise), validated at canonical 4000-step horizon.
- The dual-resource substrate is implemented but untested in comparative studies — no 2×2 factorial (topology × substrate) has been run.
- The Critic identified Energy Metabolism Fungibility and Encounter Resolution Invariance as structural ceilings: under one fungible internal energy pool, encounter topology changes accounting sequence but not outcomes.
- Recent sessions built two mechanism slots (encounter operators, resource substrates) but have not yet tested whether their combination produces synergistic coexistence gains.

## External Context
- [Species coexistence as an emergent effect of interacting mechanisms](https://www.sciencedirect.com/science/article/pii/S0040580924001084) (Theoretical Population Biology, 2025): Significant emergent effects occur for mechanism combinations, with coexistence times extended more than tenfold compared to individual mechanisms. Studies of individual coexistence mechanisms might be insufficient and misleading for quantifying their overall impact on biodiversity.
- [Multispecies Coexistence Emerges From Pairwise Exclusions in Communities With Competitive Hierarchy](https://onlinelibrary.wiley.com/doi/10.1111/ele.70206) (Ecology Letters, 2025): Emergent coexistence—where multispecies persistence occurs without pairwise coexistence—can arise without intransitivity, with competitive hierarchy and simple trade-offs producing emergent multispecies persistence.
- [Functional coexistence theory: Identifying mechanisms linking biodiversity and ecosystem function](https://esajournals.onlinelibrary.wiley.com/doi/10.1002/ecm.70033) (Ecological Monographs, Jan 2025): Three coexistence mechanisms are supported: storage effect, intransitivity, and resource partitioning.

## Research Gaps
- Does the combination of pairwise encounter topology plus dual-resource partitioning produce synergistic coexistence gains that neither mechanism produces alone?
- Is the dual-resource substrate implemented with fungible internal energy (harvested resources immediately collapse into one scalar), or does it preserve resource-type identity through metabolism to enable genuine partitioning tradeoffs?

## Current Anti-Evidence
- Pairwise encounter operator produced zero delta versus dominant at canonical 4000-step horizon with matched null.
- The Critic's backlog item [Encounter Resolution Invariance Under Fungible Energy] states: "Under fungible internal energy, encounter topology only changes accounting sequence, not who wins or loses — aggressive agents always extract energy from less-aggressive agents at the same per-encounter rate regardless of resolution order, and extracted energy is indistinguishable from harvested energy once inside the winner."
- The backlog item [Energy Metabolism Fungibility] states: "Energy gained from resource1 is indistinguishable from energy gained from resource2 once inside the agent — specialists and generalists converge to the same internal state if total energy income matches."
- No configuration has yet produced positive absolute active-clade deltas versus species-conditioned null.

## Bet Queue

### Bet 1: [investigate] Verify Resource-Identity Preservation Through Metabolism
The dual-resource substrate is implemented, but the Critic flagged that agents have only one fungible `energy` scalar. Verify whether harvested resource1 and resource2 remain distinct through metabolism or collapse into one indistinguishable pool, and measure whether specialists versus generalists show metabolic differentiation beyond harvest timing.

#### Success Evidence
- One diagnostic artifact measuring: (1) whether agents retain separate energy pools derived from resource1 versus resource2, (2) whether metabolism/reproduction costs differ by internal resource composition, (3) whether specialist (high `harvestEfficiency2`) versus generalist (balanced `harvest` and `harvestEfficiency2`) phenotypes show distinct internal states at matched total energy.
- Clear statement of whether the current implementation supports metabolic partitioning tradeoffs or collapses to fungible energy.

#### Stop Conditions
- Stop after one diagnostic artifact with clear structural assessment.
- Stop if the investigation reveals that the substrate requires redesign; document findings and defer implementation to next session.

### Bet 2: [validate] Run 2×2 Factorial Pilot: Encounter Topology × Resource Substrate At Canonical Horizon
Run a minimal factorial comparison (dominant vs. pairwise encounter × single-resource vs. dual-resource) at the canonical 4000-step horizon with matched founder-grace configuration and species-conditioned relabel null, testing whether mechanism combinations produce synergistic gains.

#### Success Evidence
- One artifact comparing four conditions with active-clade deltas, persistence, and abundance-weighted metrics.
- Dual-resource condition uses non-zero `maxResource2` and `resource2Regen` with agents carrying `harvestEfficiency2`.
- Includes species-conditioned relabel null for each condition.

#### Stop Conditions
- Stop after one 2×2 factorial artifact, even if results show no interaction effect.
- Stop if Bet 1 reveals that dual-resource requires structural changes; defer to next session.

### Bet 3: [expand] Add Trajectory Quality Metrics Beyond Final-State Summaries
Current studies export final active-clade counts, persistence windows, and turnover. Add first-class trajectory metrics (area under active-clade diversity curve, innovation survival curves, regime-switch counts) to detect interventions that create repeated innovations or long transient scaffolding invisible to endpoint snapshots.

#### Success Evidence
- New study export fields: `activeCladeAreaUnderCurve`, `innovationSurvivalCurve` (e.g., median lifespan by birth cohort), `regimeSwitchCount` (count of tick-to-tick increases in active clades after drops).
- Existing relabel-null artifacts re-exported with trajectory metrics included.
- All existing tests pass.

#### Stop Conditions
- Stop after trajectory metrics are wired and one baseline artifact is refreshed.
- Stop if the work starts redesigning the entire study surface instead of adding 2-3 new summary fields.

### Bet 4: [feat] Implement Non-Transitive Encounter Operator to Stress-Test Mechanism Slot
The encounter operator seam has two implementations (dominant, pairwise) that produce identical outcomes. Add a third operator with fundamentally different structure (e.g., Rock-Paper-Scissors non-transitivity based on genome distance or trait thresholds) to verify the abstraction is stable and test whether intransitivity breaks dominance-hierarchy convergence.

#### Success Evidence
- New `EncounterOperator` implementation in `src/encounter.ts` with non-transitive resolution logic.
- Unit tests demonstrating that A beats B, B beats C, C beats A under specific genome configurations.
- Existing dominant and pairwise operators unchanged, all tests pass.

#### Stop Conditions
- Stop after the third operator is implemented and tested, even if no comparative study artifact is produced yet.
- Stop if non-transitivity cannot be cleanly expressed within the current `EncounterOperator` interface; document the blocker.

## Assumptions / Unknowns
- Assumption: verifying resource-identity preservation is cheaper than implementing a 2×2 factorial on potentially-broken substrate.
- Unknown: whether the dual-resource substrate preserves resource-type identity through metabolism or immediately collapses harvested resources into fungible energy.
- Unknown: whether a 2×2 factorial at canonical horizon will show interaction effects or whether both mechanisms remain individually and jointly null under the current physiology.
- Observation: mechanism-combination experiments remain at zero commits despite literature emphasis and the March 17 research agenda pivot, while planner governance and critic diagnostics dominate recent activity (3/10 commits).
