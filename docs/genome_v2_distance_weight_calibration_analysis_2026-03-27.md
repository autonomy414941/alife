# GenomeV2 Distance Weight Calibration Analysis

**Date:** 2026-03-27
**Artifact:** `genome_v2_distance_weight_calibration_2026-03-27.json`

## Question
What distance weighting scheme prevents policy-only distance from inflating taxonomic outcomes while preserving ecologically meaningful diversification?

## Method
Compared four weighting regimes across two scenarios (policy-threshold-heavy and mixed-divergence) using 2 seeds and 120 steps each.

### Regimes Tested
1. **Baseline**: All traits weight 1.0 (implicit)
2. **Moderate policy downweight**: `policyThreshold: 0.25, policyBounded: 0.5, morphology: 1.0`
3. **Strong policy downweight**: `policyThreshold: 0.1, policyBounded: 0.3, morphology: 1.0`
4. **Morphology priority**: `morphology: 2.0, policyThreshold: 0.2, policyBounded: 0.4`

### Scenarios
1. **Policy-threshold-heavy**: High policy mutation (prob=1.0, mag=1.4), minimal morphology mutation (0.03)
2. **Mixed-divergence**: Balanced mutation (morph=0.16, policy prob=0.65, mag=0.5)

## Results Summary

| Regime | Policy-heavy species | Mixed species | Policy reduction % | Mixed reduction % |
|--------|---------------------|---------------|-------------------|-------------------|
| Baseline | 2535.0 | 1410.5 | - | - |
| Moderate downweight | 1925.5 | 804.0 | -24.0% | -43.0% |
| Strong downweight | 1476.0 | 522.0 | -41.8% | -63.0% |
| Morphology priority | 2018.0 | 2762.5 | -20.4% | +95.9% |

## Key Findings

1. **Morphology-priority regime is unsuitable for default weighting**
   - While it reduces policy-heavy species by 20.4%, it *inflates* mixed-divergence species by 95.9%
   - Up-weighting morphology (2.0x) causes morphology-driven mutations to dominate distance calculations
   - This creates excessive speciation events in the mixed scenario where morphology mutation is higher (0.16 vs 0.03)
   - This violates the goal of preventing inflation; it merely shifts inflation from policy to morphology

2. **Strong downweight achieves best policy inflation control**
   - Reduces policy-heavy species by 41.8% (2535 → 1476)
   - Reduces mixed species by 63.0% (1410.5 → 522)
   - However, the 63% reduction in mixed-divergence may be too aggressive

3. **Moderate downweight balances control and preservation**
   - Reduces policy-heavy species by 24.0% (2535 → 1925.5)
   - Reduces mixed species by 43.0% (1410.5 → 804)
   - More balanced impact across scenarios

4. **Tradeoff structure**
   - All down-weighting regimes reduce species counts in both scenarios
   - The question is whether the reduction is proportionally larger in the policy-heavy scenario
   - Relative reduction: moderate (24% vs 43%), strong (42% vs 63%)
   - Strong regime reduces policy-heavy by 1.7× its baseline reduction rate, but also reduces mixed by 1.5×
   - Both regimes reduce mixed-divergence more than policy-heavy in absolute percentage terms

## Interpretation

The results reveal a structural issue: **down-weighting policy traits reduces total species counts across all scenarios**, but does not selectively suppress policy-driven inflation while preserving morphology-driven diversification.

Possible explanations:
1. Both scenarios rely on a mix of morphology and policy traits for distance, so any weighting change affects both
2. The mixed-divergence scenario may actually have substantial policy-driven distance despite higher morphology mutation
3. The current distance formula may not differentiate between "policy-only" and "morphology-linked" speciation events

## Recommendation

### Rejected Default
**Morphology priority** (`morphology: 2.0, policyThreshold: 0.2, policyBounded: 0.4`) is rejected because it inflates diversification in the mixed scenario.

### Tentative Default
**Moderate policy downweight** (`policyThreshold: 0.25, policyBounded: 0.5`) is a defensible conservative default because:
- It provides meaningful policy inflation control (24% reduction in policy-heavy scenario)
- It preserves more diversification in the mixed scenario than the strong regime
- It is less aggressive than the previous smoke test weights (0.15/0.75)

### Alternative
**Strong policy downweight** (`policyThreshold: 0.1, policyBounded: 0.3`) provides stronger policy inflation control (42% reduction) but may suppress ecologically meaningful diversification too aggressively (63% mixed reduction).

## Next Steps

1. **Pending evidence from Bet 1**: The graded-harvest expression fix may change the balance of policy-driven vs morphology-driven speciation
2. **Generic trait metrics (Bet 3)**: Once genome-wide observability exists, re-run this calibration with metrics that directly show which trait categories are driving each speciation event
3. **Environmental asymmetry**: The current symmetric resource environment may wash out ecological distinctness; calibration may need to be re-run once environment provides stronger selection gradients

## Conclusion

The calibration panel shows that all policy down-weighting regimes reduce species counts across both scenarios, with no regime selectively preserving mixed-divergence while strongly suppressing policy-heavy inflation.

**Recommended default**: `{ categories: { policyThreshold: 0.25, policyBounded: 0.5 } }`

This recommendation is provisional. The weights should be re-evaluated after expression fidelity is restored (Bet 1) and genome-wide trait metrics are available (Bet 3).
