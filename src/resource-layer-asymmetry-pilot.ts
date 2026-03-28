import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation } from './simulation';
import { SimulationConfig } from './types';

export const RESOURCE_LAYER_ASYMMETRY_PILOT_ARTIFACT =
  'docs/resource_layer_asymmetry_pilot_2026-03-28.json';

export interface ResourceLayerAsymmetryPilotInput {
  generatedAt?: string;
  steps?: number;
}

export interface ResourceLayerAvailabilityPoint {
  tick: number;
  primaryTotal: number;
  secondaryTotal: number;
  totalDelta: number;
  meanAbsoluteCellDelta: number;
}

export interface ResourceLayerAsymmetryPilotScenarioResult {
  label: 'mirrored' | 'asymmetric';
  config: Partial<SimulationConfig>;
  trajectory: ResourceLayerAvailabilityPoint[];
  maxAbsoluteTotalDelta: number;
  maxMeanAbsoluteCellDelta: number;
  summary: string;
}

export interface ResourceLayerAsymmetryPilotArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    baseConfig: Partial<SimulationConfig>;
  };
  scenarios: ResourceLayerAsymmetryPilotScenarioResult[];
  conclusion: {
    mirroredStaysMatched: boolean;
    asymmetricBreaksMirroring: boolean;
    summary: string;
  };
}

const DEFAULT_STEPS = 6;

const BASE_CONFIG: Partial<SimulationConfig> = {
  width: 8,
  height: 8,
  maxResource: 120,
  maxResource2: 120,
  resourceRegen: 1,
  resource2Regen: 1,
  seasonalCycleLength: 4,
  seasonalRegenAmplitude: 0.35,
  seasonalFertilityContrastAmplitude: 0.5,
  biomeBands: 4,
  biomeContrast: 0.8,
  decompositionBase: 0,
  decompositionEnergyFraction: 0,
  initialAgents: 0,
  reproduceProbability: 0,
  maxAge: 100
};

const ASYMMETRIC_CONFIG: Partial<SimulationConfig> = {
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export function runResourceLayerAsymmetryPilot(
  input: ResourceLayerAsymmetryPilotInput = {}
): ResourceLayerAsymmetryPilotArtifact {
  const steps = input.steps ?? DEFAULT_STEPS;
  const mirrored = runScenario('mirrored', steps, {});
  const asymmetric = runScenario('asymmetric', steps, ASYMMETRIC_CONFIG);

  const mirroredStaysMatched = mirrored.maxAbsoluteTotalDelta === 0 && mirrored.maxMeanAbsoluteCellDelta === 0;
  const asymmetricBreaksMirroring =
    asymmetric.maxAbsoluteTotalDelta > 0 || asymmetric.maxMeanAbsoluteCellDelta > 0;

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Do opt-in secondary-layer regeneration controls produce substrate availability that is no longer mirrored to the primary layer?',
    prediction:
      'If the secondary layer gets its own spatial offset and seasonal forcing, mirrored controls should stay matched while the asymmetric arm should diverge in both total availability and per-cell distribution.',
    config: {
      steps,
      baseConfig: BASE_CONFIG
    },
    scenarios: [mirrored, asymmetric],
    conclusion: {
      mirroredStaysMatched,
      asymmetricBreaksMirroring,
      summary:
        `Mirrored max total delta ${mirrored.maxAbsoluteTotalDelta.toFixed(3)} and mean cell delta ${mirrored.maxMeanAbsoluteCellDelta.toFixed(3)}; ` +
        `asymmetric max total delta ${asymmetric.maxAbsoluteTotalDelta.toFixed(3)} and mean cell delta ${asymmetric.maxMeanAbsoluteCellDelta.toFixed(3)}.`
    }
  };
}

export function runResourceLayerAsymmetryPilotCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runResourceLayerAsymmetryPilot({ generatedAt }));
}

function runScenario(
  label: 'mirrored' | 'asymmetric',
  steps: number,
  config: Partial<SimulationConfig>
): ResourceLayerAsymmetryPilotScenarioResult {
  const simulation = new LifeSimulation({
    seed: 28032026,
    config: {
      ...BASE_CONFIG,
      ...config
    },
    initialAgents: []
  });

  clearResources(simulation, BASE_CONFIG.width ?? 0, BASE_CONFIG.height ?? 0);

  const trajectory: ResourceLayerAvailabilityPoint[] = [];
  for (let step = 0; step < steps; step += 1) {
    simulation.step();
    trajectory.push(sampleAvailability(simulation, BASE_CONFIG.width ?? 0, BASE_CONFIG.height ?? 0));
  }

  const maxAbsoluteTotalDelta = maxOf(trajectory.map((point) => Math.abs(point.totalDelta)));
  const maxMeanAbsoluteCellDelta = maxOf(trajectory.map((point) => point.meanAbsoluteCellDelta));

  return {
    label,
    config,
    trajectory,
    maxAbsoluteTotalDelta,
    maxMeanAbsoluteCellDelta,
    summary:
      `${label}: max total delta ${maxAbsoluteTotalDelta.toFixed(3)}, ` +
      `max mean per-cell delta ${maxMeanAbsoluteCellDelta.toFixed(3)}.`
  };
}

function clearResources(simulation: LifeSimulation, width: number, height: number): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      simulation.setResource(x, y, 0);
      simulation.setResource2(x, y, 0);
    }
  }
}

function sampleAvailability(
  simulation: LifeSimulation,
  width: number,
  height: number
): ResourceLayerAvailabilityPoint {
  let primaryTotal = 0;
  let secondaryTotal = 0;
  let absoluteDeltaTotal = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const primary = simulation.getResource(x, y);
      const secondary = simulation.getResource2(x, y);
      primaryTotal += primary;
      secondaryTotal += secondary;
      absoluteDeltaTotal += Math.abs(primary - secondary);
    }
  }

  const cellCount = width * height;
  return {
    tick: simulation.snapshot().tick,
    primaryTotal,
    secondaryTotal,
    totalDelta: secondaryTotal - primaryTotal,
    meanAbsoluteCellDelta: cellCount === 0 ? 0 : absoluteDeltaTotal / cellCount
  };
}

function maxOf(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

if (process.argv[1]?.endsWith('resource-layer-asymmetry-pilot.ts')) {
  runResourceLayerAsymmetryPilotCli(process.argv.slice(2));
}
