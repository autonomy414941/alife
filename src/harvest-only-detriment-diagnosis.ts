import {
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_RUNS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STEPS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT,
  BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
  BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG
} from './behavioral-policy-fitness-pilot';
import { INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE } from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { PolicyFitnessRecord } from './policy-fitness';
import { Rng } from './rng';
import { LifeSimulation } from './simulation';
import { Agent, AgentSeed, SimulationConfig, StepSummary } from './types';

export const HARVEST_ONLY_DETRIMENT_DIAGNOSIS_ARTIFACT =
  'docs/harvest_only_detriment_diagnosis_2026-03-24.json';

const HARVEST_POLICY_SECONDARY_PREFERENCE = 0.85;
const DIAGNOSIS_SIMULATION_CONFIG: Partial<SimulationConfig> = {
  ...BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG,
  maxResource2: 8,
  resource2Regen: 0.7
};

interface AgentStepSnapshot {
  step: number;
  agentId: number;
  hasHarvestPolicy: boolean;
  harvestSecondaryPreference?: number;
  priorPrimaryReserve: number;
  priorSecondaryReserve: number;
  priorTotalReserve: number;
  priorSecondaryShare: number;
  postPrimaryReserve: number;
  postSecondaryReserve: number;
  postTotalReserve: number;
  postSecondaryShare: number;
  primaryBurned: number;
  secondaryBurned: number;
  totalBurned: number;
  secondaryBurnShare: number;
  harvestIntake: number;
  primaryHarvested: number;
  secondaryHarvested: number;
  harvestSecondaryShare: number;
  survived: boolean;
}

interface StratifiedBinSummary {
  harvestSecondaryShareBin: string;
  poolCompositionBin: string;
  harvestOnlyCount: number;
  controlCount: number;
  harvestOnlyMeanHarvest: number;
  controlMeanHarvest: number;
  harvestOnlyMeanSurvival: number;
  controlMeanSurvival: number;
  harvestOnlyMeanPostSecondaryShare: number;
  controlMeanPostSecondaryShare: number;
  harvestOnlyMeanSecondaryBurnShare: number;
  controlMeanSecondaryBurnShare: number;
  harvestDelta: number;
  survivalDelta: number;
  postSecondaryShareDelta: number;
  secondaryBurnShareDelta: number;
}

export interface HarvestOnlyDetrimentDiagnosisArtifact {
  generatedAt: string;
  question: string;
  config: {
    runs: number;
    steps: number;
    seed: number;
    seedStep: number;
    stopWhenExtinct: boolean;
    initialAgents: number;
    policyShare: number;
    harvestSecondaryPreference: number;
    simulation: Partial<SimulationConfig>;
  };
  runSummaries: Array<{
    run: number;
    seed: number;
    stepsExecuted: number;
    extinct: boolean;
    snapshotCount: number;
    harvestOnlyCount: number;
    controlCount: number;
  }>;
  stratification: {
    bins: StratifiedBinSummary[];
    secondaryResourceBins: string[];
    poolCompositionBins: string[];
  };
  diagnosis: {
    branch: 'ecological' | 'energetic' | 'mixed' | 'unclear';
    summary: string;
    evidence: string[];
  };
}

export function runHarvestOnlyDetrimentDiagnosis(input: {
  generatedAt?: string;
  runs?: number;
  steps?: number;
  seed?: number;
  seedStep?: number;
  stopWhenExtinct?: boolean;
} = {}): HarvestOnlyDetrimentDiagnosisArtifact {
  const runs = input.runs ?? 1;
  const steps = input.steps ?? 60;
  const seed = input.seed ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED;
  const seedStep = input.seedStep ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP;
  const stopWhenExtinct = input.stopWhenExtinct ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT;

  const allSnapshots: AgentStepSnapshot[] = [];
  const runSummaries: HarvestOnlyDetrimentDiagnosisArtifact['runSummaries'] = [];

  for (let run = 0; run < runs; run += 1) {
    const runSeed = seed + run * seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: DIAGNOSIS_SIMULATION_CONFIG,
      initialAgents: buildDiagnosisInitialAgents(runSeed)
    });

    const runSnapshots = captureAgentSnapshots(simulation, steps, stopWhenExtinct);
    for (const snapshot of runSnapshots) {
      allSnapshots.push(snapshot);
    }

    const finalSnapshot = simulation.snapshot();
    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: finalSnapshot.tick,
      extinct: finalSnapshot.population === 0,
      snapshotCount: runSnapshots.length,
      harvestOnlyCount: runSnapshots.filter((s) => s.hasHarvestPolicy).length,
      controlCount: runSnapshots.filter((s) => !s.hasHarvestPolicy).length
    });
  }

  const stratification = stratifySnapshots(allSnapshots);
  const diagnosis = diagnoseBranch(stratification);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Is harvest-only detriment primarily ecological (secondary-biased niches are genuinely worse) or energetic (reserve spending destroys the value of secondary harvesting)?',
    config: {
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct,
      initialAgents: BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
      policyShare: BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
      harvestSecondaryPreference: HARVEST_POLICY_SECONDARY_PREFERENCE,
      simulation: { ...DIAGNOSIS_SIMULATION_CONFIG }
    },
    runSummaries,
    stratification,
    diagnosis
  };
}

export function runHarvestOnlyDetrimentDiagnosisCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runHarvestOnlyDetrimentDiagnosis({ generatedAt }));
}

function buildDiagnosisInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: DIAGNOSIS_SIMULATION_CONFIG
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

  const policyCount = Math.round(agents.length * BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE);
  const rng = new Rng(seed + 30_024);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, HARVEST_POLICY_SECONDARY_PREFERENCE]]);
  }

  return agents;
}

function captureAgentSnapshots(
  simulation: LifeSimulation,
  maxSteps: number,
  stopWhenExtinct: boolean
): AgentStepSnapshot[] {
  const snapshots: AgentStepSnapshot[] = [];

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    const priorSnapshot = simulation.snapshot();
    if (stopWhenExtinct && priorSnapshot.population === 0) {
      break;
    }

    const priorAgents = new Map(
      priorSnapshot.agents.map((agent) => [
        agent.id,
        {
          energyPrimary: agent.energyPrimary ?? 0,
          energySecondary: agent.energySecondary ?? 0,
          energy: agent.energy,
          hasHarvestPolicy: agent.policyState?.has(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE) ?? false,
          harvestSecondaryPreference: agent.policyState?.get(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE)
        }
      ])
    );

    const summary = simulation.step();

    const postSnapshot = simulation.snapshot();

    for (const agent of postSnapshot.agents) {
      const prior = priorAgents.get(agent.id);
      if (!prior) {
        continue;
      }

      const priorTotal = prior.energyPrimary + prior.energySecondary;
      const postPrimary = agent.energyPrimary ?? 0;
      const postSecondary = agent.energySecondary ?? 0;
      const postTotal = postPrimary + postSecondary;

      const priorSecondaryShare = priorTotal > 0 ? prior.energySecondary / priorTotal : 0;
      const postSecondaryShare = postTotal > 0 ? postSecondary / postTotal : 0;

      const primaryChange = postPrimary - prior.energyPrimary;
      const secondaryChange = postSecondary - prior.energySecondary;
      const totalChange = primaryChange + secondaryChange;

      const primaryHarvested = Math.max(0, primaryChange);
      const secondaryHarvested = Math.max(0, secondaryChange);
      const harvestIntake = primaryHarvested + secondaryHarvested;
      const harvestSecondaryShare = harvestIntake > 0 ? secondaryHarvested / harvestIntake : 0;

      const primaryBurned = Math.max(0, -primaryChange);
      const secondaryBurned = Math.max(0, -secondaryChange);
      const totalBurned = primaryBurned + secondaryBurned;
      const secondaryBurnShare = totalBurned > 0 ? secondaryBurned / totalBurned : 0;

      snapshots.push({
        step: postSnapshot.tick,
        agentId: agent.id,
        hasHarvestPolicy: prior.hasHarvestPolicy,
        harvestSecondaryPreference: prior.harvestSecondaryPreference,
        priorPrimaryReserve: prior.energyPrimary,
        priorSecondaryReserve: prior.energySecondary,
        priorTotalReserve: priorTotal,
        priorSecondaryShare,
        postPrimaryReserve: postPrimary,
        postSecondaryReserve: postSecondary,
        postTotalReserve: postTotal,
        postSecondaryShare,
        primaryBurned,
        secondaryBurned,
        totalBurned,
        secondaryBurnShare,
        harvestIntake,
        primaryHarvested,
        secondaryHarvested,
        harvestSecondaryShare,
        survived: agent.energy > 0
      });
    }
  }

  return snapshots;
}

function stratifySnapshots(
  snapshots: ReadonlyArray<AgentStepSnapshot>
): HarvestOnlyDetrimentDiagnosisArtifact['stratification'] {
  const harvestSecondaryShareBins = ['low', 'medium', 'high'];
  const poolCompositionBins = ['low', 'medium', 'high'];

  const binMap = new Map<
    string,
    {
      harvestOnly: AgentStepSnapshot[];
      control: AgentStepSnapshot[];
    }
  >();

  for (const snapshot of snapshots) {
    const harvestSecondaryShareBin = binHarvestSecondaryShare(snapshot.harvestSecondaryShare);
    const poolCompositionBin = binPoolComposition(snapshot.priorSecondaryShare);
    const key = `${harvestSecondaryShareBin}:${poolCompositionBin}`;

    if (!binMap.has(key)) {
      binMap.set(key, { harvestOnly: [], control: [] });
    }

    const bin = binMap.get(key)!;
    if (snapshot.hasHarvestPolicy) {
      bin.harvestOnly.push(snapshot);
    } else {
      bin.control.push(snapshot);
    }
  }

  const bins: StratifiedBinSummary[] = [];
  for (const [key, bin] of binMap) {
    if (bin.harvestOnly.length === 0 || bin.control.length === 0) {
      continue;
    }

    const [harvestSecondaryShareBin, poolCompositionBin] = key.split(':');

    bins.push({
      harvestSecondaryShareBin,
      poolCompositionBin,
      harvestOnlyCount: bin.harvestOnly.length,
      controlCount: bin.control.length,
      harvestOnlyMeanHarvest: mean(bin.harvestOnly.map((s) => s.harvestIntake)),
      controlMeanHarvest: mean(bin.control.map((s) => s.harvestIntake)),
      harvestOnlyMeanSurvival: mean(bin.harvestOnly.map((s) => Number(s.survived))),
      controlMeanSurvival: mean(bin.control.map((s) => Number(s.survived))),
      harvestOnlyMeanPostSecondaryShare: mean(bin.harvestOnly.map((s) => s.postSecondaryShare)),
      controlMeanPostSecondaryShare: mean(bin.control.map((s) => s.postSecondaryShare)),
      harvestOnlyMeanSecondaryBurnShare: mean(bin.harvestOnly.map((s) => s.secondaryBurnShare)),
      controlMeanSecondaryBurnShare: mean(bin.control.map((s) => s.secondaryBurnShare)),
      harvestDelta: mean(bin.harvestOnly.map((s) => s.harvestIntake)) - mean(bin.control.map((s) => s.harvestIntake)),
      survivalDelta:
        mean(bin.harvestOnly.map((s) => Number(s.survived))) - mean(bin.control.map((s) => Number(s.survived))),
      postSecondaryShareDelta:
        mean(bin.harvestOnly.map((s) => s.postSecondaryShare)) - mean(bin.control.map((s) => s.postSecondaryShare)),
      secondaryBurnShareDelta:
        mean(bin.harvestOnly.map((s) => s.secondaryBurnShare)) - mean(bin.control.map((s) => s.secondaryBurnShare))
    });
  }

  return {
    bins,
    secondaryResourceBins: harvestSecondaryShareBins,
    poolCompositionBins
  };
}

function diagnoseBranch(
  stratification: HarvestOnlyDetrimentDiagnosisArtifact['stratification']
): HarvestOnlyDetrimentDiagnosisArtifact['diagnosis'] {
  const { bins } = stratification;
  const evidence: string[] = [];

  const negativeHarvestBins = bins.filter((b) => b.harvestDelta < -0.01);
  const highHarvestSecondaryBins = bins.filter((b) => b.harvestSecondaryShareBin === 'high');
  const negativeInHighSecondaryHarvest = highHarvestSecondaryBins.filter((b) => b.harvestDelta < -0.01);
  const positiveInHighSecondaryHarvest = highHarvestSecondaryBins.filter((b) => b.harvestDelta > 0.01);

  evidence.push(
    `${negativeHarvestBins.length} of ${bins.length} matched bins show negative harvest delta (< -0.01)`
  );
  evidence.push(
    `${negativeInHighSecondaryHarvest.length} of ${highHarvestSecondaryBins.length} high-secondary-harvest bins show negative harvest delta`
  );
  evidence.push(
    `${positiveInHighSecondaryHarvest.length} of ${highHarvestSecondaryBins.length} high-secondary-harvest bins show positive harvest delta (> +0.01)`
  );

  const meanPostSecondaryShareDelta = mean(bins.map((b) => b.postSecondaryShareDelta));
  const meanSecondaryBurnShareDelta = mean(bins.map((b) => b.secondaryBurnShareDelta));

  evidence.push(
    `Mean post-harvest secondary share delta: ${formatSigned(meanPostSecondaryShareDelta)} (harvest-only vs control)`
  );
  evidence.push(
    `Mean secondary burn share delta: ${formatSigned(meanSecondaryBurnShareDelta)} (harvest-only vs control)`
  );

  const highSecondaryAdvantage = positiveInHighSecondaryHarvest.length > 0 && negativeInHighSecondaryHarvest.length === 0;
  const energeticPenalty = meanPostSecondaryShareDelta > 0.05 || meanSecondaryBurnShareDelta > 0.05;

  let branch: HarvestOnlyDetrimentDiagnosisArtifact['diagnosis']['branch'];
  let summary: string;

  if (highSecondaryAdvantage && !energeticPenalty) {
    branch = 'ecological';
    summary =
      'Harvest-only detriment appears primarily ecological: when harvest-only agents successfully harvest high secondary shares, they show positive deltas without energetic penalty. The overall detriment likely arises because secondary-preferring agents often fail to find secondary-rich niches, not because secondary intake itself is harmful.';
  } else if (highSecondaryAdvantage && energeticPenalty) {
    branch = 'mixed';
    summary =
      'Harvest-only detriment appears mixed: when harvest-only agents successfully harvest high secondary shares, they show positive deltas, but elevated secondary reserve and burn shares indicate energetic inefficiency. Both niche-finding failure and downstream spending inefficiency contribute to the overall signal.';
  } else if (!highSecondaryAdvantage && energeticPenalty) {
    branch = 'energetic';
    summary =
      'Harvest-only detriment appears primarily energetic: harvest-only agents accumulate more secondary reserves and burn a higher share of secondary energy, suggesting downstream spending inefficiency rather than poor intake niches.';
  } else {
    branch = 'unclear';
    summary =
      'Harvest-only detriment mechanism remains unclear in this bounded diagnosis: high-secondary-harvest bins do not show consistent advantage, and energetic inefficiency signals are weak.';
  }

  return {
    branch,
    summary,
    evidence
  };
}

function binHarvestSecondaryShare(share: number): string {
  if (share < 0.33) {
    return 'low';
  }
  if (share < 0.67) {
    return 'medium';
  }
  return 'high';
}

function binPoolComposition(secondaryShare: number): string {
  if (secondaryShare < 0.33) {
    return 'low';
  }
  if (secondaryShare < 0.67) {
    return 'medium';
  }
  return 'high';
}

function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

if (process.argv[1]?.endsWith('harvest-only-detriment-diagnosis.ts')) {
  runHarvestOnlyDetrimentDiagnosisCli(process.argv.slice(2));
}
