import { LifeSimulation } from './simulation';
import { Agent } from './types';
import { createGenomeV2, setTrait } from './genome-v2';
import {
  ACTION_PRIORITY_HARVEST_PRIMARY,
  ACTION_PRIORITY_HARVEST_SECONDARY,
  ACTION_PRIORITY_MOVE_TOWARD_FERTILITY,
  ACTION_THRESHOLD_HARVEST_PRIMARY
} from './action-selection';

interface ActionSelectionPilotConfig {
  seeds: number[];
  maxTicks: number;
  initialAgentsPerSeed: number;
}

interface CohortMetrics {
  finalPopulation: number;
  avgEnergy: number;
  activeSpecies: number;
  activeClades: number;
}

interface ActionSelectionPilotResult {
  config: ActionSelectionPilotConfig;
  actionSelectionCohort: CohortMetrics;
  gradedModulationCohort: CohortMetrics;
  deltaPopulation: number;
  deltaEnergy: number;
  deltaSpecies: number;
  deltaClades: number;
}

function createActionSelectionAgents(seed: number, count: number): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < count; i++) {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 0.6);
    setTrait(genomeV2, 'harvest', 0.6);
    setTrait(genomeV2, 'aggression', 0.4);
    setTrait(genomeV2, 'harvestEfficiency2', 0.5);
    setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.7);
    setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.3);
    setTrait(genomeV2, ACTION_PRIORITY_MOVE_TOWARD_FERTILITY, 0.5);
    setTrait(genomeV2, ACTION_THRESHOLD_HARVEST_PRIMARY, 5);

    agents.push({
      id: i + 1,
      species: i + 1,
      lineage: i + 1,
      x: 10 + (i % 10),
      y: 10 + Math.floor(i / 10),
      energy: 50,
      energyPrimary: 50,
      energySecondary: 0,
      age: 0,
      genome: {
        metabolism: 0.6,
        harvest: 0.6,
        aggression: 0.4,
        harvestEfficiency2: 0.5
      },
      genomeV2,
      policyState: undefined,
      transientState: new Map()
    });
  }
  return agents;
}

function createGradedModulationAgents(seed: number, count: number): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < count; i++) {
    const genomeV2 = createGenomeV2();
    setTrait(genomeV2, 'metabolism', 0.6);
    setTrait(genomeV2, 'harvest', 0.6);
    setTrait(genomeV2, 'aggression', 0.4);
    setTrait(genomeV2, 'harvestEfficiency2', 0.5);
    setTrait(genomeV2, 'harvest_secondary_preference', 0.5);

    agents.push({
      id: i + 1,
      species: i + 1,
      lineage: i + 1,
      x: 10 + (i % 10),
      y: 10 + Math.floor(i / 10),
      energy: 50,
      energyPrimary: 50,
      energySecondary: 0,
      age: 0,
      genome: {
        metabolism: 0.6,
        harvest: 0.6,
        aggression: 0.4,
        harvestEfficiency2: 0.5
      },
      genomeV2,
      policyState: undefined,
      transientState: new Map()
    });
  }
  return agents;
}

export function runActionSelectionPilot(config: ActionSelectionPilotConfig): ActionSelectionPilotResult {
  const actionSelectionResults: CohortMetrics[] = [];
  const gradedModulationResults: CohortMetrics[] = [];

  for (const seed of config.seeds) {
    const actionSelectionSim = new LifeSimulation({
      seed,
      config: {
        width: 50,
        height: 50,
        maxAge: 100,
        harvestCap: 5,
        maxResource: 100,
        maxResource2: 50,
        resource2Regen: 0.7
      },
      initialAgents: createActionSelectionAgents(seed, config.initialAgentsPerSeed)
    });

    for (let tick = 0; tick < config.maxTicks; tick++) {
      actionSelectionSim.step();
      const snapshot = actionSelectionSim.snapshot();
      if (snapshot.population === 0) {
        break;
      }
    }

    const finalSnapshot = actionSelectionSim.snapshot();
    actionSelectionResults.push({
      finalPopulation: finalSnapshot.population,
      avgEnergy: finalSnapshot.meanEnergy,
      activeSpecies: finalSnapshot.activeSpecies,
      activeClades: finalSnapshot.activeClades
    });

    const gradedModulationSim = new LifeSimulation({
      seed,
      config: {
        width: 50,
        height: 50,
        maxAge: 100,
        harvestCap: 5,
        maxResource: 100,
        maxResource2: 50,
        resource2Regen: 0.7
      },
      initialAgents: createGradedModulationAgents(seed, config.initialAgentsPerSeed)
    });

    for (let tick = 0; tick < config.maxTicks; tick++) {
      gradedModulationSim.step();
      const snapshot = gradedModulationSim.snapshot();
      if (snapshot.population === 0) {
        break;
      }
    }

    const finalSnapshot2 = gradedModulationSim.snapshot();
    gradedModulationResults.push({
      finalPopulation: finalSnapshot2.population,
      avgEnergy: finalSnapshot2.meanEnergy,
      activeSpecies: finalSnapshot2.activeSpecies,
      activeClades: finalSnapshot2.activeClades
    });
  }

  const avgActionSelection = {
    finalPopulation: actionSelectionResults.reduce((sum, r) => sum + r.finalPopulation, 0) / config.seeds.length,
    avgEnergy: actionSelectionResults.reduce((sum, r) => sum + r.avgEnergy, 0) / config.seeds.length,
    activeSpecies: actionSelectionResults.reduce((sum, r) => sum + r.activeSpecies, 0) / config.seeds.length,
    activeClades: actionSelectionResults.reduce((sum, r) => sum + r.activeClades, 0) / config.seeds.length
  };

  const avgGradedModulation = {
    finalPopulation: gradedModulationResults.reduce((sum, r) => sum + r.finalPopulation, 0) / config.seeds.length,
    avgEnergy: gradedModulationResults.reduce((sum, r) => sum + r.avgEnergy, 0) / config.seeds.length,
    activeSpecies: gradedModulationResults.reduce((sum, r) => sum + r.activeSpecies, 0) / config.seeds.length,
    activeClades: gradedModulationResults.reduce((sum, r) => sum + r.activeClades, 0) / config.seeds.length
  };

  return {
    config,
    actionSelectionCohort: avgActionSelection,
    gradedModulationCohort: avgGradedModulation,
    deltaPopulation: avgActionSelection.finalPopulation - avgGradedModulation.finalPopulation,
    deltaEnergy: avgActionSelection.avgEnergy - avgGradedModulation.avgEnergy,
    deltaSpecies: avgActionSelection.activeSpecies - avgGradedModulation.activeSpecies,
    deltaClades: avgActionSelection.activeClades - avgGradedModulation.activeClades
  };
}

if (require.main === module) {
  const result = runActionSelectionPilot({
    seeds: [1, 2],
    maxTicks: 50,
    initialAgentsPerSeed: 5
  });

  console.log('Action Selection Pilot Study');
  console.log('============================');
  console.log('\nConfiguration:');
  console.log(`  Seeds: ${result.config.seeds.join(', ')}`);
  console.log(`  Max Ticks: ${result.config.maxTicks}`);
  console.log(`  Initial Agents: ${result.config.initialAgentsPerSeed}`);
  console.log('\nAction Selection Cohort:');
  console.log(`  Final Population: ${result.actionSelectionCohort.finalPopulation.toFixed(2)}`);
  console.log(`  Avg Energy: ${result.actionSelectionCohort.avgEnergy.toFixed(2)}`);
  console.log(`  Active Species: ${result.actionSelectionCohort.activeSpecies.toFixed(2)}`);
  console.log(`  Active Clades: ${result.actionSelectionCohort.activeClades.toFixed(2)}`);
  console.log('\nGraded Modulation Cohort:');
  console.log(`  Final Population: ${result.gradedModulationCohort.finalPopulation.toFixed(2)}`);
  console.log(`  Avg Energy: ${result.gradedModulationCohort.avgEnergy.toFixed(2)}`);
  console.log(`  Active Species: ${result.gradedModulationCohort.activeSpecies.toFixed(2)}`);
  console.log(`  Active Clades: ${result.gradedModulationCohort.activeClades.toFixed(2)}`);
  console.log('\nDeltas (Action Selection - Graded Modulation):');
  console.log(`  Population: ${result.deltaPopulation > 0 ? '+' : ''}${result.deltaPopulation.toFixed(2)}`);
  console.log(`  Energy: ${result.deltaEnergy > 0 ? '+' : ''}${result.deltaEnergy.toFixed(2)}`);
  console.log(`  Species: ${result.deltaSpecies > 0 ? '+' : ''}${result.deltaSpecies.toFixed(2)}`);
  console.log(`  Clades: ${result.deltaClades > 0 ? '+' : ''}${result.deltaClades.toFixed(2)}`);
}
