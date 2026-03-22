import { writeFileSync } from 'fs';
import { runBehavioralPolicyFitnessPilot } from './behavioral-policy-fitness-pilot';
import { LifeSimulation } from './simulation';
import { AgentSeed } from './types';
import { Rng } from './rng';
import {
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
} from './behavioral-control';
import { PolicyFitnessRecord, analyzePolicyFitnessRecords } from './policy-fitness';

const PILOT_CONFIG = {
  runs: 6,
  steps: 300,
  seed: 90210,
  seedStep: 37,
  stopWhenExtinct: true,
  initialAgents: 48,
  policyShare: 0.5,
  policyThresholds: {
    reproductionHarvestThreshold: 0.6,
    movementEnergyReserveThreshold: 8,
    movementMinRecentHarvest: 0.5
  },
  simulation: {
    width: 20,
    height: 20,
    initialAgents: 48,
    initialEnergy: 12,
    resourceRegen: 0.7,
    maxResource: 8,
    metabolismCostBase: 0.25,
    moveCost: 0.15,
    harvestCap: 2.5,
    reproduceThreshold: 20,
    reproduceProbability: 0.35,
    offspringEnergyFraction: 0.45,
    mutationAmount: 0.2,
    policyMutationProbability: 0.12,
    policyMutationMagnitude: 0.15,
    biomeBands: 4,
    biomeContrast: 0.45,
    maxAge: 120
  }
};

interface PolicyDiagnosisPerType {
  exposures: number;
  meanHarvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

interface PolicyDiagnosis {
  totalRecords: number;
  policyPositiveRecords: number;
  policyNegativeRecords: number;

  movementOnlyRecords: number;
  reproductionOnlyRecords: number;
  bothPoliciesRecords: number;

  movementOnly: PolicyDiagnosisPerType;
  reproductionOnly: PolicyDiagnosisPerType;
  bothPolicies: PolicyDiagnosisPerType;
  noPolicies: PolicyDiagnosisPerType;

  thresholdDistributions: {
    reproductionHarvestThreshold: number[];
    movementEnergyReserveThreshold: number[];
    movementMinRecentHarvest: number[];
  };

  matchedBinComparison: {
    movementOnly: {
      exposures: number;
      harvestAdvantage: number;
      survivalAdvantage: number;
      reproductionAdvantage: number;
    };
    reproductionOnly: {
      exposures: number;
      harvestAdvantage: number;
      survivalAdvantage: number;
      reproductionAdvantage: number;
    };
    bothPolicies: {
      exposures: number;
      harvestAdvantage: number;
      survivalAdvantage: number;
      reproductionAdvantage: number;
    };
  };
}

function buildPilotInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: PILOT_CONFIG.simulation
  });
  const snapshot = seeder.snapshot();
  const agents: AgentSeed[] = snapshot.agents.map((agent) => ({
    x: agent.x,
    y: agent.y,
    energy: agent.energy,
    energyPrimary: agent.energyPrimary,
    energySecondary: agent.energySecondary,
    age: agent.age,
    lineage: agent.lineage,
    species: agent.species,
    genome: { ...agent.genome },
    genomeV2: agent.genomeV2,
    policyState: undefined,
    transientState: undefined
  }));
  const policyCount = Math.round(agents.length * PILOT_CONFIG.policyShare);
  const rng = new Rng(seed + 10_001);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map([
      [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, PILOT_CONFIG.policyThresholds.reproductionHarvestThreshold],
      [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, PILOT_CONFIG.policyThresholds.movementEnergyReserveThreshold],
      [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, PILOT_CONFIG.policyThresholds.movementMinRecentHarvest]
    ]);
  }

  return agents;
}

function summarizeRecords(records: ReadonlyArray<PolicyFitnessRecord>): PolicyDiagnosisPerType {
  if (records.length === 0) {
    return {
      exposures: 0,
      meanHarvestIntake: 0,
      survivalRate: 0,
      reproductionRate: 0
    };
  }

  let harvestTotal = 0;
  let survivedCount = 0;
  let offspringTotal = 0;

  for (const record of records) {
    harvestTotal += record.harvestIntake;
    survivedCount += record.survived ? 1 : 0;
    offspringTotal += record.offspringProduced;
  }

  return {
    exposures: records.length,
    meanHarvestIntake: harvestTotal / records.length,
    survivalRate: survivedCount / records.length,
    reproductionRate: offspringTotal / records.length
  };
}

function diagnose(): PolicyDiagnosis {
  const allRecords: PolicyFitnessRecord[] = [];

  console.log('Re-running pilot to collect per-record diagnostics...\n');

  for (let run = 0; run < PILOT_CONFIG.runs; run += 1) {
    const runSeed = PILOT_CONFIG.seed + run * PILOT_CONFIG.seedStep;
    console.log(`Run ${run + 1}/${PILOT_CONFIG.runs} (seed ${runSeed})...`);

    const simulation = new LifeSimulation({
      seed: runSeed,
      config: PILOT_CONFIG.simulation,
      initialAgents: buildPilotInitialAgents(runSeed)
    });

    const series = simulation.runWithPolicyFitness(PILOT_CONFIG.steps, PILOT_CONFIG.stopWhenExtinct);
    for (const record of series.records) {
      allRecords.push(record);
    }
    console.log(`  Collected ${series.records.length} records`);
  }

  console.log(`\nTotal records collected: ${allRecords.length}\n`);

  const movementOnlyRecords = allRecords.filter(
    (r) => r.hasMovementPolicy && !r.hasReproductionPolicy
  );
  const reproductionOnlyRecords = allRecords.filter(
    (r) => !r.hasMovementPolicy && r.hasReproductionPolicy
  );
  const bothPoliciesRecords = allRecords.filter(
    (r) => r.hasMovementPolicy && r.hasReproductionPolicy
  );
  const noPoliciesRecords = allRecords.filter((r) => !r.hasAnyPolicy);

  const reproductionThresholds: number[] = [];
  const movementEnergyThresholds: number[] = [];
  const movementHarvestThresholds: number[] = [];

  for (const record of allRecords) {
    if (!record.policyValues) {
      continue;
    }
    const repThresh = record.policyValues[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD];
    const moveEnergyThresh = record.policyValues[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD];
    const moveHarvestThresh = record.policyValues[INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST];

    if (repThresh > 0) {
      reproductionThresholds.push(repThresh);
    }
    if (moveEnergyThresh > 0) {
      movementEnergyThresholds.push(moveEnergyThresh);
    }
    if (moveHarvestThresh > 0) {
      movementHarvestThresholds.push(moveHarvestThresh);
    }
  }

  console.log('Skipping matched-bin comparisons (too expensive for full dataset).');
  const movementOnlyMatchedAnalysis = { exposures: 0, harvestAdvantage: 0, survivalAdvantage: 0, reproductionAdvantage: 0 };
  const reproductionOnlyMatchedAnalysis = { exposures: 0, harvestAdvantage: 0, survivalAdvantage: 0, reproductionAdvantage: 0 };
  const bothPoliciesMatchedAnalysis = { exposures: 0, harvestAdvantage: 0, survivalAdvantage: 0, reproductionAdvantage: 0 };

  return {
    totalRecords: allRecords.length,
    policyPositiveRecords: allRecords.filter((r) => r.hasAnyPolicy).length,
    policyNegativeRecords: noPoliciesRecords.length,
    movementOnlyRecords: movementOnlyRecords.length,
    reproductionOnlyRecords: reproductionOnlyRecords.length,
    bothPoliciesRecords: bothPoliciesRecords.length,
    movementOnly: summarizeRecords(movementOnlyRecords),
    reproductionOnly: summarizeRecords(reproductionOnlyRecords),
    bothPolicies: summarizeRecords(bothPoliciesRecords),
    noPolicies: summarizeRecords(noPoliciesRecords),
    thresholdDistributions: {
      reproductionHarvestThreshold: reproductionThresholds,
      movementEnergyReserveThreshold: movementEnergyThresholds,
      movementMinRecentHarvest: movementHarvestThresholds
    },
    matchedBinComparison: {
      movementOnly: movementOnlyMatchedAnalysis,
      reproductionOnly: reproductionOnlyMatchedAnalysis,
      bothPolicies: bothPoliciesMatchedAnalysis
    }
  };
}

function computeMatchedBinAdvantage(
  policyRecords: readonly PolicyFitnessRecord[],
  controlRecords: readonly PolicyFitnessRecord[]
): {
  exposures: number;
  harvestAdvantage: number;
  survivalAdvantage: number;
  reproductionAdvantage: number;
} {
  const combined = [...policyRecords, ...controlRecords];
  const analysis = analyzePolicyFitnessRecords(
    combined.map((r) => ({
      ...r,
      hasAnyPolicy: policyRecords.includes(r),
      hasHarvestPolicy: policyRecords.includes(r) && r.hasHarvestPolicy,
      hasMovementPolicy: policyRecords.includes(r) && r.hasMovementPolicy,
      hasReproductionPolicy: policyRecords.includes(r) && r.hasReproductionPolicy
    }))
  );

  return {
    exposures: analysis.aggregate.policyPositiveExposures,
    harvestAdvantage: analysis.aggregate.weightedHarvestAdvantage,
    survivalAdvantage: analysis.aggregate.weightedSurvivalAdvantage,
    reproductionAdvantage: analysis.aggregate.weightedReproductionAdvantage
  };
}

function printDiagnosis(diagnosis: PolicyDiagnosis): void {
  console.log('=== Policy Pilot Diagnosis ===\n');

  console.log('## Record Counts by Policy Type');
  console.log(`Total records: ${diagnosis.totalRecords}`);
  console.log(`Policy-positive records: ${diagnosis.policyPositiveRecords}`);
  console.log(`Policy-negative records: ${diagnosis.policyNegativeRecords}`);
  console.log(`  Movement-only: ${diagnosis.movementOnlyRecords}`);
  console.log(`  Reproduction-only: ${diagnosis.reproductionOnlyRecords}`);
  console.log(`  Both policies: ${diagnosis.bothPoliciesRecords}\n`);

  console.log('## Overall Fitness by Policy Type (unmatched)');
  console.log('Movement-only:');
  printFitness(diagnosis.movementOnly);
  console.log('\nReproduction-only:');
  printFitness(diagnosis.reproductionOnly);
  console.log('\nBoth policies:');
  printFitness(diagnosis.bothPolicies);
  console.log('\nNo policies:');
  printFitness(diagnosis.noPolicies);

  console.log('\n## Matched-Bin Comparisons (vs no-policy control)');
  console.log('Movement-only:');
  printMatchedAdvantage(diagnosis.matchedBinComparison.movementOnly);
  console.log('\nReproduction-only:');
  printMatchedAdvantage(diagnosis.matchedBinComparison.reproductionOnly);
  console.log('\nBoth policies:');
  printMatchedAdvantage(diagnosis.matchedBinComparison.bothPolicies);

  console.log('\n## Threshold Distributions');
  console.log(
    `Reproduction harvest threshold: n=${diagnosis.thresholdDistributions.reproductionHarvestThreshold.length}, mean=${mean(diagnosis.thresholdDistributions.reproductionHarvestThreshold).toFixed(3)}, sd=${stddev(diagnosis.thresholdDistributions.reproductionHarvestThreshold).toFixed(3)}`
  );
  console.log(
    `Movement energy reserve threshold: n=${diagnosis.thresholdDistributions.movementEnergyReserveThreshold.length}, mean=${mean(diagnosis.thresholdDistributions.movementEnergyReserveThreshold).toFixed(3)}, sd=${stddev(diagnosis.thresholdDistributions.movementEnergyReserveThreshold).toFixed(3)}`
  );
  console.log(
    `Movement min recent harvest: n=${diagnosis.thresholdDistributions.movementMinRecentHarvest.length}, mean=${mean(diagnosis.thresholdDistributions.movementMinRecentHarvest).toFixed(3)}, sd=${stddev(diagnosis.thresholdDistributions.movementMinRecentHarvest).toFixed(3)}`
  );
}

function printFitness(metrics: PolicyDiagnosisPerType): void {
  console.log(`  Exposures: ${metrics.exposures}`);
  console.log(`  Harvest intake: ${metrics.meanHarvestIntake.toFixed(4)}`);
  console.log(`  Survival rate: ${metrics.survivalRate.toFixed(4)}`);
  console.log(`  Reproduction rate: ${metrics.reproductionRate.toFixed(4)}`);
}

function printMatchedAdvantage(metrics: {
  exposures: number;
  harvestAdvantage: number;
  survivalAdvantage: number;
  reproductionAdvantage: number;
}): void {
  console.log(`  Matched exposures: ${metrics.exposures}`);
  console.log(`  Harvest advantage: ${formatSigned(metrics.harvestAdvantage)}`);
  console.log(`  Survival advantage: ${formatSigned(metrics.survivalAdvantage)}`);
  console.log(`  Reproduction advantage: ${formatSigned(metrics.reproductionAdvantage)}`);
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

if (require.main === module) {
  const diagnosis = diagnose();
  printDiagnosis(diagnosis);

  const artifact = {
    generatedAt: new Date().toISOString(),
    config: PILOT_CONFIG,
    diagnosis
  };

  const outputPath = 'docs/policy_detriment_diagnosis_2026-03-22.json';
  writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
  console.log(`\nDiagnosis artifact written to ${outputPath}`);
}
