# Session Plan — 2026-03-26

## Compact Context
- March 25 unified policy parameters into `genomeV2.traits`; policy divergence now contributes to speciation/cladogenesis distance
- March 26 extended graded sigmoid gates to movement (energy reserve and recent harvest thresholds)
- Harvest policy still uses binary substrate ratio; it is the last remaining non-graded decision surface
- Revalidation showed graded reproduction degraded after unification (births 2049→1210 at steepness 1.0), while spending policy preserved exactly
- Unbounded policy thresholds can dominate distance: reproduction_harvest_threshold 0→10 contributes 10 units vs max morphology 3 units

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural ceiling identification | 2 | c88018c |
| Graded policy expansion | 2 | fe0e302 |
| Policy-genome unification validation | 2 | 190ee83 |
| Policy-genome integration | 2 | e2f5109 |
| Behavioral policy mechanism rollout | 2 | 45121f6 |
| Graded harvest policy | 0 | none |
| Policy-distance weighting | 0 | none |
| Null-baseline policy preservation | 0 | none |

Dominant axis: No single axis dominates (5 axes at 2 commits each)
Underexplored axes: Graded harvest policy, Policy-distance weighting, Null-baseline policy preservation

## Project State
- Policy-genome unification complete: all policy parameters are `genomeV2.traits` loci
- Graded policies exist for reproduction (steepness-controlled sigmoid) and movement (energy + harvest thresholds)
- Focused tests confirm policy divergence crosses speciation/cladogenesis thresholds
- Main underdeveloped areas: (1) harvest policy remains binary, (2) unbounded policy traits may dominate morphology in distance, (3) graded reproduction surface degraded after unification

## External Context
- [Frontiers in Robotics and AI, 2025](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1668910/full): Embodied intelligence systems use three-layer framework integrating multimodal perception, world modeling, and structured strategies; adaptive environment generation adapts difficulty to agent capabilities via closed-loop feedback
- [Nature Communications, 2021](https://www.nature.com/articles/s41467-021-25874-z): Embodied intelligence via learning and evolution shows that morphology and control co-evolve to solve tasks
- [IET Control Theory, 2026](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/cth2.70099): Specialized deep residual policy reinforcement learning uses sigmoid-based adaptive activation for safe continuous control; gradient-descent tuning evolves activation functions to task-specific forms
- [arXiv, 2026](https://arxiv.org/abs/2602.06366): Adaptive environment generation for embodied agents uses fine-grained performance feedback beyond binary success/failure and closed-loop adaptation mechanisms

## Research Gaps
- Can graded harvest policies (smooth substrate effort allocation vs binary ratios) create measurable fitness differentiation or niche partitioning?
- Does unbounded policy trait variance systematically drown out morphological distance in speciation thresholds, creating policy-dominated taxonomic splits that ignore morphology?

## Current Anti-Evidence
- Policy-genome unification altered graded reproduction surface dynamics (births 2049→1210, steepness 5.0 births 203→7), suggesting the refactor changed evolutionary behavior beyond storage location despite substrate spending remaining unchanged
- Unbounded policy thresholds contribute disproportionately to distance: `reproduction_harvest_threshold` 0→10 produces 10-unit contribution while maximum morphological divergence across all three core traits is 3 units, meaning policy-only splits can occur while morphology remains near-identical

## Bet Queue

### Bet 1: [expand] Extend graded policy gates to harvest
Apply sigmoid or graded intensity modulation to harvest substrate preference instead of using a fixed binary ratio. Replace `harvest_secondary_preference` as a static allocation coefficient with a dynamic graded surface that modulates harvest effort or substrate choice probability based on threshold and steepness parameters.

#### Success Evidence
- Harvest policy uses graded activation (sigmoid, linear ramp, or smooth intensity function) with heritable steepness parameter
- Focused tests confirm gradient behavior across steepness values for harvest decisions
- One bounded smoke study shows measurable variation in substrate intake distributions under different steepness settings

#### Stop Conditions
- Stop after harvest has one graded surface; do not add new observability inputs or redesign resource dynamics
- Do not extend graded gates to other decision surfaces in the same bet

### Bet 2: [validate] Diagnose graded reproduction degradation after unification
Investigate why graded reproduction surface degraded (births 2049→1210 at steepness 1.0, 203→7 at steepness 5.0) while substrate spending preserved exactly. Compare mutation, inheritance, and decision-gating code paths for reproduction vs spending to identify mechanism differences.

#### Success Evidence
- Documented root cause of reproduction degradation (mutation rate, inheritance pattern, threshold resolution, or RNG seeding difference)
- Artifact under `docs/` comparing reproduction and spending code paths with hypothesis about divergence source
- If fixable without breaking other mechanisms, a targeted fix with before/after validation

#### Stop Conditions
- Stop after identifying root cause or documenting that degradation is expected evolutionary consequence, not a bug
- Do not redesign entire policy mutation or inheritance system in this bet

### Bet 3: [validate] Add per-locus distance weights to genomeV2Distance
Introduce configurable distance weights for policy vs morphological traits to prevent unbounded policy thresholds from systematically dominating speciation/cladogenesis thresholds. Test whether weighted distance preserves policy-driven splits while allowing morphology to co-contribute.

#### Success Evidence
- `genomeV2Distance()` accepts optional per-locus or per-category weights (morphology, policy thresholds, policy bounded traits)
- Focused tests show that weighted distance can balance policy and morphology contributions
- One bounded smoke study compares unweighted vs weighted distance in taxonomic split distributions

#### Stop Conditions
- Stop after weighted distance mechanism exists and is validated in focused tests
- Do not retune all experiments or redesign speciation/cladogenesis thresholds in this bet

### Bet 4: [validate] Test graded harvest policy fitness differentiation
Run bounded pilot comparing graded harvest (varying steepness) against fixed binary harvest to measure whether smooth substrate-choice surfaces create measurable fitness advantages, niche partitioning, or ecological differentiation.

#### Success Evidence
- Bounded pilot (2-4 seeds, 100-200 steps) comparing graded harvest at multiple steepness values against binary baseline
- Artifact under `docs/` showing harvest intake distributions, survival, reproductive output, or diversity metrics by steepness
- Clear statement of whether graded harvest creates measurable fitness signal or remains neutral

#### Stop Conditions
- Stop after bounded pilot with 2-4 steepness levels and 2-4 seeds
- Do not run full-horizon studies or expand to multi-factorial panels

## Assumptions / Unknowns
- Assumption: graded harvest policy is the highest-leverage next expansion because it closes the last binary decision surface and harvest is central to substrate niche partitioning
- Assumption: unbounded policy trait dominance is a structural issue requiring distance weighting, not a sign that policies should be re-bounded
- Unknown: whether graded reproduction degradation is a bug (wrong mutation rate, inheritance error) or an expected evolutionary consequence of genome-backed vs legacy policyState dynamics
- Unknown: whether graded harvest will show fitness differentiation similar to graded reproduction or remain neutral like binary harvest-only policies
