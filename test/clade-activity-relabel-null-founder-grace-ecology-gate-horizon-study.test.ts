import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import {
  BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
  HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
  HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
  runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';

describe('runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy', () => {
  it('compares founder grace against ecology gating on the canonical horizon surface', () => {
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
    const baselineStudy = runCladeActivityRelabelNullStudy(
      buildCladeActivityRelabelNullBestShortStackStudyInput(
        {
          ...studyInput,
          simulation: {
            ...studyInput.simulation,
            config: {
              ...studyInput.simulation.config,
              cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
              adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
              newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
              cladogenesisEcologyAdvantageThreshold:
                HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
            }
          }
        },
        generatedAt
      )
    );
    const result = runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy({
      generatedAt,
      baselineStudy,
      studyInput
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.baselineArtifact).toBe(BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT);
    expect(result.config.staticHabitatBaselineArtifact).toBe(
      'docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json'
    );
    expect(result.config.steps).toBe(6);
    expect(result.config.windowSize).toBe(1);
    expect(result.config.burnIn).toBe(2);
    expect(result.config.seeds).toEqual([77]);
    expect(result.config.minSurvivalTicks).toEqual([1]);
    expect(result.config.cladogenesisThresholds).toEqual([0]);
    expect(result.config.cladeHabitatCoupling).toBe(FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING);
    expect(result.config.adaptiveCladeHabitatMemoryRate).toBe(
      FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
    );
    expect(result.config.newCladeSettlementCrowdingGraceTicks).toBe(
      FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
    );
    expect(result.config.baselineCladogenesisEcologyAdvantageThreshold).toBe(
      HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
    );
    expect(result.config.ecologyGateCladogenesisEcologyAdvantageThreshold).toBe(
      HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
    );
    expect(result.config.founderGraceSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
    });
    expect(result.config.ecologyGateSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
    });
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      founderGraceBirthScheduleMatchedAllSeeds: true,
      ecologyGateBirthScheduleMatchedAllSeeds: true,
      founderGracePersistentWindowFractionDeltaVsNullMean: 0,
      ecologyGatePersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsFounderGrace: 0,
      founderGracePersistentActivityMeanDeltaVsNullMean: 0,
      ecologyGatePersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsFounderGrace: 0,
      founderGraceActiveCladeDeltaVsNullMean: 0,
      ecologyGateActiveCladeDeltaVsNullMean: 0,
      activeCladeDeltaImprovementVsFounderGrace: 0,
      founderGraceDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      ecologyGateDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.ecologyGateStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison[0].founderGraceDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.comparison[0].ecologyGateDiagnostics.finalPopulationMean).toBeGreaterThan(0);
  });
});
