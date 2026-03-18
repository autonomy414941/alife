import { describe, expect, it } from 'vitest';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import { LifeSimulation } from '../src/simulation';

describe('GenomeV2 interaction trait seeding', () => {
  it('seeds species and clade interaction levels from living GenomeV2 traits', () => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 2.2);
    setTrait(genomeV2, 'harvest', 0.4);
    setTrait(genomeV2, 'aggression', 1);
    setTrait(genomeV2, 'trophic_level', 0.85);
    setTrait(genomeV2, 'defense_level', 0.2);

    const simulation = new LifeSimulation({
      config: {
        width: 1,
        height: 1,
        initialAgents: 0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          lineage: 7,
          species: 3,
          genome: {
            metabolism: 2.2,
            harvest: 0.4,
            aggression: 1
          },
          genomeV2
        }
      ]
    });

    const internal = simulation as unknown as {
      speciesTrophicLevel: Map<number, number>;
      speciesDefenseLevel: Map<number, number>;
      getCladeTrophicLevel: (lineage: number) => number;
      getCladeDefenseLevel: (lineage: number) => number;
    };

    expect(internal.speciesTrophicLevel.get(3)).toBeCloseTo(0.85);
    expect(internal.speciesDefenseLevel.get(3)).toBeCloseTo(0.2);
    expect(internal.getCladeTrophicLevel(7)).toBeCloseTo(0.85);
    expect(internal.getCladeDefenseLevel(7)).toBeCloseTo(0.2);
  });
});
