# Research Agenda

## Current Direction
Over the next month, transition from GenomeV2 validation to identifying and tackling the next structural ceiling. The immediate goal is to separate genuine ecological novelty from loci-count-driven taxon inflation, then systematically prioritize which ceiling (behavioral control, inheritance architecture, interaction richness, environmental complexity, or others) will unlock the next ratchet in cumulative complexity.

## Why This Direction
GenomeV2 validation completed on 2026-03-19 (commits 449f5ab, 23f6718, 28bf60a, 9699b44): live discovery works, extended traits emerge and persist in 100% of canonical runs, and diversification advantage is +83.9% over fixed-genome baseline. On 2026-03-20, `genomeV2Distance()` was normalized with baseline-preserving scaling to remove the direct loci-count inflation path, and a matched 500-step, 2-seed rerun still showed strong diversification advantage (+69.8% vs +78.1% in the pre-normalization subset). The inflation concern is no longer the only plausible explanation for diversification, but full-horizon confirmation is still missing. The next loop should close that remaining validation gap only if needed, then prioritize which of the 14 structural ceiling items identified by the critic agent should be tackled next to continue the complexity ratchet.

## Structural Constraints
- `src/genome-v2.ts` now uses a baseline-scaled mean absolute difference across expressed traits, but the normalized rerun completed only on the established 500-step subset (`docs/genome_v2_canonical_comparison_2026-03-20_normalized_500step.json`), not yet the full 4000-step panel.
- The normalized 500-step subset retained strong diversification advantage (+69.8%), which weakens the pure taxon-inflation hypothesis but does not fully establish full-horizon robustness.
- The backlog contains 14 structural ceiling items, but no systematic prioritization has been done to identify which ceiling is the next highest-leverage break after GenomeV2.
- The current system still has no behavioral control (memoryless decisions), no multi-parent inheritance (clonal mutation only), no evolvable interaction types (fixed alphabet), and no persistent environmental construction (static fertility map).

## Revision History
- 2026-03-20: Normalized GenomeV2 taxonomic distance with baseline-preserving scaling and reran the established 500-step, 2-seed comparison. Diversification advantage declined from +78.1% to +69.8% but remained strong, so loci-count inflation does not appear to be the sole driver of novelty gains.
- 2026-03-20: Shifted from GenomeV2 validation to loci-count inflation falsification and structural ceiling prioritization. GenomeV2 live discovery, observability, pilot, and canonical validation all landed successfully on 2026-03-19, so the next loop must address distance normalization and decide the next monthly direction.
- 2026-03-19: Retired the "Phase 2 wiring" agenda after confirming those changes already landed on 2026-03-18. New monthly direction: unblock live loci discovery, add generic GenomeV2 observability, and validate whether new loci produce ecologically consequential novelty.
- 2026-03-18: Set the month toward GenomeV2 Phase 2 wiring after the structural expansion memo identified representational capacity as the highest-leverage ceiling break.
