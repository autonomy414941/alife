import { describe, expect, it } from 'vitest';
import {
  buildMatchedSchedulePseudoClades,
  buildTaxonBirthSchedule,
  countActiveTaxaAtTick,
  taxonBirthSchedulesEqual
} from '../src/clade-activity-relabel-null-matched-schedule';
import { TaxonHistory } from '../src/types';

describe('clade-activity-relabel-null-matched-schedule', () => {
  it('builds deterministic pseudo-clades while preserving the observed birth schedule', () => {
    const species = [
      buildTaxonHistory(1, 0, [1, 1, 1, 1, 1]),
      buildTaxonHistory(2, 0, [1, 1, 0]),
      buildTaxonHistory(3, 2, [1, 1, 1]),
      buildTaxonHistory(4, 2, [1, 1, 1])
    ];
    const clades = [buildTaxonHistory(101, 0, [2, 2, 2, 2, 2]), buildTaxonHistory(102, 2, [2, 2, 2])];

    const first = buildMatchedSchedulePseudoClades({
      species,
      clades,
      maxTick: 4,
      relabelSeed: 17
    });
    const second = buildMatchedSchedulePseudoClades({
      species,
      clades,
      maxTick: 4,
      relabelSeed: 17
    });

    expect(first).toEqual(second);
    expect(buildTaxonBirthSchedule(first)).toEqual(buildTaxonBirthSchedule(clades));
    expect(taxonBirthSchedulesEqual(buildTaxonBirthSchedule(first), buildTaxonBirthSchedule(clades))).toBe(true);
    expect(first).toHaveLength(clades.length);
    expect(countActiveTaxaAtTick(first, 4)).toBe(2);
  });

  it('groups and sorts taxon birth schedules by first-seen tick', () => {
    const taxa = [
      buildTaxonHistory(3, 5, [1]),
      buildTaxonHistory(1, 2, [1, 1]),
      buildTaxonHistory(2, 2, [1]),
      buildTaxonHistory(4, 0, [1, 1, 1])
    ];

    expect(buildTaxonBirthSchedule(taxa)).toEqual([
      { tick: 0, births: 1 },
      { tick: 2, births: 2 },
      { tick: 5, births: 1 }
    ]);
    expect(
      taxonBirthSchedulesEqual(
        buildTaxonBirthSchedule(taxa),
        [
          { tick: 0, births: 1 },
          { tick: 2, births: 2 },
          { tick: 5, births: 1 }
        ]
      )
    ).toBe(true);
    expect(
      taxonBirthSchedulesEqual(
        buildTaxonBirthSchedule(taxa),
        [
          { tick: 0, births: 1 },
          { tick: 2, births: 1 },
          { tick: 5, births: 2 }
        ]
      )
    ).toBe(false);
  });
});

function buildTaxonHistory(id: number, firstSeenTick: number, populations: number[]): TaxonHistory {
  const lastPopulation = populations[populations.length - 1] ?? 0;
  let totalBirths = 0;
  let totalDeaths = 0;

  const timeline = populations.map((population, index) => {
    const tick = firstSeenTick + index;
    const previousPopulation = index === 0 ? 0 : populations[index - 1] ?? 0;
    const births = index === 0 ? population : Math.max(0, population - previousPopulation);
    const deaths = index === 0 ? 0 : Math.max(0, previousPopulation - population);
    totalBirths += births;
    totalDeaths += deaths;

    return {
      tick,
      population,
      births,
      deaths
    };
  });

  return {
    id,
    firstSeenTick,
    extinctTick: lastPopulation === 0 ? firstSeenTick + populations.length - 1 : null,
    totalBirths,
    totalDeaths,
    peakPopulation: Math.max(...populations),
    timeline
  };
}
