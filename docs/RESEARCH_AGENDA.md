# Research Agenda

## Current Direction
Over the next month, turn behavioral control from a feasible add-on into a mechanism that produces measurable ecological advantage. The priority is to expand policy control into decisions that directly shape resource gain and conflict while tightening the state architecture and evaluation surface enough to tell real adaptive improvement from measurement artifacts.

## Why This Direction
The first behavioral-control tranche landed on 2026-03-20 to 2026-03-21: feasibility spike, movement gating, policy inheritance and mutation, policy observability, and a first policy-fitness pilot are all in the codebase. That changes the question from "can the simulator host behavioral policies?" to "do the current policy surfaces create adaptive value?"

The strongest current evidence says "not yet." In the 2026-03-21 behavioral policy fitness pilot, policy-positive agents were worse in matched bins on harvest (`-0.0596`) and survival (`-0.00255`) while gaining only a tiny reproduction edge (`+0.00077`). The pilot also matched only two occupied fertility/crowding bins, so the result could reflect coarse attribution as well as genuinely harmful policies. The next month should therefore focus on direct ecological leverage plus better causal readout, not on adding more passive policy parameters blindly.

## Structural Constraints
- `agent.internalState` still mixes heritable policy thresholds and transient observations in one string-keyed `Map<string, number>`. That was acceptable for the spike, but it becomes brittle as more decisions and observables are added.
- Policy evaluation remains narrow. Movement (`pickDestination`) and reproduction eligibility read policy state, but harvest allocation and encounter resolution are still hard-coded and memoryless, so current policies mostly suppress actions instead of creating new ecologically contingent gain paths.
- Policy fitness attribution is coarse: context is recorded at tick start and currently collapses into only two occupied fertility/crowding bins in the 2026-03-21 pilot. Weak or negative deltas may therefore mix real selection with poor matching.
- Policy loci still live outside `GenomeV2.traits`, `genomeV2Distance()`, and the relabel-null machinery, so policy divergence cannot yet contribute to taxonomic separation or policy-aware null comparisons.

## Revision History
- 2026-03-22: Narrowed the behavioral-control agenda from initial rollout to causal validation plus direct ecological leverage. The 2026-03-21 pilot showed detrimental aggregate harvest/survival effects for current policies, so the next month must diagnose that failure, improve attribution fidelity, and extend policies into harvest or encounter decisions that can generate advantage directly.
- 2026-03-21: Shifted monthly direction from GenomeV2 validation to behavioral control implementation. GenomeV2 ecological context and taxonomic distance normalization completed on 2026-03-20; structural ceiling prioritization identified behavioral control as the highest-leverage next ratchet.
- 2026-03-20: Normalized GenomeV2 taxonomic distance with baseline-preserving scaling and reran the established 500-step, 2-seed comparison. Diversification advantage declined from +78.1% to +69.8% but remained strong, so loci-count inflation does not appear to be the sole driver of novelty gains.
- 2026-03-20: Shifted from GenomeV2 validation to loci-count inflation falsification and structural ceiling prioritization. GenomeV2 live discovery, observability, pilot, and canonical validation all landed successfully on 2026-03-19, so the next loop must address distance normalization and decide the next monthly direction.
- 2026-03-19: Retired the "Phase 2 wiring" agenda after confirming those changes already landed on 2026-03-18. New monthly direction: unblock live loci discovery, add generic GenomeV2 observability, and validate whether new loci produce ecologically consequential novelty.
- 2026-03-18: Set the month toward GenomeV2 Phase 2 wiring after the structural expansion memo identified representational capacity as the highest-leverage ceiling break.
