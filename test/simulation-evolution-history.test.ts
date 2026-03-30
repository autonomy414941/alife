import { describe, expect, it } from 'vitest';
import { SimulationEvolutionHistory } from '../src/simulation-evolution-history';

type HistoryAgent = {
  id: number;
  lineage: number;
  species: number;
  x: number;
  y: number;
  age?: number;
};

describe('SimulationEvolutionHistory', () => {
  it('tracks founder context, extinction counters, and turnover analytics outside the simulation loop', () => {
    const history = new SimulationEvolutionHistory();
    const habitatAt = (x: number, _y: number, tick: number) => x + tick + 1;
    const crowdingAt = (x: number, y: number, occupancy: number[][]) => occupancy[y][x];

    history.initialize(
      [
        { id: 1, lineage: 1, species: 1, x: 0, y: 0 },
        { id: 2, lineage: 1, species: 1, x: 1, y: 0 }
      ],
      {
        tick: 0,
        occupancy: [[1, 1]],
        effectiveBiomeFertilityAt: habitatAt,
        neighborhoodCrowdingAt: crowdingAt
      }
    );

    const firstStep = history.recordStep({
      tick: 1,
      agents: [
        { id: 2, lineage: 1, species: 1, x: 1, y: 0 },
        { id: 3, lineage: 2, species: 2, x: 0, y: 0 }
      ],
      offspring: [{ id: 3, lineage: 2, species: 2, x: 0, y: 0 }],
      deadAgents: [{ id: 1, age: 3, lineage: 1, species: 1, x: 0, y: 0 }],
      birthsByParentId: new Map([[3, 1]]),
      descentEdges: [
        {
          tick: 1,
          parentId: 1,
          parentLineage: 1,
          parentSpecies: 1,
          parentX: 0,
          parentY: 0,
          offspringId: 3,
          offspringLineage: 2,
          offspringSpecies: 2,
          phenotypeDelta: [
            {
              trait: 'reproduction_harvest_threshold',
              parentValue: 0.3,
              offspringValue: 0.5,
              delta: 0.2
            }
          ],
          reproduction: {
            localFertility: 2,
            localCrowding: 2,
            policyGated: false,
            speciationOccurred: true,
            foundedNewClade: true,
            parentEnergy: 10,
            offspringEnergy: 5
          },
          settlement: {
            x: 0,
            y: 0,
            localFertility: 2,
            localCrowding: 2,
            sameLineageCrowding: 0,
            settled: true,
            movedFromParentCell: false
          },
          offspringProduced: 0,
          offspringDeathTick: null,
          offspringAgeAtDeath: null
        }
      ],
      founderOccupancy: [[2]],
      effectiveBiomeFertilityAt: habitatAt,
      neighborhoodCrowdingAt: crowdingAt
    });
    const secondStep = history.recordStep({
      tick: 2,
      agents: [],
      offspring: [],
      deadAgents: [
        { id: 2, age: 4, lineage: 1, species: 1, x: 1, y: 0 },
        { id: 3, age: 1, lineage: 2, species: 2, x: 0, y: 0 }
      ]
    });

    expect(firstStep).toEqual({ cladeExtinctionDelta: 0, speciesExtinctionDelta: 0 });
    expect(secondStep).toEqual({ cladeExtinctionDelta: 2, speciesExtinctionDelta: 2 });
    expect(history.getExtinctClades()).toBe(2);
    expect(history.getExtinctSpecies()).toBe(2);

    expect(history.snapshot()).toEqual({
      clades: [
        {
          id: 1,
          firstSeenTick: 0,
          extinctTick: 2,
          totalBirths: 2,
          totalDeaths: 2,
          peakPopulation: 2,
          founderContext: {
            habitatMean: 1.5,
            habitatBin: 2,
            localCrowdingMean: 1,
            localCrowdingBin: 1,
            founderCount: 2
          },
          timeline: [
            { tick: 0, population: 2, births: 2, deaths: 0 },
            { tick: 1, population: 1, births: 0, deaths: 1 },
            { tick: 2, population: 0, births: 0, deaths: 1 }
          ]
        },
        {
          id: 2,
          firstSeenTick: 1,
          extinctTick: 2,
          totalBirths: 1,
          totalDeaths: 1,
          peakPopulation: 1,
          founderContext: {
            habitatMean: 2,
            habitatBin: 3,
            localCrowdingMean: 2,
            localCrowdingBin: 2,
            founderCount: 1
          },
          timeline: [
            { tick: 1, population: 1, births: 1, deaths: 0 },
            { tick: 2, population: 0, births: 0, deaths: 1 }
          ]
        }
      ],
      species: [
        {
          id: 1,
          firstSeenTick: 0,
          extinctTick: 2,
          totalBirths: 2,
          totalDeaths: 2,
          peakPopulation: 2,
          founderContext: {
            habitatMean: 1.5,
            habitatBin: 2,
            localCrowdingMean: 1,
            localCrowdingBin: 1,
            founderCount: 2
          },
          timeline: [
            { tick: 0, population: 2, births: 2, deaths: 0 },
            { tick: 1, population: 1, births: 0, deaths: 1 },
            { tick: 2, population: 0, births: 0, deaths: 1 }
          ]
        },
        {
          id: 2,
          firstSeenTick: 1,
          extinctTick: 2,
          totalBirths: 1,
          totalDeaths: 1,
          peakPopulation: 1,
          founderContext: {
            habitatMean: 2,
            habitatBin: 3,
            localCrowdingMean: 2,
            localCrowdingBin: 2,
            founderCount: 1
          },
          timeline: [
            { tick: 1, population: 1, births: 1, deaths: 0 },
            { tick: 2, population: 0, births: 0, deaths: 1 }
          ]
        }
      ],
      extinctClades: 2,
      extinctSpecies: 2,
      descentEdges: [
        {
          tick: 1,
          parentId: 1,
          parentLineage: 1,
          parentSpecies: 1,
          parentX: 0,
          parentY: 0,
          offspringId: 3,
          offspringLineage: 2,
          offspringSpecies: 2,
          phenotypeDelta: [
            {
              trait: 'reproduction_harvest_threshold',
              parentValue: 0.3,
              offspringValue: 0.5,
              delta: 0.2
            }
          ],
          reproduction: {
            localFertility: 2,
            localCrowding: 2,
            policyGated: false,
            speciationOccurred: true,
            foundedNewClade: true,
            parentEnergy: 10,
            offspringEnergy: 5
          },
          settlement: {
            x: 0,
            y: 0,
            localFertility: 2,
            localCrowding: 2,
            sameLineageCrowding: 0,
            settled: true,
            movedFromParentCell: false
          },
          offspringProduced: 1,
          offspringDeathTick: 2,
          offspringAgeAtDeath: 1
        }
      ]
    });

    expect(history.buildSpeciesTurnover({ startTick: 1, endTick: 2, size: 2 }, 2)).toEqual({
      speciationsInWindow: 1,
      extinctionsInWindow: 2,
      speciationRate: 0.5,
      extinctionRate: 1,
      turnoverRate: 1.5,
      netDiversificationRate: -0.5,
      extinctLifespan: { count: 2, mean: 1.5, max: 2 },
      activeAge: { count: 0, mean: 0, max: 0 }
    });
    expect(history.buildCladeTurnover({ startTick: 1, endTick: 2, size: 2 }, 2)).toEqual({
      originationsInWindow: 1,
      extinctionsInWindow: 2,
      originationRate: 0.5,
      extinctionRate: 1,
      turnoverRate: 1.5,
      netDiversificationRate: -0.5,
      extinctLifespan: { count: 2, mean: 1.5, max: 2 },
      activeAge: { count: 0, mean: 0, max: 0 }
    });
  });
});
