import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import {
  compareActiveCladeAgeBuckets,
  runCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReview
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-age-bucket-review';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT,
  HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
  runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';
import { TaxonHistory } from '../src/types';

describe('compareActiveCladeAgeBuckets', () => {
  it('counts final active clades by configured age bucket against the matched null', () => {
    const actualClades = [
      buildTaxonHistory(1, 2, [2, 10]),
      buildTaxonHistory(2, 7, [7, 10]),
      buildTaxonHistory(3, 1, [1, 9])
    ];
    const matchedNullClades = [
      buildTaxonHistory(4, 1, [1, 10]),
      buildTaxonHistory(5, 5, [5, 10]),
      buildTaxonHistory(6, 10, [10, 10])
    ];

    expect(
      compareActiveCladeAgeBuckets({
        clades: actualClades,
        matchedNullClades,
        finalTick: 10,
        ageBuckets: [
          {
            label: 'young',
            minAgeInclusive: 0,
            maxAgeInclusive: 4,
            description: 'Ages 0 through 4'
          },
          {
            label: 'maturing',
            minAgeInclusive: 5,
            maxAgeInclusive: 9,
            description: 'Ages 5 through 9'
          },
          {
            label: 'old',
            minAgeInclusive: 10,
            maxAgeInclusive: null,
            description: 'Ages 10+'
          }
        ]
      })
    ).toEqual([
      {
        ageBucketLabel: 'young',
        minAgeInclusive: 0,
        maxAgeInclusive: 4,
        actualActiveClades: 1,
        matchedNullActiveClades: 1,
        activeCladeDeltaVsNull: 0
      },
      {
        ageBucketLabel: 'maturing',
        minAgeInclusive: 5,
        maxAgeInclusive: 9,
        actualActiveClades: 1,
        matchedNullActiveClades: 2,
        activeCladeDeltaVsNull: -1
      },
      {
        ageBucketLabel: 'old',
        minAgeInclusive: 10,
        maxAgeInclusive: null,
        actualActiveClades: 0,
        matchedNullActiveClades: 0,
        activeCladeDeltaVsNull: 0
      }
    ]);
  });
});

describe('runCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReview', () => {
  it('matches the horizon active-clade delta when every surviving clade is still founder-aged', () => {
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
    const horizonStudy = runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy({
      generatedAt,
      baselineStudy,
      studyInput
    });
    const review = runCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReview({
      generatedAt,
      studyInput
    });

    expect(review.generatedAt).toBe(generatedAt);
    expect(review.config.horizonArtifact).toBe(FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT);
    expect(review.config.ageBuckets.map((bucket) => bucket.label)).toEqual([
      'founderGraceWindow',
      'earlyMaintenance',
      'established100Plus'
    ]);
    expect(review.thresholdSummaries).toHaveLength(1);
    expect(review.thresholdSummaries[0].cladogenesisThreshold).toBe(0);

    const founderBucket = review.thresholdSummaries[0].bucketComparisons[0];
    expect(founderBucket.ageBucketLabel).toBe('founderGraceWindow');
    expect(founderBucket.founderGraceSeedResults).toHaveLength(1);
    expect(founderBucket.founderGraceSeedResults[0].finalTick).toBe(6);
    expect(founderBucket.founderGraceActiveCladeDeltaVsNullMean).toBeCloseTo(
      horizonStudy.comparison[0].founderGraceActiveCladeDeltaVsNullMean
    );
    expect(founderBucket.ecologyGateActiveCladeDeltaVsNullMean).toBeCloseTo(
      horizonStudy.comparison[0].ecologyGateActiveCladeDeltaVsNullMean
    );
    expect(founderBucket.activeCladeDeltaImprovementVsFounderGrace).toBeCloseTo(
      horizonStudy.comparison[0].activeCladeDeltaImprovementVsFounderGrace
    );

    expect(review.thresholdSummaries[0].bucketComparisons[1]).toMatchObject({
      ageBucketLabel: 'earlyMaintenance',
      founderGraceActualActiveCladesMean: 0,
      founderGraceMatchedNullActiveCladesMean: 0,
      ecologyGateActualActiveCladesMean: 0,
      ecologyGateMatchedNullActiveCladesMean: 0
    });
    expect(review.thresholdSummaries[0].bucketComparisons[2]).toMatchObject({
      ageBucketLabel: 'established100Plus',
      founderGraceActualActiveCladesMean: 0,
      founderGraceMatchedNullActiveCladesMean: 0,
      ecologyGateActualActiveCladesMean: 0,
      ecologyGateMatchedNullActiveCladesMean: 0
    });
    expect(review.bucketSummary[0].activeCladeDeltaImprovementVsFounderGrace).toBeCloseTo(
      horizonStudy.comparison[0].activeCladeDeltaImprovementVsFounderGrace
    );
  });
});

function buildTaxonHistory(
  id: number,
  firstSeenTick: number,
  activeTickRange: [number, number],
  finalTick = 10
): TaxonHistory {
  const [startTick, endTick] = activeTickRange;

  return {
    id,
    firstSeenTick,
    extinctTick: endTick < finalTick ? endTick + 1 : null,
    totalBirths: endTick - startTick + 1,
    totalDeaths: 0,
    peakPopulation: 1,
    timeline: Array.from({ length: endTick - startTick + 1 }, (_, index) => ({
      tick: startTick + index,
      population: 1,
      births: index === 0 ? 1 : 0,
      deaths: 0
    }))
  };
}
