# Session Plan — 2026-04-01

## Compact Context
- The March 31 matched-control artifact (`docs/post_coupling_matched_control_validation_2026-03-31.json`) refuted the March 30 policy-enabled diversification claim once both arms shared mutating policy loci
- The March 31 genomeV2-seeded landscape artifact (`docs/phenotype_landscape_genomev2_2026-03-31.md`) resolved the earlier zero-coverage issue: policy-active cohorts exist, but they are still a minority and not obviously advantaged
- Replay branching now exists in `LifeSimulation`, and bounded counterfactual studies can fork from a shared live world state
- Causal traces now include movement, harvest, encounter, reproduction, settlement, and death events with lineage/species context
- Trajectory persistence and descendant persistence metrics now exist, but the current persistence panel still uses the old `policyMutationProbability=0.65` versus `0` control
- Default initial agents still start without `genomeV2`, so policy evolution remains absent in vanilla runs unless a study overrides initialization

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Planning and structural critique | 3 | 53998f7 |
| Validation and artifact interpretation | 3 | 68005bd |
| Persistence and lineage observability | 2 | 9ee97bd |
| Replay and counterfactual infrastructure | 1 | 4bd2fe7 |
| Phenotype-landscape measurement | 1 | 818ecfe |
| Policy operator redesign | 0 | none |
| GenomeV2 initialization unification | 0 | none |
| Policy observability and memory expansion | 0 | none |

Dominant axis: Planning and structural critique (3/10)
Underexplored axes: Replay and counterfactual infrastructure, Phenotype-landscape measurement, Policy operator redesign, GenomeV2 initialization unification, Policy observability and memory expansion

## Project State
- The repo now has policy-payoff coupling, matched-control validation, phenotype-landscape aggregation, replay branching, causal traces, descent observability, and trajectory-persistence analysis
- Recent sessions shifted from building new coupling surfaces to falsifying whether the March 30 diversification claim survives stricter controls
- The important gap is now mechanism attribution: the strongest result is negative under matched control, but the repo still cannot say which policy operator or policy signature causes that harm

## External Context
- Matthew Andres Moreno, Santiago Rodriguez-Papa, and Emily Dolson, ["Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure"](https://doi.org/10.1162/artl_a_00470), Artificial Life 31(2), May 1, 2025: phylogenetic and diversity summaries can reflect ecology, but overlapping driver signatures require explicit disambiguation and normalization
- Theo de Pinho and Lana Sinapayen, ["A speciation simulation that partly passes open-endedness tests"](https://arxiv.org/abs/2603.01701), arXiv, submitted March 2, 2026: open-endedness conclusions change materially with the chosen measurement unit, so gene-level, individual-level, and species-level evidence should not be conflated

## Research Gaps
- Which coupled policy operator currently drives the matched-control performance loss once both arms share the same policy loci?
- Does any policy signature show a positive within-bin harvest, survival, or reproduction effect after stratifying beyond `hasAnyPolicy`?

## Current Anti-Evidence
- The March 31 matched-control artifact shows the policy-coupled arm underperforming the decoupled arm on effective richness (-27.5%), occupied niches (-18.6%), speciation rate (-18.8%), and net diversification (-27.6%), so the repo cannot currently claim that policy payoff coupling improves adaptive diversification
- The genomeV2-seeded phenotype landscape confirms policy-active cohorts exist, yet the highest-harvest stable bins are usually not policy-positive, which argues against policy presence being a sufficient proxy for adaptive advantage

## Bet Queue

### Bet 1: [validate] Policy Operator Sign Ambiguity
Run a bounded matched-control ablation panel that enables harvest guidance, reserve spending, and reproduction gating one at a time and in selected combinations, preferably from shared replay states. The goal is to replace the current "policy coupling hurts overall" conclusion with operator-level attribution that shows where the negative delta comes from.

#### Success Evidence
- New artifact with per-operator or per-combination deltas under a shared-locus matched control
- Clear statement about which operator is harmful, neutral, or beneficial at the tested horizon

#### Stop Conditions
- Stop after one interpretable ablation panel exists
- Do not add new ecological operators in this bet

### Bet 2: [validate] Policy-Cohort Collapse Ceiling
Stratify policy-fitness or phenotype-landscape analysis by policy signature or active-locus cluster instead of `hasAnyPolicy`. This tests whether the aggregate negative result hides a small beneficial cohort or whether policy-bearing agents are broadly neutral or harmful across signatures.

#### Success Evidence
- Artifact or report with signature-stratified matched comparisons
- Direct answer on whether any policy signature shows stable positive harvest, survival, or reproduction deltas

#### Stop Conditions
- Stop once one bounded signature taxonomy and one comparison artifact exist
- Do not build a generic clustering framework

### Bet 3: [refactor] GenomeV2 Initialization Split
Create one canonical initialization path for policy-capable runs so studies no longer copy-paste ad hoc `fromGenome(...)` seeding logic. This removes a known infrastructure mismatch that silently disables policy evolution and keeps future validation work from mixing incompatible starting conditions.

#### Success Evidence
- Shared helper or config path used by study code to create genomeV2-backed initial populations
- Tests proving the initialization choice is explicit and reproducible

#### Stop Conditions
- Stop after one canonical seeding path exists and at least one study uses it
- Do not migrate every historical script in one pass

### Bet 4: [expand] Memory Horizon
Add multi-tick rolling or decay-weighted memory features to the policy input surface, then run a small matched-control check to see whether richer temporal context improves policy-bearing cohorts. The point is to test a concrete mechanism for why current policies may be active yet non-adaptive.

#### Success Evidence
- New policy input features exposed to behavioral control plus tests
- Small validation artifact showing whether richer memory changes matched-control deltas or policy-signature fitness

#### Stop Conditions
- Stop after one bounded memory extension and one follow-up check exist
- Do not redesign the full action model in this bet

## Assumptions / Unknowns
- Assumption: the matched-control loss is large enough that operator-level ablations will be interpretable without very large seed panels
- Assumption: genomeV2 initialization can be unified without breaking legacy non-policy studies
- Unknown: whether any beneficial policy signature exists once aggregates are split by active loci
- Unknown: whether richer memory is enough to recover adaptive policy effects, or whether the action model itself is the real ceiling
