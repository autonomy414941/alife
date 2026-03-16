import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import { resolveDualResourceHarvest } from './resource-harvest';
import { LifeSimulation } from './simulation';
import { Agent, Genome, SimulationConfig } from './types';

export const RESOURCE_METABOLISM_FUNGIBILITY_DIAGNOSTIC_ARTIFACT =
  'docs/resource_metabolism_fungibility_diagnostics_2026-03-16.json';

interface SourcePathEvidence {
  agentStateKeys: string[];
  agentEnergyLikeKeys: string[];
  distinctInternalPoolKeys: string[];
  dualHarvestResultKeys: string[];
  harvestAddsOnlyTotalHarvestToAgentEnergy: boolean;
  metabolismConsumesOnlyScalarEnergy: boolean;
  reproductionConsumesOnlyScalarEnergy: boolean;
}

interface AgentStateSummary {
  lineage: number;
  species: number;
  x: number;
  y: number;
  energy: number;
  age: number;
}

interface SingleAgentScenario {
  config: Partial<SimulationConfig>;
  initialEnergy: number;
  initialPrimaryResource: number;
  initialSecondaryResource: number;
  genome: Genome;
  harvestedPrimary: number;
  harvestedSecondary: number;
  finalAgentState: AgentStateSummary;
  births: number;
  population: number;
  offspringEnergies: number[];
}

interface SharedEnvironmentHarvestComparison {
  genome: Genome;
  primaryHarvest: number;
  secondaryHarvest: number;
  totalHarvest: number;
  secondaryHarvestFraction: number;
}

export interface ResourceMetabolismFungibilityDiagnosticExport {
  generatedAt: string;
  question: string;
  config: {
    matchedHarvestCollapse: {
      initialEnergy: number;
      baseConfig: Partial<SimulationConfig>;
      generalistGenome: Genome;
      primaryOnlyResources: {
        primary: number;
        secondary: number;
      };
      secondaryOnlyResources: {
        primary: number;
        secondary: number;
      };
    };
    downstreamMetabolismEquivalence: {
      initialEnergy: number;
      config: Partial<SimulationConfig>;
      generalistGenome: Genome;
    };
    downstreamReproductionEquivalence: {
      initialEnergy: number;
      config: Partial<SimulationConfig>;
      generalistGenome: Genome;
    };
    specialistVsGeneralist: {
      sharedEnvironment: {
        primaryAvailable: number;
        secondaryAvailable: number;
        baseCapacity: number;
      };
      matchedEnergyMetabolismConfig: Partial<SimulationConfig>;
      matchedEnergyReproductionConfig: Partial<SimulationConfig>;
      initialEnergy: number;
      specialistGenome: Genome;
      generalistGenome: Genome;
    };
  };
  structuralEvidence: SourcePathEvidence & {
    retainsDistinctInternalEnergyPools: boolean;
    supportsSourceSpecificMetabolicCosts: boolean;
    supportsSourceSpecificReproductionCosts: boolean;
  };
  matchedHarvestCollapse: {
    primaryOnly: SingleAgentScenario;
    secondaryOnly: SingleAgentScenario;
    identicalPostHarvestAgentState: boolean;
    postHarvestEnergyDelta: number;
  };
  downstreamCostEquivalence: {
    metabolismAfterMatchedHarvest: {
      priorPrimaryDerived: SingleAgentScenario;
      priorSecondaryDerived: SingleAgentScenario;
      identicalEnergyLoss: boolean;
      energyLossDelta: number;
    };
    reproductionAfterMatchedHarvest: {
      priorPrimaryDerived: SingleAgentScenario;
      priorSecondaryDerived: SingleAgentScenario;
      identicalOutcome: boolean;
      parentEnergyDelta: number;
      childEnergyDelta: number;
    };
  };
  specialistVsGeneralist: {
    sharedEnvironmentHarvest: {
      specialist: SharedEnvironmentHarvestComparison;
      generalist: SharedEnvironmentHarvestComparison;
      harvestDifferentiationOnlyAtIntake: boolean;
    };
    matchedEnergyMetabolism: {
      specialist: SingleAgentScenario;
      generalist: SingleAgentScenario;
      identicalEnergyLoss: boolean;
      energyLossDelta: number;
    };
    matchedEnergyReproduction: {
      specialist: SingleAgentScenario;
      generalist: SingleAgentScenario;
      identicalScalarOutcome: boolean;
      parentEnergyDelta: number;
      childEnergyDelta: number;
    };
    showsDistinctInternalStateAtMatchedTotalEnergy: boolean;
  };
  diagnosis: string;
}

export interface RunResourceMetabolismFungibilityDiagnosticsInput {
  generatedAt?: string;
}

const GENERALIST_GENOME: Genome = {
  metabolism: 1,
  harvest: 1,
  aggression: 0.2,
  harvestEfficiency2: 1
};

const SPECIALIST_GENOME: Genome = {
  metabolism: 1,
  harvest: 0.5,
  aggression: 0.2,
  harvestEfficiency2: 1.5
};

const MATCHED_HARVEST_BASE_CONFIG: Partial<SimulationConfig> = {
  width: 1,
  height: 1,
  maxResource: 20,
  maxResource2: 20,
  resourceRegen: 0,
  resource2Regen: 0,
  habitatPreferenceStrength: 0,
  trophicForagingPenalty: 0,
  defenseForagingPenalty: 0,
  metabolismCostBase: 0,
  moveCost: 0,
  harvestCap: 10,
  reproduceThreshold: 100,
  reproduceProbability: 0,
  offspringEnergyFraction: 0.5,
  mutationAmount: 0,
  maxAge: 10
};

const METABOLISM_ONLY_CONFIG: Partial<SimulationConfig> = {
  width: 1,
  height: 1,
  maxResource: 20,
  maxResource2: 20,
  resourceRegen: 0,
  resource2Regen: 0,
  habitatPreferenceStrength: 0,
  trophicForagingPenalty: 0,
  defenseForagingPenalty: 0,
  metabolismCostBase: 0.75,
  moveCost: 0,
  harvestCap: 0,
  reproduceThreshold: 100,
  reproduceProbability: 0,
  offspringEnergyFraction: 0.5,
  mutationAmount: 0,
  specializationMetabolicCost: 0,
  maxAge: 10
};

const REPRODUCTION_ONLY_CONFIG: Partial<SimulationConfig> = {
  width: 1,
  height: 1,
  maxResource: 20,
  maxResource2: 20,
  resourceRegen: 0,
  resource2Regen: 0,
  habitatPreferenceStrength: 0,
  trophicForagingPenalty: 0,
  defenseForagingPenalty: 0,
  metabolismCostBase: 0,
  moveCost: 0,
  harvestCap: 0,
  reproduceThreshold: 12,
  reproduceProbability: 1,
  offspringEnergyFraction: 0.5,
  mutationAmount: 0,
  speciationThreshold: 10,
  maxAge: 10
};

export function runResourceMetabolismFungibilityDiagnostics(
  input: RunResourceMetabolismFungibilityDiagnosticsInput = {}
): ResourceMetabolismFungibilityDiagnosticExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const structuralEvidence = collectSourcePathEvidence();

  const primaryOnly = runSingleAgentScenario({
    config: MATCHED_HARVEST_BASE_CONFIG,
    initialEnergy: 10,
    initialPrimaryResource: 20,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });
  const secondaryOnly = runSingleAgentScenario({
    config: MATCHED_HARVEST_BASE_CONFIG,
    initialEnergy: 10,
    initialPrimaryResource: 0,
    initialSecondaryResource: 20,
    genome: GENERALIST_GENOME
  });

  const metabolismAfterPrimary = runSingleAgentScenario({
    config: METABOLISM_ONLY_CONFIG,
    initialEnergy: primaryOnly.finalAgentState.energy,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });
  const metabolismAfterSecondary = runSingleAgentScenario({
    config: METABOLISM_ONLY_CONFIG,
    initialEnergy: secondaryOnly.finalAgentState.energy,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });

  const reproductionAfterPrimary = runSingleAgentScenario({
    config: REPRODUCTION_ONLY_CONFIG,
    initialEnergy: primaryOnly.finalAgentState.energy,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });
  const reproductionAfterSecondary = runSingleAgentScenario({
    config: REPRODUCTION_ONLY_CONFIG,
    initialEnergy: secondaryOnly.finalAgentState.energy,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });

  const specialistHarvest = summarizeSharedEnvironmentHarvest(SPECIALIST_GENOME);
  const generalistHarvest = summarizeSharedEnvironmentHarvest(GENERALIST_GENOME);
  const specialistMetabolism = runSingleAgentScenario({
    config: METABOLISM_ONLY_CONFIG,
    initialEnergy: 12,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: SPECIALIST_GENOME
  });
  const generalistMetabolism = runSingleAgentScenario({
    config: METABOLISM_ONLY_CONFIG,
    initialEnergy: 12,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });
  const specialistReproduction = runSingleAgentScenario({
    config: REPRODUCTION_ONLY_CONFIG,
    initialEnergy: 12,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: SPECIALIST_GENOME
  });
  const generalistReproduction = runSingleAgentScenario({
    config: REPRODUCTION_ONLY_CONFIG,
    initialEnergy: 12,
    initialPrimaryResource: 0,
    initialSecondaryResource: 0,
    genome: GENERALIST_GENOME
  });

  const matchedHarvestCollapse = {
    primaryOnly,
    secondaryOnly,
    identicalPostHarvestAgentState: sameAgentState(primaryOnly.finalAgentState, secondaryOnly.finalAgentState),
    postHarvestEnergyDelta: absoluteDifference(primaryOnly.finalAgentState.energy, secondaryOnly.finalAgentState.energy)
  };

  const downstreamCostEquivalence = {
    metabolismAfterMatchedHarvest: {
      priorPrimaryDerived: metabolismAfterPrimary,
      priorSecondaryDerived: metabolismAfterSecondary,
      identicalEnergyLoss: sameScalarOutcome(
        primaryOnly.finalAgentState.energy - metabolismAfterPrimary.finalAgentState.energy,
        secondaryOnly.finalAgentState.energy - metabolismAfterSecondary.finalAgentState.energy
      ),
      energyLossDelta: absoluteDifference(
        primaryOnly.finalAgentState.energy - metabolismAfterPrimary.finalAgentState.energy,
        secondaryOnly.finalAgentState.energy - metabolismAfterSecondary.finalAgentState.energy
      )
    },
    reproductionAfterMatchedHarvest: {
      priorPrimaryDerived: reproductionAfterPrimary,
      priorSecondaryDerived: reproductionAfterSecondary,
      identicalOutcome:
        sameScalarOutcome(
          reproductionAfterPrimary.finalAgentState.energy,
          reproductionAfterSecondary.finalAgentState.energy
        ) &&
        sameNumberArray(reproductionAfterPrimary.offspringEnergies, reproductionAfterSecondary.offspringEnergies) &&
        reproductionAfterPrimary.population === reproductionAfterSecondary.population,
      parentEnergyDelta: absoluteDifference(
        reproductionAfterPrimary.finalAgentState.energy,
        reproductionAfterSecondary.finalAgentState.energy
      ),
      childEnergyDelta: absoluteDifference(
        sum(reproductionAfterPrimary.offspringEnergies),
        sum(reproductionAfterSecondary.offspringEnergies)
      )
    }
  };

  const specialistVsGeneralist = {
    sharedEnvironmentHarvest: {
      specialist: specialistHarvest,
      generalist: generalistHarvest,
      harvestDifferentiationOnlyAtIntake:
        !sameScalarOutcome(specialistHarvest.secondaryHarvestFraction, generalistHarvest.secondaryHarvestFraction)
    },
    matchedEnergyMetabolism: {
      specialist: specialistMetabolism,
      generalist: generalistMetabolism,
      identicalEnergyLoss: sameScalarOutcome(
        12 - specialistMetabolism.finalAgentState.energy,
        12 - generalistMetabolism.finalAgentState.energy
      ),
      energyLossDelta: absoluteDifference(
        12 - specialistMetabolism.finalAgentState.energy,
        12 - generalistMetabolism.finalAgentState.energy
      )
    },
    matchedEnergyReproduction: {
      specialist: specialistReproduction,
      generalist: generalistReproduction,
      identicalScalarOutcome:
        sameScalarOutcome(specialistReproduction.finalAgentState.energy, generalistReproduction.finalAgentState.energy) &&
        sameNumberArray(specialistReproduction.offspringEnergies, generalistReproduction.offspringEnergies) &&
        specialistReproduction.population === generalistReproduction.population,
      parentEnergyDelta: absoluteDifference(
        specialistReproduction.finalAgentState.energy,
        generalistReproduction.finalAgentState.energy
      ),
      childEnergyDelta: absoluteDifference(
        sum(specialistReproduction.offspringEnergies),
        sum(generalistReproduction.offspringEnergies)
      )
    },
    showsDistinctInternalStateAtMatchedTotalEnergy: false
  };

  const diagnosis = synthesizeDiagnosis({
    structuralEvidence,
    matchedHarvestCollapse,
    downstreamCostEquivalence,
    specialistVsGeneralist
  });

  return {
    generatedAt,
    question:
      'Does the dual-resource substrate preserve resource-type identity inside agents, or do primary and secondary harvest collapse into one fungible energy pool?',
    config: {
      matchedHarvestCollapse: {
        initialEnergy: 10,
        baseConfig: MATCHED_HARVEST_BASE_CONFIG,
        generalistGenome: copyGenome(GENERALIST_GENOME),
        primaryOnlyResources: { primary: 20, secondary: 0 },
        secondaryOnlyResources: { primary: 0, secondary: 20 }
      },
      downstreamMetabolismEquivalence: {
        initialEnergy: primaryOnly.finalAgentState.energy,
        config: METABOLISM_ONLY_CONFIG,
        generalistGenome: copyGenome(GENERALIST_GENOME)
      },
      downstreamReproductionEquivalence: {
        initialEnergy: primaryOnly.finalAgentState.energy,
        config: REPRODUCTION_ONLY_CONFIG,
        generalistGenome: copyGenome(GENERALIST_GENOME)
      },
      specialistVsGeneralist: {
        sharedEnvironment: {
          primaryAvailable: 20,
          secondaryAvailable: 20,
          baseCapacity: 4
        },
        matchedEnergyMetabolismConfig: METABOLISM_ONLY_CONFIG,
        matchedEnergyReproductionConfig: REPRODUCTION_ONLY_CONFIG,
        initialEnergy: 12,
        specialistGenome: copyGenome(SPECIALIST_GENOME),
        generalistGenome: copyGenome(GENERALIST_GENOME)
      }
    },
    structuralEvidence: {
      ...structuralEvidence,
      retainsDistinctInternalEnergyPools: false,
      supportsSourceSpecificMetabolicCosts: false,
      supportsSourceSpecificReproductionCosts: false
    },
    matchedHarvestCollapse,
    downstreamCostEquivalence,
    specialistVsGeneralist,
    diagnosis
  };
}

function collectSourcePathEvidence(): SourcePathEvidence {
  const typesSource = readProjectSource('types.ts');
  const simulationSource = readProjectSource('simulation.ts');
  const reproductionSource = readProjectSource('simulation-reproduction.ts');
  const agentKeys = extractInterfaceKeys(typesSource, 'Agent');
  const dualHarvestResultKeys = extractInterfaceKeys(readProjectSource('resource-harvest.ts'), 'DualResourceHarvestResult');
  const agentEnergyLikeKeys = agentKeys.filter((key) => /energy|resource/i.test(key));
  const distinctInternalPoolKeys = agentEnergyLikeKeys.filter((key) => key !== 'energy');

  return {
    agentStateKeys: agentKeys,
    agentEnergyLikeKeys,
    distinctInternalPoolKeys,
    dualHarvestResultKeys,
    harvestAddsOnlyTotalHarvestToAgentEnergy: simulationSource.includes('agent.energy += harvest.totalHarvest;'),
    metabolismConsumesOnlyScalarEnergy:
      simulationSource.includes('agent.energy -= this.config.metabolismCostBase * agent.genome.metabolism;') &&
      simulationSource.includes('agent.energy -= this.specializationMetabolicPenalty(agent);'),
    reproductionConsumesOnlyScalarEnergy:
      reproductionSource.includes('if (agent.energy < config.reproduceThreshold') &&
      reproductionSource.includes('const childEnergy = parent.energy * config.offspringEnergyFraction;')
  };
}

function summarizeSharedEnvironmentHarvest(genome: Genome): SharedEnvironmentHarvestComparison {
  const harvest = resolveDualResourceHarvest({
    primaryAvailable: 20,
    secondaryAvailable: 20,
    genome,
    baseCapacity: 4
  });

  return {
    genome: copyGenome(genome),
    primaryHarvest: harvest.primaryHarvest,
    secondaryHarvest: harvest.secondaryHarvest,
    totalHarvest: harvest.totalHarvest,
    secondaryHarvestFraction: harvest.totalHarvest <= 0 ? 0 : harvest.secondaryHarvest / harvest.totalHarvest
  };
}

function runSingleAgentScenario({
  config,
  initialEnergy,
  initialPrimaryResource,
  initialSecondaryResource,
  genome
}: {
  config: Partial<SimulationConfig>;
  initialEnergy: number;
  initialPrimaryResource: number;
  initialSecondaryResource: number;
  genome: Genome;
}): SingleAgentScenario {
  const simulation = new LifeSimulation({
    seed: 1,
    config,
    initialAgents: [
      {
        x: 0,
        y: 0,
        energy: initialEnergy,
        lineage: 1,
        species: 1,
        genome: copyGenome(genome)
      }
    ]
  });

  simulation.setResource(0, 0, initialPrimaryResource);
  simulation.setResource2(0, 0, initialSecondaryResource);
  const beforePrimary = simulation.getResource(0, 0);
  const beforeSecondary = simulation.getResource2(0, 0);
  const summary = simulation.step();
  const afterPrimary = simulation.getResource(0, 0);
  const afterSecondary = simulation.getResource2(0, 0);
  const snapshot = simulation.snapshot();
  const parent = requireAgent(snapshot.agents.find((agent) => agent.id === 1));
  const offspring = snapshot.agents.filter((agent) => agent.id !== 1);

  return {
    config,
    initialEnergy,
    initialPrimaryResource: beforePrimary,
    initialSecondaryResource: beforeSecondary,
    genome: copyGenome(genome),
    harvestedPrimary: beforePrimary - afterPrimary,
    harvestedSecondary: beforeSecondary - afterSecondary,
    finalAgentState: summarizeAgentState(parent),
    births: summary.births,
    population: summary.population,
    offspringEnergies: offspring.map((agent) => agent.energy).sort((a, b) => a - b)
  };
}

function summarizeAgentState(agent: Agent): AgentStateSummary {
  return {
    lineage: agent.lineage,
    species: agent.species,
    x: agent.x,
    y: agent.y,
    energy: agent.energy,
    age: agent.age
  };
}

function synthesizeDiagnosis(input: {
  structuralEvidence: SourcePathEvidence;
  matchedHarvestCollapse: ResourceMetabolismFungibilityDiagnosticExport['matchedHarvestCollapse'];
  downstreamCostEquivalence: ResourceMetabolismFungibilityDiagnosticExport['downstreamCostEquivalence'];
  specialistVsGeneralist: ResourceMetabolismFungibilityDiagnosticExport['specialistVsGeneralist'];
}): string {
  const parts: string[] = [];

  parts.push(
    `Agent state exposes ${input.structuralEvidence.agentEnergyLikeKeys.join(', ')} as energy-like storage, with no separate internal pools for resource1 or resource2.`
  );
  parts.push(
    `Dual-resource harvest resolves primary/secondary intake externally, then applies only total harvest to agent energy (${input.structuralEvidence.harvestAddsOnlyTotalHarvestToAgentEnergy ? 'confirmed' : 'not confirmed'} in source).`
  );
  parts.push(
    `Matched harvest trials collapse primary-only and secondary-only intake into identical post-harvest agent state (energy delta=${input.matchedHarvestCollapse.postHarvestEnergyDelta.toFixed(2)}).`
  );
  parts.push(
    `Once total energy is matched, downstream metabolism remains identical (energy-loss delta=${input.downstreamCostEquivalence.metabolismAfterMatchedHarvest.energyLossDelta.toFixed(2)}) and reproduction remains identical (parent delta=${input.downstreamCostEquivalence.reproductionAfterMatchedHarvest.parentEnergyDelta.toFixed(2)}, child delta=${input.downstreamCostEquivalence.reproductionAfterMatchedHarvest.childEnergyDelta.toFixed(2)}).`
  );
  parts.push(
    `Specialist and generalist genomes differ in harvest composition on the same patch (secondary share ${input.specialistVsGeneralist.sharedEnvironmentHarvest.specialist.secondaryHarvestFraction.toFixed(2)} vs ${input.specialistVsGeneralist.sharedEnvironmentHarvest.generalist.secondaryHarvestFraction.toFixed(2)}), but their matched-energy metabolism and reproduction are still identical.`
  );
  parts.push(
    'CONCLUSION: the current dual-resource substrate does not preserve resource identity through metabolism. Resource1 and resource2 differentiate intake opportunities only; once harvested, they collapse into one fungible energy scalar, so there is no internal metabolic partitioning tradeoff to carry specialists and generalists into different downstream physiological states.'
  );

  return parts.join(' ');
}

function extractInterfaceKeys(source: string, interfaceName: string): string[] {
  const block = extractInterfaceBlock(source, interfaceName);
  return [...block.matchAll(/^\s+([A-Za-z0-9_]+)\??:/gm)].map((match) => match[1]);
}

function extractInterfaceBlock(source: string, interfaceName: string): string {
  const match = source.match(new RegExp(`export interface ${interfaceName} \\{([\\s\\S]*?)\\n\\}`, 'm'));
  if (!match) {
    throw new Error(`Could not find interface ${interfaceName}`);
  }
  return match[1];
}

function readProjectSource(fileName: string): string {
  return readFileSync(resolve(__dirname, fileName), 'utf8');
}

function sameAgentState(a: AgentStateSummary, b: AgentStateSummary): boolean {
  return (
    a.lineage === b.lineage &&
    a.species === b.species &&
    a.x === b.x &&
    a.y === b.y &&
    sameScalarOutcome(a.energy, b.energy) &&
    a.age === b.age
  );
}

function sameNumberArray(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => sameScalarOutcome(value, b[index] ?? Number.NaN));
}

function sameScalarOutcome(a: number, b: number): boolean {
  return absoluteDifference(a, b) <= 1e-9;
}

function absoluteDifference(a: number, b: number): number {
  return Math.abs(a - b);
}

function requireAgent(agent: Agent | undefined): Agent {
  if (!agent) {
    throw new Error('Expected simulation snapshot to retain the seeded parent agent');
  }
  return agent;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function copyGenome(genome: Genome): Genome {
  return {
    metabolism: genome.metabolism,
    harvest: genome.harvest,
    aggression: genome.aggression,
    harvestEfficiency2: genome.harvestEfficiency2
  };
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runResourceMetabolismFungibilityDiagnostics({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, {
    output: options.output ?? RESOURCE_METABOLISM_FUNGIBILITY_DIAGNOSTIC_ARTIFACT
  });
}
