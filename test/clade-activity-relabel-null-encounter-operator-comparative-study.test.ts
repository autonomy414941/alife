import { describe, expect, it } from 'vitest';
import {
  runEncounterOperatorComparativeStudy,
  EncounterOperatorComparativeStudyExport
} from '../src/clade-activity-relabel-null-encounter-operator-comparative-study';
import { BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT } from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';

describe('runEncounterOperatorComparativeStudy', () => {
  it('compares dominant versus pairwise encounter operators on the canonical stack', () => {
    const generatedAt = '2026-03-16T00:00:00.000Z';
    const result: EncounterOperatorComparativeStudyExport = runEncounterOperatorComparativeStudy({
      generatedAt
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.question).toContain('pairwise encounter topology');
    expect(result.hypothesis).toContain('reduce dominance exclusion');

    expect(result.config.baselineArtifact).toBe(BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT);
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

    expect(result.dominantStudy).toBeDefined();
    expect(result.pairwiseStudy).toBeDefined();

    expect(result.comparison).toHaveLength(1);
    const comparison = result.comparison[0];

    expect(comparison.cladogenesisThreshold).toBe(0);
    expect(comparison.minSurvivalTicks).toBe(1);
    expect(comparison.dominantBirthScheduleMatchedAllSeeds).toBe(true);
    expect(comparison.pairwiseBirthScheduleMatchedAllSeeds).toBe(true);

    expect(typeof comparison.dominantPersistentWindowFractionDeltaVsNullMean).toBe('number');
    expect(typeof comparison.pairwisePersistentWindowFractionDeltaVsNullMean).toBe('number');
    expect(typeof comparison.persistentWindowFractionDeltaImprovementVsDominant).toBe('number');

    expect(typeof comparison.dominantPersistentActivityMeanDeltaVsNullMean).toBe('number');
    expect(typeof comparison.pairwisePersistentActivityMeanDeltaVsNullMean).toBe('number');
    expect(typeof comparison.persistentActivityMeanImprovementVsDominant).toBe('number');

    expect(typeof comparison.dominantActiveCladeDeltaVsNullMean).toBe('number');
    expect(typeof comparison.pairwiseActiveCladeDeltaVsNullMean).toBe('number');
    expect(typeof comparison.activeCladeDeltaImprovementVsDominant).toBe('number');

    expect(comparison.dominantDiagnostics).toBeDefined();
    expect(comparison.pairwiseDiagnostics).toBeDefined();
    expect(comparison.dominantDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(comparison.pairwiseDiagnostics.finalPopulationMean).toBeGreaterThan(0);

    expect(
      comparison.persistentWindowFractionDeltaImprovementVsDominant
    ).toBe(
      comparison.pairwisePersistentWindowFractionDeltaVsNullMean -
        comparison.dominantPersistentWindowFractionDeltaVsNullMean
    );
    expect(
      comparison.persistentActivityMeanImprovementVsDominant
    ).toBe(
      comparison.pairwisePersistentActivityMeanDeltaVsNullMean -
        comparison.dominantPersistentActivityMeanDeltaVsNullMean
    );
    expect(
      comparison.activeCladeDeltaImprovementVsDominant
    ).toBe(
      comparison.pairwiseActiveCladeDeltaVsNullMean -
        comparison.dominantActiveCladeDeltaVsNullMean
    );
  });

  it('accepts pre-run studies to avoid redundant simulation', () => {
    const generatedAt = '2026-03-16T00:00:00.000Z';
    const firstRun = runEncounterOperatorComparativeStudy({ generatedAt });

    const secondRun = runEncounterOperatorComparativeStudy({
      generatedAt,
      dominantStudy: firstRun.dominantStudy,
      pairwiseStudy: firstRun.pairwiseStudy
    });

    expect(secondRun.dominantStudy).toBe(firstRun.dominantStudy);
    expect(secondRun.pairwiseStudy).toBe(firstRun.pairwiseStudy);
    expect(secondRun.comparison).toEqual(firstRun.comparison);
  });
});
