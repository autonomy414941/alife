import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  NEW_CLADE_ESTABLISHMENT_SMOKE_FIXED_CONFIG,
  NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
  buildConfiguredFounderEstablishmentStudyInput,
  compareFounderGraceFollowupStudies
} from '../src/clade-activity-relabel-null-founder-establishment-study-helpers';

describe('clade-activity-relabel-null-founder-establishment-study-helpers', () => {
  it('builds best-short-stack study inputs from a shared sweep definition', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const result = buildConfiguredFounderEstablishmentStudyInput(
      NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
      NEW_CLADE_ESTABLISHMENT_SMOKE_FIXED_CONFIG,
      {
        simulation: {
          config: {
            width: 1,
            height: 1,
            cladeHabitatCoupling: 0.2,
            adaptiveCladeHabitatMemoryRate: 0.9
          }
        }
      },
      generatedAt,
      36
    );

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.simulation?.config).toMatchObject({
      width: 1,
      height: 1,
      cladeHabitatCoupling: 0.75,
      adaptiveCladeHabitatMemoryRate: 0.2,
      newCladeSettlementCrowdingGraceTicks: 36
    });
  });

  it('compares founder-grace follow-up studies through the shared horizon helper', () => {
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
    const founderGraceStudy = runCladeActivityRelabelNullStudy(
      buildConfiguredFounderEstablishmentStudyInput(
        FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
        FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
        studyInput,
        generatedAt,
        -1
      )
    );
    const ecologyGateStudy = runCladeActivityRelabelNullStudy(
      buildConfiguredFounderEstablishmentStudyInput(
        FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
        FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
        studyInput,
        generatedAt,
        0.1
      )
    );

    const comparison = compareFounderGraceFollowupStudies(
      ecologyGateStudy,
      founderGraceStudy,
      'Ecology-gate study'
    );

    expect(comparison).toHaveLength(1);
    expect(comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      founderGraceBirthScheduleMatchedAllSeeds: true,
      currentBirthScheduleMatchedAllSeeds: true,
      founderGracePersistentWindowFractionDeltaVsNullMean: 0,
      currentPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsFounderGrace: 0,
      founderGracePersistentActivityMeanDeltaVsNullMean: 0,
      currentPersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsFounderGrace: 0,
      founderGraceActiveCladeDeltaVsNullMean: 0,
      currentActiveCladeDeltaVsNullMean: 0,
      activeCladeDeltaImprovementVsFounderGrace: 0,
      founderGraceDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      currentDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
  });
});
