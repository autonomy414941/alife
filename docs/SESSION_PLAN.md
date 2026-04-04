# Session Plan — 2026-04-04

## Compact Context
- April 3 wired context-dependent phenotype realization into live harvest decisions, added local observation summaries, and implemented richer policy-context matching validation
- Action-selection loci are now quarantined from distance calculations (zero weights) because they remain unused by the live simulation turn loop
- The multi-horizon April 2 artifact found 104 positive horizon effects with the strongest signal at `strict|guarded|primary` (+0.0661 survival at +20 ticks)
- Movement and offspring settlement still optimize ground-truth ecology scores rather than sensed observations
- The April 3 richer-context matching artifact exists but needs analysis to determine whether April 2 survival gains persist

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique and planning | 2 | c63a3f5, 4e5631d |
| Policy validation and context matching | 2 | 4ec0e97, 8e9c4f1 |
| Context-dependent phenotype realization | 2 | 5a4ffce, f214df5 |
| Live mechanism activation | 2 | d0d7b7b, e379533 |
| Multi-horizon credit assignment | 1 | 91abe10 |
| Action model expansion | 1 | 98e57ac |

Dominant axis: tie between structural critique/planning, policy validation, context realization, and live activation (2/10 each)
Underexplored axes: Multi-horizon credit assignment, Action model expansion, Replay infrastructure, Perception layers

## Project State
- April 3 successfully activated context-dependent harvest expression in the live simulation loop and added local observation summaries to every agent
- The quarantine commit explicitly separated dormant action-selection loci from active behavioral loci by zeroing their distance weights
- A new richer-context matching validation artifact was generated on April 3 but has not yet been analyzed to determine whether April 2 multi-horizon gains survive
- The main gap is now converting the added observation infrastructure into a perception layer that drives spatial choice under partial observability

## External Context
- Guided Policy Optimization under Partial Observability (arXiv:2505.15418, 2025, https://arxiv.org/html/2505.15418): co-trains a privileged guider and a constrained learner, where the guider uses full state while ensuring alignment with the learner's partial-observability policy, achieving comparable optimality to direct RL
- Active Vision Reinforcement Learning under Limited Visual Observability (NeurIPS 2023, https://proceedings.neurips.cc/paper_files/paper/2023/file/20e6b4dd2b1f82bc599c593882f67f75-Paper-Conference.pdf): agents learn simultaneous task and sensory control policies under partial observability; sensory limitations force active perception behavior that can improve generalization

## Research Gaps
- Does the April 3 richer-context matching validation confirm or falsify the April 2 multi-horizon survival advantages, now that matching includes richer local observation state?
- Can spatial choice driven by limited sensed observations rather than ground-truth ecology scores produce context-conditional movement advantages once perception quality becomes evolvable?

## Current Anti-Evidence
- The strongest current reason the project cannot yet claim adaptive policy-driven diversification is that movement and offspring settlement still read perfect-information ground-truth ecology (fertility, crowding, lineage occupancy) instead of limited sensed observations, so the architecture cannot test whether perception-driven behavior outperforms omniscient choice
- The April 3 richer-context matching artifact has not yet been analyzed to determine whether the April 2 multi-horizon survival positives survive the new matching logic, so the current positive evidence remains unverified

## Bet Queue

### Bet 1: [validate] Analyze Richer-Context Matching Artifact
Read and interpret the April 3 `policy_rich_context_matching_validation_2026-04-03.json` artifact to determine whether the strongest April 2 multi-horizon survival-positive signatures remain positive under richer-context matching, or whether the new matching reveals the earlier gains as matching artifacts.

#### Success Evidence
- A concise written interpretation or structured summary stating which signatures remained positive, which weakened, and by how much
- Direct answer on whether the April 2 +0.0661 survival advantage at +20 ticks persists or disappears under richer matching

#### Stop Conditions
- Stop after producing one clear verdict on whether April 2 gains survive April 3 matching
- Do not re-generate the artifact; only interpret the existing one

### Bet 2: [expand] Perfect-Information Spatial Choice Ceiling
Replace adult movement's direct access to ground-truth `fertility`, `crowding`, and `lineage occupancy` with reads from the agent's local observation map, so movement becomes perception-driven rather than omniscient. The goal is to make spatial choice depend on sensed state rather than hidden environment truth.

#### Success Evidence
- Code path where `pickDestination` or equivalent adult-movement logic reads from `localObservationMap` or `observationState` instead of directly accessing world resource stocks and agent counts
- Regression tests proving movement now uses sensed observations for at least fertility and crowding

#### Stop Conditions
- Stop after adult movement uses observation-driven choice for at least two decision inputs
- Do not redesign offspring settlement or the full spatial-choice architecture in this bet

### Bet 3: [expand] Evolvable Perception Quality
Add genotype traits controlling observation noise, range, or fidelity so agents can evolve different perception strategies, then test whether limited-perception agents can outperform perfect-information controls in a matched validation. The goal is to determine whether perception as an evolvable trait creates selection for robust policies.

#### Success Evidence
- New genotype loci controlling perception parameters such as observation noise, range, or channel fidelity
- Code path where observation-map population depends on agent-specific perception traits
- A bounded artifact or matched comparison showing whether limited-perception agents diverge behaviorally from omniscient controls

#### Stop Conditions
- Stop after one or two perception-quality traits exist and affect observation construction
- Do not build a full sensory-modality framework or multi-channel perception system in this bet

### Bet 4: [validate] Perception-Driven Movement Advantage
Run a bounded matched-control validation comparing movement outcomes for agents using sensed observations versus agents using ground-truth ecology scores, focusing on settlement success, survival, or descendant outcomes. The goal is to test whether partial observability creates different adaptive landscapes.

#### Success Evidence
- New artifact comparing perception-driven versus omniscient movement under matched contexts
- Direct answer on whether perception-driven movement shows positive, neutral, or negative survival or descendant advantages relative to perfect-information baseline

#### Stop Conditions
- Stop after one bounded perception-versus-omniscient comparison exists
- Do not expand to full multi-horizon or replay-branch validation in this bet

## Assumptions / Unknowns
- Assumption: the April 3 richer-context matching used sufficiently different logic from April 2 coarse bins that it can falsify or confirm the multi-horizon gains
- Assumption: spatial choice is a high-leverage decision surface where perception-driven behavior can diverge meaningfully from perfect-information behavior
- Unknown: whether evolvable perception quality requires explicit genotype traits immediately, or whether fixed moderate noise is enough for a first perception-driven test
- Unknown: whether observation-driven movement will immediately show advantages or whether it will require additional operators (settlement, harvest, encounter) to also become perception-driven before selection can favor robust perception strategies
