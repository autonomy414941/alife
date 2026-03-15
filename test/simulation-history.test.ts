import { describe, expect, it } from 'vitest';
import {
  collectFounderContextSamples,
  exportTaxonHistory,
  seedTaxonHistory,
  TaxonHistoryState,
  updateTaxonHistory
} from '../src/simulation-history';

type FounderContextAgent = {
  lineage: number;
  species: number;
  x: number;
  y: number;
};

describe('simulation-history', () => {
  it('records founder context and lifecycle updates through the extracted helpers', () => {
    const history = new Map<number, TaxonHistoryState>();
    const initialAgents: FounderContextAgent[] = [
      { lineage: 1, species: 1, x: 0, y: 0 },
      { lineage: 1, species: 1, x: 1, y: 0 }
    ];

    seedTaxonHistory(
      history,
      collectFounderContextSamples(
        initialAgents,
        (agent) => agent.lineage,
        0,
        [[1, 1]],
        (x, _y, tick) => x + tick + 1,
        (x, y, occupancy) => occupancy[y][x]
      ),
      0
    );

    const extinctionDeltaAfterBirth = updateTaxonHistory(
      history,
      1,
      new Map([
        [1, 1],
        [2, 1]
      ]),
      new Map([[2, 1]]),
      new Map([[1, 1]]),
      collectFounderContextSamples(
        [{ lineage: 2, species: 2, x: 0, y: 0 }],
        (agent) => agent.lineage,
        1,
        [[2]],
        (x, _y, tick) => x + tick + 1,
        (x, y, occupancy) => occupancy[y][x]
      )
    );
    const extinctionDeltaAfterCollapse = updateTaxonHistory(
      history,
      2,
      new Map(),
      new Map(),
      new Map([
        [1, 1],
        [2, 1]
      ]),
      new Map()
    );

    expect(extinctionDeltaAfterBirth).toBe(0);
    expect(extinctionDeltaAfterCollapse).toBe(2);
    expect(exportTaxonHistory(history)).toEqual([
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
    ]);
  });
});
