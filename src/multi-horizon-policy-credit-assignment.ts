import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import { PolicyFitnessRecord } from './policy-fitness';
import { classifyPolicySignature, PolicySignature } from './policy-signature';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export const MULTI_HORIZON_POLICY_CREDIT_ASSIGNMENT_ARTIFACT =
  'docs/multi_horizon_policy_credit_assignment_2026-04-02.json';

const DEFAULT_SEEDS = [9201, 9202];
const DEFAULT_STEPS = 120;
const POLICY_MUTATION_PROBABILITY = 0.65;
const HORIZONS = [1, 5, 20, 50];

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

interface HorizonOutcome {
  survived: boolean;
  reproduced: boolean;
}

interface ExposureWithHorizons {
  record: PolicyFitnessRecord;
  horizons: Map<number, HorizonOutcome>;
}

interface HorizonMetrics {
  exposures: number;
  meanHarvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
}

interface HorizonComparison {
  policyPositive: HorizonMetrics;
  policyNegative: HorizonMetrics;
  delta: {
    harvestIntake: number;
    survivalRate: number;
    reproductionRate: number;
  };
}

interface SignatureHorizonSummary {
  signature: PolicySignature;
  runs: {
    seed: number;
    coupledExposures: number;
    decoupledExposures: number;
    horizons: Record<number, {
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }>;
  }[];
  overall: {
    matchedBins: number;
    horizons: Record<number, {
      policyPositiveExposures: number;
      policyNegativeExposures: number;
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }>;
  };
}

export interface MultiHorizonPolicyCreditAssignmentArtifact {
  generatedAt: string;
  question: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    horizons: number[];
    policyMutationProbability: number;
    baseConfig: Partial<SimulationConfig>;
  };
  signatures: SignatureHorizonSummary[];
  interpretation: {
    summary: string;
    positiveHorizonEffects: Array<{
      signature: string;
      horizon: number;
      metric: string;
      advantage: number;
    }>;
  };
}

export function runMultiHorizonPolicyCreditAssignment(input: {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
} = {}): MultiHorizonPolicyCreditAssignmentArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const signatureData = new Map<
    string,
    {
      signature: PolicySignature;
      runs: Array<{
        seed: number;
        coupled: ExposureWithHorizons[];
        decoupled: ExposureWithHorizons[];
      }>;
    }
  >();

  for (const seed of seeds) {
    const coupledExposures = runSimulationWithHorizons(seed, steps, true);
    const decoupledExposures = runSimulationWithHorizons(seed, steps, false);

    const runSignatureData = new Map<
      string,
      {
        coupled: ExposureWithHorizons[];
        decoupled: ExposureWithHorizons[];
      }
    >();

    for (const exposure of coupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      if (!runSignatureData.has(signature.key)) {
        runSignatureData.set(signature.key, { coupled: [], decoupled: [] });
        if (!signatureData.has(signature.key)) {
          signatureData.set(signature.key, { signature, runs: [] });
        }
      }
      runSignatureData.get(signature.key)!.coupled.push(exposure);
    }

    for (const exposure of decoupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      if (!runSignatureData.has(signature.key)) {
        runSignatureData.set(signature.key, { coupled: [], decoupled: [] });
        if (!signatureData.has(signature.key)) {
          signatureData.set(signature.key, { signature, runs: [] });
        }
      }
      runSignatureData.get(signature.key)!.decoupled.push(exposure);
    }

    for (const [signatureKey, runData] of runSignatureData.entries()) {
      signatureData.get(signatureKey)!.runs.push({
        seed,
        coupled: runData.coupled,
        decoupled: runData.decoupled
      });
    }
  }

  const signatures = Array.from(signatureData.values())
    .map((data) => buildSignatureHorizonSummary(data))
    .sort((left, right) => {
      const leftExposures =
        left.overall.horizons[1].policyPositiveExposures + left.overall.horizons[1].policyNegativeExposures;
      const rightExposures =
        right.overall.horizons[1].policyPositiveExposures + right.overall.horizons[1].policyNegativeExposures;
      return rightExposures - leftExposures;
    });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does multi-horizon credit assignment (+5, +20, +50 tick survival and reproduction windows) reveal positive policy effects that remain invisible under one-tick scoring?',
    methodology:
      `Run ${steps}-step matched-control panels for ${seeds.length} shared seeds with policyMutationProbability=${POLICY_MUTATION_PROBABILITY}. ` +
      'Both arms start from the same genomeV2-backed population with neutral policy loci present. ' +
      `For each agent exposure at tick T, track survival and reproduction at horizons ${HORIZONS.join(', ')} ticks forward. ` +
      'Within matched fertility, crowding, age, and disturbance bins, compare policy-coupled versus policy-decoupled exposures across all horizons.',
    config: {
      seeds: [...seeds],
      steps,
      horizons: [...HORIZONS],
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      baseConfig: BASE_CONFIG
    },
    signatures,
    interpretation: buildInterpretation(signatures)
  };
}

function runSimulationWithHorizons(seed: number, steps: number, policyCouplingEnabled: boolean): ExposureWithHorizons[] {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    },
    initialAgents: buildInitialAgents(seed),
    policyCouplingEnabled
  });

  const recordsByTick: PolicyFitnessRecord[][] = [];
  const agentIdsByTick: Map<number, PolicyFitnessRecord>[] = [];

  for (let tick = 0; tick < steps; tick += 1) {
    simulation.step();
    const records = simulation.policyFitnessRecords();
    recordsByTick.push(records);
    const agentMap = new Map<number, PolicyFitnessRecord>();
    for (const record of records) {
      agentMap.set(record.agentId, record);
    }
    agentIdsByTick.push(agentMap);
  }

  const exposures: ExposureWithHorizons[] = [];

  for (let tick = 0; tick < recordsByTick.length; tick += 1) {
    const records = recordsByTick[tick];

    for (const record of records) {
      const horizons = new Map<number, HorizonOutcome>();

      for (const horizon of HORIZONS) {
        const futureTick = tick + horizon;
        if (futureTick >= agentIdsByTick.length) {
          horizons.set(horizon, { survived: false, reproduced: false });
          continue;
        }

        const futureRecord = agentIdsByTick[futureTick].get(record.agentId);
        const survived = futureRecord !== undefined;
        const reproduced = futureRecord !== undefined && futureRecord.offspringProduced > 0;

        horizons.set(horizon, { survived, reproduced });
      }

      exposures.push({ record, horizons });
    }
  }

  return exposures;
}

function buildInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: BASE_CONFIG
  });

  return seeder.snapshot().agents.map((agent) => {
    const genomeV2 = fromGenome(agent.genome);
    for (const key of POLICY_TRAITS) {
      setTrait(genomeV2, key, DEFAULT_TRAIT_VALUES[key] ?? 0);
    }

    return {
      x: agent.x,
      y: agent.y,
      energy: agent.energy,
      energyPrimary: agent.energyPrimary,
      energySecondary: agent.energySecondary,
      age: agent.age,
      lineage: agent.lineage,
      species: agent.species,
      genome: { ...agent.genome },
      genomeV2
    };
  });
}

function buildSignatureHorizonSummary(data: {
  signature: PolicySignature;
  runs: Array<{
    seed: number;
    coupled: ExposureWithHorizons[];
    decoupled: ExposureWithHorizons[];
  }>;
}): SignatureHorizonSummary {
  const runs = data.runs.map((run) => {
    const horizonMetrics: Record<number, {
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }> = {};

    for (const horizon of HORIZONS) {
      const comparison = compareArmsAtHorizon(run.coupled, run.decoupled, horizon);
      horizonMetrics[horizon] = {
        weightedHarvestAdvantage: comparison.weightedHarvestAdvantage,
        weightedSurvivalAdvantage: comparison.weightedSurvivalAdvantage,
        weightedReproductionAdvantage: comparison.weightedReproductionAdvantage
      };
    }

    return {
      seed: run.seed,
      coupledExposures: run.coupled.length,
      decoupledExposures: run.decoupled.length,
      horizons: horizonMetrics
    };
  });

  const allCoupled = data.runs.flatMap((run) => run.coupled);
  const allDecoupled = data.runs.flatMap((run) => run.decoupled);

  const overallHorizons: Record<number, {
    policyPositiveExposures: number;
    policyNegativeExposures: number;
    weightedHarvestAdvantage: number;
    weightedSurvivalAdvantage: number;
    weightedReproductionAdvantage: number;
  }> = {};

  const matchedBins = compareArmsAtHorizon(allCoupled, allDecoupled, 1).matchedBins;

  for (const horizon of HORIZONS) {
    const comparison = compareArmsAtHorizon(allCoupled, allDecoupled, horizon);
    overallHorizons[horizon] = {
      policyPositiveExposures: allCoupled.length,
      policyNegativeExposures: allDecoupled.length,
      weightedHarvestAdvantage: comparison.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: comparison.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: comparison.weightedReproductionAdvantage
    };
  }

  return {
    signature: data.signature,
    runs,
    overall: {
      matchedBins,
      horizons: overallHorizons
    }
  };
}

function compareArmsAtHorizon(
  coupledExposures: ExposureWithHorizons[],
  decoupledExposures: ExposureWithHorizons[],
  horizon: number
): {
  matchedBins: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
} {
  const bins = new Map<
    string,
    {
      coupled: ExposureWithHorizons[];
      decoupled: ExposureWithHorizons[];
    }
  >();

  for (const exposure of coupledExposures) {
    const record = exposure.record;
    const key = `${record.fertilityBin}:${record.crowdingBin}:${record.ageBin}:${record.disturbancePhase}`;
    if (!bins.has(key)) {
      bins.set(key, { coupled: [], decoupled: [] });
    }
    bins.get(key)!.coupled.push(exposure);
  }

  for (const exposure of decoupledExposures) {
    const record = exposure.record;
    const key = `${record.fertilityBin}:${record.crowdingBin}:${record.ageBin}:${record.disturbancePhase}`;
    if (!bins.has(key)) {
      bins.set(key, { coupled: [], decoupled: [] });
    }
    bins.get(key)!.decoupled.push(exposure);
  }

  let totalWeight = 0;
  let weightedHarvest = 0;
  let weightedSurvival = 0;
  let weightedReproduction = 0;
  let matchedBins = 0;

  for (const bin of bins.values()) {
    if (bin.coupled.length === 0 || bin.decoupled.length === 0) {
      continue;
    }

    matchedBins += 1;
    const weight = Math.min(bin.coupled.length, bin.decoupled.length);

    const coupledMetrics = summarizeHorizonMetrics(bin.coupled, horizon);
    const decoupledMetrics = summarizeHorizonMetrics(bin.decoupled, horizon);

    totalWeight += weight;
    weightedHarvest += weight * (coupledMetrics.meanHarvestIntake - decoupledMetrics.meanHarvestIntake);
    weightedSurvival += weight * (coupledMetrics.survivalRate - decoupledMetrics.survivalRate);
    weightedReproduction += weight * (coupledMetrics.reproductionRate - decoupledMetrics.reproductionRate);
  }

  return {
    matchedBins,
    weightedHarvestAdvantage: totalWeight === 0 ? 0 : weightedHarvest / totalWeight,
    weightedSurvivalAdvantage: totalWeight === 0 ? 0 : weightedSurvival / totalWeight,
    weightedReproductionAdvantage: totalWeight === 0 ? 0 : weightedReproduction / totalWeight
  };
}

function summarizeHorizonMetrics(exposures: ExposureWithHorizons[], horizon: number): HorizonMetrics {
  if (exposures.length === 0) {
    return {
      exposures: 0,
      meanHarvestIntake: 0,
      survivalRate: 0,
      reproductionRate: 0
    };
  }

  let harvestTotal = 0;
  let survivalTotal = 0;
  let reproductionTotal = 0;

  for (const exposure of exposures) {
    harvestTotal += exposure.record.harvestIntake;
    const outcome = exposure.horizons.get(horizon);
    if (outcome) {
      survivalTotal += outcome.survived ? 1 : 0;
      reproductionTotal += outcome.reproduced ? 1 : 0;
    }
  }

  return {
    exposures: exposures.length,
    meanHarvestIntake: harvestTotal / exposures.length,
    survivalRate: survivalTotal / exposures.length,
    reproductionRate: reproductionTotal / exposures.length
  };
}

function buildInterpretation(
  signatures: SignatureHorizonSummary[]
): MultiHorizonPolicyCreditAssignmentArtifact['interpretation'] {
  const positiveHorizonEffects: Array<{
    signature: string;
    horizon: number;
    metric: string;
    advantage: number;
  }> = [];

  for (const signature of signatures) {
    for (const horizon of HORIZONS) {
      const metrics = signature.overall.horizons[horizon];
      if (metrics.weightedSurvivalAdvantage > 0) {
        positiveHorizonEffects.push({
          signature: signature.signature.key,
          horizon,
          metric: 'survival',
          advantage: metrics.weightedSurvivalAdvantage
        });
      }
      if (metrics.weightedReproductionAdvantage > 0) {
        positiveHorizonEffects.push({
          signature: signature.signature.key,
          horizon,
          metric: 'reproduction',
          advantage: metrics.weightedReproductionAdvantage
        });
      }
    }
  }

  positiveHorizonEffects.sort((left, right) => right.advantage - left.advantage);

  const summary =
    positiveHorizonEffects.length > 0
      ? `Found ${positiveHorizonEffects.length} positive multi-horizon effects. Top: ${positiveHorizonEffects[0].signature} at horizon=${positiveHorizonEffects[0].horizon} (${positiveHorizonEffects[0].metric}=${positiveHorizonEffects[0].advantage.toFixed(4)}).`
      : 'No positive multi-horizon effects detected. Policy-bearing cohorts show no survival or reproduction advantages at any horizon.';

  return {
    summary,
    positiveHorizonEffects: positiveHorizonEffects.slice(0, 10)
  };
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runMultiHorizonPolicyCreditAssignment({ generatedAt })
  );
}
