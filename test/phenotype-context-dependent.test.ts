import { describe, it, expect } from 'vitest';
import { realizePhenotype, LocalEcologicalContext } from '../src/phenotype';
import { createGenomeV2, setTrait } from '../src/genome-v2';

describe('Context-dependent phenotype realization', () => {
  it('should modulate metabolic efficiency based on local fertility', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const highFertilityContext: LocalEcologicalContext = {
      localFertility: 1.5,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const lowFertilityContext: LocalEcologicalContext = {
      localFertility: 0.5,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const highFertilityPhenotype = realizePhenotype({ genomeV2: genome }, highFertilityContext);
    const lowFertilityPhenotype = realizePhenotype({ genomeV2: genome }, lowFertilityContext);
    const directPhenotype = realizePhenotype({ genomeV2: genome });

    expect(highFertilityPhenotype.metabolicEfficiencyPrimary).toBeGreaterThan(
      lowFertilityPhenotype.metabolicEfficiencyPrimary!
    );

    expect(directPhenotype.metabolicEfficiencyPrimary).toBe(0.5);
  });

  it('should reduce metabolic efficiency under crowding', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const crowdedContext: LocalEcologicalContext = {
      localFertility: 1.0,
      localCrowding: 8,
      disturbancePhase: 0
    };

    const uncrowdedContext: LocalEcologicalContext = {
      localFertility: 1.0,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const crowdedPhenotype = realizePhenotype({ genomeV2: genome }, crowdedContext);
    const uncrowdedPhenotype = realizePhenotype({ genomeV2: genome }, uncrowdedContext);

    expect(crowdedPhenotype.metabolicEfficiencyPrimary).toBeLessThan(
      uncrowdedPhenotype.metabolicEfficiencyPrimary!
    );
  });

  it('should reduce metabolic efficiency during disturbance', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const disturbedContext: LocalEcologicalContext = {
      localFertility: 1.0,
      localCrowding: 0,
      disturbancePhase: 1
    };

    const normalContext: LocalEcologicalContext = {
      localFertility: 1.0,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const disturbedPhenotype = realizePhenotype({ genomeV2: genome }, disturbedContext);
    const normalPhenotype = realizePhenotype({ genomeV2: genome }, normalContext);

    expect(disturbedPhenotype.metabolicEfficiencyPrimary).toBeLessThan(
      normalPhenotype.metabolicEfficiencyPrimary!
    );
  });

  it('should combine multiple contextual modulations', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const optimalContext: LocalEcologicalContext = {
      localFertility: 2.0,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const harshContext: LocalEcologicalContext = {
      localFertility: 0,
      localCrowding: 8,
      disturbancePhase: 1
    };

    const optimalPhenotype = realizePhenotype({ genomeV2: genome }, optimalContext);
    const harshPhenotype = realizePhenotype({ genomeV2: genome }, harshContext);

    expect(optimalPhenotype.metabolicEfficiencyPrimary).toBeGreaterThan(
      harshPhenotype.metabolicEfficiencyPrimary!
    );
  });

  it('should shift harvest preference toward secondary resources in harsher local contexts', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'harvest_secondary_preference', 0.4);

    const favorableContext: LocalEcologicalContext = {
      localFertility: 2.0,
      localCrowding: 0,
      disturbancePhase: 0
    };

    const harshContext: LocalEcologicalContext = {
      localFertility: 0,
      localCrowding: 8,
      disturbancePhase: 1
    };

    const favorablePhenotype = realizePhenotype({ genomeV2: genome }, favorableContext);
    const harshPhenotype = realizePhenotype({ genomeV2: genome }, harshContext);
    const directPhenotype = realizePhenotype({ genomeV2: genome });

    expect(harshPhenotype.harvestSecondaryPreference).toBeGreaterThan(
      favorablePhenotype.harvestSecondaryPreference!
    );
    expect(directPhenotype.harvestSecondaryPreference).toBe(0.4);
  });

  it('should not modify other traits', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'trophic_level', 0.7);
    setTrait(genome, 'defense_level', 0.6);
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const context: LocalEcologicalContext = {
      localFertility: 1.5,
      localCrowding: 4,
      disturbancePhase: 0
    };

    const phenotype = realizePhenotype({ genomeV2: genome }, context);

    expect(phenotype.trophicLevel).toBe(0.7);
    expect(phenotype.defenseLevel).toBe(0.6);
  });

  it('should work without context (backward compatible)', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'metabolic_efficiency_primary', 0.5);

    const phenotype = realizePhenotype({ genomeV2: genome });

    expect(phenotype.metabolicEfficiencyPrimary).toBe(0.5);
  });
});
