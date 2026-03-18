# Actor Session Summary - Bet 3: Metabolic Efficiency Loci

**Date**: 2026-03-18
**Bet**: Add Metabolic Efficiency Loci for Substrate Awareness
**Status**: Complete ✓

## Implementation

Added substrate-aware metabolic efficiency to GenomeV2:

1. **New Loci** (`src/genome-v2.ts`):
   - `metabolic_efficiency_primary` (default: 0.5)
   - `metabolic_efficiency_secondary` (default: 0.5)
   - Added to `EXTENDED_TRAITS` for evolutionary discovery

2. **Cost Modifier** (`src/agent-energy.ts`):
   - Updated `spendAgentEnergy()` to apply per-substrate efficiency multipliers
   - Formula: `multiplier = 2.0 - 2.0 * efficiency`
   - Only applied when agent has explicit efficiency loci (preserves backward compatibility)

3. **Tests** (`test/metabolic-efficiency.test.ts`):
   - 3 new tests verifying differential substrate costs
   - Confirms specialists achieve lower drain than generalists
   - All 273 tests passing

## Efficiency Semantics

The chosen formula `(2.0 - 2.0 * efficiency)` with default 0.5 provides:

| Efficiency | Multiplier | Interpretation |
|-----------|-----------|----------------|
| 1.0 | 0.0 | Perfect specialist (minimal cost) |
| 0.75 | 0.5 | Strong specialist (half cost) |
| 0.5 | 1.0 | Baseline (matches agents without loci) |
| 0.25 | 1.5 | Poor performance (1.5x cost) |
| 0.0 | 2.0 | Incompetent (double cost) |

This enables resource partitioning: agents can evolve high efficiency on one substrate while accepting lower efficiency on another, creating distinct ecological niches.

## Success Criteria Met

- ✅ `EXTENDED_TRAITS` includes both efficiency loci
- ✅ `spendAgentEnergy()` checks for loci presence and applies modifiers
- ✅ Smoke test confirms specialists reduce primary-pool drain (96.0 vs 80.0)

## Commits

- `75821e5`: feat: add metabolic efficiency loci for substrate-aware evolution
- `195d6da`: fix: correct metabolic efficiency formula for cost reduction

## Next Steps

This completes Bet 3. The metabolic efficiency loci are now available for evolutionary discovery and provide substrate-specific cost differentiation. Combined with Bets 1-2 (habitat, trophic, defense as first-class loci), this enables GenomeV2 Phase 2 validation experiments.
