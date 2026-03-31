# Phenotype-Fitness Landscape (genomeV2-seeded)

Date: 2026-03-31
Analysis steps: 500
Seeds: 42, 123, 456
Min exposures for stability: 10

## Purpose

This analysis identifies why the March 30 phenotype-fitness landscape showed 0.0% policy-positive exposure despite large reported policy-sensitive diversity gains.

## Key Finding

**Initial agents created by the default simulation do not have `genomeV2`, and therefore cannot evolve policy loci** because:

1. Parents without `genomeV2` produce offspring without `genomeV2` (simulation-reproduction.ts:367-369)
2. Policy loci only exist in `genomeV2`, not in the legacy `genome` structure
3. The `addLociProbability: 0.02` in `mutateGenomeV2WithConfig` can add new loci, but only if the genome is already genomeV2

This run seeds initial agents with `genomeV2 = fromGenome(genome)`, allowing policy loci to evolve via `policyMutationProbability` during reproduction.

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

- Total records: 1582148
- Policy-positive records: 20689 (1.3%)
- Unique phenotype-environment bins: 41
- Bins with policy-positive exposure: 24 (58.5%)

### Top 10 Bins by Policy-Positive Share
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Policy% | Harvest | Survival | Repro |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|---------|----------|-------|
| 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 90 | 100.0% | 0.27 | 1.000 | 0.000 |
| 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 82 | 100.0% | 0.28 | 1.000 | 0.000 |
| 1 | 1 | 1 | 0 | 1 | 0 | 2 | 1 | 69 | 100.0% | 0.27 | 1.000 | 0.000 |
| 1 | 1 | 1 | 0 | 2 | 0 | 0 | 1 | 27 | 100.0% | 0.26 | 1.000 | 0.037 |
| 1 | 1 | 1 | 0 | 2 | 0 | 2 | 1 | 13 | 100.0% | 0.31 | 1.000 | 0.000 |
| 1 | 1 | 1 | 2 | 1 | 0 | 0 | 1 | 27 | 100.0% | 0.03 | 1.000 | 0.000 |
| 1 | 1 | 2 | 0 | 2 | 0 | 0 | 1 | 35 | 100.0% | 0.20 | 1.000 | 0.000 |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 109409 | 3.1% | 0.41 | 1.000 | 0.015 |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 57228 | 2.7% | 0.30 | 1.000 | 0.009 |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 83091 | 2.6% | 0.31 | 1.000 | 0.010 |

### Top 10 Bins by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 109409 | 0.41 | 1.000 | 0.015 | 3.1% |
| 1 | 0 | 1 | 1 | 2 | 0 | 2 | 1 | 19 | 0.39 | 1.000 | 0.000 | 0.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 83091 | 0.31 | 1.000 | 0.010 | 2.6% |
| 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 175471 | 0.31 | 1.000 | 0.012 | 1.5% |
| 1 | 1 | 1 | 0 | 2 | 0 | 2 | 1 | 13 | 0.31 | 1.000 | 0.000 | 100.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 2 | 1 | 57228 | 0.30 | 1.000 | 0.009 | 2.7% |
| 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 82 | 0.28 | 1.000 | 0.000 | 100.0% |
| 1 | 1 | 0 | 1 | 2 | 0 | 0 | 1 | 78 | 0.28 | 1.000 | 0.013 | 0.0% |
| 1 | 1 | 1 | 0 | 1 | 0 | 2 | 1 | 69 | 0.27 | 1.000 | 0.000 | 100.0% |
| 1 | 1 | 0 | 1 | 1 | 0 | 2 | 1 | 32 | 0.27 | 1.000 | 0.000 | 0.0% |

## Run 2 (Seed 123)

- Total records: 2315999
- Policy-positive records: 73647 (3.2%)
- Unique phenotype-environment bins: 83
- Bins with policy-positive exposure: 55 (66.3%)

### Top 10 Bins by Policy-Positive Share
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Policy% | Harvest | Survival | Repro |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|---------|----------|-------|
| 1 | 1 | 1 | 0 | -1 | -1 | -1 | -1 | 32 | 100.0% | 0.00 | 0.000 | 0.000 |
| 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 868 | 100.0% | 0.09 | 1.000 | 0.010 |
| 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 666 | 100.0% | 0.10 | 1.000 | 0.015 |
| 1 | 1 | 1 | 0 | 1 | 0 | 2 | 1 | 499 | 100.0% | 0.12 | 1.000 | 0.012 |
| 1 | 1 | 1 | 0 | 2 | 0 | 0 | 1 | 1253 | 100.0% | 0.10 | 1.000 | 0.017 |
| 1 | 1 | 1 | 0 | 2 | 0 | 1 | 1 | 610 | 100.0% | 0.11 | 1.000 | 0.013 |
| 1 | 1 | 1 | 0 | 2 | 0 | 2 | 1 | 372 | 100.0% | 0.08 | 1.000 | 0.008 |
| 1 | 1 | 1 | 2 | -1 | -1 | -1 | -1 | 11 | 100.0% | 0.00 | 0.000 | 0.000 |
| 1 | 1 | 1 | 2 | 1 | 0 | 0 | 1 | 1177 | 100.0% | 0.03 | 1.000 | 0.008 |
| 1 | 1 | 1 | 2 | 1 | 0 | 1 | 1 | 688 | 100.0% | 0.03 | 1.000 | 0.010 |

### Top 10 Bins by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 0 | 1 | 2 | 0 | 0 | 1 | 122 | 0.28 | 1.000 | 0.008 | 0.0% |
| 1 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 108 | 0.23 | 1.000 | 0.009 | 0.0% |
| 1 | 1 | 0 | 1 | 2 | 0 | 1 | 1 | 46 | 0.20 | 1.000 | 0.000 | 0.0% |
| 1 | 1 | 0 | 1 | 1 | 0 | 2 | 1 | 28 | 0.19 | 1.000 | 0.000 | 0.0% |
| 1 | 2 | 2 | 1 | 2 | 0 | 1 | 1 | 11 | 0.19 | 1.000 | 0.000 | 0.0% |
| 2 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 1033 | 0.19 | 1.000 | 0.011 | 2.6% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 388524 | 0.19 | 1.000 | 0.015 | 2.7% |
| 1 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 201 | 0.17 | 1.000 | 0.015 | 0.0% |
| 2 | 1 | 1 | 1 | 2 | 0 | 1 | 1 | 738 | 0.17 | 1.000 | 0.012 | 0.0% |
| 1 | 2 | 1 | 1 | 2 | 0 | 0 | 1 | 5986 | 0.16 | 1.000 | 0.012 | 3.9% |

## Run 3 (Seed 456)

- Total records: 3996003
- Policy-positive records: 298224 (7.5%)
- Unique phenotype-environment bins: 82
- Bins with policy-positive exposure: 66 (80.5%)

### Top 10 Bins by Policy-Positive Share
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Policy% | Harvest | Survival | Repro |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|---------|----------|-------|
| 1 | 0 | 1 | 0 | 2 | 0 | 0 | 1 | 39 | 100.0% | 0.08 | 1.000 | 0.000 |
| 1 | 0 | 1 | 0 | 2 | 0 | 1 | 1 | 40 | 100.0% | 0.02 | 1.000 | 0.000 |
| 1 | 0 | 1 | 0 | 2 | 0 | 2 | 1 | 41 | 100.0% | 0.02 | 1.000 | 0.000 |
| 1 | 1 | 1 | 0 | -1 | -1 | -1 | -1 | 110 | 100.0% | 0.00 | 0.000 | 0.000 |
| 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 2572 | 100.0% | 0.10 | 1.000 | 0.009 |
| 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1118 | 100.0% | 0.06 | 1.000 | 0.006 |
| 1 | 1 | 1 | 0 | 1 | 0 | 2 | 1 | 401 | 100.0% | 0.05 | 1.000 | 0.000 |
| 1 | 1 | 1 | 0 | 2 | 0 | 0 | 1 | 2591 | 100.0% | 0.10 | 1.000 | 0.019 |
| 1 | 1 | 1 | 0 | 2 | 0 | 1 | 1 | 1469 | 100.0% | 0.08 | 1.000 | 0.018 |
| 1 | 1 | 1 | 0 | 2 | 0 | 2 | 1 | 565 | 100.0% | 0.05 | 1.000 | 0.035 |

### Top 10 Bins by Harvest Intake
| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |
|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|
| 1 | 1 | 0 | 1 | 2 | 0 | 0 | 1 | 186 | 0.30 | 1.000 | 0.022 | 0.0% |
| 1 | 1 | 0 | 1 | 2 | 0 | 1 | 1 | 154 | 0.25 | 1.000 | 0.000 | 0.0% |
| 1 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 140 | 0.14 | 1.000 | 0.000 | 0.0% |
| 1 | 0 | 2 | 1 | 1 | 0 | 0 | 1 | 38 | 0.14 | 1.000 | 0.000 | 0.0% |
| 1 | 1 | 1 | 2 | 2 | 0 | 0 | 1 | 571 | 0.13 | 1.000 | 0.009 | 100.0% |
| 1 | 1 | 1 | 1 | 2 | 0 | 0 | 1 | 574208 | 0.12 | 1.000 | 0.018 | 8.4% |
| 1 | 2 | 1 | 0 | 1 | 0 | 1 | 1 | 40 | 0.11 | 1.000 | 0.000 | 100.0% |
| 2 | 1 | 1 | 1 | 1 | 0 | 2 | 1 | 34 | 0.11 | 1.000 | 0.000 | 0.0% |
| 1 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 2572 | 0.10 | 1.000 | 0.009 | 100.0% |
| 1 | 1 | 1 | 2 | 2 | 0 | 1 | 1 | 287 | 0.10 | 1.000 | 0.000 | 100.0% |

## Conclusion

Across all runs:
- Policy-positive records: 392560/7894150 (5.0%)
- Bins with policy-positive exposure: 145/206 (70.4%)

**Policy-active cohorts exist**, confirming that genomeV2-seeding enables policy evolution. The March 30 landscape analysis failed to surface these cohorts because default initial agents lack genomeV2 and cannot evolve policy loci within the analysis timeframe.

The policy-positive exposure percentage (5.0%) and bin distribution (70.4% of bins) indicate that policy-active agents occupy a minority but non-trivial subset of the phenotype-fitness landscape.
