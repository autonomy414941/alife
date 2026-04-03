# Session Plan — 2026-04-03

## Compact Context
- The April 2 multi-horizon artifact (`docs/multi_horizon_policy_credit_assignment_2026-04-02.json`) found 104 positive horizon effects, with the strongest signal at `strict|guarded|primary` and +20-tick survival advantage of +0.0661
- Action-selection loci and tests now exist, but the live simulation still does not call `selectAction` or `isActionSelectionEnabled`
- Context-dependent phenotype realization now exists in `src/phenotype.ts`, but only tests and the spike script pass ecological context into `realizePhenotype`
- Movement and offspring settlement still optimize ground-truth ecology scores, so behavior is still based on perfect information rather than sensed observations
- Replay branching, genomeV2-backed initialization, multi-tick harvest memory, and matched-control validation infrastructure all exist
- The checked-in signature-specific reproduction gate artifact is stale relative to the newer replay-branch source path, so evidence freshness needs explicit verification

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Structural critique and planning | 3 | 1cacee4 |
| Policy validation and mechanism attribution | 2 | 8e9c4f1 |
| Context-dependent phenotype realization | 1 | f214df5 |
| Action model expansion | 1 | 98e57ac |
| Multi-horizon credit assignment | 1 | 91abe10 |
| Memory and observability expansion | 1 | 7a385f5 |
| Initialization and infrastructure repair | 1 | be41147 |
| Replay and counterfactual infrastructure | 0 | none |
| Perception and sensory limitation | 0 | none |

Dominant axis: Structural critique and planning (3/10)
Underexplored axes: Context-dependent phenotype realization, Action model expansion, Multi-horizon credit assignment, Memory and observability expansion, Initialization and infrastructure repair, Replay and counterfactual infrastructure, Perception and sensory limitation

## Project State
- The repo now contains bounded prototypes for discrete action selection, context-dependent phenotype realization, multi-horizon policy credit assignment, and signature-specific reproduction-gate analysis
- Recent sessions shifted from isolating which policy operators are harmful to prototyping expressiveness and feedback-horizon expansions
- The important gap is live activation and evidence fidelity: the main simulation still runs a fixed move-harvest-reproduce loop with mostly direct-encoded traits, perfect-information spatial choice, and coarse policy matching

## External Context
- Vroomans, Lehmann, and Hogeweg, ["Facilitation of Evolution by Plasticity Scales with Phenotypic Complexity"](https://pmc.ncbi.nlm.nih.gov/articles/PMC11476054/), Animals 14(19):2804, 2024: environmentally responsive phenotype construction accelerates the evolution of more complex functional systems as phenotype complexity increases
- Li et al., ["Hippocampus supports multi-task reinforcement learning under partial observability"](https://www.nature.com/articles/s41467-025-64591-9), Nature Communications 16, 2025: agents trained under partial observability can generalize better than full-observability controls, supporting an explicit perception bottleneck instead of ground-truth decision inputs

## Research Gaps
- Do the April 2 multi-horizon survival-positive signatures remain positive once matching includes richer observation state or replay-grounded comparisons rather than coarse fertility/crowding/age/disturbance bins?
- Can live-wired action selection plus context-dependent phenotype realization outperform the current fixed turn loop once decisions are driven by sensed observations instead of perfect-information ecology scores?

## Current Anti-Evidence
- The strongest current reason the project cannot yet claim policy-driven adaptive diversification is that the April 2 mechanisms are still mostly prototype-only: the live simulation does not yet use action selection and does not pass ecological context into phenotype realization during core decisions
- The current positive evidence chain is still fragile: multi-horizon gains are analytic rather than replay-grounded, and at least one checked-in artifact no longer matches its source methodology, so the reported advantages may not survive stricter validation

## Bet Queue

### Bet 1: [validate] Dormant Action-Locus Attribution Ceiling
Either wire `action_priority_*` and `action_threshold_*` into the live turn loop or explicitly quarantine those loci from distance, diversity, and policy-analysis claims. The goal is to remove the current ambiguity where the action-selection prototype exists and mutates, but current runs still behave as if those loci do nothing.

#### Success Evidence
- Code showing `selectAction` or equivalent action-locus logic affects `processAgentTurn` or reproduction control, or a deliberate quarantine path removing those loci from downstream claims
- Regression tests proving action loci are either behaviorally live or explicitly excluded from policy-analysis surfaces

#### Stop Conditions
- Stop once action loci are no longer behaviorally ambiguous
- Do not generalize to a full action language beyond the bounded existing alphabet

### Bet 2: [expand] Direct-Encoding Ceiling
Promote context-dependent phenotype realization from a spike into a live mechanism by passing local fertility, crowding, and disturbance state into phenotype construction for at least one core decision surface such as harvest, movement, or reproduction. The goal is to test whether ecological context can shape expressed behavior in the live simulation rather than only in offline inspection.

#### Success Evidence
- Code path where live simulation decisions use `realizePhenotype(..., context)` or an equivalent intermediate phenotype layer
- A bounded artifact or matched-control comparison showing whether context-conditioned expression changes policy-bearing cohort outcomes relative to direct encoding

#### Stop Conditions
- Stop after one live decision surface uses context-conditioned phenotype realization
- Do not redesign the full phenotype pipeline or add a large developmental system in this bet

### Bet 3: [expand] Observability Blind Spots
Build a bounded read-only observation map that exposes age, disturbance history, resource mix, and local lineage or taxonomic composition to policy logic and analytics. The goal is to give action selection and phenotype realization a coherent sensed state instead of relying on a mix of internal thresholds and hidden ground-truth environment values.

#### Success Evidence
- New observation structure available during live decisions and analytics
- At least one live mechanism or validation path consumes the new observations instead of directly reading hidden world state

#### Stop Conditions
- Stop after a compact high-value observation set exists and is consumed in one place
- Do not build a general sensor framework for every subsystem

### Bet 4: [validate] Coarse Context Matching Ceiling
Re-run a bounded policy validation panel using richer context keys or nearest-neighbor matching over the new observation state, focusing on the signatures that looked strongest in the April 2 multi-horizon study. The goal is to determine whether the current delayed-survival positives survive stricter context matching.

#### Success Evidence
- New artifact comparing coarse-bin matching against richer matching for a bounded set of seeds and signatures
- Direct answer on whether the strongest April 2 survival-positive signatures remain positive, weaken, or disappear under stricter matching

#### Stop Conditions
- Stop after one bounded richer-matching validation exists
- Do not build a full generic replay-counterfactual framework in this bet

## Assumptions / Unknowns
- Assumption: the positive +20/+50 tick survival effects are not pure matching artifacts and are worth stress-testing under richer state matching
- Assumption: a bounded observation map can be added without forcing a full rewrite of movement, settlement, and analytics in one session
- Unknown: whether live action selection will help once it replaces the current fixed operator order, or whether it will simply expose a deeper physiology or payoff ceiling
- Unknown: whether context-dependent phenotype realization needs genetically encoded sensitivity parameters immediately, or whether fixed ecological modulation is enough for a first live test
