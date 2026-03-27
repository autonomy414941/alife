# Session Plan — 2026-03-27

## Compact Context
- Policy parameters now live in `genomeV2.traits`, and the uncontrolled policy-mutation regression was fixed on March 26
- Graded reproduction, movement, and harvest surfaces all exist, but only harvest currently has fresh anti-evidence from a bounded pilot
- `genomeV2DistanceWeights` is implemented, but no calibrated default weighting has been established
- `policyObservability` is exported in standard summaries, while generic genome-wide trait means and selection metrics are still missing
- The live environment still uses two largely symmetric resource pools on the same fertility and forcing structure
- Claims of progress still depend heavily on species and clade counts plus relabel-null deltas rather than direct ecological distinctness

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Behavioral policy surfaces | 4 | 1e77c0d |
| Structural critique and planning | 3 | 4a54d05 |
| Policy mutation stability | 2 | 7e1a6fd |
| Distance weighting | 1 | f87d602 |
| Trait decoder / phenotype expression | 0 | none |
| Genome-wide observability | 0 | none |
| Environmental feedbacks | 0 | none |

Dominant axis: Behavioral policy surfaces (4/10)
Underexplored axes: Trait decoder / phenotype expression, Genome-wide observability, Environmental feedbacks, Distance weighting

## Project State
- Policy loci are now first-class genome traits, graded policy gates exist for reproduction, movement, and harvest, and policy observability is collected in step summaries
- Recent sessions have concentrated on policy-genome unification, smoothing binary policy gates, and patching regressions introduced by that refactor
- The important gap is now expression fidelity and measurement: not every heritable locus is actually shaping behavior, default metrics still under-report genome-wide change, and taxonomic thresholds are not yet calibrated against ecological meaning

## External Context
- Faldor and Cully, ["Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity"](https://doi.org/10.1162/isal_a_00827), ALIFE 2024: recent OEE work is pairing richer expressive spaces with diversity-preserving search rather than relying on a small number of hand-tuned local control knobs
- Bedau, ["Kuhnian Lessons for the Study of Open-Ended Evolution"](https://doi.org/10.1162/artl_a_00428), Artificial Life 2024: argues that progress requires sharper exemplars and more decisive tests; I infer that this repo needs stronger expression and measurement validity before more mechanism rollout

## Research Gaps
- When a locus is present in `GenomeV2`, is it actually expressed in the live simulator and visible in default summaries, or can it remain selectively inert behind the current hard-coded trait plumbing?
- After restoring expression fidelity and calibrating distance weights, do graded policies still look ecologically neutral under the current symmetric ecology?

## Current Anti-Evidence
- The March 26 graded-harvest pilot showed no monotonic fitness advantage, and follow-up inspection found that graded harvest currently returns identical outputs for `basePreference=0.1` and `basePreference=0.9` under the same threshold and steepness, so the current neutrality claim is contaminated by a partially inert locus
- Taxonomic novelty can still be driven by uncalibrated policy-distance contributions and scored mainly through species and clade counts, so the project cannot yet claim ecologically meaningful open-ended diversification

## Bet Queue

### Bet 1: [investigate] Graded Harvest Base-Preference Inertness
Verify and repair the graded-harvest expression path so `harvest_secondary_preference` still matters when thresholded harvest is active. The March 26 neutrality result is not trustworthy until the heritable preference locus changes behavior under the graded regime it is supposed to parameterize.

#### Success Evidence
- Focused tests show that two agents with identical threshold and steepness but different base preferences produce different graded harvest shares
- A short follow-up artifact under `docs/` states whether the March 26 neutrality conclusion survives the fix or needs to be revised

#### Stop Conditions
- Stop after expression fidelity is restored and rechecked on a bounded smoke or pilot
- Do not redesign the wider resource model in this bet

### Bet 2: [expand] Trait Decoder Bottleneck
Introduce a metadata-driven trait registry or phenotype decoder that centralizes locus meaning, mutation behavior, clamping, and distance category for the currently supported trait set. This is the smallest structural change that turns `GenomeV2` from a flexible storage map into an actually extensible phenotype mechanism.

#### Success Evidence
- One central trait metadata surface replaces multiple hard-coded trait lists or switch branches
- At least one live simulator path consumes the shared metadata rather than direct trait-name conditionals
- Tests cover metadata-driven mutation, clamping, or distance behavior for existing loci

#### Stop Conditions
- Stop after the current locus set is centralized behind one metadata layer
- Do not attempt generative new trait families or a full developmental system in this bet

### Bet 3: [feat] Generic Trait Metrics Surface
Add genome-wide trait prevalence, mean, variance, and selection-style summaries to the standard step and export surfaces so the planner can see which loci are spreading or remaining inert. Without this, any post-decoder or post-policy result still collapses back to the legacy morphology triad.

#### Success Evidence
- `StepSummary` and standard exports include generic `GenomeV2` trait summaries rather than only the legacy morphology trio plus opt-in policy fields
- At least one study or export test asserts presence of the new generic metrics

#### Stop Conditions
- Stop after generic reporting is wired into the default observability path
- Do not build a full dashboard or redesign every study artifact in this bet

### Bet 4: [validate] Distance Weight Initialization Opacity
Run a bounded calibration panel for `genomeV2DistanceWeights` and choose a defensible default weighting scheme for morphology, bounded policy traits, and unbounded policy thresholds. Until these weights are calibrated, taxonomic outcomes remain too easy to inflate through policy-only distance.

#### Success Evidence
- Artifact under `docs/` compares at least three weighting regimes on the same bounded panel
- The study reports whether weighting changes the balance of policy-only versus mixed or morphology-linked splits
- One weighting scheme is justified as the new default or explicitly rejected pending further evidence

#### Stop Conditions
- Stop after a bounded, comparable calibration panel and recommendation
- Do not rerun full-horizon studies or retune the entire speciation system in this bet

## Assumptions / Unknowns
- Assumption: the graded-harvest base-preference omission is a real mechanism bug, not an intentional normalization
- Assumption: trait metadata can be centralized incrementally without destabilizing the current live simulator
- Unknown: whether graded-policy neutrality persists once expression fidelity and metric coverage are fixed
- Unknown: whether simple category-level distance weights are sufficient, or whether per-trait range-aware weighting will be needed
