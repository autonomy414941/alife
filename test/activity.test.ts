import { describe, expect, it } from 'vitest';
import { analyzeSpeciesActivity, runSpeciesActivityHorizonSweep, runSpeciesActivityProbe } from '../src/activity';
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
