import { LifeSimulation } from './simulation';
import { realizePhenotype, LocalEcologicalContext } from './phenotype';
import { Agent, SimulationConfig } from './types';

interface ContextDependentPhenotypeCheck {
  seed: number;
  contextDependent: ContextDependentPhenotypeMetrics;
  directEncoding: ContextDependentPhenotypeMetrics;
  delta: {
    finalPopulation: number;
    finalActiveSpecies: number;
    finalMeanEnergy: number;
    finalMetabolicEfficiencyPrimaryMean: number;
  };
}

interface ContextDependentPhenotypeMetrics {
  finalPopulation: number;
  finalActiveSpecies: number;
  finalMeanEnergy: number;
  finalMetabolicEfficiencyPrimaryMean: number;
  metabolicEfficiencyPrimaryVariance: number;
}

export interface ContextDependentPhenotypeSpikeConfig {
  seeds: number[];
  steps: number;
}

export interface ContextDependentPhenotypeSpikeExport {
  generatedAt: string;
  config: ContextDependentPhenotypeSpikeConfig;
  checks: ContextDependentPhenotypeCheck[];
  summary: {
    seeds: number;
    meanPopulationDelta: number;
    meanActiveSpeciesDelta: number;
    meanEnergyDelta: number;
    meanMetabolicEfficiencyPrimaryDelta: number;
  };
}

export function runContextDependentPhenotypeSpike(
  config: ContextDependentPhenotypeSpikeConfig
): ContextDependentPhenotypeSpikeExport {
  const checks: ContextDependentPhenotypeCheck[] = [];

  for (const seed of config.seeds) {
    const contextDependentMetrics = runWithContextDependentPhenotype(seed, config.steps);
    const directEncodingMetrics = runWithDirectEncoding(seed, config.steps);

    checks.push({
      seed,
      contextDependent: contextDependentMetrics,
      directEncoding: directEncodingMetrics,
      delta: {
        finalPopulation: contextDependentMetrics.finalPopulation - directEncodingMetrics.finalPopulation,
        finalActiveSpecies: contextDependentMetrics.finalActiveSpecies - directEncodingMetrics.finalActiveSpecies,
        finalMeanEnergy: contextDependentMetrics.finalMeanEnergy - directEncodingMetrics.finalMeanEnergy,
        finalMetabolicEfficiencyPrimaryMean:
          contextDependentMetrics.finalMetabolicEfficiencyPrimaryMean -
          directEncodingMetrics.finalMetabolicEfficiencyPrimaryMean
      }
    });
  }

  const summary = {
    seeds: checks.length,
    meanPopulationDelta: mean(checks.map((c) => c.delta.finalPopulation)),
    meanActiveSpeciesDelta: mean(checks.map((c) => c.delta.finalActiveSpecies)),
    meanEnergyDelta: mean(checks.map((c) => c.delta.finalMeanEnergy)),
    meanMetabolicEfficiencyPrimaryDelta: mean(checks.map((c) => c.delta.finalMetabolicEfficiencyPrimaryMean))
  };

  return {
    generatedAt: new Date().toISOString(),
    config,
    checks,
    summary
  };
}

function runWithContextDependentPhenotype(seed: number, steps: number): ContextDependentPhenotypeMetrics {
  const simConfig: Partial<SimulationConfig> = {
    width: 20,
    height: 20,
    maxResource: 8,
    resourceRegen: 0.6,
    initialAgents: 24,
    initialEnergy: 12,
    reproduceThreshold: 20,
    reproduceProbability: 0.35,
    mutationAmount: 0.2,
    biomeBands: 4,
    biomeContrast: 0.45
  };

  const sim = new LifeSimulation({ seed, config: simConfig });

  for (let i = 0; i < steps; i++) {
    sim.step();
  }

  const snapshot = sim.snapshot();
  const history = sim.history();

  const agents = snapshot.agents;
  const activeSpecies = history.species.filter((s) => s.extinctTick === null).length;

  const metabolicEfficiencies = agents
    .map((agent: Agent) => {
      const context: LocalEcologicalContext = {
        localFertility: 1.0,
        localCrowding: 0,
        disturbancePhase: 0
      };
      return realizePhenotype(agent, context).metabolicEfficiencyPrimary ?? 0.5;
    })
    .filter((v) => v !== undefined) as number[];

  return {
    finalPopulation: agents.length,
    finalActiveSpecies: activeSpecies,
    finalMeanEnergy: agents.length > 0 ? agents.reduce((sum, a) => sum + a.energy, 0) / agents.length : 0,
    finalMetabolicEfficiencyPrimaryMean: mean(metabolicEfficiencies),
    metabolicEfficiencyPrimaryVariance: variance(metabolicEfficiencies)
  };
}

function runWithDirectEncoding(seed: number, steps: number): ContextDependentPhenotypeMetrics {
  const simConfig: Partial<SimulationConfig> = {
    width: 20,
    height: 20,
    maxResource: 8,
    resourceRegen: 0.6,
    initialAgents: 24,
    initialEnergy: 12,
    reproduceThreshold: 20,
    reproduceProbability: 0.35,
    mutationAmount: 0.2,
    biomeBands: 4,
    biomeContrast: 0.45
  };

  const sim = new LifeSimulation({ seed, config: simConfig });

  for (let i = 0; i < steps; i++) {
    sim.step();
  }

  const snapshot = sim.snapshot();
  const history = sim.history();

  const agents = snapshot.agents;
  const activeSpecies = history.species.filter((s) => s.extinctTick === null).length;

  const metabolicEfficiencies = agents
    .map((agent: Agent) => {
      return realizePhenotype(agent).metabolicEfficiencyPrimary ?? 0.5;
    })
    .filter((v) => v !== undefined) as number[];

  return {
    finalPopulation: agents.length,
    finalActiveSpecies: activeSpecies,
    finalMeanEnergy: agents.length > 0 ? agents.reduce((sum, a) => sum + a.energy, 0) / agents.length : 0,
    finalMetabolicEfficiencyPrimaryMean: mean(metabolicEfficiencies),
    metabolicEfficiencyPrimaryVariance: variance(metabolicEfficiencies)
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
}

if (require.main === module) {
  const config: ContextDependentPhenotypeSpikeConfig = {
    seeds: [1000, 2000, 3000],
    steps: 2000
  };

  console.log('Running context-dependent phenotype spike...');
  const result = runContextDependentPhenotypeSpike(config);

  console.log('\nSummary:');
  console.log(`  Seeds: ${result.summary.seeds}`);
  console.log(`  Mean population delta: ${result.summary.meanPopulationDelta.toFixed(2)}`);
  console.log(`  Mean active species delta: ${result.summary.meanActiveSpeciesDelta.toFixed(2)}`);
  console.log(`  Mean energy delta: ${result.summary.meanEnergyDelta.toFixed(4)}`);
  console.log(`  Mean metabolic efficiency delta: ${result.summary.meanMetabolicEfficiencyPrimaryDelta.toFixed(4)}`);

  const fs = require('fs');
  const outputPath = 'docs/context_dependent_phenotype_spike_2026-04-02.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote artifact to ${outputPath}`);
}
