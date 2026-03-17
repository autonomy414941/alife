import { buildNumericAggregate, mean } from './activity-thresholds';
import { getAgentEnergyPools } from './agent-energy';
import {
  Agent,
  CladeSubstrateDependence,
  NumericAggregate,
  SubstrateObservabilityAggregate,
  SubstrateObservabilityMetrics,
  SubstrateSpecializationBand,
  SubstrateSpecializationBandAggregate,
  SubstrateSpecializationBandMetrics
} from './types';

const PRIMARY_BIASED_MAX_SECONDARY_SHARE = 1 / 3;
const SECONDARY_BIASED_MIN_SECONDARY_SHARE = 2 / 3;

export function buildSubstrateObservabilityMetrics(agents: Agent[]): SubstrateObservabilityMetrics {
  return {
    meanPrimaryEnergyShare: mean(agents.map((agent) => getPrimaryEnergyShare(agent))),
    meanSecondaryEnergyShare: mean(agents.map((agent) => getSecondaryEnergyShare(agent))),
    meanHarvestEfficiency2: mean(agents.map((agent) => Math.max(0, agent.genome.harvestEfficiency2 ?? 0))),
    meanSecondaryHarvestShare: mean(agents.map((agent) => getSecondaryHarvestShare(agent))),
    specializationStrata: buildSpecializationStrata(agents),
    cladeSubstrateDependence: buildCladeSubstrateDependence(agents)
  };
}

export function buildSubstrateObservabilityAggregate(
  metrics: SubstrateObservabilityMetrics[]
): SubstrateObservabilityAggregate {
  const normalizedMetrics = metrics.map((value) => value ?? buildEmptySubstrateObservabilityMetrics());

  return {
    meanPrimaryEnergyShare: aggregate(normalizedMetrics.map((value) => value.meanPrimaryEnergyShare)),
    meanSecondaryEnergyShare: aggregate(normalizedMetrics.map((value) => value.meanSecondaryEnergyShare)),
    meanHarvestEfficiency2: aggregate(normalizedMetrics.map((value) => value.meanHarvestEfficiency2)),
    meanSecondaryHarvestShare: aggregate(normalizedMetrics.map((value) => value.meanSecondaryHarvestShare)),
    specializationStrata: {
      primaryBiased: buildSpecializationBandAggregate(normalizedMetrics, 'primaryBiased'),
      mixed: buildSpecializationBandAggregate(normalizedMetrics, 'mixed'),
      secondaryBiased: buildSpecializationBandAggregate(normalizedMetrics, 'secondaryBiased')
    }
  };
}

export function buildEmptySubstrateObservabilityMetrics(): SubstrateObservabilityMetrics {
  return {
    meanPrimaryEnergyShare: 0,
    meanSecondaryEnergyShare: 0,
    meanHarvestEfficiency2: 0,
    meanSecondaryHarvestShare: 0,
    specializationStrata: {
      primaryBiased: emptySpecializationBandMetrics(),
      mixed: emptySpecializationBandMetrics(),
      secondaryBiased: emptySpecializationBandMetrics()
    },
    cladeSubstrateDependence: []
  };
}

function buildCladeSubstrateDependence(agents: Agent[]): CladeSubstrateDependence[] {
  if (agents.length === 0) {
    return [];
  }

  const agentsByLineage = new Map<number, Agent[]>();
  for (const agent of agents) {
    const lineageAgents = agentsByLineage.get(agent.lineage);
    if (lineageAgents) {
      lineageAgents.push(agent);
      continue;
    }

    agentsByLineage.set(agent.lineage, [agent]);
  }

  return [...agentsByLineage.entries()]
    .map(([lineage, lineageAgents]) => ({
      lineage,
      population: lineageAgents.length,
      populationFraction: lineageAgents.length / agents.length,
      meanPrimaryEnergyShare: mean(lineageAgents.map((agent) => getPrimaryEnergyShare(agent))),
      meanSecondaryEnergyShare: mean(lineageAgents.map((agent) => getSecondaryEnergyShare(agent))),
      meanHarvestEfficiency2: mean(lineageAgents.map((agent) => Math.max(0, agent.genome.harvestEfficiency2 ?? 0))),
      meanSecondaryHarvestShare: mean(lineageAgents.map((agent) => getSecondaryHarvestShare(agent)))
    }))
    .sort((a, b) => {
      if (b.population !== a.population) {
        return b.population - a.population;
      }
      return a.lineage - b.lineage;
    });
}

function buildSpecializationStrata(
  agents: Agent[]
): Record<SubstrateSpecializationBand, SubstrateSpecializationBandMetrics> {
  return {
    primaryBiased: buildSpecializationBandMetrics(
      agents.filter((agent) => classifySpecializationBand(getSecondaryHarvestShare(agent)) === 'primaryBiased'),
      agents.length
    ),
    mixed: buildSpecializationBandMetrics(
      agents.filter((agent) => classifySpecializationBand(getSecondaryHarvestShare(agent)) === 'mixed'),
      agents.length
    ),
    secondaryBiased: buildSpecializationBandMetrics(
      agents.filter((agent) => classifySpecializationBand(getSecondaryHarvestShare(agent)) === 'secondaryBiased'),
      agents.length
    )
  };
}

function buildSpecializationBandMetrics(
  agents: Agent[],
  totalPopulation: number
): SubstrateSpecializationBandMetrics {
  return {
    population: agents.length,
    populationFraction: totalPopulation > 0 ? agents.length / totalPopulation : 0,
    meanPrimaryEnergyShare: mean(agents.map((agent) => getPrimaryEnergyShare(agent))),
    meanSecondaryEnergyShare: mean(agents.map((agent) => getSecondaryEnergyShare(agent)))
  };
}

function emptySpecializationBandMetrics(): SubstrateSpecializationBandMetrics {
  return {
    population: 0,
    populationFraction: 0,
    meanPrimaryEnergyShare: 0,
    meanSecondaryEnergyShare: 0
  };
}

function buildSpecializationBandAggregate(
  metrics: SubstrateObservabilityMetrics[],
  band: SubstrateSpecializationBand
): SubstrateSpecializationBandAggregate {
  return {
    populationFraction: aggregate(metrics.map((value) => value.specializationStrata[band].populationFraction)),
    meanPrimaryEnergyShare: aggregate(metrics.map((value) => value.specializationStrata[band].meanPrimaryEnergyShare)),
    meanSecondaryEnergyShare: aggregate(
      metrics.map((value) => value.specializationStrata[band].meanSecondaryEnergyShare)
    )
  };
}

function aggregate(values: number[]): NumericAggregate {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0 };
  }

  return buildNumericAggregate(values);
}

function getPrimaryEnergyShare(agent: Agent): number {
  const pools = getAgentEnergyPools(agent);
  return pools.total > 0 ? pools.primary / pools.total : 0;
}

function getSecondaryEnergyShare(agent: Agent): number {
  const pools = getAgentEnergyPools(agent);
  return pools.total > 0 ? pools.secondary / pools.total : 0;
}

function getSecondaryHarvestShare(agent: Agent): number {
  const primaryHarvest = Math.max(0, agent.genome.harvest);
  const secondaryHarvest = Math.max(0, agent.genome.harvestEfficiency2 ?? 0);
  const totalHarvest = primaryHarvest + secondaryHarvest;
  return totalHarvest > 0 ? secondaryHarvest / totalHarvest : 0;
}

function classifySpecializationBand(secondaryHarvestShare: number): SubstrateSpecializationBand {
  if (secondaryHarvestShare <= PRIMARY_BIASED_MAX_SECONDARY_SHARE) {
    return 'primaryBiased';
  }
  if (secondaryHarvestShare >= SECONDARY_BIASED_MIN_SECONDARY_SHARE) {
    return 'secondaryBiased';
  }
  return 'mixed';
}
