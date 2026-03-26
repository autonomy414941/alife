# Graded Harvest Fitness Differentiation Pilot

**Date**: 2026-03-26
**Bet**: Bet 4 - Test graded harvest policy fitness differentiation

## Objective

Compare graded harvest policy (varying steepness) against binary baseline (steepness=0) to measure whether smooth substrate-choice surfaces create measurable fitness advantages, niche partitioning, or ecological differentiation.

## Methods

- **Seeds**: 4 (42, 100, 200, 300)
- **Steepness values**: [0, 0.5, 1.0, 2.0]
- **Steps**: 150
- **Grid**: 25x25
- **Initial agents**: 40
- **Harvest threshold**: 5.0
- **Base preference**: 0.5

## Results

| Seed | Steepness | Final Pop | Avg Pop | Births | Deaths | Mean Energy | Species | Clades | Repro Success |
|------|-----------|-----------|---------|--------|--------|-------------|---------|--------|---------------|
|   42 |       0.0 |     15564 |  7432.0 |  22306 |   6782 |        3.94 |     881 |     24 |         0.767 |
|   42 |       0.5 |     12351 |  6271.6 |  19549 |   7238 |        4.21 |     804 |     25 |         0.730 |
|   42 |       1.0 |     11942 |  6222.1 |  18959 |   7057 |        3.89 |     669 |     29 |         0.729 |
|   42 |       2.0 |     10936 |  5851.5 |  18301 |   7405 |        4.08 |     756 |     31 |         0.712 |
|  100 |       0.0 |     14089 |  7043.4 |  21226 |   7177 |        3.96 |     899 |     27 |         0.747 |
|  100 |       0.5 |     10409 |  5785.4 |  18045 |   7676 |        4.19 |     623 |     26 |         0.702 |
|  100 |       1.0 |     13986 |  6785.8 |  20524 |   6578 |        3.97 |     880 |     29 |         0.757 |
|  100 |       2.0 |     14292 |  6892.6 |  21045 |   6793 |        4.04 |     869 |     28 |         0.756 |
|  200 |       0.0 |     11846 |  6473.0 |  19498 |   7692 |        4.28 |     653 |     28 |         0.717 |
|  200 |       0.5 |     12252 |  6392.6 |  19374 |   7162 |        4.11 |     806 |     24 |         0.730 |
|  200 |       1.0 |     14549 |  7022.1 |  21272 |   6763 |        3.94 |     876 |     26 |         0.759 |
|  200 |       2.0 |     13914 |  6862.0 |  20898 |   7024 |        4.09 |     862 |     26 |         0.748 |
|  300 |       0.0 |     11454 |  6216.8 |  19067 |   7653 |        3.90 |     692 |     29 |         0.714 |
|  300 |       0.5 |     10664 |  5905.0 |  18107 |   7483 |        4.01 |     729 |     30 |         0.708 |
|  300 |       1.0 |     13054 |  6397.9 |  20046 |   7032 |        4.33 |     719 |     25 |         0.740 |
|  300 |       2.0 |     11012 |  5902.4 |  18470 |   7498 |        4.01 |     729 |     29 |         0.711 |

### Aggregate by Steepness

| Steepness | Avg Final Pop | Avg Pop | Avg Births | Avg Deaths | Avg Energy | Avg Species | Avg Clades | Avg Repro Success |
|-----------|---------------|---------|------------|------------|------------|-------------|------------|-------------------|
| 0.0       | 13238.3       | 6791.3  | 20524.3    | 7326.0     | 4.02       | 781.3       | 27.0       | 0.736             |
| 0.5       | 11419.0       | 6088.6  | 18768.8    | 7389.8     | 4.13       | 740.5       | 26.3       | 0.717             |
| 1.0       | 13382.8       | 6607.0  | 20200.3    | 6857.5     | 4.03       | 786.0       | 27.3       | 0.746             |
| 2.0       | 12538.5       | 6377.1  | 19678.5    | 7180.0     | 4.05       | 804.0       | 28.5       | 0.732             |

## Findings

### No Clear Monotonic Fitness Gradient

Graded harvest policy does **not** create a clear monotonic fitness advantage as steepness increases. Key observations:

1. **Binary baseline (steepness=0) performs competitively**: Binary harvest shows comparable or slightly better performance across most metrics compared to graded policies.

2. **High variance across seeds**: Results vary substantially by seed, suggesting stochastic dynamics dominate over systematic policy effects.

3. **Weak steepness effects**:
   - Steepness 1.0 shows highest final population (13382.8) and reproductive success (0.746)
   - Steepness 0.5 shows lowest performance (11419.0 final pop, 0.717 repro success)
   - Steepness 2.0 shows intermediate performance
   - Binary (0.0) is competitive with best graded policies

4. **Diversity metrics**: Active clades increase slightly with steepness (27.0 → 28.5), but active species show no clear pattern.

5. **Energy reserves**: Mean energy shows minimal variation (3.89-4.33), with steepness 0.5 slightly higher (4.13), suggesting graded policies may allow slightly more conservative energy management.

### No Measurable Niche Partitioning

The absence of strong fitness differentiation suggests that:
- Graded harvest does not create measurable ecological advantages over binary harvest in this parameter regime
- Substrate choice smoothness may not be a critical fitness dimension under current resource dynamics
- Policy-driven niche partitioning (if any) is dominated by seed-specific stochasticity

### Comparison to Graded Reproduction

Unlike graded reproduction (which showed births degradation: 2049→1210 at steepness 1.0 after unification), graded harvest shows:
- **No degradation**: All steepness values produce viable populations
- **No clear selection pressure**: Binary and graded policies coexist without strong fitness signal
- **Neutral variation**: Steepness appears to create neutral or weakly selected variation rather than strong fitness differences

## Conclusion

**Graded harvest policy does NOT create measurable fitness differentiation or ecological niche partitioning in this bounded pilot.**

- Binary harvest (steepness=0) remains competitive with graded policies
- No monotonic fitness gradient emerges across steepness values
- High seed-to-seed variance masks any subtle policy effects
- Graded harvest surface is functional but ecologically neutral in current configuration

This contrasts with the research agenda's hypothesis that "graded harvest policies create measurable fitness differentiation." The smooth substrate-choice surface exists mechanically but does not translate to selective advantage or niche structure under current resource dynamics.

### Next Steps

If graded harvest policy is to drive ecological differentiation:
1. Resource dynamics may need to be more heterogeneous (patchy, seasonal, or disturbance-driven)
2. Harvest thresholds may need stronger coupling to agent state (energy reserves, recent intake)
3. Substrate preferences may need to interact with morphological or metabolic traits

Alternatively, this result suggests that **harvest policy smoothness is not a high-leverage axis for fitness differentiation**, and development effort should focus on other policy dimensions or environmental forcing.
