import { describe, expect, it } from 'vitest';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import { realizePhenotype, resolveExpressedTrait } from '../src/phenotype';

describe('phenotype realization', () => {
  it('realizes supported ecological and policy loci from GenomeV2', () => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'trophic_level', 0.8);
    setTrait(genomeV2, 'defense_level', 0.2);
    setTrait(genomeV2, 'metabolic_efficiency_primary', 0.9);
    setTrait(genomeV2, 'harvest_secondary_preference', 0.7);
    setTrait(genomeV2, 'movement_energy_reserve_threshold', 12);

    expect(realizePhenotype({ genomeV2 })).toEqual({
      trophicLevel: 0.8,
      defenseLevel: 0.2,
      metabolicEfficiencyPrimary: 0.9,
      metabolicEfficiencySecondary: undefined,
      reproductionHarvestThreshold: undefined,
      reproductionHarvestThresholdSteepness: undefined,
      movementEnergyReserveThreshold: 12,
      movementEnergyReserveThresholdSteepness: undefined,
      movementMinRecentHarvest: undefined,
      movementMinRecentHarvestSteepness: undefined,
      harvestSecondaryPreference: 0.7,
      harvestPrimaryThreshold: undefined,
      harvestPrimaryThresholdSteepness: undefined,
      spendingSecondaryPreference: undefined
    });
  });

  it('falls back to clamped policyState values when GenomeV2 loci are absent', () => {
    const phenotype = realizePhenotype({
      policyState: new Map([
        ['harvest_secondary_preference', 2],
        ['spending_secondary_preference', -1],
        ['reproduction_harvest_threshold', 3]
      ])
    });

    expect(phenotype.harvestSecondaryPreference).toBe(1);
    expect(phenotype.spendingSecondaryPreference).toBe(0);
    expect(phenotype.reproductionHarvestThreshold).toBe(3);
  });

  it('prefers explicit GenomeV2 expression over legacy policyState fallback', () => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'harvest_secondary_preference', 0.25);

    expect(
      resolveExpressedTrait(
        {
          genomeV2,
          policyState: new Map([['harvest_secondary_preference', 0.9]])
        },
        'harvest_secondary_preference'
      )
    ).toBe(0.25);
  });
});
