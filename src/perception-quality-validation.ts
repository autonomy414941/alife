import { LifeSimulation } from './simulation';
import { createGenomeV2, setTrait, getTrait } from './genome-v2';

export interface PerceptionQualityValidationResult {
  timestamp: string;
  description: string;
  scenarios: PerceptionScenarioResult[];
}

export interface PerceptionScenarioResult {
  scenarioId: string;
  perfectInfoSurvival: number;
  limitedPerceptionSurvival: number;
  survivalDelta: number;
  perfectInfoDescendants: number;
  limitedPerceptionDescendants: number;
  descendantDelta: number;
  perceptionNoise: number;
  perceptionFidelity: number;
}

export function runPerceptionQualityValidation(): PerceptionQualityValidationResult {
  const scenarios: PerceptionScenarioResult[] = [];

  const perceptionConfigs = [
    { noise: 0, fidelity: 1, label: 'perfect' },
    { noise: 0.1, fidelity: 1, label: 'low_noise' },
    { noise: 0.3, fidelity: 1, label: 'moderate_noise' },
    { noise: 0, fidelity: 0.7, label: 'reduced_fidelity' },
    { noise: 0.2, fidelity: 0.8, label: 'noisy_reduced' }
  ];

  for (const config of perceptionConfigs) {
    if (config.label === 'perfect') {
      continue;
    }

    const perfectScenario = runMatchedScenario(0, 1, 1000 + scenarios.length * 10);
    const limitedScenario = runMatchedScenario(config.noise, config.fidelity, 1000 + scenarios.length * 10);

    scenarios.push({
      scenarioId: config.label,
      perfectInfoSurvival: perfectScenario.survivalRate,
      limitedPerceptionSurvival: limitedScenario.survivalRate,
      survivalDelta: limitedScenario.survivalRate - perfectScenario.survivalRate,
      perfectInfoDescendants: perfectScenario.descendants,
      limitedPerceptionDescendants: limitedScenario.descendants,
      descendantDelta: limitedScenario.descendants - perfectScenario.descendants,
      perceptionNoise: config.noise,
      perceptionFidelity: config.fidelity
    });
  }

  return {
    timestamp: new Date().toISOString(),
    description: 'Matched validation comparing perfect-information versus limited-perception movement under identical environmental conditions',
    scenarios
  };
}

interface ScenarioOutcome {
  survivalRate: number;
  descendants: number;
}

function runMatchedScenario(
  perceptionNoise: number,
  perceptionFidelity: number,
  seed: number
): ScenarioOutcome {
  const genome = createGenomeV2();
  setTrait(genome, 'metabolism', 0.5);
  setTrait(genome, 'harvest', 0.6);
  setTrait(genome, 'aggression', 0.4);
  setTrait(genome, 'perception_noise', perceptionNoise);
  setTrait(genome, 'perception_fidelity', perceptionFidelity);

  const sim = new LifeSimulation({
    seed,
    config: {
      width: 10,
      height: 10,
      maxResource: 100,
      resourceRegen: 5,
      dispersalPressure: 0.5,
      habitatPreferenceStrength: 0.3,
      metabolismCostBase: 0.5,
      moveCost: 0.2,
      harvestCap: 10,
      reproduceProbability: 0.3,
      maxAge: 30,
      speciationThreshold: 0.1
    },
    initialAgents: Array.from({ length: 5 }, (_, i) => ({
      x: i + 2,
      y: 5,
      energy: 50,
      genome: { metabolism: 0.5, harvest: 0.6, aggression: 0.4 },
      genomeV2: genome
    }))
  });

  const initialAgentIds = new Set(sim.snapshot().agents.map((a) => a.id));

  for (let tick = 0; tick < 50; tick++) {
    sim.step();
  }

  const finalSnapshot = sim.snapshot();
  const survivingInitialAgents = finalSnapshot.agents.filter((a) => initialAgentIds.has(a.id));
  const survivalRate = survivingInitialAgents.length / initialAgentIds.size;
  const descendants = finalSnapshot.agents.length;

  return {
    survivalRate,
    descendants
  };
}

if (require.main === module) {
  const result = runPerceptionQualityValidation();
  console.log(JSON.stringify(result, null, 2));
}
