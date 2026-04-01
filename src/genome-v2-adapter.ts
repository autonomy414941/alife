import { Agent, AgentSeed, Genome, GenomeV2, SimulationConfig } from './types';
import {
  DEFAULT_MUTATION_CANDIDATE_NEW_LOCI,
  fromGenome,
  toGenome,
  mutateGenomeV2,
  genomeV2Distance,
  getTrait
} from './genome-v2';
import { LifeSimulation } from './simulation';

export interface AgentV2 extends Omit<Agent, 'genome'> {
  genomeV2: GenomeV2;
}

export function agentToV2(agent: Agent): AgentV2 {
  const { genome, ...rest } = agent;
  return {
    ...rest,
    genomeV2: fromGenome(genome)
  };
}

export function agentFromV2(agentV2: AgentV2): Agent {
  const { genomeV2, ...rest } = agentV2;
  return {
    ...rest,
    genome: toGenome(genomeV2)
  };
}

export function mutateGenomeV2WithConfig(
  genome: GenomeV2,
  config: SimulationConfig,
  randomFloat: () => number
): GenomeV2 {
  return mutateGenomeV2(genome, {
    mutationAmount: config.mutationAmount,
    randomFloat,
    addLociProbability: 0.02,
    removeLociProbability: 0.01,
    minTraits: 3,
    maxTraits: 20,
    candidateNewLoci: DEFAULT_MUTATION_CANDIDATE_NEW_LOCI,
    policyMutationProbability: config.policyMutationProbability,
    policyMutationMagnitude: config.policyMutationMagnitude
  });
}

export function shouldSpeciateV2(
  parentGenomeV2: GenomeV2,
  childGenomeV2: GenomeV2,
  config: SimulationConfig
): boolean {
  return (
    genomeV2Distance(parentGenomeV2, childGenomeV2, config.genomeV2DistanceWeights) >=
    config.speciationThreshold
  );
}

export function shouldFoundCladeV2(
  founderGenomeV2: GenomeV2,
  childGenomeV2: GenomeV2,
  config: SimulationConfig
): boolean {
  const threshold = config.cladogenesisThreshold;
  if (!Number.isFinite(threshold) || threshold < 0) {
    return false;
  }
  return genomeV2Distance(founderGenomeV2, childGenomeV2, config.genomeV2DistanceWeights) >= threshold;
}

export function getMetabolismV2(genomeV2: GenomeV2): number {
  return getTrait(genomeV2, 'metabolism');
}

export function getHarvestV2(genomeV2: GenomeV2): number {
  return getTrait(genomeV2, 'harvest');
}

export function getAggressionV2(genomeV2: GenomeV2): number {
  return getTrait(genomeV2, 'aggression');
}

export function getHarvestEfficiency2V2(genomeV2: GenomeV2): number {
  return getTrait(genomeV2, 'harvestEfficiency2');
}

export interface CreateGenomeV2InitialAgentsOptions {
  seed: number;
  config?: Partial<SimulationConfig>;
}

export function createGenomeV2InitialAgents(
  options: CreateGenomeV2InitialAgentsOptions
): AgentSeed[] {
  const seeder = new LifeSimulation({ seed: options.seed, config: options.config });
  const snapshot = seeder.snapshot();

  return snapshot.agents.map((agent) => ({
    x: agent.x,
    y: agent.y,
    energy: agent.energy,
    energyPrimary: agent.energyPrimary,
    energySecondary: agent.energySecondary,
    age: agent.age,
    lineage: agent.lineage,
    species: agent.species,
    genome: { ...agent.genome },
    genomeV2: fromGenome(agent.genome),
    policyState: undefined,
    transientState: undefined
  }));
}
