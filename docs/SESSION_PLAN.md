# Session Plan — 2026-03-23

## Compact Context
- The March 22, 2026 plan fully landed: detriment diagnosis, refined policy-fitness attribution, `policyState` / `transientState` separation, and harvest-allocation rollout are all on `main`
- The original March 21, 2026 pilot never isolated movement from reproduction: every policy-positive agent carried both gates, and threshold mutation barely moved from the seeded values
- The March 22, 2026 refined attribution pass increased matched bins from 2 to 7 and removed the survival penalty, but the combined movement-plus-reproduction stack still showed weighted harvest `-0.0639`, survival `0.0000`, and reproduction `+0.00066`
- The March 22, 2026 harvest-allocation smoke test proved a live control surface exists: mean harvest-guided fraction was `0.5`, and policy carriers finished with `+0.304` higher secondary-energy share than controls, but reproduction was disabled and the run lasted only 40 ticks
- `policyState` and `transientState` are now separate, but heritable policy parameters still live outside `GenomeV2` distance and policy-aware null machinery
- Movement scoring and energy spending still follow legacy hard-coded rules, so harvest preference can change intake without yet changing navigation or expenditure strategy

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Policy measurement and validation | 3 | 1096cc0 |
| Behavioral policy infrastructure | 3 | 6a15e7d |
| Planning and backlog maintenance | 3 | ce012ff |
| Harvest policy surface expansion | 1 | 57c2eb4 |
| Encounter or expenditure policy expansion | 0 | none |
| Policy-genome unification | 0 | none |

Dominant axis: Policy measurement and validation (3/10, tied)
Underexplored axes: Harvest policy surface expansion, encounter or expenditure policy expansion, policy-genome unification

## Project State
- The codebase now has enough instrumentation to reject weak behavioral mechanisms instead of guessing: the March 22 diagnosis and refined attribution artifacts are already in `docs/`
- Behavioral control is still unproven as an adaptive mechanism because no isolated policy surface has yet shown a positive matched-context fitness signal under live selection
- Harvest allocation is the first confirmed direct control surface, but it is still ecologically incomplete because movement / settlement scoring and energy expenditure do not yet respect the chosen intake preference
- The next underdeveloped area is not more generic policy rollout; it is causal isolation, threshold search, and mechanism alignment between policy, navigation, and energetic payoff

## External Context
- Gautier Hamon, *Towards open-ended dynamics in Artificial Life and Artificial Intelligence: an eco-evo-devo perspective* (2025 PhD thesis). Source: https://reytuag.github.io/gautier-hamon/data/thesis_hamon_gautier.pdf
- Maxence Faldor and Antoine Cully, *Toward Artificial Open-Ended Evolution within Lenia using Quality-Diversity* (arXiv:2406.04235, June 6, 2024). Source: https://arxiv.org/abs/2406.04235

## Research Gaps
- Which isolated policy surface, if any, produces a positive matched-context fitness signal under live selection once movement, reproduction, and harvest policies are separated?
- Does aligning navigation and later expenditure logic with harvest policy convert the proven intake shift into downstream survival or reproductive advantage?

## Current Anti-Evidence
- No heritable policy surface has yet shown positive matched-context fitness under live selection: the best current combined movement-plus-reproduction result on March 22, 2026 still reports harvest `-0.0639`, survival `0.0000`, and reproduction `+0.00066`
- Harvest policy currently proves controllability, not adaptiveness: it changes intake shares in a smoke test, but movement / settlement scoring and energy expenditure still optimize legacy rules that ignore that preference

## Bet Queue

### Bet 1: [validate] Isolate behavioral policy surfaces under refined attribution
Run a bounded comparison that separates movement-only, reproduction-only, harvest-only, combined, and no-policy agents under the March 22 refined attribution surface. The goal is to replace the confounded March 21 result with per-surface evidence about which policy family is helpful, harmful, or only harmful in combination.

#### Success Evidence
- Artifact under `docs/` comparing matched-bin harvest, survival, reproduction, and gate rates for movement-only, reproduction-only, harvest-only, combined, and no-policy arms
- Clear conclusion identifying whether one policy surface dominates the current harm or whether the harm only appears in combinations

#### Stop Conditions
- Stop after one bounded panel at the existing 300-step pilot scale or a smaller equivalent that still yields interpretable matched bins
- Do not change policy mechanics in this bet

### Bet 2: [expand] [Policy Observability Void for Movement and Reproduction] Add gate-specific decision observability
Tighten the decision-level evidence surface so later threshold sweeps and isolated-surface pilots can explain why policies fire. Record movement blocks by energy vs recent-harvest threshold, reproduction suppressions, and at least one near-boundary signal instead of only aggregate gated fractions.

#### Success Evidence
- `StepSummary`, exports, or study artifacts expose gate-specific movement and reproduction counts plus at least one near-miss or dormant-vs-fired measure
- Focused tests cover the new observability path and one bounded study or smoke output consumes it

#### Stop Conditions
- Stop once gate-specific reasons are available and tested
- Do not build a full alternative-universe counterfactual simulator if the implementation starts to sprawl

### Bet 3: [validate] Sweep movement and reproduction threshold regimes with refined attribution
Use the refined attribution surface and improved gate observability to test whether the March 21, 2026 detriment was just a bad seeded threshold regime. The point is to map activation rates against fitness deltas and determine whether any small region of threshold space is non-detrimental before escalating to richer policy forms.

#### Success Evidence
- Artifact under `docs/` mapping representative threshold settings to harvest, survival, reproduction, and gate-specific activation rates
- Either identifies at least one non-detrimental regime or rules out the current binary gate design across the tested range

#### Stop Conditions
- Stop after one bounded grid over 2-4 representative settings per threshold
- Do not add adaptive mutation, continuous gates, or new policy families in this bet

### Bet 4: [expand] [Diet-Choice Compression] Align movement and settlement with harvest-choice policy
Finish the harvest-choice mechanism by feeding policy-selected resource shares into movement and settlement ecology scoring, instead of steering intake with one rule while navigation still optimizes the old fixed harvest mix. This is the shortest path from "harvest policy changes state" to "harvest policy can plausibly change niche choice."

#### Success Evidence
- Candidate-cell movement or settlement scoring uses policy-selected harvest shares when harvest policy is present
- Focused tests show default navigation is unchanged without policy and shifts toward policy-aligned cells with harvest policy enabled
- A bounded smoke or pilot artifact shows policy-guided movement / settlement activates in live runs

#### Stop Conditions
- Stop after movement / settlement alignment works end to end
- Do not add spending policies or encounter policies in this bet

## Assumptions / Unknowns
- Assumption: the remaining negative harvest signal is mechanistic rather than mere noise because it persists after matched bins increased from 2 to 7 on March 22, 2026
- Assumption: isolated-surface evidence is more valuable right now than unifying policy into `GenomeV2`, because taxonomic integration is premature if no surface earns positive fitness
- Unknown: whether harvest policy can produce positive descendant output once movement and settlement are aligned with intake preference
- Unknown: whether gate-specific observability will reveal simple threshold miscalibration or a deeper failure mode in the current binary policy architecture
