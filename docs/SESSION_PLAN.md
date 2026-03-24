# Session Plan — 2026-03-24

## Compact Context
- March 23, 2026 isolated the current behavioral surfaces: reproduction-only was weakly positive in matched bins, while movement-only and harvest-only remained negative
- The March 23, 2026 threshold-regime panel found no non-detrimental binary-gate regime; the best tested setting still traded a small harvest gain for lower reproduction
- Gate-specific movement and reproduction observability now exists, including block reasons and near-threshold counts
- Movement and settlement scoring already respect `harvest_secondary_preference`; the old navigation mismatch is no longer the main blocker
- Energy expenditure is still hard-coded in `spendAgentEnergy()`, so harvest choice can change intake without becoming a full reserve-management strategy
- Heritable policy loci still live outside `GenomeV2.traits`, `genomeV2Distance()`, speciation / cladogenesis thresholds, and policy-aware null machinery

## Exploration Axes (last 10 commits)
| Axis | Count | Last seen |
|------|-------|-----------|
| Behavioral policy validation and reporting | 4 | 8d633bf |
| Planning and structural backlog maintenance | 3 | 6552fa4 |
| Behavioral policy mechanism rollout | 2 | fa79fe5 |
| Behavioral state architecture | 1 | 6a15e7d |
| Policy-genome integration | 0 | none |
| Metabolic / expenditure policy | 0 | none |

Dominant axis: Behavioral policy validation and reporting (4/10)
Underexplored axes: Behavioral state architecture, Policy-genome integration, Metabolic / expenditure policy

## Project State
- The codebase now has isolated policy-surface studies, bounded threshold-regime sweeps, gate-specific observability, harvest-allocation control, and navigation alignment artifacts under `docs/`
- Recent sessions have been converging on a falsifiable conclusion about the current binary policy family rather than expanding policies blindly
- The main underdeveloped area is now mechanism replacement: current movement and harvest policies are harmful, while reproduction-only is only weakly positive and still architecturally outside the shared evolutionary machinery

## External Context
- Tobias Uller et al., *Twenty years on from Developmental Plasticity and Evolution: middle-range theories and how to test them* (Journal of Experimental Biology, 2024). Source: https://charliecornwallis.github.io/Group/wp-content/uploads/2024/11/Uller-et-al.-2024-Twenty-years-on-from-Developmental-Plasticity-a.pdf
- Joseph Bejjani et al., *The Emergence of Complex Behavior in Large-Scale Ecological Environments* (arXiv:2510.18221, submitted October 21, 2025; revised December 12, 2025). Source: https://arxiv.org/abs/2510.18221

## Research Gaps
- Does the small March 23, 2026 reproduction-only advantage persist over longer horizons and more seeds, or was it a short-panel artifact?
- Is harvest-only still negative because secondary-preferring intake lacks downstream reserve-management payoff, or because the current ecology makes secondary-biased foraging intrinsically worse?

## Current Anti-Evidence
- The project still cannot claim adaptive behavioral control: no current policy stack improves harvest, survival, and reproduction together under live selection, and the March 23, 2026 sweep ruled out the tested binary-gate family across its bounded parameter range
- Even if a policy surface starts to work locally, policy divergence still does not count toward `GenomeV2` distance, speciation, cladogenesis, or policy-aware nulls, so evolutionary novelty from behavior remains structurally undercounted

## Bet Queue

### Bet 1: [validate] Stress-test reproduction-only behavioral policy robustness
Re-run the March 23 reproduction-only result on a slightly longer horizon and broader seed panel to find out whether the current weak positive signal is real enough to build on. The goal is not to optimize yet; it is to determine whether reproduction control is actually the best surviving foothold after the binary-gate sweep failure.

#### Success Evidence
- Artifact under `docs/` comparing reproduction-only vs no-policy across a bounded longer-horizon, multi-seed panel with matched-bin harvest, survival, reproduction, and any diversification readout already available
- Clear conclusion stating whether the reproduction-only signal survives, vanishes, or reverses outside the original 120-step, 2-seed panel

#### Stop Conditions
- Stop after one bounded panel that is meaningfully larger than the March 23 pilot but still cheap enough for a single session
- Do not redesign policy mechanics in this bet

### Bet 2: [investigate] Diagnose harvest-only detriment after navigation alignment
Use the now-aligned movement / settlement stack to explain why harvest-only still underperforms. The most likely branches are ecology versus payoff: either secondary-biased niches are genuinely worse, or current reserve spending destroys the value of harvesting secondary energy. This bet should discriminate between those branches before more policy rollout happens.

#### Success Evidence
- Artifact under `docs/` stratifying harvest-only outcomes by at least secondary-resource availability, resulting pool composition, and one downstream spending or reserve measure
- A concrete diagnosis identifying whether the remaining harm is primarily ecological, energetic, or mixed

#### Stop Conditions
- Stop after one bounded diagnosis pass on the current harvest-only setup
- Do not add new policy parameters or change energy rules in this bet

### Bet 3: [expand] [Binary Policy Gates] Prototype a graded reproduction policy surface
Replace the current all-or-nothing reproduction veto with one richer surface while keeping scope narrow: reproduction is the only surface with any positive evidence, so it should be the first place to test whether continuous or probabilistic control is better than brittle thresholds. A minimal graded gate with observability is enough for this session if it is heritable and testable.

#### Success Evidence
- Code and focused tests for one graded or probabilistic reproduction policy surface that uses existing policy state and observability plumbing
- A bounded smoke or pilot artifact showing that reproduction decisions vary across a gradient instead of only firing as a hard threshold

#### Stop Conditions
- Stop once one richer reproduction surface is live, heritable, and measurable
- Do not redesign movement and harvest policies in the same bet

### Bet 4: [expand] [Energy Expenditure Policy Blindness] Add a substrate spending policy
If harvest choice is going to matter, intake must be able to influence downstream reserve use. Introduce one spending-policy hook so agents can preferentially burn primary or secondary reserves under simple conditions, and make the effect observable. This is the shortest path from “harvest policy changes intake” to “harvest policy can alter lifetime energetic strategy.”

#### Success Evidence
- `spendAgentEnergy()` or its caller consults a heritable spending preference or reserve target instead of always using the current fixed draw rule
- Focused tests and one bounded artifact or smoke study show policy-driven differences in reserve retention or burn order under controlled conditions

#### Stop Conditions
- Stop after one end-to-end spending policy exists and is observable
- Do not attempt full policy-genome unification or multi-policy optimization in this bet

## Assumptions / Unknowns
- Assumption: the March 23 reproduction-only signal is the best current foundation because it is the only isolated surface with positive matched-bin harvest and reproduction deltas
- Assumption: harvest-only underperformance is more likely downstream-payoff failure than a remaining navigation bug, because navigation alignment already landed on March 23, 2026
- Unknown: whether richer reproduction policies need new observation inputs immediately or can already improve on binary gates using the current state surface
- Unknown: whether spending-policy control will rescue harvest-choice fitness or simply reveal that the dual-resource ecology itself is poorly tuned for secondary specialization
