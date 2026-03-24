# Graded Reproduction Policy Implementation

**Date**: 2026-03-24
**Session**: Bet 3 (expand binary policy gates)

## Summary

Replaced the all-or-nothing reproduction veto with a graded probability surface. Instead of binary blocking when `recentHarvest < threshold`, reproduction now occurs with probability determined by a sigmoid function, creating a smooth gradient.

## Implementation

### New Policy Parameter
- `reproduction_harvest_threshold_steepness` (0-10 range, default 1.0)
- Heritable via existing policy mutation machinery
- Clamped to [0.01, 10] to prevent degenerate values

### Sigmoid Function
```
probability = 1 / (1 + exp(-steepness * (harvest - threshold) / max(1, threshold)))
```

- Normalized distance accounts for threshold magnitude
- Steepness controls gradient slope
- Always returns 0.5 when harvest equals threshold
- Asymptotes toward 0 and 1 at extremes

### Backward Compatibility
- Steepness = 0 → binary threshold (legacy behavior)
- Existing tests updated to explicitly use steepness=0 for deterministic blocking

## Smoke Study Results

60-step pilot with threshold=2.0, varying steepness:

| Steepness | Total Births | Gated Fraction | Behavior |
|-----------|--------------|----------------|----------|
| 0.0       | 0            | 100%           | Binary (hard block) |
| 0.5       | 2319         | 9%             | Very gentle gradient |
| 1.0       | 2049         | 12%            | Moderate gradient |
| 2.0       | 1625         | 24%            | Steeper gradient |
| 5.0       | 203          | 72%            | Very steep (near-binary) |

The gradient is working as designed: different steepness values produce measurably different birth rates and gating behavior.

## Testing

- Unit tests for sigmoid function across parameter ranges
- Smoke study confirms gradient variation
- All existing tests pass (341 tests)

## Next Steps

This provides the minimal graded reproduction surface requested. Future work:
- Test whether graded control improves fitness over binary gates in live selection
- Compare different steepness values for evolutionary advantage
- Consider whether this pattern should extend to movement/harvest policies
