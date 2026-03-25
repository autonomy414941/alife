# Policy-Driven Speciation and Cladogenesis

## Summary

Following the policy-genome unification (2026-03-25), behavioral policy parameters are now first-class loci in `genomeV2.traits`. Policy divergence contributes to `genomeV2Distance()` and can trigger speciation and cladogenesis thresholds, making behavioral differentiation visible to taxonomic machinery and diversity metrics.

## Mechanism

### Unified Genome Distance

`genomeV2Distance()` (src/genome-v2.ts:167-180) computes distance as:

```typescript
for (const key of allKeys) {
  sum += Math.abs(getTrait(a, key) - getTrait(b, key));
}
return (sum * DISTANCE_BASELINE_TRAIT_COUNT) / normalizationCount;
```

This includes:
- Core morphological traits: metabolism, harvest, aggression
- Optional traits: harvestEfficiency2, habitat_preference, trophic_level, etc.
- Policy traits: reproduction_harvest_threshold, harvest_secondary_preference, spending_secondary_preference, movement_energy_reserve_threshold, movement_min_recent_harvest, reproduction_harvest_threshold_steepness

### Trait Range Considerations

**Bounded traits [0, 1]:**
- Core morphological (metabolism, harvest, aggression)
- harvest_secondary_preference, spending_secondary_preference

**Unbounded policy thresholds [0, ∞):**
- reproduction_harvest_threshold
- movement_energy_reserve_threshold
- movement_min_recent_harvest

**Bounded policy steepness [0.01, 10]:**
- reproduction_harvest_threshold_steepness

Unbounded policy thresholds can contribute larger distances than morphological traits. A shift from reproduction_harvest_threshold=0 to 10 contributes 10 units to the raw distance sum, whereas maximum morphological divergence across all three core traits is 3 units.

### Speciation and Cladogenesis

Speciation (src/genome-v2-adapter.ts:52):
```typescript
return genomeV2Distance(parentGenomeV2, childGenomeV2) >= config.speciationThreshold;
```

Cladogenesis (src/genome-v2-adapter.ts:64):
```typescript
return genomeV2Distance(founderGenomeV2, childGenomeV2) >= config.cladogenesisThreshold;
```

Both use the same unified distance function that includes policy traits.

## Test Evidence

### Focused Unit Tests (test/policy-driven-speciation.test.ts)

1. **Policy divergence increments distance**: Pure policy trait difference (reproduction_harvest_threshold: 5.0 → 10.0) produces distance = 3.75

2. **Pure policy divergence crosses speciation threshold**: reproduction_harvest_threshold: 0.0 → 1.0 produces distance ≥ 0.25 (default threshold), triggering speciation

3. **Multiple policy traits accumulate**: harvest_secondary_preference (0.1 → 0.9) + spending_secondary_preference (0.1 → 0.9) + reproduction_harvest_threshold (0.0 → 1.0) produces distance > 1.0

4. **Policy divergence crosses cladogenesis threshold**: reproduction_harvest_threshold: 0.0 → 5.0 produces distance ≥ 1.0 (default threshold), triggering cladogenesis

5. **Unbounded traits dominate morphological traits**: reproduction_harvest_threshold: 0.0 → 10.0 produces larger distance than maximum morphological divergence (metabolism, harvest, aggression: 0.1 → 0.9 each)

### Smoke Study (test/policy-driven-taxonomic-splits-smoke.test.ts)

Three bounded 100-step simulations with varying speciationThreshold, cladogenesisThreshold, and mutationAmount confirm that policy-driven distance can create taxonomic splits under controlled conditions.

## Implications

### Behavioral Differentiation → Taxonomic Novelty

Policy divergence now counts toward speciation and cladogenesis distance, so behavioral niche partitioning (e.g., lineages specializing in high vs. low reproduction thresholds, or primary vs. secondary substrate preference) can create taxonomic splits even without morphological divergence.

### Relabel-Null Baseline

Current relabel-null baselines (used in validation studies) do not preserve or match policy state when scrambling clades, so policy-mediated clade advantages are washed out. Future work may need to extend relabel-null to preserve policy distributions if policy-driven fitness differences become substantial.

### Distance Weighting

The current implementation treats all trait differences equally in the distance sum. Unbounded policy thresholds can dominate distance calculations. Future refinements could add per-locus weights if policy variance systematically drowns out morphological variance in practice.

## Open Questions

1. Should policy loci have equal weight to morphological loci in distance calculations, or should they be scaled separately?

2. Do policy-driven taxonomic splits create measurable ecological differentiation in longer-horizon studies?

3. Should relabel-null baselines preserve policy state to avoid washing out policy-mediated fitness advantages?

## References

- src/genome-v2.ts:167-180 (genomeV2Distance)
- src/genome-v2-adapter.ts:52,64 (speciation and cladogenesis thresholds)
- test/policy-driven-speciation.test.ts (focused unit tests)
- test/policy-driven-taxonomic-splits-smoke.test.ts (bounded smoke study)
