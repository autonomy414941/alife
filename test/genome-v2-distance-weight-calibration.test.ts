import { describe, it } from 'vitest';
import { runDistanceWeightCalibration, DistanceWeightCalibrationScenario, DistanceWeightCalibrationRegime } from '../src/genome-v2-distance-weight-calibration';
import { writeFileSync } from 'fs';
import { join } from 'path';

describe('Genome V2 Distance Weight Calibration', () => {
  it('calibrates distance weights across policy-heavy and mixed scenarios', () => {
    const scenarios: DistanceWeightCalibrationScenario[] = [
      {
        label: 'policy-threshold-heavy',
        description: 'High policy mutation rate and magnitude, dominated by unbounded threshold traits',
        config: {
          mutationAmount: 0.03,
          policyMutationProbability: 1.0,
          policyMutationMagnitude: 1.4,
          speciationThreshold: 0.35,
          cladogenesisThreshold: 1.1
        }
      },
      {
        label: 'mixed-divergence',
        description: 'Moderate morphology and policy mutation, more balanced trait change',
        config: {
          mutationAmount: 0.16,
          policyMutationProbability: 0.65,
          policyMutationMagnitude: 0.5,
          speciationThreshold: 0.35,
          cladogenesisThreshold: 1.1
        }
      }
    ];

    const regimes: DistanceWeightCalibrationRegime[] = [
      {
        label: 'baseline',
        description: 'All traits weighted equally (implicit 1.0)',
        weights: undefined
      },
      {
        label: 'moderate-policy-downweight',
        description: 'Policy thresholds 0.25, policy bounded 0.5, morphology implicit 1.0',
        weights: {
          categories: {
            policyThreshold: 0.25,
            policyBounded: 0.5
          }
        }
      },
      {
        label: 'strong-policy-downweight',
        description: 'Policy thresholds 0.1, policy bounded 0.3, morphology implicit 1.0',
        weights: {
          categories: {
            policyThreshold: 0.1,
            policyBounded: 0.3
          }
        }
      },
      {
        label: 'morphology-priority',
        description: 'Morphology 2.0, policy thresholds 0.2, policy bounded 0.4',
        weights: {
          categories: {
            morphology: 2.0,
            policyThreshold: 0.2,
            policyBounded: 0.4
          }
        }
      }
    ];

    const seeds = [5001, 5002];
    const steps = 120;

    const artifact = runDistanceWeightCalibration(scenarios, regimes, seeds, steps);

    const outputPath = join(process.cwd(), 'docs', 'genome_v2_distance_weight_calibration_2026-03-27.json');
    writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

    console.log('\n=== Distance Weight Calibration Results ===');
    console.log(`Question: ${artifact.question}`);
    console.log(`Hypothesis: ${artifact.hypothesis}\n`);

    console.log('Results by Scenario and Regime:');
    for (const result of artifact.results) {
      console.log(`\n  ${result.scenario} / ${result.regime}:`);
      console.log(`    Mean Total Species: ${result.aggregate.meanTotalSpecies.toFixed(1)}`);
      console.log(`    Mean Total Clades: ${result.aggregate.meanTotalClades.toFixed(1)}`);
      console.log(`    Mean Active Species: ${result.aggregate.meanActiveSpecies.toFixed(1)}`);
    }

    console.log(`\n=== Conclusion ===`);
    console.log(`Best Regime: ${artifact.conclusion.bestRegimeForPolicyInflationControl}`);
    console.log(`Reasoning: ${artifact.conclusion.reasoning}`);
    if (artifact.conclusion.recommendedDefault) {
      console.log(`Recommended Default: ${JSON.stringify(artifact.conclusion.recommendedDefault, null, 2)}`);
    }

    console.log(`\nArtifact written to: ${outputPath}`);
  }, 300000);
});
