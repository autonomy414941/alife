import { describe, expect, it } from 'vitest';
import {
  COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION,
  COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION,
  ENCOUNTER_TOPOLOGY_COMPOSITION_COST_FACTORIAL_HORIZON_ARTIFACT,
  runEncounterTopologyCompositionCostFactorialStudy
} from '../src/clade-activity-relabel-null-encounter-topology-composition-cost-factorial-study';

describe('runEncounterTopologyCompositionCostFactorialStudy', () => {
  it('defines the correct artifact path', () => {
    expect(ENCOUNTER_TOPOLOGY_COMPOSITION_COST_FACTORIAL_HORIZON_ARTIFACT).toBe(
      'docs/clade_activity_relabel_null_encounter_topology_composition_cost_factorial_horizon_2026-03-17.json'
    );
  });

  it('compares all four factorial conditions and computes interaction terms', () => {
    const generatedAt = '2026-03-17T00:00:00.000Z';
    const study = runEncounterTopologyCompositionCostFactorialStudy({
      generatedAt,
      studyInput: {
        steps: 12,
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
            maxResource: 25,
            maxResource2: 25,
            resourceRegen: 1,
            resource2Regen: 1,
            metabolismCostBase: 0.2,
            moveCost: 0,
            harvestCap: 5,
            reproduceThreshold: 12,
            reproduceProbability: 1,
            offspringEnergyFraction: 0.5,
            mutationAmount: 0.1,
            speciationThreshold: 0.2,
            maxAge: 200
          },
          initialAgents: [
            {
              x: 2,
              y: 2,
              energy: 40,
              genome: { metabolism: 1, harvest: 1, aggression: 0.5, harvestEfficiency2: 1 }
            }
          ]
        }
      }
    });

    expect(study.generatedAt).toBe(generatedAt);
    expect(study.question).toContain('non-transitive encounters');
    expect(study.hypothesis).toContain('non-transitive + composition-dependent');
    expect(study.config.steps).toBe(12);
    expect(study.config.seeds).toEqual([77]);
    expect(study.config.minSurvivalTicks).toEqual([1]);
    expect(study.config.cladogenesisThresholds).toEqual([0]);
    expect(study.config.simulationConfig).toMatchObject({
      maxResource2: 25,
      resource2Regen: 1
    });
    expect(study.config.compositionDependentReproductionThresholds).toEqual({
      minPrimaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION,
      minSecondaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION
    });

    expect(study.conditions.map((condition) => condition.key)).toEqual([
      'dominantAgnostic',
      'dominantDependent',
      'nonTransitiveAgnostic',
      'nonTransitiveDependent'
    ]);
    expect(study.conditions).toHaveLength(4);

    const dominantDependent = study.conditions.find((condition) => condition.key === 'dominantDependent');
    expect(dominantDependent?.reproductionMinPrimaryFraction).toBe(
      COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION
    );
    expect(dominantDependent?.reproductionMinSecondaryFraction).toBe(
      COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION
    );

    expect(study.comparisons).toHaveLength(1);
    const comparison = study.comparisons[0];

    expect(comparison.cladogenesisThreshold).toBe(0);
    expect(comparison.minSurvivalTicks).toBe(1);
    expect(typeof comparison.dominantAgnostic.activeCladeDeltaVsNullMean).toBe('number');
    expect(typeof comparison.nonTransitiveDependent.activeCladeAreaUnderCurveDeltaVsNullMean).toBe('number');
    expect(typeof comparison.nonTransitiveDependent.regimeSwitchCountDeltaVsNullMean).toBe('number');

    expect(comparison.activeCladeDeltaVsNullInteraction).toBe(
      comparison.nonTransitiveDependent.activeCladeDeltaVsNullMean -
        comparison.dominantDependent.activeCladeDeltaVsNullMean -
        comparison.nonTransitiveAgnostic.activeCladeDeltaVsNullMean +
        comparison.dominantAgnostic.activeCladeDeltaVsNullMean
    );
    expect(comparison.persistentAbundanceWeightedActivityMeanDeltaVsNullInteraction).toBe(
      comparison.nonTransitiveDependent.persistentAbundanceWeightedActivityMeanDeltaVsNullMean -
        comparison.dominantDependent.persistentAbundanceWeightedActivityMeanDeltaVsNullMean -
        comparison.nonTransitiveAgnostic.persistentAbundanceWeightedActivityMeanDeltaVsNullMean +
        comparison.dominantAgnostic.persistentAbundanceWeightedActivityMeanDeltaVsNullMean
    );
    expect(comparison.activeCladeAreaUnderCurveDeltaVsNullInteraction).toBe(
      comparison.nonTransitiveDependent.activeCladeAreaUnderCurveDeltaVsNullMean -
        comparison.dominantDependent.activeCladeAreaUnderCurveDeltaVsNullMean -
        comparison.nonTransitiveAgnostic.activeCladeAreaUnderCurveDeltaVsNullMean +
        comparison.dominantAgnostic.activeCladeAreaUnderCurveDeltaVsNullMean
    );
    expect(comparison.regimeSwitchCountDeltaVsNullInteraction).toBe(
      comparison.nonTransitiveDependent.regimeSwitchCountDeltaVsNullMean -
        comparison.dominantDependent.regimeSwitchCountDeltaVsNullMean -
        comparison.nonTransitiveAgnostic.regimeSwitchCountDeltaVsNullMean +
        comparison.dominantAgnostic.regimeSwitchCountDeltaVsNullMean
    );
  });
});
