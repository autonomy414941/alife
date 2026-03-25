import { describe, expect, it } from 'vitest';
import {
  parseGradedReproductionBaseline,
  runPolicyGenomeUnificationRevalidation
} from '../src/policy-genome-unification-revalidation';

const GRADED_BASELINE_TEXT = `Running graded reproduction policy smoke test...

Steepness | Threshold | Final Pop | Total Births | Policy Fraction | Gated Fraction
----------|-----------|-----------|--------------|-----------------|---------------
      0.0 |       2.0 |        30 |            0 |          1.0000 |         1.0000
      1.0 |       2.0 |      2079 |         2049 |          1.0000 |         0.1232
      5.0 |       2.0 |       233 |          203 |          1.0000 |         0.7225
`;

const SPENDING_BASELINE_JSON = JSON.stringify({
  generatedAt: '2026-03-24T00:00:00.000Z',
  question: 'baseline',
  prediction: 'baseline',
  config: {
    steps: 6,
    initialPools: { primary: 6, secondary: 6 },
    intakePerStep: { primary: 1, secondary: 2 },
    spendPerStep: 2.5
  },
  arms: [
    {
      label: 'control',
      cumulativePrimarySpent: 6,
      cumulativeSecondarySpent: 9,
      finalPrimary: 6,
      finalSecondary: 9,
      finalSecondaryShare: 0.6
    },
    {
      label: 'primary_biased',
      spendingSecondaryPreference: 0,
      cumulativePrimarySpent: 12,
      cumulativeSecondarySpent: 3,
      finalPrimary: 0,
      finalSecondary: 15,
      finalSecondaryShare: 1
    },
    {
      label: 'secondary_biased',
      spendingSecondaryPreference: 1,
      cumulativePrimarySpent: 0,
      cumulativeSecondarySpent: 15,
      finalPrimary: 12,
      finalSecondary: 3,
      finalSecondaryShare: 0.2
    }
  ],
  interpretation: {
    primaryBiasedRetainsMoreSecondary: true,
    secondaryBiasedBurnsMoreSecondary: true,
    summary: 'baseline'
  }
});

const ROBUSTNESS_BASELINE_JSON = JSON.stringify({
  generatedAt: '2026-03-24',
  question: 'baseline',
  prediction: 'baseline',
  config: {
    runs: 1,
    steps: 10,
    seed: 1,
    seedStep: 1,
    stopWhenExtinct: true,
    initialAgents: 10,
    policyShare: 0.5,
    reproductionHarvestThreshold: 0.6,
    simulation: {}
  },
  runs: [],
  overall: {
    policyMetrics: {
      exposures: 10,
      meanHarvestIntake: 0.4,
      survivalRate: 1,
      reproductionRate: 0.02,
      movementPolicyGatedRate: 0,
      reproductionPolicyGatedRate: 0.1,
      harvestPolicyGuidedRate: 0
    },
    controlMetrics: {
      exposures: 10,
      meanHarvestIntake: 0.35,
      survivalRate: 1,
      reproductionRate: 0.01,
      movementPolicyGatedRate: 0,
      reproductionPolicyGatedRate: 0,
      harvestPolicyGuidedRate: 0
    },
    matchedComparison: {
      matchedBins: 2,
      weightedHarvestAdvantage: 0.04,
      weightedSurvivalAdvantage: 0,
      weightedReproductionAdvantage: 0.001
    }
  },
  support: {
    harvestAdvantagePositiveRunFraction: 1,
    survivalAdvantagePositiveRunFraction: 0,
    reproductionAdvantagePositiveRunFraction: 1
  },
  conclusion: {
    signal: 'mixed',
    summary: 'baseline'
  }
});

describe('policy-genome-unification-revalidation', () => {
  it('parses the historical graded reproduction smoke table', () => {
    expect(parseGradedReproductionBaseline(GRADED_BASELINE_TEXT)).toEqual([
      {
        steepness: 0,
        threshold: 2,
        finalPopulation: 30,
        totalBirths: 0,
        reproductionPolicyAgentFraction: 1,
        reproductionDecisionGatedFraction: 1
      },
      {
        steepness: 1,
        threshold: 2,
        finalPopulation: 2079,
        totalBirths: 2049,
        reproductionPolicyAgentFraction: 1,
        reproductionDecisionGatedFraction: 0.1232
      },
      {
        steepness: 5,
        threshold: 2,
        finalPopulation: 233,
        totalBirths: 203,
        reproductionPolicyAgentFraction: 1,
        reproductionDecisionGatedFraction: 0.7225
      }
    ]);
  });

  it('builds a preserved comparison artifact from injected bounded studies', () => {
    const artifact = runPolicyGenomeUnificationRevalidation(
      {
        generatedAt: '2026-03-25T00:00:00.000Z',
        reproductionRobustness: {
          runs: 1,
          steps: 10
        }
      },
      {
        readTextFile: (path) => {
          if (path.endsWith('graded_reproduction_policy_smoke_2026-03-24.txt')) {
            return GRADED_BASELINE_TEXT;
          }
          if (path.endsWith('substrate_spending_policy_smoke_2026-03-24.json')) {
            return SPENDING_BASELINE_JSON;
          }
          if (path.endsWith('reproduction_policy_robustness_stress_test_2026-03-24.json')) {
            return ROBUSTNESS_BASELINE_JSON;
          }
          throw new Error(`Unexpected path ${path}`);
        },
        runGradedReproductionSmoke: () => parseGradedReproductionBaseline(GRADED_BASELINE_TEXT),
        runSubstrateSpendingSmoke: () => JSON.parse(SPENDING_BASELINE_JSON),
        runReproductionRobustness: () => JSON.parse(ROBUSTNESS_BASELINE_JSON)
      }
    );

    expect(artifact.generatedAt).toBe('2026-03-25T00:00:00.000Z');
    expect(artifact.architectureChecks.reproductionPolicyFlagsRecognizeGenomeTraits).toBe(true);
    expect(artifact.architectureChecks.spendingPreferenceResolvesFromGenomeTraits).toBe(true);
    expect(artifact.validations.gradedReproduction.status).toBe('preserved');
    expect(artifact.validations.substrateSpending.status).toBe('preserved');
    expect(artifact.validations.reproductionRobustness.status).toBe('preserved');
    expect(artifact.conclusion).toMatchObject({
      preservedCount: 3,
      improvedCount: 0,
      degradedCount: 0
    });
  });
});
