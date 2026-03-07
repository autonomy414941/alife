import { describe, expect, it } from 'vitest';
import {
  analyzePersistentSpeciesActivity,
  analyzeSpeciesActivity,
  runSpeciesActivityHorizonSweep,
  runSpeciesActivityPersistenceSweep,
  runSpeciesActivitySeedPanel,
  runSpeciesActivityProbe
} from '../src/activity';
import { TaxonHistory } from '../src/types';

describe('analyzeSpeciesActivity', () => {
  it('builds cumulative and new activity windows from species histories', () => {
    const species: TaxonHistory[] = [
      {
        id: 1,
        firstSeenTick: 0,
        extinctTick: 4,
        totalBirths: 1,
        totalDeaths: 1,
        peakPopulation: 1,
        timeline: [
          { tick: 0, population: 1, births: 1, deaths: 0 },
          { tick: 1, population: 1, births: 0, deaths: 0 },
          { tick: 2, population: 1, births: 0, deaths: 0 },
          { tick: 3, population: 1, births: 0, deaths: 0 },
          { tick: 4, population: 0, births: 0, deaths: 1 }
        ]
      },
      {
        id: 2,
        firstSeenTick: 2,
        extinctTick: 5,
        totalBirths: 1,
        totalDeaths: 1,
        peakPopulation: 1,
        timeline: [
          { tick: 2, population: 1, births: 1, deaths: 0 },
          { tick: 3, population: 1, births: 0, deaths: 0 },
          { tick: 4, population: 1, births: 0, deaths: 0 },
          { tick: 5, population: 0, births: 0, deaths: 1 }
        ]
      },
      {
        id: 3,
        firstSeenTick: 4,
        extinctTick: null,
        totalBirths: 1,
        totalDeaths: 0,
        peakPopulation: 1,
        timeline: [
          { tick: 4, population: 1, births: 1, deaths: 0 },
          { tick: 5, population: 1, births: 0, deaths: 0 }
        ]
      }
    ];

    const analysis = analyzeSpeciesActivity({
      species,
      windowSize: 2,
      burnIn: 2,
      maxTick: 5
    });

    expect(analysis.windows).toEqual([
      {
        windowIndex: 0,
        startTick: 1,
        endTick: 2,
        size: 2,
        postBurnIn: false,
        newSpecies: 1,
        cumulativeActivity: 3,
        normalizedCumulativeActivity: 1.5,
        newActivity: 1
      },
      {
        windowIndex: 1,
        startTick: 3,
        endTick: 4,
        size: 2,
        postBurnIn: true,
        newSpecies: 1,
        cumulativeActivity: 7,
        normalizedCumulativeActivity: 1.75,
        newActivity: 1
      },
      {
        windowIndex: 2,
        startTick: 5,
        endTick: 5,
        size: 1,
        postBurnIn: true,
        newSpecies: 0,
        cumulativeActivity: 8,
        normalizedCumulativeActivity: 1.6,
        newActivity: 0
      }
    ]);
    expect(analysis.summary).toEqual({
      stepsExecuted: 5,
      totalSpecies: 3,
      postBurnInWindows: 2,
      postBurnInWindowsWithNewActivity: 1,
      postBurnInNewSpecies: 1,
      postBurnInNewActivityMean: 0.5,
      postBurnInNewActivityMin: 0,
      postBurnInNewActivityMax: 1,
      finalCumulativeActivity: 8,
      finalNormalizedCumulativeActivity: 1.6,
      finalNewActivity: 0
    });
  });
});

describe('runSpeciesActivityProbe', () => {
  it('is deterministic for the same seeded baseline run', () => {
    const input = {
      steps: 4,
      windowSize: 2,
      burnIn: 2,
      seed: 77,
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-07T00:00:00.000Z'
    };

    const first = runSpeciesActivityProbe(input);
    const second = runSpeciesActivityProbe(input);

    expect(first).toEqual(second);
    expect(first.definition.activityUnit).toBe('activeSpeciesTick');
    expect(first.windows).toHaveLength(2);
    expect(first.summary.stepsExecuted).toBe(4);
    expect(first.summary.totalSpecies).toBeGreaterThan(1);
    expect(first.windows[0].cumulativeActivity).toBeGreaterThan(0);
  });
});

describe('analyzePersistentSpeciesActivity', () => {
  it('filters persistent novelty and censors late windows near the horizon', () => {
    const species: TaxonHistory[] = [
      {
        id: 1,
        firstSeenTick: 2,
        extinctTick: 5,
        totalBirths: 1,
        totalDeaths: 1,
        peakPopulation: 1,
        timeline: [
          { tick: 2, population: 1, births: 1, deaths: 0 },
          { tick: 3, population: 1, births: 0, deaths: 0 },
          { tick: 4, population: 1, births: 0, deaths: 0 },
          { tick: 5, population: 0, births: 0, deaths: 1 }
        ]
      },
      {
        id: 2,
        firstSeenTick: 3,
        extinctTick: 5,
        totalBirths: 1,
        totalDeaths: 1,
        peakPopulation: 1,
        timeline: [
          { tick: 3, population: 1, births: 1, deaths: 0 },
          { tick: 4, population: 1, births: 0, deaths: 0 },
          { tick: 5, population: 0, births: 0, deaths: 1 }
        ]
      },
      {
        id: 3,
        firstSeenTick: 4,
        extinctTick: null,
        totalBirths: 1,
        totalDeaths: 0,
        peakPopulation: 1,
        timeline: [
          { tick: 4, population: 1, births: 1, deaths: 0 },
          { tick: 5, population: 1, births: 0, deaths: 0 },
          { tick: 6, population: 1, births: 0, deaths: 0 }
        ]
      },
      {
        id: 4,
        firstSeenTick: 5,
        extinctTick: null,
        totalBirths: 1,
        totalDeaths: 0,
        peakPopulation: 1,
        timeline: [
          { tick: 5, population: 1, births: 1, deaths: 0 },
          { tick: 6, population: 1, births: 0, deaths: 0 }
        ]
      }
    ];

    const analysis = analyzePersistentSpeciesActivity({
      species,
      windowSize: 2,
      burnIn: 2,
      maxTick: 6,
      minSurvivalTicks: 2
    });

    expect(analysis.windows).toEqual([
      {
        windowIndex: 0,
        startTick: 1,
        endTick: 2,
        size: 2,
        postBurnIn: false,
        censored: false,
        newSpecies: 1,
        rawNewActivity: 1,
        persistentNewSpecies: 1,
        persistentNewActivity: 1
      },
      {
        windowIndex: 1,
        startTick: 3,
        endTick: 4,
        size: 2,
        postBurnIn: true,
        censored: false,
        newSpecies: 2,
        rawNewActivity: 3,
        persistentNewSpecies: 2,
        persistentNewActivity: 3
      },
      {
        windowIndex: 2,
        startTick: 5,
        endTick: 6,
        size: 2,
        postBurnIn: true,
        censored: true,
        newSpecies: 1,
        rawNewActivity: 2,
        persistentNewSpecies: null,
        persistentNewActivity: null
      }
    ]);
    expect(analysis.summary).toEqual({
      minSurvivalTicks: 2,
      postBurnInWindows: 2,
      censoredPostBurnInWindows: 1,
      evaluablePostBurnInWindows: 1,
      postBurnInWindowsWithPersistentNewActivity: 1,
      postBurnInPersistentNewSpecies: 2,
      postBurnInPersistentNewActivityMean: 3,
      postBurnInPersistentNewActivityMin: 3,
      postBurnInPersistentNewActivityMax: 3,
      finalPersistentNewActivity: null,
      finalWindowCensored: true
    });
  });
});

describe('runSpeciesActivityHorizonSweep', () => {
  it('is deterministic and projects probe summaries across horizons', () => {
    const simulation = {
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: [4, 6],
      windowSize: 2,
      burnIn: 2,
      seed: 77,
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-07T00:00:00.000Z'
    };

    const first = runSpeciesActivityHorizonSweep(input);
    const second = runSpeciesActivityHorizonSweep(input);

    expect(first).toEqual(second);
    expect(first.definition.component).toBe('species');
    expect(first.config.steps).toEqual([4, 6]);
    expect(first.horizons).toEqual(
      input.steps.map((steps) => ({
        steps,
        ...runSpeciesActivityProbe({
          steps,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          seed: input.seed,
          stopWhenExtinct: input.stopWhenExtinct,
          simulation,
          generatedAt: input.generatedAt
        }).summary
      }))
    );
  });
});

describe('runSpeciesActivityPersistenceSweep', () => {
  it('is deterministic and preserves the raw probe summary for the same seeded run', () => {
    const simulation = {
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 4,
      windowSize: 2,
      burnIn: 2,
      seed: 77,
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-07T00:00:00.000Z'
    };

    const first = runSpeciesActivityPersistenceSweep(input);
    const second = runSpeciesActivityPersistenceSweep(input);
    const rawProbe = runSpeciesActivityProbe({
      steps: input.steps,
      windowSize: input.windowSize,
      burnIn: input.burnIn,
      seed: input.seed,
      stopWhenExtinct: input.stopWhenExtinct,
      simulation,
      generatedAt: input.generatedAt
    });

    expect(first).toEqual(second);
    expect(first.definition.raw.component).toBe('species');
    expect(first.config.minSurvivalTicks).toEqual([1, 2]);
    expect(first.rawSummary).toEqual(rawProbe.summary);
    expect(first.thresholds).toHaveLength(2);
    expect(first.thresholds.map((threshold) => threshold.minSurvivalTicks)).toEqual([1, 2]);
    expect(first.thresholds[1].summary.finalWindowCensored).toBe(true);
  });
});

describe('runSpeciesActivitySeedPanel', () => {
  it('aggregates persistence summaries across a fixed seed panel', () => {
    const simulation = {
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.2,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 2,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-07T00:00:00.000Z'
    };

    const first = runSpeciesActivitySeedPanel(input);
    const second = runSpeciesActivitySeedPanel(input);

    expect(first).toEqual(second);
    expect(first.definition.raw.component).toBe('species');
    expect(first.config.seeds).toEqual([77, 78]);
    expect(first.seedResults.map((result) => result.seed)).toEqual([77, 78]);

    for (const aggregate of first.aggregates) {
      const thresholdResults = first.seedResults.map((seedResult) => {
        const threshold = seedResult.thresholds.find((result) => result.minSurvivalTicks === aggregate.minSurvivalTicks);
        expect(threshold).toBeDefined();
        return threshold!;
      });
      const persistentWindowFractions = thresholdResults.map((threshold) => threshold.persistentWindowFraction);
      const persistentActivityMeans = thresholdResults.map(
        (threshold) => threshold.summary.postBurnInPersistentNewActivityMean
      );
      const meanPersistentWindowFraction =
        persistentWindowFractions.reduce((total, value) => total + value, 0) / persistentWindowFractions.length;
      const meanPersistentActivityMean =
        persistentActivityMeans.reduce((total, value) => total + value, 0) / persistentActivityMeans.length;

      expect(aggregate.seeds).toBe(2);
      expect(aggregate.seedsWithEvaluableWindows).toBe(
        thresholdResults.filter((threshold) => threshold.summary.evaluablePostBurnInWindows > 0).length
      );
      expect(aggregate.seedsWithAllEvaluableWindowsPositive).toBe(
        thresholdResults.filter((threshold) => threshold.allEvaluableWindowsPositive).length
      );
      expect(aggregate.minPersistentWindowFraction).toBeCloseTo(Math.min(...persistentWindowFractions), 10);
      expect(aggregate.meanPersistentWindowFraction).toBeCloseTo(meanPersistentWindowFraction, 10);
      expect(aggregate.maxPersistentWindowFraction).toBeCloseTo(Math.max(...persistentWindowFractions), 10);
      expect(aggregate.minPersistentActivityMean).toBeCloseTo(Math.min(...persistentActivityMeans), 10);
      expect(aggregate.meanPersistentActivityMean).toBeCloseTo(meanPersistentActivityMean, 10);
      expect(aggregate.maxPersistentActivityMean).toBeCloseTo(Math.max(...persistentActivityMeans), 10);
    }
  });

  it('rejects duplicate seed entries', () => {
    expect(() =>
      runSpeciesActivitySeedPanel({
        steps: 10,
        windowSize: 2,
        burnIn: 2,
        seeds: [5, 5],
        minSurvivalTicks: [1]
      })
    ).toThrow('seeds must not contain duplicates');
  });
});
