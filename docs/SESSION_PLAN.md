# Session Plan — 2026-03-28

## Compact Context
- `GenomeV2` trait metadata now centralizes mutation, clamps, activation modes, and distance categories for the supported locus set
- The graded-harvest base-preference expression bug was fixed on March 27 and revalidated on a short panel, so that item is no longer the main mechanism blocker
- `StepSummary.genomeV2Metrics` now exposes per-trait prevalence, mean, variance, and selection differential, but the main diversification claims still rely on raw taxon counts
- Live ecology still consumes a hard-coded subset of loci through direct trait reads and helper functions rather than a shared phenotype realization layer
- `resource` and `resource2` still regenerate from the same fertility map and seasonal forcing, keeping substrate specialization weak under default-style ecology
- `genomeV2DistanceWeights` has a provisional calibration recommendation, but no default has been adopted or rechecked against phenotype-aware validation

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Planning and structural critique | 4 | a3087b5 |
| Trait expression and observability | 3 | c052eb0 |
| Distance and speciation calibration | 2 | 7afe69d |
| Policy-surface validation | 1 | 1e77c0d |
| Phenotype realization in live ecology | 0 | none |
| Ecological asymmetry | 0 | none |
| Taxonomic validity metrics | 0 | none |

Dominant axis: Planning and structural critique (4/10)
Underexplored axes: Policy-surface validation, Phenotype realization in live ecology, Ecological asymmetry, Taxonomic validity metrics

## Project State
- `GenomeV2` is now materially usable: trait metadata is centralized, graded policy loci live in `genomeV2.traits`, generic genome-wide step metrics exist, and a first distance-weight calibration artifact is on disk
- Recent sessions have concentrated on repairing policy expression, adding observability, and calibrating how policy loci affect taxonomic distance
- The important gap is that most heritable variation is still not causal in the live simulation, and the environment remains too symmetric to test whether new phenotype dimensions actually create ecological differentiation

## External Context
- Faldor and Cully, ["Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity"](https://arxiv.org/abs/2406.04235), ALIFE 2024: recent OEE progress is coupling richer expressive spaces with diversity-preserving search rather than retuning a small set of fixed local controls
- ["Eco-Evo-Devo in the Adaptive Evolution of Artificial Creatures Within a 3D Physical Environment"](https://www.mdpi.com/2079-9292/14/2/354), Electronics 2025: lifetime development, niche construction, and ecological inheritance are studied together; I infer from this that phenotype realization and ecological asymmetry should be built as coupled mechanisms here rather than separate late-stage polish

## Research Gaps
- Can a shared phenotype decoder make supported `GenomeV2` loci affect live ecological payoffs and decisions without bespoke per-operator wiring?
- If the two substrate layers are decoupled, do phenotype-aware richness metrics reveal genuine specialization that raw species and clade counts currently miss?

## Current Anti-Evidence
- Even after the March 27 fixes, live ecology still interprets only a hand-picked subset of loci, so most heritable variation remains observational and taxonomic rather than mechanistically causal
- The default ecology still gives both substrate layers the same spatial and temporal structure, while success is still judged mainly through raw taxon counts, so the project cannot yet claim ecologically meaningful open-ended diversification

## Bet Queue

### Bet 1: [expand] Trait Decoder Bottleneck
Build a shared phenotype realization layer that the live simulation can use instead of direct trait-name reads. The immediate goal is not a full developmental system; it is to make the currently supported ecological and policy loci flow through one mechanism so newly added traits stop being selectively inert by default.

#### Success Evidence
- At least two live ecology operators consume a shared decoder or trait-effect registry instead of bespoke direct trait reads
- Tests show supported loci change behavior or ecological payoff through the shared path

#### Stop Conditions
- Stop after the currently supported locus set is routed through one realizable phenotype layer
- Do not attempt generative trait families or full context-dependent expression in this bet

### Bet 2: [expand] Resource-Layer Symmetry Ceiling
Decouple `resource` and `resource2` so substrate preference and efficiency traits face real ecological asymmetry. This is the smallest environment change that can give harvest and spending policies something meaningful to specialize against once Bet 1 makes trait expression more coherent.

#### Success Evidence
- Configurable differences exist between the two resource layers in spatial pattern, temporal forcing, or disturbance response
- A bounded smoke or pilot artifact under `docs/` shows layer-specific availability regimes rather than mirrored trajectories

#### Stop Conditions
- Stop after a bounded asymmetric two-layer ecology is live and validated
- Do not add more than two resource layers or full biotic construction in this bet

### Bet 3: [validate] Taxonomic Proxy Leakage
Add phenotype-aware diversity metrics so future claims are not carried by raw species and clade counts alone. The focus is to make threshold crossings and ecologically distinct diversification separable in standard study outputs before running another policy-neutrality argument.

#### Success Evidence
- Standard summaries or exported artifacts include at least one phenotype-weighted richness metric and one niche-occupancy-style metric
- Tests or fixture studies show the new metrics distinguish a count-inflated case from a more ecologically distinct case

#### Stop Conditions
- Stop after raw count metrics can be compared against phenotype-aware alternatives on existing fixtures or bounded studies
- Do not redesign the full analytics stack or every historical artifact format

### Bet 4: [investigate] Graded Policy Ecological Neutrality Generalization
Run a matched bounded panel after Bets 1 to 3 to test whether graded movement, harvest, and reproduction remain near-neutral once loci are expressed more coherently and substrate choice is no longer symmetric. This is the decisive short-horizon check against the current anti-evidence that policy traits mostly reshuffle bookkeeping.

#### Success Evidence
- A new artifact under `docs/` compares graded-policy and matched-baseline outcomes under asymmetric ecology using phenotype-aware diversity metrics
- The write-up states clearly whether neutrality persists, weakens, or reverses under the revised mechanism stack

#### Stop Conditions
- Stop after a bounded panel with at least one matched baseline and multiple seeds
- Do not escalate to full-horizon reruns unless the bounded panel shows a materially different signal

## Assumptions / Unknowns
- Assumption: the current supported locus set can be routed through a shared phenotype layer incrementally without destabilizing the simulation core
- Assumption: modest substrate asymmetry will create enough selective gradient to test specialization on short bounded panels
- Unknown: whether policy neutrality is mainly caused by expression gaps, environmental symmetry, or a deeper lack of policy-ecology coupling
- Unknown: whether the provisional March 27 distance-weight recommendation remains sensible once phenotype realization and ecological asymmetry improve
