# Phenotype-Fitness Landscape Analysis

Date: 2026-03-30
Steps per run: 500
Seeds: 42, 123, 456
Min exposures for stability: 10

## Purpose

This analysis aggregates policy-fitness records into phenotype-by-environment outcome maps. The goal is to identify which expressed trait configurations (trophic level, defense, metabolic efficiency, resource preference) gain harvest, survival, or reproduction advantages in specific environmental contexts (fertility, crowding, age, disturbance phase).

## Interpretation

- **Trophic**: 0=herbivore, 1=mid, 2=carnivore
- **Defense**: 0=low, 1=mid, 2=high
- **MetabEff**: 0=low metabolic efficiency (primary resource), 1=mid, 2=high
- **ResPref**: 0=primary-preferring, 1=mixed, 2=secondary-preferring
- **Fert**: Fertility bin (higher = more fertile environment)
- **Crowd**: Crowding bin (higher = more crowded)
- **Age**: Age bin (0=young, 1=mid, 2=old)
- **Dist**: Disturbance phase (0=recent disturbance, 1=stable)
- **Policy%**: Percentage of exposures with any active policy

## Run 1 (Seed 42)

# Phenotype-Fitness Landscape Analysis

## Configuration
- Seed: 42
- Steps: 500
- Min exposures for stability: 10
- Min fitness threshold:
  - Harvest intake: 5
  - Survival rate: 0.5

## Summary
- Total records: 482381
- Unique phenotype-environment bins: 7
- Stable regions: 0

## Top 10 Regions by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 79840 | 0.34 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 58167 | 0.29 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 36670 | 0.28 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 125890 | 0.26 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 104638 | 0.22 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 73236 | 0.22 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 3940 | 0.00 | 0.000 | 0.005 | 0.0% |

## Top 10 Regions by Survival Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 125890 | 0.26 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 104638 | 0.22 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 73236 | 0.22 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 79840 | 0.34 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 58167 | 0.29 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 36670 | 0.28 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 3940 | 0.00 | 0.000 | 0.005 | 0.0% |

## Top 10 Regions by Reproduction Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 58167 | 0.29 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 79840 | 0.34 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 36670 | 0.28 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 73236 | 0.22 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 104638 | 0.22 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 125890 | 0.26 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 3940 | 0.00 | 0.000 | 0.005 | 0.0% |

## Run 2 (Seed 123)

# Phenotype-Fitness Landscape Analysis

## Configuration
- Seed: 123
- Steps: 500
- Min exposures for stability: 10
- Min fitness threshold:
  - Harvest intake: 5
  - Survival rate: 0.5

## Summary
- Total records: 748038
- Unique phenotype-environment bins: 7
- Stable regions: 0

## Top 10 Regions by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 126469 | 0.23 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 89199 | 0.19 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 53136 | 0.18 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 211316 | 0.17 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 162101 | 0.14 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 98708 | 0.13 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 7109 | 0.00 | 0.000 | 0.007 | 0.0% |

## Top 10 Regions by Survival Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 211316 | 0.17 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 162101 | 0.14 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 98708 | 0.13 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 126469 | 0.23 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 89199 | 0.19 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 53136 | 0.18 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 7109 | 0.00 | 0.000 | 0.007 | 0.0% |

## Top 10 Regions by Reproduction Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 98708 | 0.13 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 53136 | 0.18 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 89199 | 0.19 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 126469 | 0.23 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 162101 | 0.14 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 211316 | 0.17 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 7109 | 0.00 | 0.000 | 0.007 | 0.0% |

## Run 3 (Seed 456)

# Phenotype-Fitness Landscape Analysis

## Configuration
- Seed: 456
- Steps: 500
- Min exposures for stability: 10
- Min fitness threshold:
  - Harvest intake: 5
  - Survival rate: 0.5

## Summary
- Total records: 709876
- Unique phenotype-environment bins: 7
- Stable regions: 0

## Top 10 Regions by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 116702 | 0.25 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 82561 | 0.21 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 49396 | 0.20 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 204170 | 0.18 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 156757 | 0.15 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 93381 | 0.14 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 6909 | 0.00 | 0.000 | 0.004 | 0.0% |

## Top 10 Regions by Survival Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 204170 | 0.18 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 156757 | 0.15 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 93381 | 0.14 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 116702 | 0.25 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 82561 | 0.21 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 49396 | 0.20 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 6909 | 0.00 | 0.000 | 0.004 | 0.0% |

## Top 10 Regions by Reproduction Rate
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 49396 | 0.20 | 1.000 | 0.015 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 93381 | 0.14 | 1.000 | 0.014 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 82561 | 0.21 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 116702 | 0.25 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 156757 | 0.15 | 1.000 | 0.012 | 0.0% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 204170 | 0.18 | 1.000 | 0.011 | 0.0% |
| 1 | 1 | 1 | 1 | -1 | -1 | -1 | -1 | 6909 | 0.00 | 0.000 | 0.004 | 0.0% |

## Cross-Run Stability Analysis

Regions that appear in top 10 by harvest across multiple seeds:

| Phenotype (T-D-M-R) | Appearances |
|---------------------|-------------|
| 1-1-1-1 | 21/3 |
