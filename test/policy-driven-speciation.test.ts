import { describe, expect, it } from 'vitest';
import { createGenomeV2, genomeV2Distance, setTrait } from '../src/genome-v2';
import { shouldSpeciateV2, shouldFoundCladeV2 } from '../src/genome-v2-adapter';
import { SimulationConfig } from '../src/types';

describe('policy-driven speciation and cladogenesis', () => {
  const baseConfig: SimulationConfig = {
    width: 10,
    height: 10,
    initialAgents: 10,
    reproductionEnergyThreshold: 10,
    metabolism: 1,
    mutationAmount: 0.1,
    offspringEnergyFraction: 0.5,
    encounterCompetitionFactor: 0.5,
    speciationThreshold: 0.25,
    cladogenesisThreshold: 1.0,
    encounterRadius: 1,
    maxAgentAge: 500,
    harvestEfficiency2: 0.5,
    useGenomeV2: true,
    policyParameterKeys: []
  };

  describe('policy divergence contributes to speciation distance', () => {
    it('policy trait divergence increments distance', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);
      setTrait(parent, 'reproduction_harvest_threshold', 5.0);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.5);
      setTrait(child, 'harvest', 0.5);
      setTrait(child, 'aggression', 0.5);
      setTrait(child, 'reproduction_harvest_threshold', 10.0);

      const distance = genomeV2Distance(parent, child);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(3.75);
    });

    it('pure policy divergence can cross speciation threshold', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);
      setTrait(parent, 'reproduction_harvest_threshold', 0.0);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.5);
      setTrait(child, 'harvest', 0.5);
      setTrait(child, 'aggression', 0.5);
      setTrait(child, 'reproduction_harvest_threshold', 1.0);

      const distance = genomeV2Distance(parent, child);
      expect(distance).toBeGreaterThanOrEqual(baseConfig.speciationThreshold);
      expect(shouldSpeciateV2(parent, child, baseConfig)).toBe(true);
    });

    it('multiple policy trait divergence accumulates', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);
      setTrait(parent, 'harvest_secondary_preference', 0.1);
      setTrait(parent, 'spending_secondary_preference', 0.1);
      setTrait(parent, 'reproduction_harvest_threshold', 0.0);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.5);
      setTrait(child, 'harvest', 0.5);
      setTrait(child, 'aggression', 0.5);
      setTrait(child, 'harvest_secondary_preference', 0.9);
      setTrait(child, 'spending_secondary_preference', 0.9);
      setTrait(child, 'reproduction_harvest_threshold', 1.0);

      const distance = genomeV2Distance(parent, child);
      expect(distance).toBeGreaterThan(1.0);
    });
  });

  describe('policy divergence can trigger cladogenesis', () => {
    it('pure policy divergence can cross cladogenesis threshold', () => {
      const founder = createGenomeV2();
      setTrait(founder, 'metabolism', 0.5);
      setTrait(founder, 'harvest', 0.5);
      setTrait(founder, 'aggression', 0.5);
      setTrait(founder, 'reproduction_harvest_threshold', 0.0);

      const descendant = createGenomeV2();
      setTrait(descendant, 'metabolism', 0.5);
      setTrait(descendant, 'harvest', 0.5);
      setTrait(descendant, 'aggression', 0.5);
      setTrait(descendant, 'reproduction_harvest_threshold', 5.0);

      const distance = genomeV2Distance(founder, descendant);
      expect(distance).toBeGreaterThanOrEqual(baseConfig.cladogenesisThreshold);
      expect(shouldFoundCladeV2(founder, descendant, baseConfig)).toBe(true);
    });

    it('policy and morphological divergence combine for cladogenesis', () => {
      const founder = createGenomeV2();
      setTrait(founder, 'metabolism', 0.5);
      setTrait(founder, 'harvest', 0.5);
      setTrait(founder, 'aggression', 0.5);
      setTrait(founder, 'reproduction_harvest_threshold', 0.0);

      const descendant = createGenomeV2();
      setTrait(descendant, 'metabolism', 0.7);
      setTrait(descendant, 'harvest', 0.7);
      setTrait(descendant, 'aggression', 0.3);
      setTrait(descendant, 'reproduction_harvest_threshold', 3.0);

      const distance = genomeV2Distance(founder, descendant);
      expect(distance).toBeGreaterThanOrEqual(baseConfig.cladogenesisThreshold);
      expect(shouldFoundCladeV2(founder, descendant, baseConfig)).toBe(true);
    });
  });

  describe('unbounded policy traits dominate distance calculation', () => {
    it('reproduction threshold difference dominates morphological differences', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.1);
      setTrait(a, 'harvest', 0.1);
      setTrait(a, 'aggression', 0.1);
      setTrait(a, 'reproduction_harvest_threshold', 0.0);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.9);
      setTrait(b, 'harvest', 0.9);
      setTrait(b, 'aggression', 0.9);
      setTrait(b, 'reproduction_harvest_threshold', 0.0);

      const morphologicalDistance = genomeV2Distance(a, b);

      const c = createGenomeV2();
      setTrait(c, 'metabolism', 0.5);
      setTrait(c, 'harvest', 0.5);
      setTrait(c, 'aggression', 0.5);
      setTrait(c, 'reproduction_harvest_threshold', 0.0);

      const d = createGenomeV2();
      setTrait(d, 'metabolism', 0.5);
      setTrait(d, 'harvest', 0.5);
      setTrait(d, 'aggression', 0.5);
      setTrait(d, 'reproduction_harvest_threshold', 10.0);

      const policyDistance = genomeV2Distance(c, d);

      expect(policyDistance).toBeGreaterThan(morphologicalDistance);
    });

    it('steepness difference contributes substantially', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);
      setTrait(a, 'reproduction_harvest_threshold_steepness', 0.01);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.5);
      setTrait(b, 'harvest', 0.5);
      setTrait(b, 'aggression', 0.5);
      setTrait(b, 'reproduction_harvest_threshold_steepness', 10.0);

      const distance = genomeV2Distance(a, b);
      expect(distance).toBeGreaterThan(2.0);
    });

    it('distance weights can rebalance morphology against threshold policy divergence', () => {
      const morphologyA = createGenomeV2();
      setTrait(morphologyA, 'metabolism', 0.1);
      setTrait(morphologyA, 'harvest', 0.1);
      setTrait(morphologyA, 'aggression', 0.1);
      setTrait(morphologyA, 'reproduction_harvest_threshold', 0.0);

      const morphologyB = createGenomeV2();
      setTrait(morphologyB, 'metabolism', 0.9);
      setTrait(morphologyB, 'harvest', 0.9);
      setTrait(morphologyB, 'aggression', 0.9);
      setTrait(morphologyB, 'reproduction_harvest_threshold', 0.0);

      const policyA = createGenomeV2();
      setTrait(policyA, 'metabolism', 0.5);
      setTrait(policyA, 'harvest', 0.5);
      setTrait(policyA, 'aggression', 0.5);
      setTrait(policyA, 'reproduction_harvest_threshold', 0.0);

      const policyB = createGenomeV2();
      setTrait(policyB, 'metabolism', 0.5);
      setTrait(policyB, 'harvest', 0.5);
      setTrait(policyB, 'aggression', 0.5);
      setTrait(policyB, 'reproduction_harvest_threshold', 10.0);

      const weightedConfig: SimulationConfig = {
        ...baseConfig,
        genomeV2DistanceWeights: {
          categories: {
            policyThreshold: 0.1
          }
        }
      };

      const weightedMorphologyDistance = genomeV2Distance(morphologyA, morphologyB, weightedConfig.genomeV2DistanceWeights);
      const weightedPolicyDistance = genomeV2Distance(policyA, policyB, weightedConfig.genomeV2DistanceWeights);

      expect(weightedMorphologyDistance).toBeGreaterThan(weightedPolicyDistance);
      expect(shouldSpeciateV2(policyA, policyB, weightedConfig)).toBe(true);
      expect(shouldFoundCladeV2(policyA, policyB, weightedConfig)).toBe(false);
    });
  });

  describe('mixed morphological and policy divergence', () => {
    it('small morphological + small policy divergence does not trigger speciation', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);
      setTrait(parent, 'harvest_secondary_preference', 0.5);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.55);
      setTrait(child, 'harvest', 0.55);
      setTrait(child, 'aggression', 0.45);
      setTrait(child, 'harvest_secondary_preference', 0.55);

      expect(shouldSpeciateV2(parent, child, baseConfig)).toBe(false);
    });

    it('moderate morphological + moderate policy divergence triggers speciation', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);
      setTrait(parent, 'reproduction_harvest_threshold', 2.0);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.7);
      setTrait(child, 'harvest', 0.3);
      setTrait(child, 'aggression', 0.6);
      setTrait(child, 'reproduction_harvest_threshold', 3.0);

      const distance = genomeV2Distance(parent, child);
      expect(distance).toBeGreaterThanOrEqual(baseConfig.speciationThreshold);
      expect(shouldSpeciateV2(parent, child, baseConfig)).toBe(true);
    });
  });
});
