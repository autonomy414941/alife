# Research Agenda

## Current Direction
Over the next month, determine whether behavioral control can become a real adaptive ratchet instead of a merely expressive add-on. The priority is to isolate individual policy surfaces under live selection, close the remaining mechanism mismatches between policy and ecology, and only then decide whether policy state deserves promotion into the shared `GenomeV2` architecture.

## Why This Direction
The March 22, 2026 tranche completed the first serious behavioral-control loop: detriment diagnosis, refined policy-fitness attribution, explicit `policyState` / `transientState` separation, and a live harvest-allocation control surface. That changes the question again. The simulator no longer needs a feasibility answer; it needs a falsifiable answer about adaptive value.

Current evidence is mixed but still anti-victory. On March 22, 2026, the detriment diagnosis showed that the original March 21 pilot never isolated movement from reproduction because every policy-positive agent carried both gates, and threshold mutation barely moved from the seeded values. The refined attribution pass improved matching from 2 to 7 occupied bins and removed the survival penalty, but the combined movement-plus-reproduction stack still showed weighted harvest `-0.0639`, survival `0.0000`, and reproduction `+0.00066`. Meanwhile, the harvest-allocation smoke test proved that policy can steer behavior at all: guided harvest fraction averaged `0.5`, and policy carriers finished with `+0.304` higher secondary-energy share than controls. The open question is therefore fitness feedthrough, not raw controllability.

## Structural Constraints
- Movement and settlement scoring still optimize legacy `combinedResourceAvailability(agent.genome)` and do not consult `harvest_secondary_preference`, so navigation is misaligned with the new harvest-choice policy.
- `spendAgentEnergy()` still burns primary and secondary pools by fixed proportional rules, so intake-side policy cannot yet become reserve-management strategy.
- Behavioral policies are still binary one-tick threshold gates with minimal memory, which makes search brittle and temporal credit assignment shallow.
- Heritable policy parameters still live outside `GenomeV2.traits`, `genomeV2Distance()`, speciation / cladogenesis thresholds, and policy-aware nulls, so any real behavioral divergence is still undercounted by the evolutionary evidence surface.

## Revision History
- 2026-03-23: Tightened the month around behavioral-control falsification and mechanism alignment. March 22 finished the first diagnosis / attribution / harvest-control tranche, but no isolated policy surface has yet shown positive matched-context fitness under live selection.
- 2026-03-22: Narrowed the behavioral-control agenda from initial rollout to causal validation plus direct ecological leverage. The 2026-03-21 pilot showed detrimental aggregate harvest / survival effects for current policies, so the next month must diagnose that failure, improve attribution fidelity, and extend policies into harvest or encounter decisions that can generate advantage directly.
- 2026-03-21: Shifted monthly direction from GenomeV2 validation to behavioral control implementation. GenomeV2 ecological context and taxonomic distance normalization completed on 2026-03-20; structural ceiling prioritization identified behavioral control as the highest-leverage next ratchet.
- 2026-03-20: Normalized GenomeV2 taxonomic distance with baseline-preserving scaling and reran the established 500-step, 2-seed comparison. Diversification advantage declined from +78.1% to +69.8% but remained strong, so loci-count inflation does not appear to be the sole driver of novelty gains.
- 2026-03-20: Shifted from GenomeV2 validation to loci-count inflation falsification and structural ceiling prioritization. GenomeV2 live discovery, observability, pilot, and canonical validation all landed successfully on 2026-03-19, so the next loop must address distance normalization and decide the next monthly direction.
- 2026-03-19: Retired the "Phase 2 wiring" agenda after confirming those changes already landed on 2026-03-18. New monthly direction: unblock live loci discovery, add generic GenomeV2 observability, and validate whether new loci produce ecologically consequential novelty.
- 2026-03-18: Set the month toward GenomeV2 Phase 2 wiring after the structural expansion memo identified representational capacity as the highest-leverage ceiling break.
