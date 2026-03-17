import { describe, expect, it } from 'vitest';
import {
  buildSubstrateObservabilityAggregate,
  buildSubstrateObservabilityMetrics
} from '../src/substrate-observability';
import { Agent } from '../src/types';

describe('substrate observability', () => {
  it('summarizes pool balance, harvest bias, and clade dependence from final agents', () => {
    const metrics = buildSubstrateObservabilityMetrics([
      buildAgent({
        id: 1,
        lineage: 10,
        species: 1,
        energyPrimary: 8,
        energySecondary: 2,
        genome: { metabolism: 1, harvest: 1.5, aggression: 0.2, harvestEfficiency2: 0.5 }
      }),
      buildAgent({
        id: 2,
        lineage: 10,
        species: 1,
        energyPrimary: 6,
        energySecondary: 4,
        genome: { metabolism: 1, harvest: 1.5, aggression: 0.2, harvestEfficiency2: 0.5 }
      }),
      buildAgent({
        id: 3,
        lineage: 20,
        species: 2,
        energyPrimary: 2,
        energySecondary: 8,
        genome: { metabolism: 1, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 1.5 }
      }),
      buildAgent({
        id: 4,
        lineage: 30,
        species: 3,
        energyPrimary: 5,
        energySecondary: 5,
        genome: { metabolism: 1, harvest: 1, aggression: 0.2, harvestEfficiency2: 1 }
      })
    ]);

    expect(metrics.meanPrimaryEnergyShare).toBeCloseTo(0.525, 10);
    expect(metrics.meanSecondaryEnergyShare).toBeCloseTo(0.475, 10);
    expect(metrics.meanHarvestEfficiency2).toBeCloseTo(0.875, 10);
    expect(metrics.meanSecondaryHarvestShare).toBeCloseTo(0.4375, 10);
    expect(metrics.specializationStrata.primaryBiased.population).toBe(2);
    expect(metrics.specializationStrata.primaryBiased.populationFraction).toBe(0.5);
    expect(metrics.specializationStrata.primaryBiased.meanPrimaryEnergyShare).toBeCloseTo(0.7, 10);
    expect(metrics.specializationStrata.primaryBiased.meanSecondaryEnergyShare).toBeCloseTo(0.3, 10);
    expect(metrics.specializationStrata.mixed).toEqual({
      population: 1,
      populationFraction: 0.25,
      meanPrimaryEnergyShare: 0.5,
      meanSecondaryEnergyShare: 0.5
    });
    expect(metrics.specializationStrata.secondaryBiased).toEqual({
      population: 1,
      populationFraction: 0.25,
      meanPrimaryEnergyShare: 0.2,
      meanSecondaryEnergyShare: 0.8
    });
    expect(metrics.cladeSubstrateDependence.map((clade) => clade.lineage)).toEqual([10, 20, 30]);
    expect(metrics.cladeSubstrateDependence[0]).toMatchObject({
      lineage: 10,
      population: 2,
      populationFraction: 0.5,
      meanPrimaryEnergyShare: 0.7,
      meanHarvestEfficiency2: 0.5,
      meanSecondaryHarvestShare: 0.25
    });
    expect(metrics.cladeSubstrateDependence[0]?.meanSecondaryEnergyShare).toBeCloseTo(0.3, 10);
    expect(metrics.cladeSubstrateDependence[1]).toMatchObject({
      lineage: 20,
      population: 1,
      populationFraction: 0.25,
      meanPrimaryEnergyShare: 0.2,
      meanHarvestEfficiency2: 1.5,
      meanSecondaryHarvestShare: 0.75
    });
    expect(metrics.cladeSubstrateDependence[1]?.meanSecondaryEnergyShare).toBeCloseTo(0.8, 10);
    expect(metrics.cladeSubstrateDependence[2]).toMatchObject({
      lineage: 30,
      population: 1,
      populationFraction: 0.25,
      meanPrimaryEnergyShare: 0.5,
      meanHarvestEfficiency2: 1,
      meanSecondaryHarvestShare: 0.5
    });
    expect(metrics.cladeSubstrateDependence[2]?.meanSecondaryEnergyShare).toBeCloseTo(0.5, 10);
  });

  it('aggregates seed-level substrate summaries for study exports', () => {
    const lowPrimary = buildSubstrateObservabilityMetrics([
      buildAgent({
        id: 1,
        lineage: 1,
        species: 1,
        energyPrimary: 2,
        energySecondary: 8,
        genome: { metabolism: 1, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 1.5 }
      })
    ]);
    const highPrimary = buildSubstrateObservabilityMetrics([
      buildAgent({
        id: 2,
        lineage: 2,
        species: 2,
        energyPrimary: 8,
        energySecondary: 2,
        genome: { metabolism: 1, harvest: 1.5, aggression: 0.2, harvestEfficiency2: 0.5 }
      })
    ]);

    const aggregate = buildSubstrateObservabilityAggregate([lowPrimary, highPrimary]);

    expect(aggregate.meanPrimaryEnergyShare).toEqual({
      mean: 0.5,
      min: 0.2,
      max: 0.8
    });
    expect(aggregate.specializationStrata.primaryBiased.populationFraction).toEqual({
      mean: 0.5,
      min: 0,
      max: 1
    });
    expect(aggregate.specializationStrata.secondaryBiased.populationFraction).toEqual({
      mean: 0.5,
      min: 0,
      max: 1
    });
  });
});

function buildAgent(overrides: Partial<Agent> & Pick<Agent, 'id' | 'lineage' | 'species'>): Agent {
  const energyPrimary = overrides.energyPrimary ?? 0;
  const energySecondary = overrides.energySecondary ?? 0;

  return {
    id: overrides.id,
    lineage: overrides.lineage,
    species: overrides.species,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    energy: overrides.energy ?? energyPrimary + energySecondary,
    energyPrimary,
    energySecondary,
    age: overrides.age ?? 0,
    genome: overrides.genome ?? { metabolism: 1, harvest: 1, aggression: 0 }
  };
}
