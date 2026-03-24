# Research Agenda

## Current Direction
Over the next month, turn behavioral control from brittle binary vetoes into adaptive, context-aware decision loci that can improve fitness under live selection. The immediate path is to preserve and stress-test the only promising current surface, reproduction gating, while redesigning movement and harvest control around richer observations and downstream energy-use policies. Policy loci should only be promoted into the shared `GenomeV2` architecture after at least one richer behavioral surface shows a robust advantage.

## Why This Direction
March 23, 2026 materially changed the evidence base. The isolated policy-surface panel showed that reproduction-only is the only surface with a positive matched-bin signal so far (`harvest +0.0479`, `survival +0.0000`, `reproduction +0.0005`), while movement-only remained strongly harmful (`harvest -0.1665`) and harvest-only stayed negative (`harvest -0.1001`) even after navigation alignment landed. The bounded threshold-regime panel then ruled out the current binary gate family across the tested range: its best regime still traded a small harvest gain for lower reproduction and did not clear the non-detrimental bar.

That means further effort on the current movement / harvest threshold stack is unlikely to pay off without a mechanism change. The remaining high-leverage work is to make behavioral policies less brittle, give them more relevant context, and connect harvest choice to downstream reserve management so behavioral differences can affect lifetime payoffs instead of only one decision boundary.

## Structural Constraints
- Behavioral policy expressiveness is still capped by binary threshold gates over almost no memory or ecological context.
- Policy inputs remain too sparse: agents can gate on current energy and `last_harvest_total`, but not on age, disturbance history, crowding, reserve composition, or recent encounter / reproductive outcomes.
- Harvest allocation now influences intake and navigation, but energy expenditure and reserve management remain hard-coded, so diet choice still cannot become a full metabolic strategy.
- Policy loci still live outside `GenomeV2.traits`, `genomeV2Distance()`, speciation / cladogenesis thresholds, and policy-aware nulls, so successful behavioral divergence is still undercounted by the evolutionary evidence surface.

## Revision History
- 2026-03-24: Shifted the month from validating existing binary policy gates to replacing them. March 23 showed reproduction-only as the lone weakly positive surface, while movement-only and harvest-only remained negative and a bounded threshold sweep ruled out the current binary gate family across the tested range.
- 2026-03-23: Tightened the month around behavioral-control falsification and mechanism alignment. March 22 finished the first diagnosis / attribution / harvest-control tranche, but no isolated policy surface had yet shown positive matched-context fitness under live selection.
- 2026-03-22: Narrowed the behavioral-control agenda from initial rollout to causal validation plus direct ecological leverage. The 2026-03-21 pilot showed detrimental aggregate harvest / survival effects for current policies, so the next month had to diagnose that failure, improve attribution fidelity, and extend policies into harvest or encounter decisions that could generate advantage directly.
- 2026-03-21: Shifted monthly direction from GenomeV2 validation to behavioral control implementation. GenomeV2 ecological context and taxonomic distance normalization completed on 2026-03-20; structural ceiling prioritization identified behavioral control as the highest-leverage next ratchet.
