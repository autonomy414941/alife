import { describe, expect, it } from 'vitest';
import { DEFAULT_MUTATION_CANDIDATE_NEW_LOCI, createGenomeV2, setTrait } from '../src/genome-v2';
import { reproduceAgent } from '../src/simulation-reproduction';
import { resolveSimulationConfig } from '../src/simulation';
import { Agent } from '../src/types';

function createCoreGenomeV2() {
  const genome = createGenomeV2();
  setTrait(genome, 'metabolism', 0.5);
  setTrait(genome, 'harvest', 0.5);
  setTrait(genome, 'aggression', 0.5);
  return genome;
}

function scriptedRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? 0.5;
}

describe('simulation reproduction', () => {
  it('can produce a live offspring with a newly added GenomeV2 ecological locus', () => {
    const parentGenomeV2 = createCoreGenomeV2();
    const parent: Agent = {
      id: 1,
      lineage: 1,
      species: 1,
      x: 0,
      y: 0,
      energy: 40,
      age: 0,
      genome: {
        metabolism: 0.5,
        harvest: 0.5,
        aggression: 0.5
      },
      genomeV2: parentGenomeV2
    };
    const habitatIndex = DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.indexOf('habitat_preference');
    const config = resolveSimulationConfig({
      mutationAmount: 0,
      speciationThreshold: 10,
      cladogenesisThreshold: -1,
      offspringSettlementEcologyScoring: false,
      disturbanceSettlementOpeningTicks: 0,
      disturbanceSettlementOpeningBonus: 0
    });

    const child = reproduceAgent({
      parent,
      agents: [parent],
      config,
      tickCount: 0,
      occupancy: undefined,
      lineageOccupancy: undefined,
      speciesHabitatPreference: new Map([[1, 1]]),
      speciesTrophicLevel: new Map([[1, 0.5]]),
      speciesDefenseLevel: new Map([[1, 0.5]]),
      cladeFounderGenome: new Map([[1, parent.genome]]),
      cladeFounderGenomeV2: new Map([[1, parentGenomeV2]]),
      cladeHabitatPreference: new Map([[1, 1]]),
      allocateAgentId: () => 2,
      allocateSpeciesId: () => 2,
      allocateLineageId: () => 2,
      randomFloat: scriptedRandom([
        0.5,
        0.5,
        0.5,
        0,
        (habitatIndex + 0.01) / DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.length
      ]),
      mutateGenome: (genome) => genome,
      buildOccupancyGrid: () => [[1]],
      buildLineageOccupancyGrid: () => new Map(),
      wrapX: (x) => x,
      wrapY: (y) => y,
      pickRandomNeighbor: (neighbors) => neighbors[0],
      localEcologyScore: () => 0,
      disturbanceSettlementOpenUntilTick: [[0]],
      sameLineageNeighborhoodCrowdingAt: () => 0,
      effectiveBiomeFertilityAt: () => 1,
      getCladeFounderGenome: () => parentGenomeV2,
      getSpeciesHabitatPreference: () => 1,
      getCladeHabitatPreference: () => 1,
      getSpeciesTrophicLevel: () => 0.5,
      getCladeTrophicLevel: () => 0.5,
      getSpeciesDefenseLevel: () => 0.5,
      getCladeDefenseLevel: () => 0.5
    });

    expect(habitatIndex).toBeGreaterThanOrEqual(0);
    expect(child.genomeV2?.traits.has('habitat_preference')).toBe(true);
    expect(child.species).toBe(parent.species);
    expect(child.lineage).toBe(parent.lineage);
  });
});
