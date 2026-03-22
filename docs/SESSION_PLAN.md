# Session Plan — 2026-03-22

## Compact Context
- `internalState`-based behavioral control is live and heritable: movement reads `movement_energy_reserve_threshold` / `movement_min_recent_harvest`, and reproduction reads `reproduction_harvest_threshold`
- `StepSummary` and CSV exports now include policy observability, and per-tick `PolicyFitnessRecord`s capture harvest, survival, reproduction, and policy values
- The 2026-03-21 behavioral policy pilot was negative overall: across 6 x 300-step runs, policy-positive agents had aggregate matched-bin deltas of harvest `-0.0596`, survival `-0.00255`, and reproduction `+0.00077`
- That same pilot matched only two occupied fertility/crowding bins and records ecology at tick start, so causal attribution is still weak
- Harvest allocation and encounter resolution remain policy-agnostic, and `internalState` still mixes heritable parameters with transient memory
- Package manager is npm; the recent behavioral-control tranche landed on `main` on 2026-03-21

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Planning and structural ceiling analysis | 4 | 2a71446 |
| Behavioral control surface implementation | 3 | 61460a3 |
| Policy measurement and observability | 2 | 2dbb07d |
| GenomeV2 ecological validation | 1 | ac699f9 |
| Harvest / encounter policy expansion | 0 | none |
| Policy architecture refactor | 0 | none |

Dominant axis: Planning and structural ceiling analysis (4/10)
Underexplored axes: GenomeV2 ecological validation, harvest / encounter policy expansion, policy architecture refactor

## Project State
- The first behavioral-control tranche is complete: feasibility spike, movement gating, inheritance / mutation, policy fitness pilot, and policy observability all landed on 2026-03-20 to 2026-03-21
- The code now has enough instrumentation to reject weak mechanisms, and the first pilot currently points to a harmful or badly measured policy surface rather than a clear adaptive gain
- The main mechanistic gap is that policies can currently veto movement and reproduction but cannot yet steer harvest or encounters, where direct ecological advantage should emerge if the direction is viable
- The main measurement gap is that policy fitness attribution still uses coarse tick-start context instead of richer decision-time ecology and policy-specific strata

## External Context
- Gautier Hamon, *Towards open-ended dynamics in Artificial Life and Artificial Intelligence: an eco-evo-devo perspective* (PhD thesis, defended March 17, 2025): argues for open-ended systems built around rich agent-environment interaction and adaptation across multiple scales, not genome expansion alone. Source: https://reytuag.github.io/gautier-hamon/data/thesis_hamon_gautier.pdf
- Maxence Faldor and Antoine Cully, *Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity* (arXiv:2406.04235, June 6, 2024): sustained diversity came from maintaining niche-adapted stepping stones instead of collapsing search onto one optimum. Source: https://arxiv.org/abs/2406.04235

## Research Gaps
- Is the 2026-03-21 policy detriment real after measuring ecology at decision time and stratifying by policy type, age, and disturbance / seasonal phase?
- Can a policy surface that controls resource acquisition or encounters generate positive fitness deltas where movement / reproduction gates alone did not?

## Current Anti-Evidence
- On 2026-03-21, the only policy pilot returned a detrimental aggregate result: weighted matched-bin harvest `-0.0596`, survival `-0.00255`, reproduction `+0.00077`, so behavioral control has not yet shown adaptive value
- Policy divergence still sits outside `GenomeV2` distance and null-model machinery, so even real ecological policy effects will be undercounted by the current taxonomic evidence surface

## Bet Queue

### Bet 1: [investigate] Diagnose the current policy pilot detriment

Audit the 2026-03-21 policy pilot at the per-policy level instead of treating all policy-enabled agents as one group. The goal is to identify whether the negative signal comes from threshold calibration, one harmful decision surface (movement vs reproduction), or a simple activation imbalance before more behavior-control code is added.

#### Success Evidence
- Analysis artifact under `docs/` reporting movement-gated and reproduction-gated activation rates, threshold distributions, and per-policy marginal fitness deltas across the existing pilot seeds
- Clear diagnosis naming one dominant failure mode or explicitly ruling out obvious threshold-calibration failure

#### Stop Conditions
- Stop once one bounded analysis pass over the existing pilot or a closely matched rerun isolates the main negative contributor
- Do not redesign the policy architecture or add new policy surfaces in this bet

### Bet 2: [validate] Improve policy fitness attribution granularity

Tighten policy fitness attribution so results are interpretable. Record ecology at decision time rather than only at tick start, add a small number of meaningful strata such as age class and disturbance or seasonal phase, and rerun a bounded pilot to see whether the current detrimental signal survives better matching.

#### Success Evidence
- Updated records or derived artifacts capture decision-time context and at least one new informative stratum beyond coarse fertility / crowding
- A new pilot artifact under `docs/` compares the old aggregate with the refined attribution surface

#### Stop Conditions
- Stop after one bounded rerun with refined attribution
- Do not build full genealogy or long-horizon trajectory analytics in this bet

### Bet 3: [refactor] Separate heritable policy parameters from transient observations

Split policy state so future rollout is less brittle. Keep true ephemeral memory separate from inherited policy parameters, and preserve default behavior while making it clearer which numbers are observations, which are heritable controls, and which should reset at birth.

#### Success Evidence
- `internalState` responsibilities are split into heritable policy parameters and transient observations without changing default simulation behavior
- Focused tests cover inheritance semantics and reset semantics for the new state boundary

#### Stop Conditions
- Stop after the state boundary is explicit and existing policy behavior still passes
- Do not unify policies into `GenomeV2` or extend speciation distance in this bet

### Bet 4: [feat] Extend behavioral control to harvest allocation

Add the first policy surface that can improve resource gain directly instead of only vetoing actions. Separate harvest preference from harvest efficiency and let agents reallocate effort across resource layers from internal state so policy has a plausible path to raising harvest and survival rather than only constraining movement or reproduction.

#### Success Evidence
- Harvest-choice policy parameters affect resource-layer effort allocation in the live simulation
- Focused tests show default behavior is unchanged when no policy is present and altered allocation occurs when policy is enabled
- A small pilot or smoke artifact shows the new policy surface actually activates in nontrivial ecological contexts

#### Stop Conditions
- Stop after one bounded harvest-allocation policy surface works end to end
- Do not add encounter policies, multi-resource metabolic spending rules, or probabilistic activation in this bet

## Assumptions / Unknowns
- Assumption: the 2026-03-21 negative pilot is still worth diagnosing rather than discarding, because the current measurement surface is too coarse to separate bad thresholds from bad mechanisms
- Assumption: harvest allocation is the most direct next policy surface because current anti-evidence is strongest on harvest and survival, not reproduction
- Unknown: whether the present policy detriment is caused mainly by movement gating, reproduction gating, or ecological mismatching in the fitness analysis
- Unknown: how much state-boundary cleanup is needed before harvest policies can land without creating another stringly typed control layer
