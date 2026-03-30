# Session Plan — 2026-03-30

## Compact Context
- Direct policy-payoff coupling is now live: harvest policy modulates intake payoff, and harvest and spending preferences can share substrate-management state
- Moderate downweight `{ policyThreshold: 0.25, policyBounded: 0.5 }` was adopted on 2026-03-29 as the `genomeV2` distance default after matching morphology-priority outcomes without the earlier inflation failure
- Sampled causal traces exist for movement, harvest, encounter, and death, but not yet for reproduction or settlement
- `runWithPolicyFitness` already records decision-time fertility, crowding, age, disturbance phase, survival, reproduction, and policy gating per agent exposure
- `phenotypeDiversity` still bins only `NON_POLICY_TRAITS`, so policy differentiation can remain invisible in the main diversity summary
- The strongest published anti-evidence is still the 2026-03-28 bounded graded-policy panel: weak richness and niche gains with a 53.8% lower speciation rate for policy-enabled runs

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Distance-weight validation and calibration | 4 | 173abf7 |
| Planning and structural critique | 2 | 5e931fb |
| Policy-payoff coupling | 2 | 6bc2889 |
| Causal attribution infrastructure | 2 | 7182e25 |
| Policy-sensitive measurement | 0 | none |
| Genealogy and counterfactual replay | 0 | none |

Dominant axis: Distance-weight validation and calibration (4/10)
Underexplored axes: Policy-sensitive measurement, Genealogy and counterfactual replay

## Project State
- The repo now has shared phenotype decoding, asymmetric two-resource ecology, a moderate-downweight default, policy-fitness exposure logging, direct harvest and reserve-spending payoff coupling, and bounded causal traces
- Recent sessions moved from expression repair into payoff coupling, trace plumbing, and default-calibration cleanup
- The important gap is no longer missing policy surfaces in code; it is missing evidence that the current surfaces drive diversification and missing analytics that can explain any signal at phenotype and lineage level

## External Context
- Moreno, Rodriguez-Papa, and Dolson, ["Ecology, Spatial Structure, and Selection Pressure Induce Strong Signatures in Phylogenetic Structure"](https://doi.org/10.1162/artl_a_00470), Artificial Life 31(2), 2025: phylogenetic metrics can detect ecology and spatial structure, but the paper says driver disambiguation and normalization methods are still needed
- De Pinho and Sinapayen, ["A speciation simulation that partly passes open-endedness tests"](https://arxiv.org/abs/2603.01701), arXiv, March 2, 2026: evolutionary-activity conclusions depend strongly on whether the measured components are genes, individuals, or species, which directly raises the bar for this repo's current taxon-only and policy-only summaries

## Research Gaps
- Under the current March 29 code path and moderate-downweight default, do the new payoff couplings actually improve policy-driven diversification or does the March 28 weak/negative result still hold?
- If policy effects exist, can we localize them to phenotype-and-environment regions and descendant lineages instead of only policy-positive cohorts?

## Current Anti-Evidence
- No post-coupling validation artifact exists yet, so the strongest available result is still the 2026-03-28 panel where policy-enabled runs gained only 11.2% effective richness and 13.3% occupied niches while losing speciation rate by 53.8%
- Even if the new couplings help, the current measurement stack can still miss or misattribute that effect because `phenotypeDiversity` excludes policy loci and sampled causal traces still stop short of reproduction and settlement outcomes

## Bet Queue

### Bet 1: [validate] Post-Coupling Diversification Revalidation
Run a new bounded graded-policy versus policy-neutral panel under the current March 29 code and moderate-downweight default. This replaces stale anti-evidence with a directly comparable result that includes live harvest-payoff and harvest-spending coupling.

#### Success Evidence
- New `docs/` artifact comparing policy-enabled and policy-neutral arms under current defaults
- Explicit deltas for effective richness, policy-sensitive niche occupancy, speciation rate, and net diversification rate

#### Stop Conditions
- Stop once at least one bounded matched-seed panel is complete and interpretable
- Do not broaden into exhaustive sweeps or new operator design

### Bet 2: [validate] Policy Metric Blind Spot
Add a policy-sensitive niche or action-signature summary beside `phenotypeDiversity`, then rerun the bounded comparison to see whether policy differentiation appears there even when non-policy phenotype bins stay flat. This tests whether policy novelty is being hidden by the current measurement surface rather than absent in the simulation.

#### Success Evidence
- New summary metric in code and tests that responds to policy-only differences with matched morphology
- The validation artifact reports both existing phenotype diversity and the new policy-sensitive summary

#### Stop Conditions
- Stop after one durable metric surface exists and is wired into at least one panel
- Do not redesign the entire analytics stack

### Bet 3: [expand] Fitness-Phenotype Gap
Aggregate existing policy-fitness records and/or causal traces into phenotype-by-environment outcome maps keyed by expressed traits plus local ecology. The goal is to move from "policy-positive versus policy-negative" toward identifying which expressed trait configurations actually gain intake, survival, or reproduction advantages and whether those regions persist across runs.

#### Success Evidence
- Artifact or exported table showing phenotype and environment bins with conditional harvest, survival, or reproduction outcomes
- Tests or analysis demonstrate that at least one bin-level advantage is stable across multiple seeds or windows

#### Stop Conditions
- Stop after one bounded phenotype-landscape surface exists for current policy and payoff mechanisms
- Do not build a full online dashboard or unbounded archive

### Bet 4: [feat] Descent Observability
Persist lightweight parent-child edges, phenotype deltas, and reproduction and settlement attribution so phenotype-fitness gains can be connected to descendant success or failure. This fills the current gap between per-step traces and diversification outcomes.

#### Success Evidence
- Reproduction or settlement traces or genealogy records are exported with parent and offspring lineage or species plus phenotype-delta context
- A follow-up summary can trace at least one successful or failed descendant branch to a concrete policy or phenotype change

#### Stop Conditions
- Stop after bounded genealogy plus reproduction and settlement attribution is live and tested
- Do not attempt full replay branching in this bet

## Assumptions / Unknowns
- Assumption: the March 29 coupling changes are large enough to move bounded diversification metrics, not just per-agent energy partitioning
- Assumption: policy-sensitive metrics can be layered onto current phenotype and fitness code without rewriting core simulation loops
- Unknown: whether the next bottleneck after measurement repair is missing descent attribution or insufficient policy-payoff reach
- Unknown: how much of any new signal is robust across seeds versus path-dependent without replay support
