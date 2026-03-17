# Session Plan — 2026-03-17

## Compact Context
- Agents now have internal dual-resource pools (`energyPrimary`, `energySecondary`) that preserve source identity through metabolism and reproduction (`c5cb3eb`).
- Metabolism and reproduction costs are composition-agnostic (equal scalar scaling regardless of pool mix).
- Non-transitive encounter operator implemented (`4bd9349`), pairwise and dominant operators validated at canonical horizon.
- Trajectory metrics (area under curve, innovation median lifespan, regime switches) now exported (`891b38c`, `766c205`).
- No configuration beats species-conditioned relabel null in absolute active clades; canonical founder-grace sits at `-25.75`.
- Package manager is npm (`package-lock.json`).

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Mechanism implementation (substrate / operators) | 4 | 4bd9349, c5cb3eb, 0a069b9, 242d31b |
| Structural diagnosis (Critic / diagnostics) | 3 | 56a58f8, 85a4c34, 55f33e7, 5b7056a |
| Validation study (comparative / horizon) | 2 | 1d4c357, 886e509 |
| Trajectory metrics / export | 2 | 766c205, 891b38c |
| Planner governance | 2 | 8f6d22f, 973a230 |
| Code refactoring | 1 | b68d34d |
| Scalability measurement | 1 | 24820b3 |

Dominant axis: Mechanism implementation (4/10)
Underexplored axes: mechanism-combination experiments (0 commits), factorial comparative studies, composition-dependent physiology

## Project State
- The dual-resource substrate now preserves source identity internally (agents retain separate `energyPrimary` and `energySecondary` pools), but downstream physiology (metabolism, reproduction) remains composition-agnostic.
- Three encounter operators exist (dominant, pairwise, non-transitive), but comparative studies confirm pairwise produces zero delta versus dominant at canonical 4000-step horizon.
- Trajectory metrics are implemented but not yet used in mechanism-combination experiments.
- Recent sessions built substrate and operator diversity but have not tested whether combinations produce synergistic gains.

## External Context
- [Species coexistence as an emergent effect of interacting mechanisms](https://www.sciencedirect.com/science/article/pii/S0040580924001084) (Theoretical Population Biology, 2025): Mechanism combinations extend coexistence more than tenfold compared to singular mechanisms. The particular combination of mechanisms and their interactions appears vital for biodiversity.
- [Functional coexistence theory: Identifying mechanisms linking biodiversity and ecosystem function](https://esajournals.onlinelibrary.wiley.com/doi/10.1002/ecm.70033) (Ecological Monographs, 2025): Three core coexistence mechanisms—storage effect, intransitivity, and resource partitioning—are supported.
- [A practical guide to characterising ecological coexistence](https://doi.org/10.1111/brv.70079) (Biological Reviews, 2026): Recent integrative framework for characterizing coexistence mechanisms.

## Research Gaps
- Does composition-dependent metabolism or reproduction (e.g., requiring minimum primary and secondary thresholds, or penalizing imbalanced pools) enable resource-partitioning tradeoffs that composition-agnostic physiology cannot express?
- Do mechanism combinations (encounter topology × resource substrate × composition-dependent costs) produce emergent coexistence gains at canonical horizon?

## Current Anti-Evidence
- Internal pool preservation alone is insufficient: the diagnostics confirmed that "metabolism and reproduction costs are still composition-agnostic, so the redesign preserves source identity without yet imposing source-specific physiological tradeoffs."
- Pairwise versus dominant encounter operators produce zero delta at canonical horizon (both converge to single active clade).
- Non-transitive operator is implemented but untested in long-horizon comparative studies.
- No configuration has produced positive absolute active-clade deltas versus species-conditioned null.

## Bet Queue

### Bet 1: [expand] Implement Composition-Dependent Physiology to Enable Partitioning Tradeoffs
The dual-resource substrate preserves internal pool identity, but metabolism and reproduction remain composition-agnostic. Implement composition-dependent costs (e.g., reproduction requires minimum thresholds in both pools, or metabolism penalizes imbalanced compositions based on genome-defined target ratios) to enable genuine partitioning tradeoffs where specialists and generalists face different viability constraints.

#### Success Evidence
- New `SimulationConfig` field (e.g., `compositionDependentReproduction` or `metabolicBalancePenalty`) that makes reproduction or metabolism depend on internal pool structure, not just total energy.
- Unit tests demonstrating that specialists with imbalanced pools face different viability than generalists with matched total energy.
- Existing tests pass.

#### Stop Conditions
- Stop after one composition-dependent mechanism is implemented and tested.
- Stop if the implementation starts redesigning the entire physiology layer instead of adding one targeted constraint.

### Bet 2: [validate] Run 2×2 Factorial: Encounter Topology × Composition-Dependent Costs at Canonical Horizon
Test whether the combination of non-transitive encounter topology plus composition-dependent reproduction produces synergistic coexistence gains that neither mechanism produces alone, using canonical 4000-step horizon with matched null.

#### Success Evidence
- Factorial artifact comparing four conditions: (1) dominant + composition-agnostic, (2) dominant + composition-dependent, (3) non-transitive + composition-agnostic, (4) non-transitive + composition-dependent.
- Uses dual-resource substrate (`maxResource2 > 0`, `resource2Regen > 0`).
- Reports active-clade deltas, trajectory metrics (area under curve, regime switches), and abundance-weighted persistence.

#### Stop Conditions
- Stop after one 2×2 factorial artifact, even if results show no interaction effect.
- Stop if Bet 1 is incomplete; defer to next session.

### Bet 3: [validate] Run Non-Transitive Operator Long-Horizon Validation
The non-transitive operator is implemented and unit-tested but not validated at canonical 4000-step horizon. Run a comparative study (non-transitive vs dominant) with matched null to test whether intransitivity breaks dominance-hierarchy convergence under the current substrate.

#### Success Evidence
- Canonical-horizon artifact comparing non-transitive versus dominant operators with species-conditioned relabel null.
- Uses founder-grace configuration (matched to existing canonical artifacts).
- Reports active-clade deltas, aggression hierarchy stability, and trajectory metrics.

#### Stop Conditions
- Stop after one comparative horizon artifact, even if non-transitive shows zero delta versus dominant.
- Stop if the run reveals that non-transitive is structurally equivalent to pairwise under current physiology; document findings.

### Bet 4: [expand] Add Substrate-Specific Observability Metrics to Study Exports
Current study exports report `meanEnergy`, activity, and turnover but do not distinguish internal pool composition, per-layer harvest dependence, or taxon-level substrate specialization. Add substrate-specific metrics (mean primary-energy share, per-clade substrate dependence, specialization-stratified pool balance) so mechanism-combination studies can detect partitioning invisible to scalar summaries.

#### Success Evidence
- New `StepSummary` or analytics fields: `meanPrimaryEnergyShare`, `meanSecondaryEnergyShare`, per-clade harvest-efficiency distributions.
- Existing relabel-null or factorial artifacts re-exported with substrate metrics included.
- All existing tests pass.

#### Stop Conditions
- Stop after substrate observability metrics are wired and one baseline artifact is refreshed.
- Stop if the work starts redesigning the entire export surface instead of adding 2-3 new substrate-focused fields.

## Assumptions / Unknowns
- Assumption: composition-dependent physiology is a prerequisite for resource-partitioning tradeoffs under the current dual-pool substrate.
- Unknown: whether composition-dependent costs alone enable coexistence gains, or whether they only express gains when combined with encounter-topology diversity.
- Unknown: whether non-transitive encounter operator differentiates from dominant under dual-resource substrate or whether it remains structurally equivalent under fungible-energy composition-agnostic costs.
- Observation: mechanism-combination experiments remain at zero commits despite literature emphasis and March 17 agenda pivot, while mechanism implementation (4/10) and structural diagnosis (3/10) dominate recent activity.
