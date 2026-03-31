# Session Plan — 2026-03-31

## Compact Context
- March 30 already landed four important surfaces: post-coupling diversification revalidation, policy-sensitive phenotype diversity, phenotype-fitness landscape aggregation, and descent observability
- The latest post-coupling artifact (`docs/post_coupling_diversification_revalidation_2026-03-30.json`) reports large policy-enabled gains, but it compares `policyMutationProbability=0.65` against `0`
- `summarizePolicySensitivePhenotypeDiversity` now includes policy loci, but it still bins species centroids rather than agent-level actions or descendant outcomes
- The March 30 phenotype landscape artifact (`docs/phenotype_fitness_landscape_2026-03-30.md`) shows only seven phenotype-environment bins and 0.0% policy-positive exposure across seeds 42, 123, and 456
- Reproduction and settlement causal traces plus lightweight parent-child `descentEdges` are now live and tested
- The study layer still lacks snapshot branching or deterministic replay, so mechanism claims remain path-dependent

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Distance-weight calibration | 3 | 173abf7 |
| Planning and structural critique | 2 | 47fd3f7 |
| Post-coupling validation | 1 | 6127066 |
| Policy-sensitive measurement | 1 | 1b59962 |
| Phenotype-fitness aggregation | 1 | 818ecfe |
| Descent observability | 1 | 239e8a9 |
| Tooling maintenance | 1 | 0bb4455 |
| Counterfactual replay | 0 | none |
| Matched-null fidelity | 0 | none |
| Temporal credit assignment | 0 | none |

Dominant axis: Distance-weight calibration (3/10)
Underexplored axes: Post-coupling validation, Policy-sensitive measurement, Phenotype-fitness aggregation, Descent observability, Tooling maintenance, Counterfactual replay, Matched-null fidelity, Temporal credit assignment

## Project State
- The repo now has working policy-payoff coupling, post-coupling panel generation, policy-sensitive diversity summaries, phenotype-landscape aggregation, reproduction and settlement causal traces, and exported descent edges
- Recent sessions have concentrated on measurement and observability rather than adding new ecological operators
- The important gap is evidence quality: the strongest current result may still be inflated by a permissive control and trait-space metrics that count policy loci directly, while the phenotype-landscape artifact failed to surface active policy-conditioned regions

## External Context
- Moreno, Rodriguez-Papa, and Dolson, ["Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure"](https://doi.org/10.1162/artl_a_00470), Artificial Life 31(2), 2025: phylogenetic summaries can detect ecological and spatial effects, but driver disambiguation and normalization remain necessary
- De Pinho and Sinapayen, ["A speciation simulation that partly passes open-endedness tests"](https://arxiv.org/abs/2603.01701), arXiv, March 2, 2026: open-endedness conclusions change materially depending on whether the measured unit is genes, individuals, or species

## Research Gaps
- Under matched controls that keep policy loci present in both arms, do the March 30 diversification gains persist when only payoff coupling or policy execution differs?
- Why does the current phenotype-landscape analysis show effectively no policy-active coverage despite the diversification panel reporting very large policy-sensitive richness gains?

## Current Anti-Evidence
- The March 30 "improves" result is not yet strong enough to claim genuine adaptive diversification because its control disables policy mutation entirely and its largest gains come from a metric that directly includes policy traits
- The March 30 phenotype landscape artifact shows only seven bins and 0.0% policy-positive exposure across three 500-step runs, so the current analytics still do not demonstrate stable policy-conditioned fitness regions

## Bet Queue

### Bet 1: [validate] Policy-Mutation Control Confound
Rerun the March 30 post-coupling comparison under a stricter matched design where both arms carry the same policy loci and differ only in whether policies can affect payoffs or policy state. This directly tests whether the current diversification jump survives once "more mutating coordinates" is removed as the main explanation.

#### Success Evidence
- New `docs/` artifact with matched-locus arms and explicit deltas versus the March 30 panel
- Clear statement about whether the large policy-enabled advantage survives the stricter control

#### Stop Conditions
- Stop after one interpretable matched-control panel exists
- Do not broaden into parameter sweeps or new ecological operators

### Bet 2: [validate] Policy Activity Coverage Gap
Repair the phenotype-landscape workflow so policy-active cohorts actually appear in the surface, either by conditioning on policy-positive exposures, adding policy-state bins, or targeting runs that activate the new couplings. The goal is to find out whether policy-conditioned fitness regions exist or whether the March 30 trait-space gain is mostly bookkeeping.

#### Success Evidence
- Updated analysis or artifact showing non-zero policy-active coverage and the bins where it occurs
- A direct comparison between policy-active and policy-inactive regions or a falsifying result that no stable policy-active regions were found

#### Stop Conditions
- Stop once the analysis can either surface policy-active regions or convincingly show their absence
- Do not build a general dashboard

### Bet 3: [validate] No Branching Counterfactuals
Add bounded snapshot and replay support so the same live world can be forked into perturbed and unperturbed branches. This lowers the path-dependence risk in mechanism claims and creates an infrastructure base for future matched-null and intervention studies.

#### Success Evidence
- Tests proving a snapshot can be replayed into paired branches with deterministic divergence only after the intervention
- One bounded study or fixture that uses replay to compare a policy intervention against a shared baseline world state

#### Stop Conditions
- Stop after one durable replay path exists for paired comparisons
- Do not redesign RNG architecture beyond what is needed for bounded replay

### Bet 4: [validate] Temporal Credit Assignment
Add trajectory summaries that score whether new lineages or phenotype innovations persist, not just whether they appear by the endpoint. This is the minimum needed to decide whether policy-linked novelty is durable adaptive structure or rapid churn.

#### Success Evidence
- New metrics such as active-diversity area under curve, innovation survival curves, or descendant persistence tables
- At least one artifact that applies the metric to an existing March 30 style run

#### Stop Conditions
- Stop after one bounded trajectory summary is exported and tested
- Do not expand into a full historical analytics framework

## Assumptions / Unknowns
- Assumption: the March 30 diversification gain is large enough that a stricter control will still be interpretable even if it shrinks substantially
- Assumption: current causal traces and descent edges provide enough state to support replay-adjacent and trajectory analyses without first rewriting core simulation storage
- Unknown: whether the zero policy coverage in the phenotype landscape is caused by coarse binning, weak policy activation, or a bug in how policy-positive exposures are propagated
- Unknown: whether the next bottleneck after stricter validation will be insufficient payoff reach or insufficient environmental complexity
