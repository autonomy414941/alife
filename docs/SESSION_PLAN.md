# Session Plan — 2026-03-25

## Compact Context
- March 24, 2026 completed four bets: reproduction-only validated over longer horizon, harvest-only diagnosed as ecological (secondary niches worse), graded reproduction surface shipped with sigmoid, spending policy landed
- `spending_secondary_preference` now controls reserve burn order; `reproduction_harvest_threshold_steepness` enables smooth probability gradients
- Policy parameters live in `policyState`, traits in `genomeV2.traits`; separate mutation, distance, observability
- Policy divergence invisible to `genomeV2Distance()`, speciation, cladogenesis, relabel-null
- Movement and harvest policies still binary; reproduction is the only graded surface

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Behavioral policy validation and reporting | 4 | 4665d4f |
| Planning and structural backlog maintenance | 3 | e0a0d36 |
| Behavioral policy mechanism rollout | 2 | d4771e7 |
| Metabolic / expenditure policy | 1 | 45121f6 |
| Policy-genome integration | 0 | none |
| Graded policy expansion | 0 | none |

Dominant axis: Behavioral policy validation and reporting (4/10)
Underexplored axes: Policy-genome integration, Graded policy expansion

## Project State
- Graded reproduction policy and spending policy both exist, are heritable, have focused tests, and show measurable gradient behavior in smoke studies
- The codebase has extensive validation artifacts (`docs/`) showing reproduction-only as weakly positive, harvest-only as ecologically detrimental
- The main underdeveloped area is policy-genome architectural split: policies and traits are separate systems despite being functionally identical (heritable scalars that mutate and affect fitness)

## External Context
- Uller et al., *Twenty years on from Developmental Plasticity and Evolution* (JEB, 2024): adaptive phenotypic plasticity can facilitate evolution by allowing organisms to express phenotypes that match local conditions, creating selection pressures that favor genetic accommodation of initially plastic responses. Source: https://charliecornwallis.github.io/Group/wp-content/uploads/2024/11/Uller-et-al.-2024-Twenty-years-on-from-Developmental-Plasticity-a.pdf
- Recent research in embodied intelligence (2025-2026) emphasizes multimodal perception, world modeling, and adaptive control for closed-loop interaction in dynamic environments, with agents learning optimal policies through experience. Sources: [Frontiers in Robotics and AI](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1668910/full), [Nature Neuroscience](https://www.nature.com/articles/s41593-025-02169-w)
- Metabolic strategy evolution research shows that species interactions and species sorting set the tempo and trajectory of evolutionary divergence, with substrate choice driving parallel evolution of regulatory loci. Source: [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0960982220313592)

## Research Gaps
- Can policy divergence drive taxonomic splits if policies become first-class genome loci that contribute to speciation distance?
- Does unifying policy and genome state reduce technical debt without breaking existing validation artifacts or test coverage?

## Current Anti-Evidence
- The strongest current anti-evidence against claiming adaptive behavioral control is that policy divergence remains invisible to taxonomic machinery: two lineages with radically different behavioral strategies (e.g., `harvest_secondary_preference` 0.9 vs 0.1) can remain classified as the same species indefinitely because `genomeV2Distance()` ignores policy state, so policy-driven niche partitioning is systematically undercounted by diversity metrics.
- Even if policies begin driving fitness advantages, the relabel-null baseline treats all clades as interchangeable regardless of policy state, washing out any policy-mediated ecological differentiation signal.

## Bet Queue

### Bet 1: [refactor] [Policy-Genome Coupling] Unify policy parameters into GenomeV2.traits
Merge `policyState` into `genomeV2.traits` so behavioral and morphological loci share one mutation operator, one distance metric, one observability surface. Deprecate `policyState` for heritable state, keeping only ephemeral memory (`last_harvest`) in `transientState`. This removes duplication and makes policy loci eligible for speciation/cladogenesis distance.

#### Success Evidence
- `POLICY_PARAMETER_KEYS` entries moved to `genomeV2.traits`, `policyState` deprecated for heritable loci
- Existing tests pass or are updated to reflect unified architecture
- `genomeV2Distance()` consumes policy loci alongside morphological traits

#### Stop Conditions
- Stop after one unified heritable-state system exists and all prior policy mechanisms still function
- Do not extend `genomeV2Distance()` weighting or add new policy loci in this bet

### Bet 2: [expand] Extend genomeV2Distance and speciation to include policy loci
Make `genomeV2Distance()` include policy trait contributions so policy divergence can trigger speciation and cladogenesis thresholds. Add per-locus distance weights if needed to prevent policy loci from dominating morphological distance.

#### Success Evidence
- `genomeV2Distance()` includes policy loci with configurable or default weights
- Focused tests show that policy divergence increments distance and can cross speciation thresholds
- One bounded smoke or pilot artifact demonstrates that policy-driven distance can create taxonomic splits under controlled conditions

#### Stop Conditions
- Stop after speciation machinery consumes unified policy-genome distance
- Do not revalidate full ecological context or redesign cladogenesis logic in this bet

### Bet 3: [validate] Test whether policy-genome unification preserves prior validation results
Re-run a subset of prior validation artifacts (reproduction-only advantage, graded sigmoid behavior, spending policy reserve retention) under the unified architecture to confirm that the refactor did not break established mechanisms or reverse prior findings.

#### Success Evidence
- At least two prior validation conclusions re-confirmed under unified policy-genome architecture
- Artifact under `docs/` comparing pre-unification and post-unification outcomes on a bounded test panel
- Clear statement of whether unification preserved, improved, or degraded prior behavioral surfaces

#### Stop Conditions
- Stop after bounded revalidation of 2-3 key prior results
- Do not run full 4000-step horizon studies or expand the validation scope beyond confirming mechanism preservation

### Bet 4: [expand] Extend graded policy gates to movement
Apply the sigmoid activation pattern from reproduction to movement policies, replacing binary blocking with smooth probability or intensity gradients controlled by threshold and steepness parameters. Movement is the natural next candidate because it already has threshold parameters and remains binary while reproduction is now graded.

#### Success Evidence
- Movement policy uses sigmoid or continuous activation with heritable steepness parameter
- Focused tests confirm gradient behavior across steepness values
- One bounded smoke study shows measurable variation in movement frequency or behavior under different steepness settings

#### Stop Conditions
- Stop after movement has one graded surface; do not extend to harvest in the same bet
- Do not redesign movement kinematics or add new observation inputs

## Assumptions / Unknowns
- Assumption: policy-genome unification is the highest-leverage refactor because it removes duplication and enables policy divergence to count toward taxonomic novelty
- Assumption: prior validation artifacts will largely survive unification because the functional mechanism (heritable scalars that mutate) remains unchanged, only the storage location shifts
- Unknown: whether policy loci should have equal distance weight to morphological loci, or whether they need separate scaling to prevent policy variance from drowning out morphology in speciation thresholds
- Unknown: whether graded movement policies will improve fitness over binary gates, or whether movement blocking is already near-optimal and smoothing the gate will just add noise
