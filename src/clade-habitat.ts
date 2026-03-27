import { clampGenomeV2TraitValue, getDefaultGenomeV2TraitValue, getTrait } from './genome-v2';
import { Agent, Genome, GenomeV2, SimulationConfig } from './types';

type HabitatAgent = Pick<Agent, 'lineage' | 'species' | 'x' | 'y' | 'genomeV2'>;

const DEFAULT_HABITAT_PREFERENCE = getDefaultGenomeV2TraitValue('habitat_preference');

interface InitializeHabitatPreferencesOptions {
  agents: HabitatAgent[];
  habitatPreference: Map<number, number>;
  fertilityAt: (agent: HabitatAgent) => number;
  taxonOf: (agent: HabitatAgent) => number;
}

interface ResolveMutatedSpeciesHabitatPreferenceOptions {
  parentSpecies: number;
  parentGenome: Genome | GenomeV2;
  childGenome: Genome | GenomeV2;
  speciesHabitatPreference: Map<number, number>;
  config: Pick<SimulationConfig, 'habitatPreferenceMutation'>;
}

interface SetFoundCladeHabitatPreferenceOptions {
  cladeHabitatPreference: Map<number, number>;
  lineage: number;
  fertility: number;
  genomeV2?: GenomeV2;
}

interface AdaptCladeHabitatPreferenceOptions {
  cladeHabitatPreference: Map<number, number>;
  lineage: number;
  fertility: number;
  config: Pick<SimulationConfig, 'adaptiveCladeHabitatMemoryRate'>;
}

interface HabitatMatchEfficiencyOptions {
  agent: Pick<Agent, 'species' | 'lineage' | 'genomeV2'>;
  fertility: number;
  speciesHabitatPreference: Map<number, number>;
  cladeHabitatPreference: Map<number, number>;
  config: Pick<SimulationConfig, 'habitatPreferenceStrength' | 'cladeHabitatCoupling'>;
}

export function initializeSpeciesHabitatPreferences(
  agents: HabitatAgent[],
  speciesHabitatPreference: Map<number, number>,
  fertilityAt: (agent: HabitatAgent) => number
): void {
  initializeHabitatPreferences({
    agents,
    habitatPreference: speciesHabitatPreference,
    fertilityAt,
    taxonOf: (agent) => agent.species
  });
}

export function initializeCladeHabitatPreferences(
  agents: HabitatAgent[],
  cladeHabitatPreference: Map<number, number>,
  fertilityAt: (agent: HabitatAgent) => number
): void {
  initializeHabitatPreferences({
    agents,
    habitatPreference: cladeHabitatPreference,
    fertilityAt,
    taxonOf: (agent) => agent.lineage
  });
}

export function getSpeciesHabitatPreference(
  speciesHabitatPreference: Map<number, number>,
  species: number
): number {
  return getHabitatPreference(speciesHabitatPreference, species);
}

export function getCladeHabitatPreference(cladeHabitatPreference: Map<number, number>, lineage: number): number {
  return getHabitatPreference(cladeHabitatPreference, lineage);
}

export function resolveMutatedSpeciesHabitatPreference({
  parentSpecies,
  parentGenome,
  childGenome,
  speciesHabitatPreference,
  config
}: ResolveMutatedSpeciesHabitatPreferenceOptions): number {
  const directPreference = habitatPreferenceTrait(childGenome);
  if (directPreference !== undefined) {
    return directPreference;
  }

  const parentPreference = getSpeciesHabitatPreference(speciesHabitatPreference, parentSpecies);
  const mutationScale = Math.max(0, config.habitatPreferenceMutation);
  if (mutationScale === 0) {
    return parentPreference;
  }

  const parentLegacyGenome = asLegacyGenome(parentGenome);
  const childLegacyGenome = asLegacyGenome(childGenome);
  const harvestShift = childLegacyGenome.harvest - parentLegacyGenome.harvest;
  const metabolismShift = parentLegacyGenome.metabolism - childLegacyGenome.metabolism;
  const signal = harvestShift * 0.65 + metabolismShift * 0.35;
  return clampHabitatPreference(parentPreference + clamp(signal, -1, 1) * mutationScale);
}

export function setFoundCladeHabitatPreference({
  cladeHabitatPreference,
  lineage,
  fertility,
  genomeV2
}: SetFoundCladeHabitatPreferenceOptions): void {
  cladeHabitatPreference.set(lineage, explicitHabitatPreferenceTrait(genomeV2) ?? clampHabitatPreference(fertility));
}

export function adaptCladeHabitatPreference({
  cladeHabitatPreference,
  lineage,
  fertility,
  config
}: AdaptCladeHabitatPreferenceOptions): void {
  const rate = clamp(config.adaptiveCladeHabitatMemoryRate, 0, 1);
  if (rate === 0) {
    return;
  }

  const currentPreference = getCladeHabitatPreference(cladeHabitatPreference, lineage);
  const targetPreference = clampHabitatPreference(fertility);
  cladeHabitatPreference.set(
    lineage,
    clampHabitatPreference(currentPreference + (targetPreference - currentPreference) * rate)
  );
}

export function habitatMatchEfficiency({
  agent,
  fertility,
  speciesHabitatPreference,
  cladeHabitatPreference,
  config
}: HabitatMatchEfficiencyOptions): number {
  const strength = Math.max(0, config.habitatPreferenceStrength);
  if (strength === 0) {
    return 1;
  }

  const preference =
    habitatPreferenceTraitWithFallback(agent.genomeV2) ??
    blendedHabitatPreference(agent.species, agent.lineage, speciesHabitatPreference, cladeHabitatPreference, config);
  const mismatch = fertility - preference;
  return Math.max(0.05, Math.exp(-strength * mismatch * mismatch));
}

function initializeHabitatPreferences({
  agents,
  habitatPreference,
  fertilityAt,
  taxonOf
}: InitializeHabitatPreferencesOptions): void {
  const sums = new Map<number, { total: number; count: number }>();
  for (const agent of agents) {
    const taxon = taxonOf(agent);
    const current = sums.get(taxon) ?? { total: 0, count: 0 };
    current.total += explicitHabitatPreferenceTrait(agent.genomeV2) ?? fertilityAt(agent);
    current.count += 1;
    sums.set(taxon, current);
  }

  for (const [taxon, { total, count }] of sums) {
    habitatPreference.set(
      taxon,
      clampHabitatPreference(count === 0 ? DEFAULT_HABITAT_PREFERENCE : total / count)
    );
  }
}

function getHabitatPreference(habitatPreference: Map<number, number>, taxon: number): number {
  const existing = habitatPreference.get(taxon);
  if (existing !== undefined) {
    return existing;
  }

  habitatPreference.set(taxon, DEFAULT_HABITAT_PREFERENCE);
  return DEFAULT_HABITAT_PREFERENCE;
}

function blendedHabitatPreference(
  species: number,
  lineage: number,
  speciesHabitatPreference: Map<number, number>,
  cladeHabitatPreference: Map<number, number>,
  config: Pick<SimulationConfig, 'cladeHabitatCoupling'>
): number {
  const speciesPreference = getSpeciesHabitatPreference(speciesHabitatPreference, species);
  const coupling = clamp(config.cladeHabitatCoupling, 0, 1);
  if (coupling === 0) {
    return speciesPreference;
  }

  const cladePreference = getCladeHabitatPreference(cladeHabitatPreference, lineage);
  return clampHabitatPreference(speciesPreference * (1 - coupling) + cladePreference * coupling);
}

function clampHabitatPreference(value: number): number {
  return clampGenomeV2TraitValue('habitat_preference', value);
}

function habitatPreferenceTrait(genome: Genome | GenomeV2): number | undefined {
  if (!isGenomeV2(genome) || !genome.traits.has('habitat_preference')) {
    return undefined;
  }
  return clampHabitatPreference(getTrait(genome, 'habitat_preference'));
}

function explicitHabitatPreferenceTrait(genomeV2: GenomeV2 | undefined): number | undefined {
  if (genomeV2 === undefined || !genomeV2.traits.has('habitat_preference')) {
    return undefined;
  }
  return clampHabitatPreference(getTrait(genomeV2, 'habitat_preference'));
}

function habitatPreferenceTraitWithFallback(genomeV2: GenomeV2 | undefined): number | undefined {
  if (genomeV2 === undefined) {
    return undefined;
  }
  return clampHabitatPreference(getTrait(genomeV2, 'habitat_preference'));
}

function asLegacyGenome(genome: Genome | GenomeV2): Genome {
  if (!isGenomeV2(genome)) {
    return genome;
  }
  return {
    metabolism: getTrait(genome, 'metabolism'),
    harvest: getTrait(genome, 'harvest'),
    aggression: getTrait(genome, 'aggression'),
    harvestEfficiency2: genome.traits.has('harvestEfficiency2') ? getTrait(genome, 'harvestEfficiency2') : undefined
  };
}

function isGenomeV2(genome: Genome | GenomeV2): genome is GenomeV2 {
  return 'traits' in genome;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
