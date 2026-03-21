# Research Agenda

## Current Direction
Over the next month, implement behavioral control to enable contingent strategies through per-agent internal state and evolvable policy layers. The goal is to break the memoryless decision ceiling so agents can condition movement, harvest, encounters, and reproduction on recent history, thresholds, and heritable parameters—unlocking adaptive strategies currently impossible in the hard-coded framework.

## Why This Direction
GenomeV2 validation completed successfully on 2026-03-19–20: extended traits emerge, persist, and show spatial/fertility enrichment (enrichmentScore 1.04–1.66). However, the 2026-03-20 ecological context pilot showed that despite 20.6% extended trait prevalence sustained for 949 ticks, the simulation collapsed to 1 clade and 1 species by tick 1000. Spatial correlation does not prove ecological advantage; traits may be hitchhiking on founder geography or neutral drift.

The structural ceiling prioritization analysis (2026-03-20) systematically compared 14 backlog ceilings and ranked **Behavioral Control** as the #1 candidate based on: (1) high cumulative innovation potential—adaptive strategies enable niche construction, contingent decision-making, and policy evolution; (2) strong ALife literature alignment—open-ended systems require adaptive agents with learning-like dynamics; (3) one-month feasibility—the 2026-03-20 feasibility spike confirmed minimal coupling risk with internal state + threshold policies.

Behavioral control is the fundamental enabler that unblocks adaptive strategies currently impossible in the memoryless framework. Environmental complexity (#2) and trait decoder bottleneck (#3) are also high-leverage, but behavioral control creates the foundation for later expansions and can proceed immediately post-GenomeV2.

## Structural Constraints
- Agents currently have `internalState?: Map<string, number>` infrastructure (types.ts:202, behavioral-control.ts) with one signal (`last_harvest_total`) and one policy parameter (`reproduction_harvest_threshold`), but only reproduction reads policy state. Movement, harvest, encounters, and settlement do not consume internal state or heritable thresholds.
- The feasibility spike (2026-03-20) confirmed low coupling risk: reproduction gating works with opt-in policies without breaking default behavior. However, the current `Map<string, number>` is stringly typed and mixes policy parameters with transient memory; larger expansions should separate heritable policy from ephemeral observations.
- Movement, encounters, and harvest touch the main turn loop more heavily than reproduction and should share a common policy evaluation boundary before broader rollout.
- Extended traits show moderate spatial/fertility enrichment but do not prevent taxonomic collapse, suggesting that ecological advantage may require active behavioral adaptation beyond passive trait expression.

## Revision History
- 2026-03-21: Shifted monthly direction from GenomeV2 validation to behavioral control implementation. GenomeV2 ecological context and taxonomic distance normalization completed on 2026-03-20; structural ceiling prioritization identified behavioral control as the highest-leverage next ratchet.
- 2026-03-20: Normalized GenomeV2 taxonomic distance with baseline-preserving scaling and reran the established 500-step, 2-seed comparison. Diversification advantage declined from +78.1% to +69.8% but remained strong, so loci-count inflation does not appear to be the sole driver of novelty gains.
- 2026-03-20: Shifted from GenomeV2 validation to loci-count inflation falsification and structural ceiling prioritization. GenomeV2 live discovery, observability, pilot, and canonical validation all landed successfully on 2026-03-19, so the next loop must address distance normalization and decide the next monthly direction.
- 2026-03-19: Retired the "Phase 2 wiring" agenda after confirming those changes already landed on 2026-03-18. New monthly direction: unblock live loci discovery, add generic GenomeV2 observability, and validate whether new loci produce ecologically consequential novelty.
- 2026-03-18: Set the month toward GenomeV2 Phase 2 wiring after the structural expansion memo identified representational capacity as the highest-leverage ceiling break.
