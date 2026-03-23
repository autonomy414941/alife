import { describe, expect, it } from 'vitest';
import { INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE } from '../src/behavioral-control';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import { pickOffspringSettlement } from '../src/reproduction-coordinator';
import { resolveSimulationLocalEcologyScore } from '../src/simulation-offspring';
import { resolveSimulationConfig } from '../src/simulation';

describe('simulation offspring settlement', () => {
  it('scores biomes using explicit GenomeV2 habitat preference when present', () => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 0.5);
    setTrait(genomeV2, 'harvest', 0.5);
    setTrait(genomeV2, 'aggression', 0.5);
    setTrait(genomeV2, 'habitat_preference', 1.8);

    const config = resolveSimulationConfig({
      habitatPreferenceStrength: 4,
      dispersalPressure: 0
    });
    const fertilityByX = [0.2, 1.8, 0.2];
    const resources = [[8, 8, 8]];
    const resources2 = [[0, 0, 0]];
    const speciesHabitatPreference = new Map([[1, 0.2]]);
    const cladeHabitatPreference = new Map([[1, 0.2]]);
    const agent = {
      lineage: 1,
      species: 1,
      x: 0,
      y: 0,
      genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
      genomeV2
    };

    const matchedScore = resolveSimulationLocalEcologyScore({
      config,
      tickCount: 0,
      dispersalRadius: 1,
      width: 3,
      cladeHistory: new Map(),
      resources,
      resources2,
      speciesHabitatPreference,
      cladeHabitatPreference,
      agent,
      x: 1,
      y: 0,
      occupancy: [[0, 0, 0]],
      lineageOccupancy: undefined,
      lineagePenalty: 0,
      excludedPosition: undefined,
      jitter: 0,
      effectiveBiomeFertilityAt: (x) => fertilityByX[x],
      wrapX: (x) => ((x % 3) + 3) % 3,
      wrapY: () => 0,
      cellIndex: (x) => ((x % 3) + 3) % 3
    });
    const mismatchedScore = resolveSimulationLocalEcologyScore({
      config,
      tickCount: 0,
      dispersalRadius: 1,
      width: 3,
      cladeHistory: new Map(),
      resources,
      resources2,
      speciesHabitatPreference,
      cladeHabitatPreference,
      agent,
      x: 0,
      y: 0,
      occupancy: [[0, 0, 0]],
      lineageOccupancy: undefined,
      lineagePenalty: 0,
      excludedPosition: undefined,
      jitter: 0,
      effectiveBiomeFertilityAt: (x) => fertilityByX[x],
      wrapX: (x) => ((x % 3) + 3) % 3,
      wrapY: () => 0,
      cellIndex: (x) => ((x % 3) + 3) % 3
    });

    expect(matchedScore).toBeGreaterThan(mismatchedScore);
    expect(
      pickOffspringSettlement({
        parent: agent,
        settlementContext: {
          occupancy: [[0, 0, 0]],
          lineageOccupancy: undefined,
          lineagePenalty: 0
        },
        config: {
          ...config,
          offspringSettlementEcologyScoring: true
        },
        currentStepTick: 1,
        wrapX: (x) => ((x % 3) + 3) % 3,
        wrapY: () => 0,
        pickRandomNeighbor: (neighbors) => neighbors[0],
        randomJitter: () => 0,
        localEcologyScore: (nextAgent, x, y, occupancy, lineageOccupancy, lineagePenalty, excludedPosition, jitter) =>
          resolveSimulationLocalEcologyScore({
            config,
            tickCount: 0,
            dispersalRadius: 1,
            width: 3,
            cladeHistory: new Map(),
            resources,
            resources2,
            speciesHabitatPreference,
            cladeHabitatPreference,
            agent: nextAgent,
            x,
            y,
            occupancy,
            lineageOccupancy,
            lineagePenalty,
            excludedPosition,
            jitter,
            effectiveBiomeFertilityAt: (x) => fertilityByX[x],
            wrapX: (x) => ((x % 3) + 3) % 3,
            wrapY: () => 0,
            cellIndex: (x) => ((x % 3) + 3) % 3
          }),
        disturbanceSettlementOpeningBonusAt: () => 0
      })
    ).toEqual({ x: 1, y: 0 });
  });

  it('shifts settlement scoring toward policy-aligned secondary-rich cells', () => {
    const config = resolveSimulationConfig({
      habitatPreferenceStrength: 0,
      dispersalPressure: 0,
      offspringSettlementEcologyScoring: true
    });
    const resources = [[10, 0, 0]];
    const resources2 = [[0, 0, 10]];
    const speciesHabitatPreference = new Map([[1, 1]]);
    const cladeHabitatPreference = new Map([[1, 1]]);
    const wrapX = (x: number) => ((x % 3) + 3) % 3;
    const wrapY = () => 0;
    const cellIndex = (x: number) => wrapX(x);
    const makeSettlement = (policyState?: Map<string, number>) =>
      pickOffspringSettlement({
        parent: {
          lineage: 1,
          species: 1,
          x: 1,
          y: 0,
          genome: { metabolism: 1, harvest: 2, aggression: 0.5, harvestEfficiency2: 1 },
          policyState
        },
        settlementContext: {
          occupancy: [[0, 0, 0]],
          lineageOccupancy: undefined,
          lineagePenalty: 0
        },
        config,
        currentStepTick: 1,
        wrapX,
        wrapY,
        pickRandomNeighbor: (neighbors) => neighbors[0],
        randomJitter: () => 0,
        localEcologyScore: (agent, x, y, occupancy, lineageOccupancy, lineagePenalty, excludedPosition, jitter) =>
          resolveSimulationLocalEcologyScore({
            config,
            tickCount: 0,
            dispersalRadius: 1,
            width: 3,
            cladeHistory: new Map(),
            resources,
            resources2,
            speciesHabitatPreference,
            cladeHabitatPreference,
            agent,
            x,
            y,
            occupancy,
            lineageOccupancy,
            lineagePenalty,
            excludedPosition,
            jitter,
            effectiveBiomeFertilityAt: () => 1,
            wrapX,
            wrapY,
            cellIndex
          }),
        disturbanceSettlementOpeningBonusAt: () => 0
      });

    expect(makeSettlement()).toEqual({ x: 0, y: 0 });
    expect(makeSettlement(new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 1]]))).toEqual({
      x: 2,
      y: 0
    });
  });
});
