import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import { resolveSimulationConfig, LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';
import {
  analyzeTrajectoryPersistence,
  analyzeDescendantPersistence,
  TrajectorySurvivalMetrics,
  DescendantPersistenceMetrics
} from './trajectory-persistence';

export const TRAJECTORY_PERSISTENCE_ANALYSIS_ARTIFACT =
  'docs/trajectory_persistence_analysis_2026-03-31.json';

const DEFAULT_SEEDS = [9101, 9102];
const DEFAULT_STEPS = 200;

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export interface TrajectoryPersistenceAnalysisInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
}

export interface TrajectoryPersistenceRunResult {
  seed: number;
  finalPopulation: number;
  activeSpecies: number;
  activeClades: number;
  speciesPersistence: TrajectorySurvivalMetrics;
  cladePersistence: TrajectorySurvivalMetrics;
  descendantPersistence: DescendantPersistenceMetrics;
}

export interface TrajectoryPersistenceArmResult {
  label: 'policy_enabled' | 'policy_neutral';
  policyMutationProbability: number;
  runs: TrajectoryPersistenceRunResult[];
  aggregate: {
    meanSpeciesActiveDiversityAUC: number;
    meanSpeciesSurvivalRate50: number;
    meanSpeciesSurvivalRate100: number;
    meanSpeciesPersistentFraction: number;
    meanCladeActiveDiversityAUC: number;
    meanCladeSurvivalRate50: number;
    meanCladeSurvivalRate100: number;
    meanCladePersistentFraction: number;
    meanDescendantLifespan: number;
    meanOffspringProduced: number;
  };
}

export interface TrajectoryPersistenceAnalysisArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    baseConfig: Partial<SimulationConfig>;
  };
  policyEnabled: TrajectoryPersistenceArmResult;
  policyNeutral: TrajectoryPersistenceArmResult;
  delta: {
    speciesActiveDiversityAUC: number;
    speciesSurvivalRate50: number;
    speciesSurvivalRate100: number;
    speciesPersistentFraction: number;
    cladeActiveDiversityAUC: number;
    cladeSurvivalRate50: number;
    cladeSurvivalRate100: number;
    cladePersistentFraction: number;
    descendantLifespan: number;
    offspringProduced: number;
  };
  percentDelta: {
    speciesActiveDiversityAUC: number | null;
    speciesSurvivalRate50: number | null;
    speciesSurvivalRate100: number | null;
    cladeActiveDiversityAUC: number | null;
    descendantLifespan: number | null;
  };
  conclusion: {
    outcome: 'durable' | 'mixed' | 'transient';
    summary: string;
  };
}

export function runTrajectoryPersistenceAnalysis(
  input: TrajectoryPersistenceAnalysisInput = {}
): TrajectoryPersistenceAnalysisArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;

  const policyEnabled = runArm({
    label: 'policy_enabled',
    seeds,
    steps,
    policyMutationProbability: 0.65
  });

  const policyNeutral = runArm({
    label: 'policy_neutral',
    seeds,
    steps,
    policyMutationProbability: 0
  });

  const delta = {
    speciesActiveDiversityAUC:
      policyEnabled.aggregate.meanSpeciesActiveDiversityAUC - policyNeutral.aggregate.meanSpeciesActiveDiversityAUC,
    speciesSurvivalRate50:
      policyEnabled.aggregate.meanSpeciesSurvivalRate50 - policyNeutral.aggregate.meanSpeciesSurvivalRate50,
    speciesSurvivalRate100:
      policyEnabled.aggregate.meanSpeciesSurvivalRate100 - policyNeutral.aggregate.meanSpeciesSurvivalRate100,
    speciesPersistentFraction:
      policyEnabled.aggregate.meanSpeciesPersistentFraction - policyNeutral.aggregate.meanSpeciesPersistentFraction,
    cladeActiveDiversityAUC:
      policyEnabled.aggregate.meanCladeActiveDiversityAUC - policyNeutral.aggregate.meanCladeActiveDiversityAUC,
    cladeSurvivalRate50:
      policyEnabled.aggregate.meanCladeSurvivalRate50 - policyNeutral.aggregate.meanCladeSurvivalRate50,
    cladeSurvivalRate100:
      policyEnabled.aggregate.meanCladeSurvivalRate100 - policyNeutral.aggregate.meanCladeSurvivalRate100,
    cladePersistentFraction:
      policyEnabled.aggregate.meanCladePersistentFraction - policyNeutral.aggregate.meanCladePersistentFraction,
    descendantLifespan:
      policyEnabled.aggregate.meanDescendantLifespan - policyNeutral.aggregate.meanDescendantLifespan,
    offspringProduced:
      policyEnabled.aggregate.meanOffspringProduced - policyNeutral.aggregate.meanOffspringProduced
  };

  const percentDelta = {
    speciesActiveDiversityAUC: relativeDelta(
      policyEnabled.aggregate.meanSpeciesActiveDiversityAUC,
      policyNeutral.aggregate.meanSpeciesActiveDiversityAUC
    ),
    speciesSurvivalRate50: relativeDelta(
      policyEnabled.aggregate.meanSpeciesSurvivalRate50,
      policyNeutral.aggregate.meanSpeciesSurvivalRate50
    ),
    speciesSurvivalRate100: relativeDelta(
      policyEnabled.aggregate.meanSpeciesSurvivalRate100,
      policyNeutral.aggregate.meanSpeciesSurvivalRate100
    ),
    cladeActiveDiversityAUC: relativeDelta(
      policyEnabled.aggregate.meanCladeActiveDiversityAUC,
      policyNeutral.aggregate.meanCladeActiveDiversityAUC
    ),
    descendantLifespan: relativeDelta(
      policyEnabled.aggregate.meanDescendantLifespan,
      policyNeutral.aggregate.meanDescendantLifespan
    )
  };

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Are the March 30 policy-enabled diversification gains durable adaptive structure or transient churn? Do policy-linked lineages and species persist longer than policy-neutral equivalents?',
    prediction:
      'If the policy-enabled diversification gains reflect genuine adaptive structure, policy-enabled runs should show higher innovation survival rates, larger active-diversity area under curve, and longer descendant persistence. If the gains are transient churn, survival curves should collapse quickly and mean time to extinction should be similar or shorter than policy-neutral controls.',
    methodology:
      `Run matched ${steps}-step panels with ${seeds.length} shared seeds. Each arm starts from genomeV2-backed initial populations. ` +
      'The policy-enabled arm allows policy mutation (policyMutationProbability=0.65) while the control disables it. ' +
      'Collect full taxon history (species and clades) and descent edges. Analyze innovation survival curves, active-diversity area under curve, ' +
      'survival rates at 50 and 100 tick thresholds, persistent lineage fractions, and descendant lifespan and offspring production. ' +
      'Compare policy-enabled against policy-neutral to determine whether policy-linked innovations are durable or transient.',
    config: {
      seeds: [...seeds],
      steps,
      baseConfig: BASE_CONFIG
    },
    policyEnabled,
    policyNeutral,
    delta,
    percentDelta,
    conclusion: buildConclusion(delta, percentDelta)
  };
}

function runArm(input: {
  label: 'policy_enabled' | 'policy_neutral';
  seeds: number[];
  steps: number;
  policyMutationProbability: number;
}): TrajectoryPersistenceArmResult {
  const runs = input.seeds.map((seed) =>
    runSimulation(seed, input.steps, input.policyMutationProbability)
  );

  return {
    label: input.label,
    policyMutationProbability: input.policyMutationProbability,
    runs,
    aggregate: {
      meanSpeciesActiveDiversityAUC: meanOf(runs, (run) => run.speciesPersistence.activeDiversityAreaUnderCurve),
      meanSpeciesSurvivalRate50: meanOf(runs, (run) => run.speciesPersistence.survivalRate50),
      meanSpeciesSurvivalRate100: meanOf(runs, (run) => run.speciesPersistence.survivalRate100),
      meanSpeciesPersistentFraction: meanOf(runs, (run) => run.speciesPersistence.persistentLineageFraction),
      meanCladeActiveDiversityAUC: meanOf(runs, (run) => run.cladePersistence.activeDiversityAreaUnderCurve),
      meanCladeSurvivalRate50: meanOf(runs, (run) => run.cladePersistence.survivalRate50),
      meanCladeSurvivalRate100: meanOf(runs, (run) => run.cladePersistence.survivalRate100),
      meanCladePersistentFraction: meanOf(runs, (run) => run.cladePersistence.persistentLineageFraction),
      meanDescendantLifespan: meanOf(runs, (run) => run.descendantPersistence.meanDescendantLifespan),
      meanOffspringProduced: meanOf(runs, (run) => run.descendantPersistence.meanOffspringProduced)
    }
  };
}

function runSimulation(
  seed: number,
  steps: number,
  policyMutationProbability: number
): TrajectoryPersistenceRunResult {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability
    },
    initialAgents: buildInitialAgents(seed)
  });

  simulation.runWithAnalytics(steps, 40, false);
  const snapshot = simulation.snapshot();
  const history = simulation.history();

  const speciesPersistence = analyzeTrajectoryPersistence({
    taxonHistory: history.species,
    finalTick: steps
  });

  const cladePersistence = analyzeTrajectoryPersistence({
    taxonHistory: history.clades,
    finalTick: steps
  });

  const descendantPersistence = analyzeDescendantPersistence({
    descentEdges: history.descentEdges ?? [],
    finalTick: steps
  });

  return {
    seed,
    finalPopulation: snapshot.population,
    activeSpecies: snapshot.activeSpecies,
    activeClades: snapshot.activeClades,
    speciesPersistence,
    cladePersistence,
    descendantPersistence
  };
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

function relativeDelta(value: number, baseline: number): number | null {
  if (baseline === 0) {
    return value === 0 ? 0 : null;
  }
  return ((value - baseline) / Math.abs(baseline)) * 100;
}

function meanOf<T>(values: T[], pick: (value: T) => number): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + pick(value), 0) / values.length;
}

function buildConclusion(
  delta: TrajectoryPersistenceAnalysisArtifact['delta'],
  percentDelta: TrajectoryPersistenceAnalysisArtifact['percentDelta']
): TrajectoryPersistenceAnalysisArtifact['conclusion'] {
  const durableSignals = [
    delta.speciesActiveDiversityAUC > 0,
    delta.speciesSurvivalRate50 > 0,
    delta.speciesSurvivalRate100 > 0,
    delta.speciesPersistentFraction > 0,
    delta.cladeActiveDiversityAUC > 0,
    delta.descendantLifespan > 0
  ].filter(Boolean).length;

  const transientSignals = [
    delta.speciesActiveDiversityAUC < 0,
    delta.speciesSurvivalRate50 < 0,
    delta.speciesSurvivalRate100 < 0,
    delta.speciesPersistentFraction < 0,
    delta.cladeActiveDiversityAUC < 0,
    delta.descendantLifespan < 0
  ].filter(Boolean).length;

  const outcome =
    durableSignals > 0 && transientSignals === 0
      ? 'durable'
      : transientSignals > 0 && durableSignals === 0
        ? 'transient'
        : 'mixed';

  return {
    outcome,
    summary:
      `Species AUC ${formatSigned(delta.speciesActiveDiversityAUC)} (${formatPercent(percentDelta.speciesActiveDiversityAUC)}), ` +
      `species 50-tick survival ${formatSigned(delta.speciesSurvivalRate50)} (${formatPercent(percentDelta.speciesSurvivalRate50)}), ` +
      `species 100-tick survival ${formatSigned(delta.speciesSurvivalRate100)} (${formatPercent(percentDelta.speciesSurvivalRate100)}), ` +
      `species persistent fraction ${formatSigned(delta.speciesPersistentFraction)}, ` +
      `clade AUC ${formatSigned(delta.cladeActiveDiversityAUC)} (${formatPercent(percentDelta.cladeActiveDiversityAUC)}), ` +
      `descendant lifespan ${formatSigned(delta.descendantLifespan)} (${formatPercent(percentDelta.descendantLifespan)}).`
  };
}

function formatSigned(value: number): string {
  const rounded = value.toFixed(4);
  return value > 0 ? `+${rounded}` : rounded;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return 'n/a';
  }
  const rounded = value.toFixed(1);
  return value > 0 ? `+${rounded}%` : `${rounded}%`;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runTrajectoryPersistenceAnalysis({ generatedAt })
  );
}
