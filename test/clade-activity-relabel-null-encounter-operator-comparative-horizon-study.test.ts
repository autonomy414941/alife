import { describe, expect, it } from 'vitest';
import { ENCOUNTER_OPERATOR_COMPARATIVE_HORIZON_ARTIFACT } from '../src/clade-activity-relabel-null-encounter-operator-comparative-horizon-study';
import { runEncounterOperatorComparativeStudy } from '../src/clade-activity-relabel-null-encounter-operator-comparative-study';

describe('encounter operator comparative horizon study', () => {
  it('defines the correct artifact path', () => {
    expect(ENCOUNTER_OPERATOR_COMPARATIVE_HORIZON_ARTIFACT).toBe(
      'docs/clade_activity_relabel_null_encounter_operator_comparative_horizon_2026-03-17.json'
    );
  });

  it('runs a minimal version of the horizon study', () => {
    const generatedAt = '2026-03-16T00:00:00.000Z';
    const study = runEncounterOperatorComparativeStudy({
      generatedAt,
      studyInput: {
        steps: 10,
        windowSize: 2,
        burnIn: 2,
        seeds: [77],
        minSurvivalTicks: [1],
        cladogenesisThresholds: [0],
        stopWhenExtinct: false,
        simulation: {
          config: {
            width: 5,
            height: 5,
            maxResource: 50,
            resourceRegen: 1,
            metabolismCostBase: 0.5,
            moveCost: 0.1,
            harvestCap: 5,
            reproduceThreshold: 30,
            reproduceProbability: 0.8,
            offspringEnergyFraction: 0.5,
            mutationAmount: 0.1,
            speciationThreshold: 0.3,
            maxAge: 500
          },
          initialAgents: [
            { x: 2, y: 2, energy: 100, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } }
          ]
        }
      }
    });

    expect(study.generatedAt).toBe(generatedAt);
    expect(study.comparison).toHaveLength(1);
    expect(study.comparison[0].cladogenesisThreshold).toBe(0);
    expect(study.comparison[0].minSurvivalTicks).toBe(1);
    expect(typeof study.comparison[0].dominantActiveCladeDeltaVsNullMean).toBe('number');
    expect(typeof study.comparison[0].pairwiseActiveCladeDeltaVsNullMean).toBe('number');
    expect(typeof study.comparison[0].activeCladeDeltaImprovementVsDominant).toBe('number');
  });
});
