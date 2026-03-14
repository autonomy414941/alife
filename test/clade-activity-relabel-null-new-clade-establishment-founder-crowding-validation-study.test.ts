import { describe, expect, it } from 'vitest';
import {
  runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy
} from '../src/clade-activity-relabel-null-new-clade-establishment-founder-crowding-validation-study';

describe('runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy', () => {
  it('emits deterministic founder-crowding validation output through the dedicated study entrypoint', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const studyInput = {
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
    } as const;

    const parsed = JSON.parse(
      JSON.stringify(
        runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy({
          generatedAt,
          studyInput
        })
      )
    );

    expect(parsed.generatedAt).toBe(generatedAt);
    expect(parsed.question).toContain('local crowding bins');
    expect(parsed.prediction).toContain('founderHabitatAndCrowdingBin');
    expect(parsed.config).toMatchObject({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
      stopWhenExtinct: true,
      minSurvivalTicks: [1],
      cladogenesisThresholds: [0],
      habitatMatchedNullFounderContext: 'founderHabitatBin',
      habitatAndCrowdingMatchedNullFounderContext: 'founderHabitatAndCrowdingBin'
    });
    expect(parsed.comparison).toHaveLength(1);
    expect(parsed.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: true,
      habitatAndCrowdingMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: true,
      habitatAndCrowdingMatchedNullFounderGraceFounderHabitatCrowdingScheduleMatchedAllSeeds: true,
      habitatMatchedNullFounderGraceImprovementVsStaticHabitat: 0,
      habitatAndCrowdingMatchedNullFounderGraceImprovementVsStaticHabitat: 0,
      activeCladeImprovementShiftVsHabitatMatchedNull: 0
    });
    expect(parsed.habitatAndCrowdingMatchedNullStudy.founderGraceStudy.config.matchedNullFounderContext).toBe(
      'founderHabitatAndCrowdingBin'
    );
  });
});
