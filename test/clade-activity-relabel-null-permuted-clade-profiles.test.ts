import { describe, expect, it } from 'vitest';
import { buildTaxonBirthSchedule } from '../src/clade-activity-relabel-null-matched-schedule';
import { buildPermutedCladeProfileNull } from '../src/clade-activity-relabel-null-permuted-clade-profiles';

describe('buildPermutedCladeProfileNull', () => {
  it('preserves the observed birth schedule without reusing species histories', () => {
    const clades = [
      {
        id: 1,
        firstSeenTick: 0,
        extinctTick: 2,
        totalBirths: 4,
        totalDeaths: 4,
        peakPopulation: 3,
        founderContext: {
          habitatMean: 0.1,
          habitatBin: 0,
          localCrowdingMean: 0.2,
          localCrowdingBin: 0,
          founderCount: 1
        },
        timeline: [
          { tick: 0, population: 1, births: 1, deaths: 0 },
          { tick: 1, population: 3, births: 2, deaths: 0 },
          { tick: 2, population: 0, births: 1, deaths: 4 }
        ]
      },
      {
        id: 2,
        firstSeenTick: 1,
        extinctTick: 3,
        totalBirths: 3,
        totalDeaths: 3,
        peakPopulation: 2,
        founderContext: {
          habitatMean: 0.9,
          habitatBin: 2,
          localCrowdingMean: 0.8,
          localCrowdingBin: 2,
          founderCount: 1
        },
        timeline: [
          { tick: 1, population: 1, births: 1, deaths: 0 },
          { tick: 2, population: 2, births: 1, deaths: 0 },
          { tick: 3, population: 0, births: 1, deaths: 3 }
        ]
      },
      {
        id: 3,
        firstSeenTick: 1,
        extinctTick: null,
        totalBirths: 5,
        totalDeaths: 1,
        peakPopulation: 4,
        founderContext: {
          habitatMean: 0.5,
          habitatBin: 1,
          localCrowdingMean: 0.4,
          localCrowdingBin: 1,
          founderCount: 2
        },
        timeline: [
          { tick: 1, population: 2, births: 2, deaths: 0 },
          { tick: 2, population: 4, births: 2, deaths: 0 },
          { tick: 3, population: 3, births: 1, deaths: 1 }
        ]
      }
    ] as const;

    const first = buildPermutedCladeProfileNull({
      clades: clades.map((clade) => ({ ...clade, timeline: [...clade.timeline] })),
      maxTick: 3,
      relabelSeed: 1
    });
    const second = buildPermutedCladeProfileNull({
      clades: clades.map((clade) => ({ ...clade, timeline: [...clade.timeline] })),
      maxTick: 3,
      relabelSeed: 1
    });

    expect(buildTaxonBirthSchedule(first)).toEqual(buildTaxonBirthSchedule(clades));
    expect(first).toEqual(second);
    expect(first).toHaveLength(clades.length);
    expect(first.every((clade) => clade.founderContext === undefined)).toBe(true);
    expect(first.some((clade, index) => clade.firstSeenTick !== clades[index]?.firstSeenTick)).toBe(false);
    expect(first.map((clade) => clade.timeline[0]?.tick)).toEqual([0, 1, 1]);
    expect(first.map((clade) => clade.peakPopulation)).not.toEqual(clades.map((clade) => clade.peakPopulation));
  });
});
