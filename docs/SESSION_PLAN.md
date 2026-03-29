# Session Plan — 2026-03-29

## Compact Context
- A shared phenotype decoder now routes supported ecological and policy loci from `genomeV2` or legacy `policyState` into live operators
- The secondary resource layer now has independent seasonal amplitude, phase offset, and biome shift controls, with a March 28 pilot showing mirrored and asymmetric regimes diverge as intended
- Standard step summaries now expose both `genomeV2Metrics` and `phenotypeDiversity`, but the diversity summary bins only `NON_POLICY_TRAITS`
- The 2026-03-28 bounded graded-policy panel found weak richness and niche gains for policy-enabled runs, but a 53.8% lower speciation rate versus the matched baseline
- That same validation used morphology-priority distance weights even though the March 27 calibration analysis rejected that regime as a default
- The simulator still lacks sampled event-level causal traces, lightweight genealogy, and branchable counterfactual replay

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Phenotype realization and policy expression | 3 | a6ad5a5 |
| Planning and structural critique | 2 | 1de7687 |
| Phenotype-aware measurement | 2 | 1c8b0ee |
| Validation and calibration | 2 | 9398711 |
| Ecological asymmetry | 1 | 37d3b96 |
| Policy-payoff coupling | 0 | none |
| Causal attribution and genealogy | 0 | none |
| Counterfactual replay | 0 | none |

Dominant axis: Phenotype realization and policy expression (3/10)
Underexplored axes: Ecological asymmetry, Policy-payoff coupling, Causal attribution and genealogy, Counterfactual replay

## Project State
- The repo now has the minimum infrastructure needed to test `GenomeV2` policy loci in live ecology: shared phenotype decoding, asymmetric two-resource dynamics, genome-wide trait metrics, and phenotype-diversity summaries
- Recent sessions moved from expression repairs and observability into a first phenotype-aware ecological-neutrality check for graded policy mutation
- Harvest and spending policy are now coupled through a shared substrate-management signal: harvest preference can steer reserve burn when no separate spending locus is present, and a bounded March 29 pilot records full specialist reserve-share separation under an asymmetric pulse schedule
- The important gap is no longer whether policy traits exist or are readable; it is whether they change ecological payoffs enough to matter, and whether the simulator can explain any resulting diversification signal mechanistically

## External Context
- Moreno, Rodriguez-Papa, and Dolson, ["Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure"](https://arxiv.org/abs/2405.07245), revised November 21, 2024, with related Artificial Life publication: ecology can leave detectable phylogenetic signatures, but the paper explicitly says further methods are needed to distinguish driver classes and normalize phylometric evidence
- Faldor and Cully, ["Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity"](https://arxiv.org/abs/2406.04235), ALIFE 2024: sustained diversity comes from coupling expressive spaces to niches and diversity maintenance; I infer from this that policy loci here need direct ecological consequence, not just extra taxonomic distance

## Research Gaps
- Are graded policy loci still weak because they mostly reallocate actions without changing intake, cost, encounter, or settlement payoffs directly?
- Once causal traces and a stable distance-weight default exist, does the March 28 ambiguity resolve into real ecological differentiation or into measurement artifact?

## Current Anti-Evidence
- The strongest current anti-evidence is the 2026-03-28 bounded panel: after the decoder and asymmetric ecology landed, policy-enabled runs gained only modest phenotype richness and occupied niches while losing speciation rate by 53.8%, so policy loci still cannot be claimed as a clear engine of diversification
- The validation stack is still methodologically unstable because that panel used morphology-priority distance weights that the 2026-03-27 calibration explicitly rejected for default use

## Bet Queue

### Bet 1: [expand] Policy-Ecology Segregation
Make policy loci affect ecological payoffs directly instead of only gating decisions. The goal is to route at least one policy surface into fitness-relevant operators such as intake efficiency, spending burden, encounter transfer, or settlement score, so policy variation can change demographic outcomes even when raw movement or reproduction counts look similar.

#### Success Evidence
- At least one ecological payoff path reads policy phenotype directly in live simulation code
- Tests show policy-divergent agents with matched morphology produce different intake, expenditure, or survival outcomes through that path

#### Stop Conditions
- Stop after one or two direct payoff couplings are live and covered by tests
- Do not redesign the full interaction alphabet in this bet

### Bet 2: [expand] Harvest-Spending Policy Coupling Asymmetry
Build a coherent substrate-management loop by coupling intake and burn policy in the asymmetric two-layer world. This should let agents express strategies such as specializing toward one pool, preserving scarce secondary energy, or exploiting temporal layer mismatch instead of mutating independent preferences that cancel out.

#### Success Evidence
- Harvest and spending decisions share at least one common policy input or pool-composition signal
- A bounded smoke or pilot artifact shows differentiated primary-versus-secondary energy trajectories or specialization regimes

#### Stop Conditions
- Stop after coherent intake-burn coupling exists and produces measurable divergence on a bounded panel
- Do not add long-horizon learning or large memory systems in this bet

### Bet 3: [validate] Mechanism Attribution Ceiling
Add sampled causal traces and lightweight lineage context so future panels can explain why policy-enabled runs win or lose. The immediate target is not full raw logging; it is enough movement, harvest, encounter, reproduction, and settlement attribution to connect expressed traits to outcomes and descendant success.

#### Success Evidence
- Exported or documented artifacts include sampled per-event attribution keyed by lineage, expressed trait, or policy cohort
- A bounded comparison can state which mechanism changed between policy-enabled and baseline runs, not just that an aggregate moved

#### Stop Conditions
- Stop after one bounded attribution surface exists for the main policy mechanisms
- Do not build an unbounded raw-event archive in this bet

### Bet 4: [validate] Distance Weight Initialization Opacity
Resolve the weighting mismatch before making stronger diversification claims. Re-run a bounded comparison under the current post-decoder, asymmetric-ecology stack and either adopt the March 27 moderate downweight recommendation or replace it with a better-supported default.

#### Success Evidence
- A new artifact under `docs/` compares at least the moderate downweight regime against the current morphology-priority setup on phenotype-aware outcomes
- `docs/RESEARCH_AGENDA.md`, `docs/BACKLOG.md`, or code defaults state clearly whether a distance-weight default has been adopted or deferred

#### Stop Conditions
- Stop after a bounded follow-up panel resolves the current weighting ambiguity
- Do not escalate to exhaustive hyperparameter sweeps in this bet

## Assumptions / Unknowns
- Assumption: direct payoff coupling will create a clearer signal than further threshold tuning alone
- Assumption: bounded causal traces can explain the March 28 ambiguity without requiring full simulation replay
- Unknown: whether policy-driven ecological gains are currently suppressed more by payoff weakness, distance-weight inflation, or remaining measurement blind spots
- Unknown: whether the next decisive bottleneck after payoff coupling is genealogical observability or broader environmental complexity
