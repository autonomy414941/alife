import { describe, expect, it } from 'vitest';
import {
  analyzePersistentSpeciesActivity,
  analyzeCladeActivity,
  analyzePersistentCladeActivity,
  analyzeSpeciesActivity
} from '../src/activity';
import { buildCladeActivityRelabelNullThresholdResults } from '../src/clade-activity-relabel-null-study-runner';
import { EvolutionHistorySnapshot, TaxonHistory } from '../src/types';

describe('buildCladeActivityRelabelNullThresholdResults', () => {
  it('assembles relabel-null threshold results while preserving the stricter founder habitat/crowding schedule', () => {
    const history: EvolutionHistorySnapshot = {
      clades: [
        buildTaxonHistory(101, 0, [2, 2, 1], {
          habitatMean: 0.4,
          habitatBin: 0,
          localCrowdingMean: 2.4,
          localCrowdingBin: 2,
          founderCount: 1
        }),
        buildTaxonHistory(102, 2, [2, 2, 2], {
          habitatMean: 1.5,
          habitatBin: 2,
          localCrowdingMean: 1.2,
          localCrowdingBin: 1,
          founderCount: 1
        })
      ],
      species: [
        buildTaxonHistory(1, 0, [1, 1, 1], {
          habitatMean: 0.3,
          habitatBin: 0,
          localCrowdingMean: 0.4,
          localCrowdingBin: 0,
          founderCount: 1
        }),
        buildTaxonHistory(2, 0, [1, 1, 1], {
          habitatMean: 0.4,
          habitatBin: 0,
          localCrowdingMean: 2.4,
          localCrowdingBin: 2,
          founderCount: 1
        }),
        buildTaxonHistory(3, 2, [1, 1, 1], {
          habitatMean: 1.5,
          habitatBin: 2,
          localCrowdingMean: 1.2,
          localCrowdingBin: 1,
          founderCount: 1
        }),
        buildTaxonHistory(4, 2, [1, 1, 1], {
          habitatMean: 1.6,
          habitatBin: 3,
          localCrowdingMean: 1.2,
          localCrowdingBin: 1,
          founderCount: 1
        })
      ],
      extinctClades: 0,
      extinctSpecies: 0
    };

    const thresholdResults = buildCladeActivityRelabelNullThresholdResults(
      {
        steps: 4,
        windowSize: 1,
        burnIn: 0,
        seeds: [17],
        minSurvivalTicks: [1],
        cladogenesisThresholds: [0],
        stopWhenExtinct: true,
        matchedNullFounderContext: 'founderHabitatAndCrowdingBin'
      },
      {
        runSimulation: () => ({
          history,
          finalSummary: {
            tick: 4,
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
          }
        }),
        analyzeCladeActivitySummary: (input) => analyzeCladeActivity(input).summary,
        analyzeSpeciesActivitySummary: (input) => analyzeSpeciesActivity(input).summary,
        analyzePersistentCladeActivitySummary: (input) => analyzePersistentCladeActivity(input).summary,
        analyzePersistentSpeciesActivitySummary: (input) => analyzePersistentSpeciesActivity(input).summary,
        withCladogenesisThreshold: (simulation, cladogenesisThreshold) => ({
          ...simulation,
          config: {
            ...simulation?.config,
            cladogenesisThreshold
          }
        })
      }
    );

    expect(thresholdResults).toHaveLength(1);
    expect(thresholdResults[0]).toMatchObject({
      cladogenesisThreshold: 0
    });
    expect(thresholdResults[0]?.seedResults).toHaveLength(1);
    expect(thresholdResults[0]?.seedResults[0]).toMatchObject({
      seed: 17,
      birthScheduleMatched: true,
      founderHabitatScheduleMatched: true,
      founderHabitatCrowdingScheduleMatched: true
    });
    expect(thresholdResults[0]?.seedResults[0]?.actualSpeciesThresholds[0]?.minSurvivalTicks).toBe(1);
    expect(thresholdResults[0]?.seedResults[0]?.thresholds[0]?.minSurvivalTicks).toBe(1);
    expect(thresholdResults[0]?.aggregates[0]?.diagnostics.activeCladeDeltaVsNull.mean).toBe(
      thresholdResults[0]?.seedResults[0]?.thresholds[0]?.diagnostics.activeCladeDeltaVsNull
    );
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
