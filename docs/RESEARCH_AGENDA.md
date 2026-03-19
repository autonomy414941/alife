# Research Agenda

## Current Direction
Over the next month, shift from GenomeV2 wiring to end-to-end validation of evolvable ecological novelty. The goal is to prove that live simulations can actually discover new loci, that those loci alter ecology rather than just inflate taxon counts, and that the study surface can measure novelty without collapsing back to the legacy metabolism/harvest/aggression triad.

## Why This Direction
GenomeV2 Phase 2 wiring already landed on 2026-03-18 (`af31ee3`, `d63b1e6`, `75821e5`, `195d6da`), so repeating more trait plumbing is no longer the highest-leverage move. The strongest current anti-evidence is structural: live `mutateGenomeV2WithConfig()` still restricts new loci to `harvestEfficiency2`, which means canonical runs cannot discover `habitat_preference`, `trophic_level`, `defense_level`, or metabolic-efficiency loci at all. The only GenomeV2 validation artifact (`docs/genome_v2_canonical_smoke_2026-03-18.json`) converted agents after a legacy run, so it validated fallback equivalence instead of live open-ended trait discovery. Recent open-endedness work also warns that raw cumulative activity can look unbounded while normalized or genuinely new activity stays null, so the next loop needs generic trait observability rather than more raw taxon-count wins.

## Structural Constraints
- `src/genome-v2-adapter.ts`: `candidateNewLoci` is hard-coded to `['harvestEfficiency2']`, blocking discovery of the newly wired ecological loci during live GenomeV2 reproduction.
- `src/genome-v2-canonical-smoke.ts`: the smoke study converts agents with `agentToV2()` after the run instead of seeding and maintaining GenomeV2 agents during evolution, so it does not test live loci addition or selection.
- `src/types.ts` and `src/export.ts`: `StepSummary` and CSV exports still center `meanGenome` and `selectionDifferential` on the legacy triad only, hiding loci counts, trait presence, and generic trait distributions from the main feedback loop.
- `src/genome-v2.ts` and `src/reproduction.ts`: distance and taxonomic thresholds still scale with raw summed locus differences, so more loci can mechanically increase speciation or cladogenesis odds even if the added traits are ecologically inert.

## Revision History
- 2026-03-19: Retired the "Phase 2 wiring" agenda after confirming those changes already landed on 2026-03-18. New monthly direction: unblock live loci discovery, add generic GenomeV2 observability, and validate whether new loci produce ecologically consequential novelty.
- 2026-03-18: Set the month toward GenomeV2 Phase 2 wiring after the structural expansion memo identified representational capacity as the highest-leverage ceiling break.
