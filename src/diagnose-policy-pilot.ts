import { readFileSync } from 'fs';
import { BehavioralPolicyFitnessPilotArtifact } from './behavioral-policy-fitness-pilot';

const PILOT_PATH = 'docs/behavioral_policy_fitness_pilot_2026-03-21.json';

interface PolicyDiagnostic {
  totalRecords: number;
  policyPositiveRecords: number;
  policyNegativeRecords: number;

  movementPolicyRecords: number;
  reproductionPolicyRecords: number;
  bothPoliciesRecords: number;

  movementGatedCount: number;
  reproductionGatedCount: number;

  movementGatedRate: number;
  reproductionGatedRate: number;

  perPolicyFitness: {
    movementOnly: {
      exposures: number;
      harvestIntake: number;
      survivalRate: number;
      reproductionRate: number;
    };
    reproductionOnly: {
      exposures: number;
      harvestIntake: number;
      survivalRate: number;
      reproductionRate: number;
    };
    bothPolicies: {
      exposures: number;
      harvestIntake: number;
      survivalRate: number;
      reproductionRate: number;
    };
    noPolicies: {
      exposures: number;
      harvestIntake: number;
      survivalRate: number;
      reproductionRate: number;
    };
  };

  thresholdDistributions: {
    reproductionHarvestThreshold: number[];
    movementEnergyReserveThreshold: number[];
    movementMinRecentHarvest: number[];
  };
}

function diagnosePolicy(): PolicyDiagnostic {
  const artifact = JSON.parse(readFileSync(PILOT_PATH, 'utf-8')) as BehavioralPolicyFitnessPilotArtifact;

  let totalRecords = 0;
  let policyPositiveRecords = 0;
  let policyNegativeRecords = 0;

  let movementPolicyRecords = 0;
  let reproductionPolicyRecords = 0;
  let bothPoliciesRecords = 0;

  let movementGatedCount = 0;
  let reproductionGatedCount = 0;

  const movementOnlyRecords: any[] = [];
  const reproductionOnlyRecords: any[] = [];
  const bothPoliciesRecords_: any[] = [];
  const noPoliciesRecords: any[] = [];

  const reproductionThresholds: number[] = [];
  const movementEnergyThresholds: number[] = [];
  const movementHarvestThresholds: number[] = [];

  for (const run of artifact.runs) {
    console.log(`\n=== Run ${run.run} (seed ${run.seed}) ===`);
    console.log(`Policy positive exposures: ${run.policyPositiveExposures}`);
    console.log(`Policy negative exposures: ${run.policyNegativeExposures}`);
    console.log(`Weighted harvest advantage: ${run.weightedHarvestAdvantage.toFixed(4)}`);
    console.log(`Weighted survival advantage: ${run.weightedSurvivalAdvantage.toFixed(4)}`);
    console.log(`Weighted reproduction advantage: ${run.weightedReproductionAdvantage.toFixed(4)}`);
  }

  console.log('\n\nNote: The pilot artifact does not include per-tick PolicyFitnessRecord data.');
  console.log('This analysis can only use aggregate run-level metrics from the artifact.');
  console.log('\nTo perform granular diagnosis, we need to:');
  console.log('1. Re-run the pilot with the same configuration to generate raw records');
  console.log('2. Or modify the pilot to export per-record policy flags and values');

  return {
    totalRecords: 0,
    policyPositiveRecords: artifact.overall.aggregate.policyPositiveExposures,
    policyNegativeRecords: artifact.overall.aggregate.policyNegativeExposures,
    movementPolicyRecords: 0,
    reproductionPolicyRecords: 0,
    bothPoliciesRecords: 0,
    movementGatedCount: 0,
    reproductionGatedCount: 0,
    movementGatedRate: 0,
    reproductionGatedRate: 0,
    perPolicyFitness: {
      movementOnly: {
        exposures: 0,
        harvestIntake: 0,
        survivalRate: 0,
        reproductionRate: 0
      },
      reproductionOnly: {
        exposures: 0,
        harvestIntake: 0,
        survivalRate: 0,
        reproductionRate: 0
      },
      bothPolicies: {
        exposures: 0,
        harvestIntake: 0,
        survivalRate: 0,
        reproductionRate: 0
      },
      noPolicies: {
        exposures: 0,
        harvestIntake: 0,
        survivalRate: 0,
        reproductionRate: 0
      }
    },
    thresholdDistributions: {
      reproductionHarvestThreshold: [],
      movementEnergyReserveThreshold: [],
      movementMinRecentHarvest: []
    }
  };
}

if (require.main === module) {
  diagnosePolicy();
}
