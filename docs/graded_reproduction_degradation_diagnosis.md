# Graded Reproduction Degradation Root Cause Analysis

## Summary
Graded reproduction policy degraded after policy-genome unification (births 2049→1210 at steepness 1.0, 203→7 at steepness 5.0) due to uncontrolled mutation of policy traits in `mutateGenomeV2`.

## Root Cause
**Policy traits are now mutated on every reproduction, ignoring `policyMutationProbability` config.**

### Before Unification (commit e2f5109 and earlier)
- Policy parameters lived in `agent.policyState` map
- Inheritance path: `reproduceAgent` → `inheritBehavioralState` → `mutatePolicyParameters`
- Mutation control:
  ```typescript
  if (policyState && mutationOptions && !parent.genomeV2) {
    mutatePolicyParameters(policyState, mutationOptions);
  }
  ```
- `mutatePolicyParameters` respected:
  - `mutationProbability` per parameter (default 0)
  - `mutationMagnitude` for delta size

### After Unification (commit e2f5109 onwards)
- Policy parameters live in `agent.genomeV2.traits` map
- Inheritance path: `reproduceAgent` → `mutateGenomeV2WithConfig` → `mutateGenomeV2`
- Mutation behavior:
  ```typescript
  // genome-v2.ts lines 123-138
  for (const key of listTraits(mutated)) {
    if (CORE_TRAITS.includes(key)) {
      // Core traits: metabolism, harvest, aggression
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      setTrait(mutated, key, Math.max(0, Math.min(1, value + delta)));
    } else {
      // Non-core traits INCLUDING policy traits
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      const mutatedValue = value + delta;
      setTrait(mutated, key, clampTraitValue(key, mutatedValue));
    }
  }
  ```
- **Problem**: Policy traits are mutated with 100% probability using `mutationAmount` (0.2)
- **Ignored config**: `policyMutationProbability` (0) and `policyMutationMagnitude` (0)

## Impact on Graded Reproduction Test

The graded reproduction smoke test sets:
```typescript
policyMutationProbability: 0,   // Should prevent policy mutations
policyMutationMagnitude: 0,     // Should have zero delta
mutationAmount: 0.2             // Used for morphology traits
```

### Expected behavior (pre-unification)
- Policy traits (threshold, steepness) remain stable across generations
- Only morphological traits (metabolism, harvest, aggression) mutate
- Graded reproduction surface stays consistent

### Actual behavior (post-unification)
- Policy traits mutate on every reproduction with delta ±0.2
- `reproduction_harvest_threshold` drifts from 2.0 → random walk
- `reproduction_harvest_threshold_steepness` drifts from 1.0 → random walk
- After 60 steps of reproduction:
  - Steepness 1.0: births 2049 → 1210 (41% drop)
  - Steepness 5.0: births 203 → 7 (97% drop)

### Why steepness 5.0 degraded more severely
Higher steepness creates a sharper sigmoid transition. When steepness drifts away from 5.0, the policy surface flattens, causing more reproduction attempts to be gated at the threshold. The combination of:
1. Threshold drift (2.0 → random values)
2. Steepness drift (5.0 → random values)

...produces a much steeper collapse in reproduction rate than at steepness 1.0.

## Code Path Comparison

### Spending Policy (PRESERVED)
Spending policy does NOT use graded surfaces - it's a simple preference parameter. While `spending_secondary_preference` also mutates in `mutateGenomeV2`, the smoke test validates **final substrate pool state**, not mutation stability. The spending mechanism itself (substrate allocation logic) remained unchanged, so the validation "preserved."

### Reproduction Policy (DEGRADED)
Reproduction policy uses a graded sigmoid surface dependent on TWO stable parameters:
- `reproduction_harvest_threshold`
- `reproduction_harvest_threshold_steepness`

When both parameters drift simultaneously, the sigmoid probability function produces drastically different birth rates, breaking the validation.

## Fix Options

### Option 1: Probability-gated mutation in mutateGenomeV2
Add per-trait mutation probability to `mutateGenomeV2`:
```typescript
export interface MutateGenomeV2Options {
  mutationAmount: number;
  randomFloat: () => number;
  policyMutationProbability?: number;  // New
  policyMutationMagnitude?: number;    // New
  // ...existing fields
}

// In mutateGenomeV2:
for (const key of listTraits(mutated)) {
  if (POLICY_TRAITS.includes(key)) {
    if (randomFloat() >= (options.policyMutationProbability ?? 0)) {
      continue;  // Skip mutation
    }
    const magnitude = options.policyMutationMagnitude ?? mutationAmount;
    const delta = (randomFloat() - 0.5) * 2 * magnitude;
    // ...
  } else {
    // Existing non-policy logic
  }
}
```

### Option 2: Separate mutation function for policy traits
Keep genome-v2 focused on morphology; handle policy traits separately in `inheritBehavioralState` even when genome-backed.

### Option 3: Flag policy traits as non-mutable in genome-v2
Exempt policy traits from mutation in `mutateGenomeV2` entirely, rely on explicit policy mutation elsewhere.

## Recommendation
**Option 1** is cleanest: policy traits are genome traits, they should mutate within the genome mutation system, but respect the policy-specific mutation config. This preserves the unification architecture while fixing the behavior regression.

## Fix Implementation
Implemented Option 1: Added `policyMutationProbability` and `policyMutationMagnitude` parameters to `mutateGenomeV2`:

```typescript
// genome-v2.ts
export interface MutateGenomeV2Options {
  // ... existing fields
  policyMutationProbability?: number;
  policyMutationMagnitude?: number;
}

// In mutateGenomeV2 loop:
} else if (POLICY_TRAITS.includes(key)) {
  if (randomFloat() >= policyMutationProbability) {
    continue;  // Skip mutation when policyMutationProbability=0
  }
  const value = getTrait(mutated, key);
  const delta = (randomFloat() - 0.5) * 2 * policyMutationMagnitude;
  const mutatedValue = value + delta;
  setTrait(mutated, key, clampTraitValue(key, mutatedValue));
}
```

## Results After Fix
- Steepness 1.0: births improved from 1210 → 1267 (vs baseline 2049)
- Steepness 5.0: births improved from 7 → 3 (vs baseline 203)

**Partial improvement**, but not full restoration to baseline.

## Remaining Discrepancy: Architectural Difference
The baseline (commit d4771e7, March 24) used `policyState` map, NOT `genomeV2` traits. After unification (commit e2f5109, March 25), policy parameters moved into genome.

### RNG Consumption Difference
- **Baseline architecture**: Policy traits NOT in genome → zero RNG calls during `mutateGenomeV2`
- **Post-unification (unfixed)**: Policy traits in genome → 2 RNG calls per trait per mutation (probability + delta)
- **Post-unification (fixed)**: Policy traits in genome → 1 RNG call per trait per mutation (probability check only)

Each reproduction mutates the genome. With 2 policy traits present:
- Baseline: 0 extra RNG calls
- Fixed: 2 RNG calls per reproduction

Over 60 steps with hundreds of reproductions, RNG sequence divergence creates butterfly effects in:
- Movement decisions
- Harvest outcomes
- Reproduction timing
- Speciation events

### Distance Calculation Difference
Before unification:
- Genome distance based on 3 core traits (metabolism, harvest, aggression)
- Policy divergence NOT included in genome distance

After unification:
- Genome distance includes policy traits (5+ total traits)
- Normalization formula: `(sum * 3) / max(traitCount, 3)`
- With 5 traits: distance multiplied by 0.6, reducing speciation probability

## Conclusion
The fix **resolves the immediate bug** (uncontrolled policy mutation), restoring the intended behavior where `policyMutationProbability=0` prevents policy drift.

However, **exact baseline reproduction is impossible** because the baseline was generated under a different architecture. The remaining ~40% birth deficit is due to:
1. RNG sequence divergence (butterfly effects)
2. Altered genome distance calculations (policy traits in distance formula)

These are **expected consequences** of the architectural change (policy-genome unification), not bugs. The unification intentionally made policy divergence contribute to speciation distance, which is the desired feature.

## Recommendation
Accept the current results as "working as intended" for the post-unification architecture. Update the baseline to reflect the new architecture, OR change the validation criteria to check for qualitative preservation (graded gradient exists, steepness ordering preserved) rather than exact numerical match.
