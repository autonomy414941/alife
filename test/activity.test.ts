import { describe, expect, it } from 'vitest';
import {
  analyzeCladeActivity,
  analyzePersistentCladeActivity,
  DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY,
  DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY,
  DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP,
  DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP,
  DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY,
  DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY,
  runCladeActivityCladogenesisHorizonStudy,
  runCladeActivityCladogenesisHorizonSweep,
  runCladeActivityCladogenesisSweep,
  runCladeActivityCoarseThresholdBoundaryStudy,
  runCladeActivityRelabelNullCladeHabitatCouplingSweep,
  runCladeActivityRelabelNullCladeInteractionCouplingSweep,
  runCladeActivityPersistenceSweep,
  runCladeActivityRelabelNullStudy,
  runCladeActivitySeedPanel,
  runCladeSpeciesActivityCouplingStudy,
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

describe('analyzeCladeActivity', () => {
  it('builds cumulative and new activity windows from clade histories', () => {
    const clades: TaxonHistory[] = [
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

    const analysis = analyzeCladeActivity({
      clades,
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
        newClades: 1,
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
        newClades: 1,
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
        newClades: 0,
        cumulativeActivity: 8,
        normalizedCumulativeActivity: 1.6,
        newActivity: 0
      }
    ]);
    expect(analysis.summary).toEqual({
      stepsExecuted: 5,
      totalClades: 3,
      postBurnInWindows: 2,
      postBurnInWindowsWithNewActivity: 1,
      postBurnInNewClades: 1,
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

describe('analyzePersistentCladeActivity', () => {
  it('filters persistent clade novelty and censors late windows near the horizon', () => {
    const clades: TaxonHistory[] = [
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

    const analysis = analyzePersistentCladeActivity({
      clades,
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
        newClades: 1,
        rawNewActivity: 1,
        persistentNewClades: 1,
        persistentNewActivity: 1
      },
      {
        windowIndex: 1,
        startTick: 3,
        endTick: 4,
        size: 2,
        postBurnIn: true,
        censored: false,
        newClades: 2,
        rawNewActivity: 3,
        persistentNewClades: 2,
        persistentNewActivity: 3
      },
      {
        windowIndex: 2,
        startTick: 5,
        endTick: 6,
        size: 2,
        postBurnIn: true,
        censored: true,
        newClades: 1,
        rawNewActivity: 2,
        persistentNewClades: null,
        persistentNewActivity: null
      }
    ]);
    expect(analysis.summary).toEqual({
      minSurvivalTicks: 2,
      postBurnInWindows: 2,
      censoredPostBurnInWindows: 1,
      evaluablePostBurnInWindows: 1,
      postBurnInWindowsWithPersistentNewActivity: 1,
      postBurnInPersistentNewClades: 2,
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

describe('runCladeActivityPersistenceSweep', () => {
  it('reports post-burn-in clade novelty in a fixed cladogenesis-enabled micro-regime', () => {
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
        cladogenesisThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const result = runCladeActivityPersistenceSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seed: 77,
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-08T00:00:00.000Z'
    });

    expect(result.rawSummary).toMatchObject({
      stepsExecuted: 6,
      totalClades: 18,
      postBurnInWindows: 4,
      postBurnInWindowsWithNewActivity: 4,
      postBurnInNewClades: 14,
      postBurnInNewActivityMean: 3.5,
      postBurnInNewActivityMin: 1,
      postBurnInNewActivityMax: 8,
      finalCumulativeActivity: 65,
      finalNormalizedCumulativeActivity: 10.833333333333334,
      finalNewActivity: 1
    });
    expect(result.finalSummary.activeClades).toBe(18);
    expect(result.thresholds).toHaveLength(2);
    expect(result.thresholds[0].summary).toMatchObject({
      minSurvivalTicks: 1,
      postBurnInWindowsWithPersistentNewActivity: 3,
      postBurnInPersistentNewClades: 13,
      postBurnInPersistentNewActivityMean: 4.333333333333333,
      finalPersistentNewActivity: null,
      finalWindowCensored: true
    });
    expect(result.thresholds[1].summary).toMatchObject({
      minSurvivalTicks: 2,
      postBurnInWindowsWithPersistentNewActivity: 2,
      postBurnInPersistentNewClades: 12,
      postBurnInPersistentNewActivityMean: 6,
      finalPersistentNewActivity: null,
      finalWindowCensored: true
    });
  });

  it('is deterministic and reports zero post-burn-in clade novelty for the baseline dynamics', () => {
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
      generatedAt: '2026-03-08T00:00:00.000Z'
    };

    const first = runCladeActivityPersistenceSweep(input);
    const second = runCladeActivityPersistenceSweep(input);

    expect(first).toEqual(second);
    expect(first.definition.raw.component).toBe('clades');
    expect(first.rawSummary.totalClades).toBe(1);
    expect(first.rawSummary.postBurnInWindowsWithNewActivity).toBe(0);
    expect(first.thresholds).toHaveLength(2);
    expect(first.thresholds[0].summary.postBurnInWindowsWithPersistentNewActivity).toBe(0);
    expect(first.thresholds[1].summary.finalWindowCensored).toBe(true);
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

describe('runCladeActivitySeedPanel', () => {
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
      generatedAt: '2026-03-08T00:00:00.000Z'
    };

    const first = runCladeActivitySeedPanel(input);
    const second = runCladeActivitySeedPanel(input);

    expect(first).toEqual(second);
    expect(first.definition.raw.component).toBe('clades');
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
});

describe('runCladeActivityCladogenesisSweep', () => {
  it('is deterministic and summarizes clade/species count ratios for each cladogenesis threshold', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-08T00:00:00.000Z'
    };

    const first = runCladeActivityCladogenesisSweep(input);
    const second = runCladeActivityCladogenesisSweep(input);

    expect(first).toEqual(second);
    expect(first.definition.seedPanel.raw.component).toBe('clades');
    expect(first.config.cladogenesisThresholds).toEqual([-1, 0]);
    expect(first.thresholdResults).toHaveLength(2);

    for (const thresholdResult of first.thresholdResults) {
      expect(thresholdResult.seedResults).toHaveLength(2);

      const activeClades = thresholdResult.seedResults.map((seedResult) => seedResult.counts.activeClades);
      const activeSpecies = thresholdResult.seedResults.map((seedResult) => seedResult.counts.activeSpecies);
      const totalClades = thresholdResult.seedResults.map((seedResult) => seedResult.counts.totalClades);
      const totalSpecies = thresholdResult.seedResults.map((seedResult) => seedResult.counts.totalSpecies);
      const activeRatios = thresholdResult.seedResults.map(
        (seedResult) => seedResult.counts.activeCladeToSpeciesRatio
      );
      const totalRatios = thresholdResult.seedResults.map((seedResult) => seedResult.counts.totalCladeToSpeciesRatio);

      expect(thresholdResult.countAggregates.activeClades).toEqual({
        mean: activeClades.reduce((total, value) => total + value, 0) / activeClades.length,
        min: Math.min(...activeClades),
        max: Math.max(...activeClades)
      });
      expect(thresholdResult.countAggregates.activeSpecies).toEqual({
        mean: activeSpecies.reduce((total, value) => total + value, 0) / activeSpecies.length,
        min: Math.min(...activeSpecies),
        max: Math.max(...activeSpecies)
      });
      expect(thresholdResult.countAggregates.totalClades).toEqual({
        mean: totalClades.reduce((total, value) => total + value, 0) / totalClades.length,
        min: Math.min(...totalClades),
        max: Math.max(...totalClades)
      });
      expect(thresholdResult.countAggregates.totalSpecies).toEqual({
        mean: totalSpecies.reduce((total, value) => total + value, 0) / totalSpecies.length,
        min: Math.min(...totalSpecies),
        max: Math.max(...totalSpecies)
      });
      expect(thresholdResult.countAggregates.activeCladeToSpeciesRatio).toEqual({
        mean: activeRatios.reduce((total, value) => total + value, 0) / activeRatios.length,
        min: Math.min(...activeRatios),
        max: Math.max(...activeRatios)
      });
      expect(thresholdResult.countAggregates.totalCladeToSpeciesRatio).toEqual({
        mean: totalRatios.reduce((total, value) => total + value, 0) / totalRatios.length,
        min: Math.min(...totalRatios),
        max: Math.max(...totalRatios)
      });

      for (const aggregate of thresholdResult.activityAggregates) {
        const thresholdSeedResults = thresholdResult.seedResults.map((seedResult) => {
          const threshold = seedResult.thresholds.find((result) => result.minSurvivalTicks === aggregate.minSurvivalTicks);
          expect(threshold).toBeDefined();
          return threshold!;
        });
        const persistentWindowFractions = thresholdSeedResults.map((threshold) => threshold.persistentWindowFraction);
        const persistentActivityMeans = thresholdSeedResults.map(
          (threshold) => threshold.summary.postBurnInPersistentNewActivityMean
        );

        expect(aggregate.seeds).toBe(2);
        expect(aggregate.minPersistentWindowFraction).toBeCloseTo(Math.min(...persistentWindowFractions), 10);
        expect(aggregate.meanPersistentWindowFraction).toBeCloseTo(
          persistentWindowFractions.reduce((total, value) => total + value, 0) / persistentWindowFractions.length,
          10
        );
        expect(aggregate.maxPersistentWindowFraction).toBeCloseTo(Math.max(...persistentWindowFractions), 10);
        expect(aggregate.minPersistentActivityMean).toBeCloseTo(Math.min(...persistentActivityMeans), 10);
        expect(aggregate.meanPersistentActivityMean).toBeCloseTo(
          persistentActivityMeans.reduce((total, value) => total + value, 0) / persistentActivityMeans.length,
          10
        );
        expect(aggregate.maxPersistentActivityMean).toBeCloseTo(Math.max(...persistentActivityMeans), 10);
      }
    }

    const disabled = first.thresholdResults[0];
    const enabled = first.thresholdResults[1];
    expect(disabled.cladogenesisThreshold).toBe(-1);
    expect(disabled.seedResults.every((seedResult) => seedResult.counts.activeClades === 1)).toBe(true);
    expect(disabled.seedResults.every((seedResult) => seedResult.counts.totalClades === 1)).toBe(true);
    expect(enabled.cladogenesisThreshold).toBe(0);
    expect(
      enabled.seedResults.every((seedResult) => seedResult.counts.activeClades === seedResult.counts.activeSpecies)
    ).toBe(true);
    expect(
      enabled.seedResults.every((seedResult) => seedResult.counts.totalClades === seedResult.counts.totalSpecies)
    ).toBe(true);
    expect(enabled.countAggregates.activeCladeToSpeciesRatio.mean).toBeGreaterThan(
      disabled.countAggregates.activeCladeToSpeciesRatio.mean
    );
    expect(enabled.activityAggregates[0].meanPersistentActivityMean).toBeGreaterThan(0);
  });

  it('rejects duplicate cladogenesis thresholds', () => {
    expect(() =>
      runCladeActivityCladogenesisSweep({
        steps: 10,
        windowSize: 2,
        burnIn: 2,
        seeds: [5],
        minSurvivalTicks: [1],
        cladogenesisThresholds: [0.25, 0.25]
      })
    ).toThrow('cladogenesisThresholds must not contain duplicates');
  });
});

describe('runCladeActivityCladogenesisHorizonSweep', () => {
  it('is deterministic and reuses the per-threshold cladogenesis sweep at each horizon', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: [4, 6],
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-09T12:00:00.000Z'
    };

    const first = runCladeActivityCladogenesisHorizonSweep(input);
    const second = runCladeActivityCladogenesisHorizonSweep(input);

    expect(first).toEqual(second);
    expect(first.definition.seedPanel.raw.component).toBe('clades');
    expect(first.config.steps).toEqual([4, 6]);
    expect(first.horizons).toHaveLength(2);

    for (const horizon of first.horizons) {
      const directSweep = runCladeActivityCladogenesisSweep({
        steps: horizon.steps,
        windowSize: input.windowSize,
        burnIn: input.burnIn,
        seeds: input.seeds,
        minSurvivalTicks: input.minSurvivalTicks,
        cladogenesisThresholds: input.cladogenesisThresholds,
        stopWhenExtinct: input.stopWhenExtinct,
        simulation
      });

      expect(horizon.thresholdResults).toEqual(directSweep.thresholdResults);
    }
  });
});

describe('runCladeActivityCladogenesisHorizonStudy', () => {
  it('is deterministic for the canonical March 9 horizon ladder', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: [4, 6],
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      simulation,
      generatedAt: '2026-03-09T00:00:00.000Z'
    };

    const first = runCladeActivityCladogenesisHorizonStudy({
      ...input
    });
    const second = runCladeActivityCladogenesisHorizonStudy({
      ...input
    });

    expect(first).toEqual(second);
    expect(DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.steps).toEqual([2000, 3000, 4000]);
    expect(DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.minSurvivalTicks).toEqual([50, 100]);
    expect(DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.cladogenesisThresholds).toEqual([-1, 1, 1.2]);
    expect(first.config.steps).toEqual(input.steps);
    expect(first.config.windowSize).toBe(input.windowSize);
    expect(first.config.burnIn).toBe(input.burnIn);
    expect(first.config.seeds).toEqual(input.seeds);
    expect(first.config.stopWhenExtinct).toBe(DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.stopWhenExtinct);
    expect(first.config.minSurvivalTicks).toEqual(
      DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.minSurvivalTicks
    );
    expect(first.config.cladogenesisThresholds).toEqual(
      DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.cladogenesisThresholds
    );
    expect(first.horizons).toHaveLength(2);
    expect(first.horizons.every((horizon) => horizon.thresholdResults.length === 3)).toBe(true);
  });
});

describe('runCladeSpeciesActivityCouplingStudy', () => {
  it('is deterministic and matches the paired species/clade persistence summaries for each threshold', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-09T12:00:00.000Z'
    };

    const first = runCladeSpeciesActivityCouplingStudy(input);
    const second = runCladeSpeciesActivityCouplingStudy(input);

    expect(first).toEqual(second);
    expect(first.definition.species.raw.component).toBe('species');
    expect(first.definition.clade.raw.component).toBe('clades');
    expect(first.thresholdResults).toHaveLength(2);

    for (const thresholdResult of first.thresholdResults) {
      for (const seedResult of thresholdResult.seedResults) {
        const thresholdSimulation = {
          ...simulation,
          config: {
            ...simulation.config,
            cladogenesisThreshold: thresholdResult.cladogenesisThreshold
          }
        };
        const speciesSweep = runSpeciesActivityPersistenceSweep({
          steps: input.steps,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          seed: seedResult.seed,
          stopWhenExtinct: input.stopWhenExtinct,
          simulation: thresholdSimulation,
          minSurvivalTicks: input.minSurvivalTicks
        });
        const cladeSweep = runCladeActivityPersistenceSweep({
          steps: input.steps,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          seed: seedResult.seed,
          stopWhenExtinct: input.stopWhenExtinct,
          simulation: thresholdSimulation,
          minSurvivalTicks: input.minSurvivalTicks
        });

        expect(seedResult.speciesRawSummary).toEqual(speciesSweep.rawSummary);
        expect(seedResult.cladeRawSummary).toEqual(cladeSweep.rawSummary);

        for (const threshold of seedResult.thresholds) {
          const speciesThreshold = speciesSweep.thresholds.find(
            (result) => result.minSurvivalTicks === threshold.minSurvivalTicks
          );
          const cladeThreshold = cladeSweep.thresholds.find(
            (result) => result.minSurvivalTicks === threshold.minSurvivalTicks
          );

          expect(speciesThreshold).toBeDefined();
          expect(cladeThreshold).toBeDefined();

          const speciesSummary = speciesThreshold!.summary;
          const cladeSummary = cladeThreshold!.summary;
          const speciesFraction =
            speciesSummary.evaluablePostBurnInWindows === 0
              ? 0
              : speciesSummary.postBurnInWindowsWithPersistentNewActivity / speciesSummary.evaluablePostBurnInWindows;
          const cladeFraction =
            cladeSummary.evaluablePostBurnInWindows === 0
              ? 0
              : cladeSummary.postBurnInWindowsWithPersistentNewActivity / cladeSummary.evaluablePostBurnInWindows;

          expect(threshold.species.summary).toEqual(speciesSummary);
          expect(threshold.clade.summary).toEqual(cladeSummary);
          expect(threshold.species.persistentWindowFraction).toBeCloseTo(speciesFraction, 10);
          expect(threshold.clade.persistentWindowFraction).toBeCloseTo(cladeFraction, 10);
          expect(threshold.species.allEvaluableWindowsPositive).toBe(
            speciesSummary.evaluablePostBurnInWindows > 0 &&
              speciesSummary.postBurnInWindowsWithPersistentNewActivity === speciesSummary.evaluablePostBurnInWindows
          );
          expect(threshold.clade.allEvaluableWindowsPositive).toBe(
            cladeSummary.evaluablePostBurnInWindows > 0 &&
              cladeSummary.postBurnInWindowsWithPersistentNewActivity === cladeSummary.evaluablePostBurnInWindows
          );
          expect(threshold.cladeToSpeciesPersistentWindowFraction).toBe(
            speciesFraction === 0 ? null : cladeFraction / speciesFraction
          );
          expect(threshold.persistentWindowFractionDelta).toBeCloseTo(cladeFraction - speciesFraction, 10);
          expect(threshold.cladeToSpeciesPersistentActivityMeanRatio).toBe(
            speciesSummary.postBurnInPersistentNewActivityMean === 0
              ? null
              : cladeSummary.postBurnInPersistentNewActivityMean /
                  speciesSummary.postBurnInPersistentNewActivityMean
          );
          expect(threshold.persistentActivityMeanDelta).toBeCloseTo(
            cladeSummary.postBurnInPersistentNewActivityMean - speciesSummary.postBurnInPersistentNewActivityMean,
            10
          );
        }
      }

      for (const aggregate of thresholdResult.aggregates) {
        const thresholds = thresholdResult.seedResults.map((seedResult) =>
          seedResult.thresholds.find((result) => result.minSurvivalTicks === aggregate.minSurvivalTicks)
        );

        expect(thresholds.every((threshold) => threshold !== undefined)).toBe(true);

        const definedThresholds = thresholds.filter((threshold) => threshold !== undefined);
        const persistentWindowRatios = definedThresholds.flatMap((threshold) =>
          threshold.cladeToSpeciesPersistentWindowFraction === null
            ? []
            : [threshold.cladeToSpeciesPersistentWindowFraction]
        );
        const persistentWindowDeltas = definedThresholds.map((threshold) => threshold.persistentWindowFractionDelta);
        const persistentActivityRatios = definedThresholds.flatMap((threshold) =>
          threshold.cladeToSpeciesPersistentActivityMeanRatio === null
            ? []
            : [threshold.cladeToSpeciesPersistentActivityMeanRatio]
        );
        const persistentActivityDeltas = definedThresholds.map((threshold) => threshold.persistentActivityMeanDelta);

        expect(aggregate.cladeToSpeciesPersistentWindowFraction.definedSeeds).toBe(persistentWindowRatios.length);
        expect(aggregate.cladeToSpeciesPersistentWindowFraction.mean).toBe(
          persistentWindowRatios.length === 0
            ? null
            : persistentWindowRatios.reduce((total, value) => total + value, 0) / persistentWindowRatios.length
        );
        expect(aggregate.cladeToSpeciesPersistentWindowFraction.min).toBe(
          persistentWindowRatios.length === 0 ? null : Math.min(...persistentWindowRatios)
        );
        expect(aggregate.cladeToSpeciesPersistentWindowFraction.max).toBe(
          persistentWindowRatios.length === 0 ? null : Math.max(...persistentWindowRatios)
        );
        expect(aggregate.persistentWindowFractionDelta.mean).toBeCloseTo(
          persistentWindowDeltas.reduce((total, value) => total + value, 0) / persistentWindowDeltas.length,
          10
        );
        expect(aggregate.persistentWindowFractionDelta.min).toBeCloseTo(Math.min(...persistentWindowDeltas), 10);
        expect(aggregate.persistentWindowFractionDelta.max).toBeCloseTo(Math.max(...persistentWindowDeltas), 10);
        expect(aggregate.cladeToSpeciesPersistentActivityMeanRatio.definedSeeds).toBe(
          persistentActivityRatios.length
        );
        expect(aggregate.cladeToSpeciesPersistentActivityMeanRatio.mean).toBe(
          persistentActivityRatios.length === 0
            ? null
            : persistentActivityRatios.reduce((total, value) => total + value, 0) / persistentActivityRatios.length
        );
        expect(aggregate.cladeToSpeciesPersistentActivityMeanRatio.min).toBe(
          persistentActivityRatios.length === 0 ? null : Math.min(...persistentActivityRatios)
        );
        expect(aggregate.cladeToSpeciesPersistentActivityMeanRatio.max).toBe(
          persistentActivityRatios.length === 0 ? null : Math.max(...persistentActivityRatios)
        );
        expect(aggregate.persistentActivityMeanDelta.mean).toBeCloseTo(
          persistentActivityDeltas.reduce((total, value) => total + value, 0) / persistentActivityDeltas.length,
          10
        );
        expect(aggregate.persistentActivityMeanDelta.min).toBeCloseTo(Math.min(...persistentActivityDeltas), 10);
        expect(aggregate.persistentActivityMeanDelta.max).toBeCloseTo(Math.max(...persistentActivityDeltas), 10);
      }
    }
  });

  it('preserves the canonical March 9 defaults for the bounded 4000-step study', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };

    const result = runCladeSpeciesActivityCouplingStudy({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
      simulation,
      generatedAt: '2026-03-09T00:00:00.000Z'
    });

    expect(DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.steps).toBe(4000);
    expect(DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.minSurvivalTicks).toEqual([50, 100]);
    expect(DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.cladogenesisThresholds).toEqual([-1, 1, 1.2]);
    expect(result.config.stopWhenExtinct).toBe(DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.stopWhenExtinct);
    expect(result.config.minSurvivalTicks).toEqual(DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.minSurvivalTicks);
    expect(result.config.cladogenesisThresholds).toEqual(
      DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.cladogenesisThresholds
    );
    expect(result.thresholdResults).toHaveLength(3);
  });
});

describe('runCladeActivityRelabelNullStudy', () => {
  it('is deterministic and preserves the clade birth schedule for the matched null', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [0],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-10T12:00:00.000Z'
    };

    const first = runCladeActivityRelabelNullStudy(input);
    const second = runCladeActivityRelabelNullStudy(input);

    expect(first).toEqual(second);
    expect(first.definition.actual.raw.component).toBe('clades');
    expect(first.definition.matchedNull.raw.component).toBe('clades');
    expect(first.thresholdResults).toHaveLength(1);

    const thresholdResult = first.thresholdResults[0];
    expect(thresholdResult.cladogenesisThreshold).toBe(0);

    for (const seedResult of thresholdResult.seedResults) {
      expect(seedResult.birthScheduleMatched).toBe(true);
      expect(seedResult.actualBirthSchedule).toEqual(seedResult.matchedNullBirthSchedule);
      expect(seedResult.actualRawSummary).toEqual(seedResult.matchedNullRawSummary);

      for (const threshold of seedResult.thresholds) {
        expect(threshold.actual.summary).toEqual(threshold.matchedNull.summary);
        expect(threshold.actual.persistentWindowFraction).toBeCloseTo(
          threshold.matchedNull.persistentWindowFraction,
          10
        );
        expect(threshold.actualToNullPersistentWindowFractionRatio).toBe(1);
        expect(threshold.persistentWindowFractionDeltaVsNull).toBeCloseTo(0, 10);
        expect(threshold.actualToNullPersistentActivityMeanRatio).toBe(1);
        expect(threshold.persistentActivityMeanDeltaVsNull).toBeCloseTo(0, 10);
      }
    }

    for (const aggregate of thresholdResult.aggregates) {
      expect(aggregate.actual).toEqual(aggregate.matchedNull);
      expect(aggregate.actualToNullPersistentWindowFractionRatio.definedSeeds).toBe(
        thresholdResult.seedResults.length
      );
      expect(aggregate.actualToNullPersistentWindowFractionRatio.mean).toBe(1);
      expect(aggregate.persistentWindowFractionDeltaVsNull.mean).toBeCloseTo(0, 10);
      expect(aggregate.actualToNullPersistentActivityMeanRatio.mean).toBe(1);
      expect(aggregate.persistentActivityMeanDeltaVsNull.mean).toBeCloseTo(0, 10);
    }
  });

  it(
    'separates actual clades from the matched null when clade habitat coupling is enabled',
    () => {
      const result = runCladeActivityRelabelNullStudy({
        steps: 400,
        windowSize: 50,
        burnIn: 100,
        seeds: [20260307],
        minSurvivalTicks: [50],
        cladogenesisThresholds: [1],
        simulation: {
          config: {
            cladeHabitatCoupling: 1
          }
        },
        generatedAt: '2026-03-10T00:00:00.000Z'
      });

      const thresholdResult = result.thresholdResults[0]!;
      const seedResult = thresholdResult.seedResults[0]!;
      const threshold = seedResult.thresholds[0]!;
      const aggregate = thresholdResult.aggregates[0]!;

      expect(seedResult.birthScheduleMatched).toBe(true);
      expect(Math.abs(threshold.persistentActivityMeanDeltaVsNull)).toBeGreaterThan(0.1);
      expect(Math.abs(aggregate.persistentActivityMeanDeltaVsNull.mean)).toBeGreaterThan(0.1);
    },
    15000
  );

  it(
    'separates actual clades from the matched null when clade interaction coupling is enabled',
    () => {
      const result = runCladeActivityRelabelNullStudy({
        steps: 400,
        windowSize: 50,
        burnIn: 100,
        seeds: [20260307],
        minSurvivalTicks: [50],
        cladogenesisThresholds: [1],
        simulation: {
          config: {
            cladeInteractionCoupling: 1
          }
        },
        generatedAt: '2026-03-11T00:00:00.000Z'
      });

      const thresholdResult = result.thresholdResults[0]!;
      const seedResult = thresholdResult.seedResults[0]!;
      const threshold = seedResult.thresholds[0]!;
      const aggregate = thresholdResult.aggregates[0]!;

      expect(seedResult.birthScheduleMatched).toBe(true);
      expect(Math.abs(threshold.persistentActivityMeanDeltaVsNull)).toBeGreaterThan(0.1);
      expect(Math.abs(aggregate.persistentActivityMeanDeltaVsNull.mean)).toBeGreaterThan(0.1);
    },
    15000
  );

  it('preserves the canonical March 10 defaults for the matched-null study', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };

    const result = runCladeActivityRelabelNullStudy({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
      simulation,
      generatedAt: '2026-03-10T00:00:00.000Z'
    });

    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.steps).toBe(4000);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.minSurvivalTicks).toEqual([50, 100]);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.cladogenesisThresholds).toEqual([1, 1.2]);
    expect(result.config.stopWhenExtinct).toBe(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.stopWhenExtinct);
    expect(result.config.minSurvivalTicks).toEqual(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.minSurvivalTicks);
    expect(result.config.cladogenesisThresholds).toEqual(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.cladogenesisThresholds
    );
    expect(result.thresholdResults).toHaveLength(2);
  });
});

describe('runCladeActivityRelabelNullCladeHabitatCouplingSweep', () => {
  it('is deterministic for a fixed coupling sweep configuration', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: 1,
      cladogenesisThreshold: 0,
      cladeHabitatCouplingValues: [0, 1],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-11T00:00:00.000Z'
    };

    const first = runCladeActivityRelabelNullCladeHabitatCouplingSweep(input);
    const second = runCladeActivityRelabelNullCladeHabitatCouplingSweep(input);

    expect(first).toEqual(second);
    expect(first.results).toHaveLength(2);
    expect(first.results.every((result) => result.birthScheduleMatchedAllSeeds)).toBe(true);
  });

  it('matches standalone relabel-null studies at the sweep endpoints', () => {
    const input = {
      steps: 400,
      windowSize: 50,
      burnIn: 100,
      seeds: [20260307],
      minSurvivalTicks: 50,
      cladogenesisThreshold: 1,
      cladeHabitatCouplingValues: [0, 1],
      generatedAt: '2026-03-11T00:00:00.000Z'
    };

    const result = runCladeActivityRelabelNullCladeHabitatCouplingSweep(input);
    expect(result.results).toHaveLength(2);

    const uncoupledStudy = runCladeActivityRelabelNullStudy({
      steps: input.steps,
      windowSize: input.windowSize,
      burnIn: input.burnIn,
      seeds: input.seeds,
      minSurvivalTicks: [input.minSurvivalTicks],
      cladogenesisThresholds: [input.cladogenesisThreshold],
      simulation: {
        config: {
          cladeHabitatCoupling: 0
        }
      },
      generatedAt: input.generatedAt
    });
    const coupledStudy = runCladeActivityRelabelNullStudy({
      steps: input.steps,
      windowSize: input.windowSize,
      burnIn: input.burnIn,
      seeds: input.seeds,
      minSurvivalTicks: [input.minSurvivalTicks],
      cladogenesisThresholds: [input.cladogenesisThreshold],
      simulation: {
        config: {
          cladeHabitatCoupling: 1
        }
      },
      generatedAt: input.generatedAt
    });

    const uncoupledResult = result.results.find((sweepResult) => sweepResult.cladeHabitatCoupling === 0);
    const coupledResult = result.results.find((sweepResult) => sweepResult.cladeHabitatCoupling === 1);

    expect(uncoupledResult).toBeDefined();
    expect(coupledResult).toBeDefined();
    expect(uncoupledResult!.seedResults).toEqual(uncoupledStudy.thresholdResults[0]!.seedResults);
    expect(uncoupledResult!.aggregate).toEqual(uncoupledStudy.thresholdResults[0]!.aggregates[0]);
    expect(coupledResult!.seedResults).toEqual(coupledStudy.thresholdResults[0]!.seedResults);
    expect(coupledResult!.aggregate).toEqual(coupledStudy.thresholdResults[0]!.aggregates[0]);
    expect(uncoupledResult!.birthScheduleMatchedAllSeeds).toBe(true);
    expect(coupledResult!.birthScheduleMatchedAllSeeds).toBe(true);
    expect(uncoupledResult!.persistentActivityMeanDeltaVsNullMean).toBeCloseTo(
      uncoupledResult!.aggregate.persistentActivityMeanDeltaVsNull.mean,
      10
    );
    expect(coupledResult!.persistentWindowFractionDeltaVsNullMean).toBeCloseTo(
      coupledResult!.aggregate.persistentWindowFractionDeltaVsNull.mean,
      10
    );
    expect(Math.abs(coupledResult!.persistentActivityMeanDeltaVsNullMean)).toBeGreaterThan(0.1);
  }, 20000);

  it('preserves the March 11 short-panel defaults for the coupling sweep', () => {
    const result = runCladeActivityRelabelNullCladeHabitatCouplingSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
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
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-11T00:00:00.000Z'
    });

    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.steps).toBe(1000);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.minSurvivalTicks).toBe(50);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladogenesisThreshold).toBe(1);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladeHabitatCouplingValues).toEqual([
      0, 0.25, 0.5, 0.75, 1
    ]);
    expect(result.config.stopWhenExtinct).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.stopWhenExtinct
    );
    expect(result.config.minSurvivalTicks).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.minSurvivalTicks
    );
    expect(result.config.cladogenesisThreshold).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladogenesisThreshold
    );
    expect(result.config.cladeHabitatCouplingValues).toEqual(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladeHabitatCouplingValues
    );
    expect(result.results).toHaveLength(5);
  });
});

describe('runCladeActivityRelabelNullCladeInteractionCouplingSweep', () => {
  it('is deterministic for a fixed coupling sweep configuration', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: 1,
      cladogenesisThreshold: 0,
      cladeInteractionCouplingValues: [0, 1],
      stopWhenExtinct: true,
      simulation,
      generatedAt: '2026-03-11T00:00:00.000Z'
    };

    const first = runCladeActivityRelabelNullCladeInteractionCouplingSweep(input);
    const second = runCladeActivityRelabelNullCladeInteractionCouplingSweep(input);

    expect(first).toEqual(second);
    expect(first.results).toHaveLength(2);
    expect(first.results.every((result) => result.birthScheduleMatchedAllSeeds)).toBe(true);
  });

  it('matches standalone relabel-null studies at the sweep endpoints', () => {
    const input = {
      steps: 400,
      windowSize: 50,
      burnIn: 100,
      seeds: [20260307],
      minSurvivalTicks: 50,
      cladogenesisThreshold: 1,
      cladeInteractionCouplingValues: [0, 1],
      generatedAt: '2026-03-11T00:00:00.000Z'
    };

    const result = runCladeActivityRelabelNullCladeInteractionCouplingSweep(input);
    expect(result.results).toHaveLength(2);

    const uncoupledStudy = runCladeActivityRelabelNullStudy({
      steps: input.steps,
      windowSize: input.windowSize,
      burnIn: input.burnIn,
      seeds: input.seeds,
      minSurvivalTicks: [input.minSurvivalTicks],
      cladogenesisThresholds: [input.cladogenesisThreshold],
      simulation: {
        config: {
          cladeInteractionCoupling: 0
        }
      },
      generatedAt: input.generatedAt
    });
    const coupledStudy = runCladeActivityRelabelNullStudy({
      steps: input.steps,
      windowSize: input.windowSize,
      burnIn: input.burnIn,
      seeds: input.seeds,
      minSurvivalTicks: [input.minSurvivalTicks],
      cladogenesisThresholds: [input.cladogenesisThreshold],
      simulation: {
        config: {
          cladeInteractionCoupling: 1
        }
      },
      generatedAt: input.generatedAt
    });

    const uncoupledResult = result.results.find((sweepResult) => sweepResult.cladeInteractionCoupling === 0);
    const coupledResult = result.results.find((sweepResult) => sweepResult.cladeInteractionCoupling === 1);

    expect(uncoupledResult).toBeDefined();
    expect(coupledResult).toBeDefined();
    expect(uncoupledResult!.seedResults).toEqual(uncoupledStudy.thresholdResults[0]!.seedResults);
    expect(uncoupledResult!.aggregate).toEqual(uncoupledStudy.thresholdResults[0]!.aggregates[0]);
    expect(coupledResult!.seedResults).toEqual(coupledStudy.thresholdResults[0]!.seedResults);
    expect(coupledResult!.aggregate).toEqual(coupledStudy.thresholdResults[0]!.aggregates[0]);
    expect(uncoupledResult!.birthScheduleMatchedAllSeeds).toBe(true);
    expect(coupledResult!.birthScheduleMatchedAllSeeds).toBe(true);
    expect(uncoupledResult!.persistentActivityMeanDeltaVsNullMean).toBeCloseTo(
      uncoupledResult!.aggregate.persistentActivityMeanDeltaVsNull.mean,
      10
    );
    expect(coupledResult!.persistentWindowFractionDeltaVsNullMean).toBeCloseTo(
      coupledResult!.aggregate.persistentWindowFractionDeltaVsNull.mean,
      10
    );
    expect(Math.abs(coupledResult!.persistentActivityMeanDeltaVsNullMean)).toBeGreaterThan(0.1);
  }, 20000);

  it('preserves the March 11 short-panel defaults for the coupling sweep', () => {
    const result = runCladeActivityRelabelNullCladeInteractionCouplingSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
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
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-11T00:00:00.000Z'
    });

    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.steps).toBe(1000);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.minSurvivalTicks).toBe(50);
    expect(DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladogenesisThreshold).toBe(1);
    expect(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladeInteractionCouplingValues
    ).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(result.config.stopWhenExtinct).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.stopWhenExtinct
    );
    expect(result.config.minSurvivalTicks).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.minSurvivalTicks
    );
    expect(result.config.cladogenesisThreshold).toBe(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladogenesisThreshold
    );
    expect(result.config.cladeInteractionCouplingValues).toEqual(
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladeInteractionCouplingValues
    );
    expect(result.results).toHaveLength(5);
  });
});

describe('runCladeActivityCoarseThresholdBoundaryStudy', () => {
  it('is deterministic for the canonical March 9 coarse-threshold grid', () => {
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
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    };
    const input = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77, 78],
      minSurvivalTicks: [1, 2],
      simulation,
      generatedAt: '2026-03-09T00:00:00.000Z'
    };
    const first = runCladeActivityCoarseThresholdBoundaryStudy({
      ...input
    });
    const second = runCladeActivityCoarseThresholdBoundaryStudy({
      ...input
    });

    expect(first).toEqual(second);
    expect(DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.minSurvivalTicks).toEqual([50, 100]);
    expect(DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.cladogenesisThresholds).toEqual([
      -1,
      0.6,
      0.8,
      1,
      1.2
    ]);
    expect(first.config.steps).toBe(input.steps);
    expect(first.config.windowSize).toBe(input.windowSize);
    expect(first.config.burnIn).toBe(input.burnIn);
    expect(first.config.seeds).toEqual(input.seeds);
    expect(first.config.stopWhenExtinct).toBe(
      DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.stopWhenExtinct
    );
    expect(first.config.minSurvivalTicks).toEqual(input.minSurvivalTicks);
    expect(first.config.cladogenesisThresholds).toEqual(
      DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.cladogenesisThresholds
    );
    expect(first.thresholdResults).toHaveLength(
      DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.cladogenesisThresholds.length
    );
    expect(first.thresholdResults.map((result) => result.cladogenesisThreshold)).toEqual(
      DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.cladogenesisThresholds
    );
    expect(first.thresholdResults.every((result) => result.seedResults.length === first.config.seeds.length)).toBe(
      true
    );
    expect(
      first.thresholdResults.every(
        (result) => result.activityAggregates.length === first.config.minSurvivalTicks.length
      )
    ).toBe(true);
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
