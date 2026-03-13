import { describe, expect, it } from 'vitest';
import {
  passesCladogenesisEcologyGate,
  passesCladogenesisTraitNoveltyGate,
  pickSettlementSite,
  resolveDisturbanceSettlementOpeningBonus,
  shouldFoundClade
} from '../src/reproduction';

describe('reproduction helpers', () => {
  it('scores freshly disturbed settlement cells by opening freshness', () => {
    expect(
      resolveDisturbanceSettlementOpeningBonus({
        enabled: true,
        openUntilTick: 6,
        currentStepTick: 4,
        openingTicks: 4,
        openingBonus: 1.2
      })
    ).toBeCloseTo(0.9, 10);

    expect(
      resolveDisturbanceSettlementOpeningBonus({
        enabled: true,
        openUntilTick: 3,
        currentStepTick: 4,
        openingTicks: 4,
        openingBonus: 1.2
      })
    ).toBe(0);
  });

  it('picks the highest-scoring settlement site across ecology and disturbance inputs', () => {
    const selected = pickSettlementSite({
      parent: {
        lineage: 1,
        species: 1,
        x: 1,
        y: 0,
        genome: { metabolism: 1, harvest: 1, aggression: 0 }
      },
      settlementContext: {
        occupancy: [[0, 0, 0]],
        lineageOccupancy: undefined,
        lineagePenalty: 0
      },
      useDisturbanceOpeningBonus: true,
      currentStepTick: 1,
      wrapX: (x) => ((x % 3) + 3) % 3,
      wrapY: (y) => ((y % 1) + 1) % 1,
      pickRandomNeighbor: (neighbors) => neighbors[0],
      randomJitter: () => 0,
      localEcologyScore: (_agent, x) => (x === 0 ? 0.25 : 0),
      disturbanceSettlementOpeningBonusAt: (x) => (x === 2 ? 1 : 0)
    });

    expect(selected).toEqual({ x: 2, y: 0 });
  });

  it('requires composite trait novelty to clear the configured threshold', () => {
    expect(
      passesCladogenesisTraitNoveltyGate({
        threshold: 0.21,
        speciesHabitatPreference: 1.57,
        cladeHabitatPreference: 1,
        speciesTrophicLevel: 0,
        cladeTrophicLevel: 0,
        speciesDefenseLevel: 0.3,
        cladeDefenseLevel: 0
      })
    ).toBe(false);

    expect(
      passesCladogenesisTraitNoveltyGate({
        threshold: 0.2,
        speciesHabitatPreference: 1.57,
        cladeHabitatPreference: 1,
        speciesTrophicLevel: 0,
        cladeTrophicLevel: 0,
        speciesDefenseLevel: 0.3,
        cladeDefenseLevel: 0
      })
    ).toBe(true);
  });

  it('requires ecology advantage before founding a new clade when the gate is enabled', () => {
    const settlementAgent = {
      lineage: 1,
      species: 2,
      x: 1,
      y: 0,
      genome: { metabolism: 1, harvest: 1, aggression: 0 }
    };
    const settlementContext = {
      occupancy: [[0, 0, 0]],
      lineageOccupancy: undefined,
      lineagePenalty: 0
    };

    expect(
      passesCladogenesisEcologyGate({
        threshold: 1.1,
        settlementAgent,
        childPos: { x: 2, y: 0 },
        settlementContext,
        resolveSettlementContext: () => settlementContext,
        localEcologyScore: (_agent, x) => x
      })
    ).toBe(false);

    expect(
      passesCladogenesisEcologyGate({
        threshold: 0.5,
        settlementAgent,
        childPos: { x: 2, y: 0 },
        settlementContext,
        resolveSettlementContext: () => settlementContext,
        localEcologyScore: (_agent, x) => x
      })
    ).toBe(true);
  });

  it('blocks clade founding when genome distance or novelty gates fail', () => {
    const founderGenome = { metabolism: 1, harvest: 1, aggression: 0 };
    const childGenome = { metabolism: 1.4, harvest: 1, aggression: 0 };

    expect(
      shouldFoundClade({
        diverged: true,
        threshold: 0.5,
        childGenome,
        founderGenome,
        genomeDistance: () => 0.25,
        passesTraitNoveltyGate: () => true,
        passesEcologyGate: () => true
      })
    ).toBe(false);

    expect(
      shouldFoundClade({
        diverged: true,
        threshold: 0.5,
        childGenome,
        founderGenome,
        genomeDistance: () => 0.75,
        passesTraitNoveltyGate: () => false,
        passesEcologyGate: () => true
      })
    ).toBe(false);

    expect(
      shouldFoundClade({
        diverged: true,
        threshold: 0.5,
        childGenome,
        founderGenome,
        genomeDistance: () => 0.75,
        passesTraitNoveltyGate: () => true,
        passesEcologyGate: () => true
      })
    ).toBe(true);
  });
});
