import { describe, expect, it } from 'vitest';
import { DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT } from '../src/clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from '../src/clade-activity-relabel-null-smoke-study';

describe('runCladeActivityRelabelNullSmokeStudy', () => {
  it('reuses the shared short-run defaults and emits setting-keyed results', () => {
    expect(DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT.steps).toBe(1000);
    expect(DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT.minSurvivalTicks).toEqual([50]);
    expect(DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT.cladogenesisThresholds).toEqual([1]);

    const generatedAt = '2026-03-12T00:00:00.000Z';
    const result = runCladeActivityRelabelNullSmokeStudy({
      label: 'Decomposition spillover smoke study',
      generatedAt,
      question: 'Q',
      prediction: 'P',
      settingName: 'decompositionSpilloverFraction',
      valueConfigName: 'decompositionSpilloverFractionValues',
      values: [0, 0.5],
      fixedConfig: {
        lineageHarvestCrowdingPenalty: 1
      },
      studyInput: {
        steps: 6,
        windowSize: 1,
        burnIn: 2,
        seeds: [77],
        minSurvivalTicks: [1],
        cladogenesisThresholds: [0],
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
              energy: 100,
              genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
            }
          ]
        }
      }
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.question).toBe('Q');
    expect(result.prediction).toBe('P');
    expect(result.config).toMatchObject({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
      stopWhenExtinct: true,
      minSurvivalTicks: [1],
      cladogenesisThresholds: [0],
      lineageHarvestCrowdingPenalty: 1,
      width: 1,
      height: 1,
      decompositionSpilloverFractionValues: [0, 0.5]
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].decompositionSpilloverFraction).toBe(0);
    expect(result.results[1].decompositionSpilloverFraction).toBe(0.5);
    expect(result.results[1].studyInput.generatedAt).toBe(generatedAt);
    expect(result.results[1].studyInput.simulation?.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      decompositionSpilloverFraction: 0.5
    });
    expect(result.results[1].studyInput.simulation?.initialAgents).toHaveLength(1);
    expect(result.results[0].summary).toMatchObject({
      birthScheduleMatchedAllSeeds: true,
      persistentWindowFractionDeltaVsNullMean: 0,
      persistentActivityMeanDeltaVsNullMean: 0,
      diagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.results[0].summary.diagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.results[0].summary.diagnostics.actualActiveCladesMean).toBe(
      result.results[0].summary.diagnostics.matchedNullActiveCladesMean
    );
  });

  it('parses the shared generated-at flag', () => {
    expect(parseGeneratedAtCli(['--generated-at', '2026-03-12T00:00:00.000Z'])).toEqual({
      generatedAt: '2026-03-12T00:00:00.000Z'
    });
    expect(() => parseGeneratedAtCli(['--generated-at'])).toThrow('--generated-at requires a value');
    expect(() => parseGeneratedAtCli(['--unknown'])).toThrow('Unknown argument: --unknown');
  });
});
