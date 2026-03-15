import { describe, expect, it } from 'vitest';
import {
  analyzeCladeActivity,
  analyzePersistentCladeActivity,
  analyzePersistentSpeciesActivity,
  analyzeSpeciesActivity
} from '../src/activity';
import {
  buildCladeActivityCladogenesisSeedResult,
  buildSpeciesActivitySeedPanelSeedResult,
  truncateEvolutionHistory
} from '../src/activity-study-results';
import { EvolutionHistorySnapshot, StepSummary, TaxonHistory } from '../src/types';

describe('activity-study-results', () => {
  it('assembles cladogenesis seed results from injected analyzers', () => {
    const history: EvolutionHistorySnapshot = {
      clades: [
        buildTaxonHistory(11, 0, [1, 1, 1, 1]),
        buildTaxonHistory(12, 2, [1, 1])
      ],
      species: [
        buildTaxonHistory(1, 0, [1, 1, 1, 1]),
        buildTaxonHistory(2, 1, [1, 1, 1]),
        buildTaxonHistory(3, 2, [1, 1])
      ],
      extinctClades: 0,
      extinctSpecies: 0
    };
    const finalSummary: StepSummary = {
      tick: 3,
      population: 4,
      births: 0,
      deaths: 0,
      meanEnergy: 0,
      meanGenome: { metabolism: 0, harvest: 0, aggression: 0 },
      activeClades: 2,
      activeSpecies: 3,
      dominantSpeciesShare: 0,
      selectionDifferential: { metabolism: 0, harvest: 0, aggression: 0 },
      cladeExtinctions: 0,
      speciesExtinctions: 0,
      cumulativeExtinctClades: 0,
      cumulativeExtinctSpecies: 0
    };

    const result = buildCladeActivityCladogenesisSeedResult(
      {
        seed: 17,
        finalSummary,
        history,
        windowSize: 1,
        burnIn: 0,
        minSurvivalTicks: [1]
      },
      {
        analyzeCladeActivitySummary: (input) => analyzeCladeActivity(input).summary,
        analyzePersistentCladeActivitySummary: (input) => analyzePersistentCladeActivity(input).summary
      }
    );

    expect(result).toMatchObject({
      seed: 17,
      counts: {
        activeClades: 2,
        activeSpecies: 3,
        totalClades: 2,
        totalSpecies: 3,
        activeCladeToSpeciesRatio: 2 / 3,
        totalCladeToSpeciesRatio: 2 / 3
      }
    });
    expect(result.rawSummary.totalClades).toBe(2);
    expect(result.thresholds).toHaveLength(1);
    expect(result.thresholds[0]?.minSurvivalTicks).toBe(1);
  });

  it('truncates history snapshots to a horizon and recomputes derived totals', () => {
    const founderContext = {
      habitatMean: 1.2,
      habitatBin: 2,
      localCrowdingMean: 0.7,
      localCrowdingBin: 1,
      founderCount: 1
    };
    const history: EvolutionHistorySnapshot = {
      clades: [
        buildTaxonHistory(11, 0, [1, 2, 1, 0], founderContext),
        buildTaxonHistory(12, 4, [1])
      ],
      species: [
        buildTaxonHistory(1, 0, [1, 2, 1, 0], founderContext),
        buildTaxonHistory(2, 5, [1])
      ],
      extinctClades: 1,
      extinctSpecies: 1
    };

    const truncated = truncateEvolutionHistory(history, 2);

    expect(truncated.extinctClades).toBe(0);
    expect(truncated.extinctSpecies).toBe(0);
    expect(truncated.clades).toHaveLength(1);
    expect(truncated.species).toHaveLength(1);
    expect(truncated.clades[0]).toMatchObject({
      id: 11,
      extinctTick: null,
      totalBirths: 2,
      totalDeaths: 1,
      peakPopulation: 2,
      timeline: [
        { tick: 0, population: 1, births: 1, deaths: 0 },
        { tick: 1, population: 2, births: 1, deaths: 0 },
        { tick: 2, population: 1, births: 0, deaths: 1 }
      ]
    });
    expect(truncated.clades[0]?.founderContext).toEqual(founderContext);
    expect(truncated.clades[0]?.founderContext).not.toBe(founderContext);
  });

  it('assembles species seed results through injected analyzers', () => {
    const history: EvolutionHistorySnapshot = {
      clades: [buildTaxonHistory(11, 0, [1, 1, 1])],
      species: [buildTaxonHistory(1, 0, [1, 1, 1]), buildTaxonHistory(2, 1, [1, 1])],
      extinctClades: 0,
      extinctSpecies: 0
    };

    const result = buildSpeciesActivitySeedPanelSeedResult(
      {
        seed: 5,
        finalSummary: {
          tick: 2,
          population: 2,
          births: 0,
          deaths: 0,
          meanEnergy: 0,
          meanGenome: { metabolism: 0, harvest: 0, aggression: 0 },
          activeClades: 1,
          activeSpecies: 2,
          dominantSpeciesShare: 0,
          selectionDifferential: { metabolism: 0, harvest: 0, aggression: 0 },
          cladeExtinctions: 0,
          speciesExtinctions: 0,
          cumulativeExtinctClades: 0,
          cumulativeExtinctSpecies: 0
        },
        history,
        windowSize: 1,
        burnIn: 0,
        minSurvivalTicks: [1]
      },
      {
        analyzeSpeciesActivitySummary: (input) => analyzeSpeciesActivity(input).summary,
        analyzePersistentSpeciesActivitySummary: (input) =>
          analyzePersistentSpeciesActivity(input).summary
      }
    );

    expect(result.seed).toBe(5);
    expect(result.rawSummary.totalSpecies).toBe(2);
    expect(result.thresholds).toHaveLength(1);
    expect(result.thresholds[0]?.summary.minSurvivalTicks).toBe(1);
  });
});

function buildTaxonHistory(
  id: number,
  firstSeenTick: number,
  populations: number[],
  founderContext?: TaxonHistory['founderContext']
): TaxonHistory {
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
    founderContext,
    timeline
  };
}
