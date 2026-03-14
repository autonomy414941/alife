import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildConfiguredFounderEstablishmentStudyInput } from '../src/clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS,
  runConfiguredFounderGraceFollowupHorizonStudy
} from '../src/clade-activity-relabel-null-founder-grace-followup-horizon-helpers';

describe('clade-activity-relabel-null-founder-grace-followup-horizon-helpers', () => {
  it('runs table-driven founder-grace follow-up horizons from a shared definition', () => {
    const definition = FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS.founderGraceEcologyGate;
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const studyInput = {
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [83],
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
    const baselineStudy = runCladeActivityRelabelNullStudy(
      buildConfiguredFounderEstablishmentStudyInput(
        definition.sweepDefinition,
        definition.fixedConfig,
        studyInput,
        generatedAt,
        definition.baselineValue
      )
    );

    const result = runConfiguredFounderGraceFollowupHorizonStudy(definition, {
      generatedAt,
      studyInput,
      baselineStudy
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.question).toBe(definition.question);
    expect(result.prediction).toBe(definition.prediction);
    expect(result.resolvedStudyConfig).toMatchObject({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [83],
      minSurvivalTicks: [1],
      cladogenesisThresholds: [0],
      stopWhenExtinct: true
    });
    expect(result.baselineStudyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: 0.75,
      adaptiveCladeHabitatMemoryRate: 0,
      newCladeSettlementCrowdingGraceTicks: 36,
      cladogenesisEcologyAdvantageThreshold: -1
    });
    expect(result.currentStudyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: 0.75,
      adaptiveCladeHabitatMemoryRate: 0,
      newCladeSettlementCrowdingGraceTicks: 36,
      cladogenesisEcologyAdvantageThreshold: 0.1
    });
    expect(result.currentStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      founderGraceBirthScheduleMatchedAllSeeds: true,
      currentBirthScheduleMatchedAllSeeds: true,
      founderGracePersistentWindowFractionDeltaVsNullMean: 0,
      currentPersistentWindowFractionDeltaVsNullMean: 0,
      founderGraceActiveCladeDeltaVsNullMean: 0,
      currentActiveCladeDeltaVsNullMean: 0,
      activeCladeDeltaImprovementVsFounderGrace: 0
    });
    expect(result.comparison[0].currentDiagnostics.finalPopulationMean).toBeGreaterThan(0);
  });
});
