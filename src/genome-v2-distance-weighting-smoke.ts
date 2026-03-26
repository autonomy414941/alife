import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { createGenomeV2, setTrait, toGenome } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed, GenomeV2DistanceWeights, SimulationConfig } from './types';

export const DEFAULT_GENOME_V2_DISTANCE_WEIGHTING_SMOKE_WEIGHTS: GenomeV2DistanceWeights = {
  categories: {
    policyThreshold: 0.15,
    policyBounded: 0.75
  }
};

const DEFAULT_STUDY_SEEDS = [4101, 4138];
const DEFAULT_STUDY_STEPS = 120;

interface DistanceWeightingSmokeScenario {
  name: string;
  config: Partial<SimulationConfig>;
}

export interface GenomeV2DistanceWeightingSmokeInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
  weights?: GenomeV2DistanceWeights;
}

export interface GenomeV2DistanceWeightingSmokeRunResult {
  seed: number;
  finalPopulation: number;
  activeSpecies: number;
  activeClades: number;
  totalSpecies: number;
  totalClades: number;
  extinctSpecies: number;
  extinctClades: number;
}

export interface GenomeV2DistanceWeightingSmokeArmResult {
  label: 'unweighted' | 'weighted';
  config: {
    genomeV2DistanceWeights?: GenomeV2DistanceWeights;
  };
  runs: GenomeV2DistanceWeightingSmokeRunResult[];
  aggregate: {
    meanFinalPopulation: number;
    meanActiveSpecies: number;
    meanActiveClades: number;
    meanTotalSpecies: number;
    meanTotalClades: number;
  };
}

export interface GenomeV2DistanceWeightingSmokeScenarioResult {
  scenario: string;
  config: Partial<SimulationConfig>;
  unweighted: GenomeV2DistanceWeightingSmokeArmResult;
  weighted: GenomeV2DistanceWeightingSmokeArmResult;
  deltas: {
    meanFinalPopulation: number;
    meanActiveSpecies: number;
    meanActiveClades: number;
    meanTotalSpecies: number;
    meanTotalClades: number;
  };
  summary: string;
}

export interface GenomeV2DistanceWeightingSmokeArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    seeds: number[];
    steps: number;
    weights: GenomeV2DistanceWeights;
  };
  scenarios: GenomeV2DistanceWeightingSmokeScenarioResult[];
  conclusion: {
    weightedReducedTotalSpeciesInAllScenarios: boolean;
    weightedReducedTotalCladesInAllScenarios: boolean;
    summary: string;
  };
}

const DEFAULT_SCENARIOS: DistanceWeightingSmokeScenario[] = [
  {
    name: 'policy-threshold-heavy',
    config: {
      mutationAmount: 0.03,
      policyMutationProbability: 1,
      policyMutationMagnitude: 1.4,
      speciationThreshold: 0.35,
      cladogenesisThreshold: 1.1
    }
  },
  {
    name: 'mixed-divergence',
    config: {
      mutationAmount: 0.16,
      policyMutationProbability: 0.65,
      policyMutationMagnitude: 0.5,
      speciationThreshold: 0.35,
      cladogenesisThreshold: 1.1
    }
  }
];

export function runGenomeV2DistanceWeightingSmoke(
  input: GenomeV2DistanceWeightingSmokeInput = {}
): GenomeV2DistanceWeightingSmokeArtifact {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seeds = input.seeds ?? DEFAULT_STUDY_SEEDS;
  const steps = input.steps ?? DEFAULT_STUDY_STEPS;
  const weights = input.weights ?? DEFAULT_GENOME_V2_DISTANCE_WEIGHTING_SMOKE_WEIGHTS;

  const scenarios = DEFAULT_SCENARIOS.map((scenario) =>
    runScenarioComparison({
      scenario,
      seeds,
      steps,
      weights
    })
  );

  const weightedReducedTotalSpeciesInAllScenarios = scenarios.every(
    (scenario) => scenario.deltas.meanTotalSpecies < 0
  );
  const weightedReducedTotalCladesInAllScenarios = scenarios.every(
    (scenario) => scenario.deltas.meanTotalClades < 0
  );

  return {
    generatedAt,
    question:
      'Do per-category genomeV2 distance weights suppress threshold-dominated taxonomic splitting while preserving some diversification under the same mutation schedules?',
    prediction:
      'If unbounded policy thresholds are dominating distance, then lowering policy-threshold weight should reduce total species/clade originations in the threshold-heavy scenario without eliminating diversification entirely.',
    config: {
      seeds: [...seeds],
      steps,
      weights
    },
    scenarios,
    conclusion: {
      weightedReducedTotalSpeciesInAllScenarios,
      weightedReducedTotalCladesInAllScenarios,
      summary: buildConclusionSummary(scenarios)
    }
  };
}

function runScenarioComparison({
  scenario,
  seeds,
  steps,
  weights
}: {
  scenario: DistanceWeightingSmokeScenario;
  seeds: number[];
  steps: number;
  weights: GenomeV2DistanceWeights;
}): GenomeV2DistanceWeightingSmokeScenarioResult {
  const unweighted = runArm({
    label: 'unweighted',
    seeds,
    steps,
    config: scenario.config
  });
  const weighted = runArm({
    label: 'weighted',
    seeds,
    steps,
    config: {
      ...scenario.config,
      genomeV2DistanceWeights: weights
    }
  });

  const deltas = {
    meanFinalPopulation: weighted.aggregate.meanFinalPopulation - unweighted.aggregate.meanFinalPopulation,
    meanActiveSpecies: weighted.aggregate.meanActiveSpecies - unweighted.aggregate.meanActiveSpecies,
    meanActiveClades: weighted.aggregate.meanActiveClades - unweighted.aggregate.meanActiveClades,
    meanTotalSpecies: weighted.aggregate.meanTotalSpecies - unweighted.aggregate.meanTotalSpecies,
    meanTotalClades: weighted.aggregate.meanTotalClades - unweighted.aggregate.meanTotalClades
  };

  return {
    scenario: scenario.name,
    config: scenario.config,
    unweighted,
    weighted,
    deltas,
    summary:
      `${scenario.name}: weighted mean total species ${formatSignedDelta(deltas.meanTotalSpecies)} ` +
      `and mean total clades ${formatSignedDelta(deltas.meanTotalClades)} versus unweighted.`
  };
}

function runArm({
  label,
  seeds,
  steps,
  config
}: {
  label: 'unweighted' | 'weighted';
  seeds: number[];
  steps: number;
  config: Partial<SimulationConfig>;
}): GenomeV2DistanceWeightingSmokeArmResult {
  const runs = seeds.map((seed) => runSimulation(seed, steps, config));

  return {
    label,
    config: {
      genomeV2DistanceWeights: config.genomeV2DistanceWeights
    },
    runs,
    aggregate: {
      meanFinalPopulation: meanOf(runs, (run) => run.finalPopulation),
      meanActiveSpecies: meanOf(runs, (run) => run.activeSpecies),
      meanActiveClades: meanOf(runs, (run) => run.activeClades),
      meanTotalSpecies: meanOf(runs, (run) => run.totalSpecies),
      meanTotalClades: meanOf(runs, (run) => run.totalClades)
    }
  };
}

function runSimulation(
  seed: number,
  steps: number,
  config: Partial<SimulationConfig>
): GenomeV2DistanceWeightingSmokeRunResult {
  const simulation = new LifeSimulation({
    seed,
    config: {
      width: 14,
      height: 14,
      initialAgents: 24,
      initialEnergy: 12,
      maxResource: 7,
      maxResource2: 7,
      resourceRegen: 0.75,
      resource2Regen: 0.75,
      metabolismCostBase: 0.24,
      moveCost: 0.12,
      harvestCap: 2.4,
      reproduceThreshold: 9,
      reproduceProbability: 0.7,
      offspringEnergyFraction: 0.5,
      maxAge: 180,
      ...config
    },
    initialAgents: buildInitialAgents(24)
  });

  simulation.run(steps);
  const snapshot = simulation.snapshot();
  const history = simulation.history();

  return {
    seed,
    finalPopulation: snapshot.population,
    activeSpecies: snapshot.activeSpecies,
    activeClades: snapshot.activeClades,
    totalSpecies: history.species.length,
    totalClades: history.clades.length,
    extinctSpecies: history.extinctSpecies,
    extinctClades: history.extinctClades
  };
}

function buildInitialAgents(count: number): AgentSeed[] {
  return Array.from({ length: count }, (_, index) => {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 0.5);
    setTrait(genomeV2, 'harvest', 0.5);
    setTrait(genomeV2, 'aggression', 0.5);
    setTrait(genomeV2, 'reproduction_harvest_threshold', 0);
    setTrait(genomeV2, 'reproduction_harvest_threshold_steepness', 1);
    setTrait(genomeV2, 'movement_energy_reserve_threshold', 0);
    setTrait(genomeV2, 'movement_min_recent_harvest', 0);
    setTrait(genomeV2, 'harvest_secondary_preference', 0.5);
    setTrait(genomeV2, 'spending_secondary_preference', 0.5);

    return {
      x: index % 14,
      y: Math.floor(index / 14),
      energy: 12,
      genome: toGenome(genomeV2),
      genomeV2
    };
  });
}

function meanOf<T>(values: T[], pick: (value: T) => number): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + pick(value), 0) / values.length;
}

function formatSignedDelta(value: number): string {
  const rounded = value.toFixed(2);
  return value > 0 ? `+${rounded}` : rounded;
}

function buildConclusionSummary(scenarios: GenomeV2DistanceWeightingSmokeScenarioResult[]): string {
  return scenarios
    .map(
      (scenario) =>
        `${scenario.scenario}: species ${formatSignedDelta(scenario.deltas.meanTotalSpecies)}, ` +
        `clades ${formatSignedDelta(scenario.deltas.meanTotalClades)}`
    )
    .join('; ');
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runGenomeV2DistanceWeightingSmoke({ generatedAt })
  );
}
