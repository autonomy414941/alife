import {
  clampGenomeV2TraitValue,
  getDefaultGenomeV2TraitValue,
  getGenomeV2TraitDefinition,
  getTrait,
  NON_POLICY_TRAITS
} from './genome-v2';
import { Agent, PhenotypeDiversityMetrics } from './types';

const NICHE_BIN_COUNT = 4;

interface SpeciesPhenotypeSummary {
  population: number;
  centroid: number[];
  nicheSignature: string;
}

interface SpeciesAccumulator {
  population: number;
  sums: number[];
}

interface NicheAccumulator {
  population: number;
  centroidSums: number[];
}

export function summarizePhenotypeDiversity(agents: Agent[]): PhenotypeDiversityMetrics {
  if (agents.length === 0) {
    return {
      effectiveRichness: 0,
      meanPairwiseDistance: 0,
      occupiedNiches: 0,
      speciesPerOccupiedNiche: 0
    };
  }

  const speciesGroups = new Map<number, SpeciesAccumulator>();
  for (const agent of agents) {
    const values = NON_POLICY_TRAITS.map((key) => normalizedTraitValue(agent, key));
    const accumulator = speciesGroups.get(agent.species);
    if (accumulator) {
      accumulator.population += 1;
      for (let i = 0; i < values.length; i += 1) {
        accumulator.sums[i] = (accumulator.sums[i] ?? 0) + values[i]!;
      }
    } else {
      speciesGroups.set(agent.species, {
        population: 1,
        sums: [...values]
      });
    }
  }

  const speciesPhenotypes = Array.from(speciesGroups.values()).map((speciesAgents) =>
    buildSpeciesPhenotypeSummary(speciesAgents)
  );
  const nicheAccumulators = new Map<string, NicheAccumulator>();
  for (const species of speciesPhenotypes) {
    const niche = nicheAccumulators.get(species.nicheSignature);
    if (niche) {
      niche.population += species.population;
      for (let i = 0; i < species.centroid.length; i += 1) {
        niche.centroidSums[i] = (niche.centroidSums[i] ?? 0) + species.centroid[i]! * species.population;
      }
    } else {
      nicheAccumulators.set(species.nicheSignature, {
        population: species.population,
        centroidSums: species.centroid.map((value) => value * species.population)
      });
    }
  }

  const occupiedNiches = nicheAccumulators.size;
  const speciesPerOccupiedNiche = occupiedNiches > 0 ? speciesPhenotypes.length / occupiedNiches : 0;

  const totalPopulation = agents.length;
  const niches = Array.from(nicheAccumulators.values()).map((niche) => ({
    population: niche.population,
    centroid: niche.centroidSums.map((sum) => sum / niche.population)
  }));
  const nicheWeights = niches.map((niche) => niche.population / totalPopulation);
  const simpsonConcentration = nicheWeights.reduce((sum, weight) => sum + weight * weight, 0);
  const giniSimpson = 1 - simpsonConcentration;

  let meanPairwiseDistance = 0;
  if (giniSimpson > 0) {
    let weightedDistance = 0;
    for (let i = 0; i < niches.length; i += 1) {
      for (let j = i + 1; j < niches.length; j += 1) {
        const distance = meanAbsoluteDistance(niches[i]!.centroid, niches[j]!.centroid);
        weightedDistance += 2 * nicheWeights[i]! * nicheWeights[j]! * distance;
      }
    }
    meanPairwiseDistance = weightedDistance / giniSimpson;
  }

  return {
    effectiveRichness: clamp(1 / Math.max(1e-9, simpsonConcentration), 1, occupiedNiches),
    meanPairwiseDistance,
    occupiedNiches,
    speciesPerOccupiedNiche
  };
}

function buildSpeciesPhenotypeSummary(speciesAgents: SpeciesAccumulator): SpeciesPhenotypeSummary {
  const centroid = speciesAgents.sums.map((value) => value / speciesAgents.population);
  return {
    population: speciesAgents.population,
    centroid,
    nicheSignature: centroid.map(binPhenotypeValue).join('|')
  };
}

function normalizedTraitValue(agent: Agent, key: string): number {
  const definition = getGenomeV2TraitDefinition(key);
  if (!definition) {
    return 0;
  }

  const rawValue = resolveTraitValue(agent, key);
  const clampedValue = clampGenomeV2TraitValue(key, rawValue);
  const max = definition.clamp.max;
  if (max === undefined || max <= definition.clamp.min) {
    return clampedValue > definition.clamp.min ? 1 : 0;
  }

  return clamp((clampedValue - definition.clamp.min) / (max - definition.clamp.min), 0, 1);
}

function resolveTraitValue(agent: Agent, key: string): number {
  if (agent.genomeV2) {
    return getTrait(agent.genomeV2, key);
  }

  const definition = getGenomeV2TraitDefinition(key);
  const legacyField = definition?.legacyGenomeField;
  if (legacyField) {
    return agent.genome[legacyField] ?? getDefaultGenomeV2TraitValue(key);
  }

  return getDefaultGenomeV2TraitValue(key);
}

function meanAbsoluteDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < a.length; i += 1) {
    total += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  }
  return total / Math.max(a.length, b.length);
}

function binPhenotypeValue(value: number): number {
  return Math.min(NICHE_BIN_COUNT - 1, Math.floor(clamp(value, 0, 1) * NICHE_BIN_COUNT));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
