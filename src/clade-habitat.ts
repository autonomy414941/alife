import { Agent, Genome, SimulationConfig } from './types';

type HabitatAgent = Pick<Agent, 'lineage' | 'species' | 'x' | 'y'>;

const DEFAULT_HABITAT_PREFERENCE = 1;
const MIN_HABITAT_PREFERENCE = 0.1;
const MAX_HABITAT_PREFERENCE = 2;

interface InitializeHabitatPreferencesOptions {
  agents: HabitatAgent[];
  habitatPreference: Map<number, number>;
  fertilityAt: (agent: HabitatAgent) => number;
  taxonOf: (agent: HabitatAgent) => number;
}

interface ResolveMutatedSpeciesHabitatPreferenceOptions {
  parentSpecies: number;
  parentGenome: Genome;
  childGenome: Genome;
  speciesHabitatPreference: Map<number, number>;
  config: Pick<SimulationConfig, 'habitatPreferenceMutation'>;
}

interface SetFoundCladeHabitatPreferenceOptions {
  cladeHabitatPreference: Map<number, number>;
  lineage: number;
  fertility: number;
}

interface AdaptCladeHabitatPreferenceOptions {
  cladeHabitatPreference: Map<number, number>;
  lineage: number;
  fertility: number;
  config: Pick<SimulationConfig, 'adaptiveCladeHabitatMemoryRate'>;
}

interface HabitatMatchEfficiencyOptions {
  agent: Pick<Agent, 'species' | 'lineage'>;
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
  const parentPreference = getSpeciesHabitatPreference(speciesHabitatPreference, parentSpecies);
  const mutationScale = Math.max(0, config.habitatPreferenceMutation);
  if (mutationScale === 0) {
    return parentPreference;
  }

  const harvestShift = childGenome.harvest - parentGenome.harvest;
  const metabolismShift = parentGenome.metabolism - childGenome.metabolism;
  const signal = harvestShift * 0.65 + metabolismShift * 0.35;
  return clampHabitatPreference(parentPreference + clamp(signal, -1, 1) * mutationScale);
}

export function setFoundCladeHabitatPreference({
  cladeHabitatPreference,
  lineage,
  fertility
}: SetFoundCladeHabitatPreferenceOptions): void {
  cladeHabitatPreference.set(lineage, clampHabitatPreference(fertility));
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

  const preference = blendedHabitatPreference(
    agent.species,
    agent.lineage,
    speciesHabitatPreference,
    cladeHabitatPreference,
    config
  );
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
    current.total += fertilityAt(agent);
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
  return clamp(value, MIN_HABITAT_PREFERENCE, MAX_HABITAT_PREFERENCE);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
