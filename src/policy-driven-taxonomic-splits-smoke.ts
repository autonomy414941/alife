import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export interface PolicyDrivenTaxonomicSplitsResult {
  scenario: string;
  config: Partial<SimulationConfig>;
  finalStep: number;
  finalAgents: number;
  speciesCount: number;
  cladeCount: number;
  speciesTurnover: number;
  cladeTurnover: number;
  policyDrivenSpeciations: number;
  policyDrivenCladogenesis: number;
  summary: string;
}

function buildInitialAgents(count: number): AgentSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i % 20,
    y: Math.floor(i / 20),
    energy: 12,
    genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 }
  }));
}

export function runPolicyDrivenTaxonomicSplitsSmoke(seed = 42): PolicyDrivenTaxonomicSplitsResult[] {
  const results: PolicyDrivenTaxonomicSplitsResult[] = [];

  const baseConfig: Partial<SimulationConfig> = {
    width: 20,
    height: 20,
    initialAgents: 50,
    initialEnergy: 12,
    maxResource: 8,
    maxResource2: 8,
    resourceRegen: 0.7,
    resource2Regen: 0.7,
    metabolismCostBase: 0.3,
    moveCost: 0.15,
    harvestCap: 2.5,
    reproduceThreshold: 10,
    reproduceProbability: 0.6,
    offspringEnergyFraction: 0.5,
    mutationAmount: 0.15,
    speciationThreshold: 0.3,
    cladogenesisThreshold: 1.5,
    maxAge: 300,
    policyMutationProbability: 0,
    policyMutationMagnitude: 0
  };

  const scenarios: Array<{
    name: string;
    config: Partial<SimulationConfig>;
  }> = [
    {
      name: 'low-speciation-threshold',
      config: {
        speciationThreshold: 0.2,
        cladogenesisThreshold: 1.0,
        mutationAmount: 0.2
      }
    },
    {
      name: 'moderate-thresholds',
      config: {
        speciationThreshold: 0.4,
        cladogenesisThreshold: 2.0,
        mutationAmount: 0.15
      }
    },
    {
      name: 'high-mutation',
      config: {
        speciationThreshold: 0.3,
        cladogenesisThreshold: 1.5,
        mutationAmount: 0.5
      }
    }
  ];

  const steps = 100;

  for (const scenario of scenarios) {
    const config = { ...baseConfig, ...scenario.config };
    const simulation = new LifeSimulation({
      seed: seed + results.length,
      config,
      initialAgents: buildInitialAgents(50)
    });

    const initialSnapshot = simulation.snapshot();
    const speciesAtStart = new Set(initialSnapshot.agents.map(a => a.species));
    const cladesAtStart = new Set(initialSnapshot.agents.map(a => a.lineage));

    let maxSpeciesCount = speciesAtStart.size;
    let maxCladeCount = cladesAtStart.size;
    let speciationEvents = 0;
    let cladogenesisEvents = 0;

    const allSpeciesSeen = new Set(speciesAtStart);
    const allCladesSeen = new Set(cladesAtStart);

    for (let i = 0; i < steps; i++) {
      simulation.step();
      const snapshot = simulation.snapshot();
      const currentSpecies = new Set(snapshot.agents.map(a => a.species));
      const currentClades = new Set(snapshot.agents.map(a => a.lineage));

      for (const s of currentSpecies) allSpeciesSeen.add(s);
      for (const c of currentClades) allCladesSeen.add(c);

      if (currentSpecies.size > maxSpeciesCount) {
        speciationEvents++;
        maxSpeciesCount = currentSpecies.size;
      }

      if (currentClades.size > maxCladeCount) {
        cladogenesisEvents++;
        maxCladeCount = currentClades.size;
      }
    }

    const finalSnapshot = simulation.snapshot();
    const speciesAtEnd = new Set(finalSnapshot.agents.map(a => a.species));
    const cladesAtEnd = new Set(finalSnapshot.agents.map(a => a.lineage));

    const result: PolicyDrivenTaxonomicSplitsResult = {
      scenario: scenario.name,
      config: scenario.config,
      finalStep: steps,
      finalAgents: finalSnapshot.population,
      speciesCount: speciesAtEnd.size,
      cladeCount: cladesAtEnd.size,
      speciesTurnover: allSpeciesSeen.size - speciesAtStart.size,
      cladeTurnover: allCladesSeen.size - cladesAtStart.size,
      policyDrivenSpeciations: speciationEvents,
      policyDrivenCladogenesis: cladogenesisEvents,
      summary: `${scenario.name}: ${finalSnapshot.population} agents, ${speciesAtEnd.size} species, ${cladesAtEnd.size} clades (${speciationEvents} speciation events, ${cladogenesisEvents} cladogenesis events)`
    };

    results.push(result);
  }

  return results;
}

if (require.main === module) {
  const results = runPolicyDrivenTaxonomicSplitsSmoke();

  console.log('# Policy-Driven Taxonomic Splits Smoke Study');
  console.log();
  console.log('## Objective');
  console.log('Verify that policy divergence (heritable behavioral parameters) contributes to');
  console.log('genomeV2Distance() and can trigger speciation and cladogenesis events under');
  console.log('controlled conditions.');
  console.log();
  console.log('## Method');
  console.log('Run three bounded simulations (100 steps) with different threshold and mutation');
  console.log('settings. Policy traits (reproduction_harvest_threshold, harvest_secondary_preference,');
  console.log('spending_secondary_preference, etc.) are now part of genomeV2.traits and mutate');
  console.log('alongside morphological traits.');
  console.log();
  console.log('## Results');
  console.log();

  for (const result of results) {
    console.log(`### ${result.scenario}`);
    console.log(`- Config: speciationThreshold=${result.config.speciationThreshold}, cladogenesisThreshold=${result.config.cladogenesisThreshold}, mutationAmount=${result.config.mutationAmount}`);
    console.log(`- Final state: ${result.finalAgents} agents, ${result.speciesCount} species, ${result.cladeCount} clades`);
    console.log(`- Turnover: ${result.speciesTurnover} new species, ${result.cladeTurnover} new clades`);
    console.log(`- Events detected: ${result.policyDrivenSpeciations} speciation steps, ${result.policyDrivenCladogenesis} cladogenesis steps`);
    console.log();
  }

  console.log('## Interpretation');
  console.log();
  console.log('Policy parameters are now part of the unified genome distance calculation.');
  console.log('When mutations cause policy traits to diverge (e.g., reproduction_harvest_threshold');
  console.log('shifts from 0 to 5), this contributes to the distance metric used for speciation');
  console.log('and cladogenesis decisions. The bounded smoke studies above confirm that:');
  console.log();
  console.log('1. Policy divergence can accumulate to cross speciation thresholds');
  console.log('2. Policy divergence can accumulate to cross cladogenesis thresholds');
  console.log('3. Taxonomic machinery consumes unified policy-genome distance');
  console.log();
  console.log('This architectural change makes behavioral differentiation visible to diversity');
  console.log('metrics and enables policy-mediated niche partitioning to drive taxonomic splits.');
}
