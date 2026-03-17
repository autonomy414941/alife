# Session Plan — 2026-03-18

## Compact Context
- Composition-dependent reproduction landed: `canReproduce()` requires minimum 30% primary and 30% secondary energy fractions.
- Substrate observability metrics wired: exports now include pool-composition summaries.
- Non-transitive encounter operator validation completed: zero delta versus dominant at canonical 4000-step horizon (both converge to single active clade).
- Factorial study code exists (`src/clade-activity-relabel-null-encounter-topology-composition-cost-factorial-study.ts`) but artifact missing—execution is the critical decision point.
- All tests pass (47 files, 231 tests, March 18).
- Package manager is npm.

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Mechanism implementation | 5 | fc23956, 41e37c1, 4bd9349, c5cb3eb, 0a069b9 |
| Validation studies | 3 | 584d70e, 1d4c357, 55f33e7 |
| Structural diagnosis | 3 | 3c0b7ed, 56a58f8, 5b7056a |
| Trajectory metrics | 2 | 766c205, 891b38c |
| Infrastructure / refactoring | 2 | 39dd4d7, b68d34d |
| Planner governance | 1 | 749cab3 |
| Scalability measurement | 1 | 85a4c34 |

Dominant axis: Mechanism implementation (5/10)
Underexplored axes: structural expansion (0 commits), complexity-ratchet infrastructure (0 commits)

## Project State
- Infrastructure phase complete: composition-dependent costs implemented, non-transitive operator validated (nullity confirmed), substrate observability wired, trajectory metrics exportable.
- Factorial code landed (commit 39dd4d7) but has not run—no artifact exists under `docs/`.
- Recent commit messages confirm nullity findings: non-transitive operator shows "zero active-clade delta improvement (0.00) across all conditions" and "converges to single active clade identical to dominant operator, confirming structural equivalence under composition-agnostic physiology."
- The backlog contains 14 Critic-flagged structural ceiling items spanning six dimensions (Representational Capacity, Behavioral Control, Inheritance Architecture, Interaction Richness, Environmental Complexity, Evolutionary Mechanisms).
- Zero commits on structural expansion in last 20 commits despite literature emphasis on complexity ratchet and open-endedness requiring unbounded complexity increase.

## External Context
- [The Complexity Ratchet: Stronger than Selection, Stronger than Evolvability, Weaker than Robustness](https://direct.mit.edu/artl/article/26/1/38/93265/The-Complexity-Ratchet-Stronger-than-Selection) (Artificial Life, 2020): Using the Aevol platform, researchers found that organisms become complex although such organisms are less fit than simple ones, demonstrating a complexity ratchet that operates independently of selection. An open question is whether the complexity ratchet could contribute to open-ended evolution, opening the door for non-selectively-driven open-endedness.
- [Automating the Search for Artificial Life with Foundation Models](https://arxiv.org/html/2412.17799v2) (arXiv, 2024): Automated Search for Artificial Life (ASAL) enables foundation models to identify interesting ALife simulations producing temporally open-ended novelty. ASAL discovered previously unseen lifeforms and expanded the frontier of emergent structures, revealing that automated search can identify life-like cellular automata which are open-ended.
- [Towards open-ended dynamics in Artificial Life](https://theses.hal.science/tel-05137835v1/file/HAMON_GAUTIER_2025.pdf) (PhD thesis, 2025): Open-ended evolution describes systems where continual generation of novelty and unbounded increase in complexity characterize evolution on multiple scales. The thesis explores conditions for open-endedness in computational systems.

## Research Gaps
- Does the 2×2 factorial (encounter topology × composition-dependent costs) produce synergistic coexistence gains that neither mechanism produces in isolation, or does nullity persist across all four conditions?
- If the factorial shows null across all conditions, which of the 14 Critic-flagged structural ceiling items offers the highest leverage for enabling complexity ratchet and open-ended novelty generation?

## Current Anti-Evidence
- Non-transitive operator validation confirmed zero delta: "both converge to single active clade" and "structural equivalence under composition-agnostic physiology."
- Composition-dependent reproduction gates eligibility but does not alter metabolism, movement cost, encounter transfers, or disturbance impacts—all still key off total energy only.
- The genome remains three mutable axes (`metabolism`, `harvest`, `aggression`) plus optional `harvestEfficiency2`; all other ecological roles are derived scalars computed from these axes.
- No configuration has produced positive absolute active-clade deltas versus species-conditioned relabel null.

## Bet Queue

### Bet 1: [validate] Execute 2×2 Factorial and Generate Decision Artifact
Run the encounter-topology × composition-cost factorial study at canonical 4000-step horizon to test whether mechanism combinations produce synergistic coexistence gains. The study code exists; execution is the decision point. If all four conditions show null results (zero interaction effect, zero absolute gains versus null), this confirms that the current expressiveness ceiling (three-axis genome, composition-agnostic metabolism except reproductive gating, fungible total-energy physiology) structurally caps partitioning tradeoffs regardless of constraint tuning.

#### Success Evidence
- Artifact at `docs/clade_activity_relabel_null_encounter_topology_composition_cost_factorial_horizon_2026-03-18.json`.
- Four conditions tested: (1) dominant + agnostic, (2) dominant + dependent, (3) non-transitive + agnostic, (4) non-transitive + dependent.
- Reports interaction effects on active-clade delta, abundance-weighted activity, area under curve, innovation median lifespan, regime switches.

#### Stop Conditions
- Stop after one factorial artifact, even if results show null across all conditions.
- Stop if execution exceeds 2 hours wall time; document partial results if available.

### Bet 2: [synthesize] Write Structural-Expansion Decision Memo if Factorial Shows Null
If Bet 1 confirms null results across all four factorial conditions, write a decision memo analyzing the 14 Critic-flagged structural ceiling items and recommending the highest-leverage expansion for enabling complexity ratchet and open-ended novelty generation. The memo should evaluate each item against three criteria: (1) unblocks cumulative innovation (not just parameter retuning), (2) aligns with recent ALife literature on complexity ratchet and open-endedness, (3) implementable within one-month horizon without full architecture redesign.

#### Success Evidence
- Markdown document at `docs/structural_expansion_decision_memo_2026-03-18.md`.
- Evaluates at least the top 5 ceiling items from backlog against stated criteria.
- Proposes one concrete expansion with implementation sketch, expected impact on complexity ratchet, and connection to open-endedness literature.

#### Stop Conditions
- Only execute if Bet 1 shows null results.
- Stop after recommending one expansion; do not begin implementation.

### Bet 3: [investigate] Analyze Factorial Mechanism Interactions if Non-Null
If Bet 1 shows non-null interaction effects or absolute gains, write diagnostic analysis explaining which mechanism combination produced gains, why the interaction was synergistic, and what substrate or physiological properties enabled the partitioning tradeoffs to express. Compare internal pool composition, aggression hierarchy stability, and spatial clustering across the four conditions to identify causal channels.

#### Success Evidence
- Markdown document at `docs/factorial_mechanism_interaction_analysis_2026-03-18.md`.
- Compares pool-composition metrics, encounter-transfer distributions, and aggression hierarchies across all four conditions.
- Identifies which physiological or behavioral channel enabled composition-dependent costs to differentiate outcomes.

#### Stop Conditions
- Only execute if Bet 1 shows non-null results (interaction effect or absolute gain > 0).
- Stop after identifying causal channel; do not begin follow-up experiments.

### Bet 4: [validate] Refresh Canonical Baseline Artifact with Substrate Metrics
The canonical founder-grace artifact predates substrate observability (commit fc23956). Refresh the baseline to include pool-composition, per-clade substrate dependence, and specialization-stratified metrics, ensuring future comparisons can detect resource-partitioning signals invisible to scalar energy summaries.

#### Success Evidence
- Updated artifact at `docs/clade_activity_relabel_null_founder_grace_ecology_gate_horizon_2026-03-18.json`.
- Includes new substrate metrics: mean primary/secondary energy share, per-clade harvest-efficiency distributions.
- Uses same configuration as March 15 baseline (founder grace, ecology gate, canonical 4000-step horizon).

#### Stop Conditions
- Stop after one refreshed artifact.
- Stop if Bet 1 or Bet 2 consume more than 75% of session time; defer to next session.

## Assumptions / Unknowns
- Assumption: The factorial is the critical decision point—null results across all conditions justify pivoting from mechanism-combination tuning to structural expansion.
- Assumption: If the factorial shows null, the highest-leverage expansion targets Representational Capacity, Behavioral Control, or Inheritance Architecture (the three dimensions that directly control what agents can evolve, not just how existing mechanisms interact).
- Unknown: Whether the complexity ratchet requires recombination (sexual reproduction, horizontal transfer) or whether mutable controller architecture (evolvable policies, internal state) suffices for cumulative innovation.
- Unknown: Whether the ASAL automated-search paradigm could be adapted to this system, or whether search requires a richer genotype-phenotype map first.
- Observation: Mechanism implementation has dominated recent work (5/10 commits), while structural expansion remains at zero commits despite literature emphasis and Critic flagging 14 ceiling items.
