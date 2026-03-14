import {
  MatchedNullFounderContext,
  TaxonFounderContext,
  TaxonFounderHabitatSchedulePoint,
  TaxonHistory
} from './types';

const MIN_FOUNDER_HABITAT = 0.1;
const MAX_FOUNDER_HABITAT = 2;
export const FOUNDER_HABITAT_BIN_COUNT = 4;

export function buildFounderContextFromHabitatSamples(habitatSamples: number[]): TaxonFounderContext | undefined {
  if (habitatSamples.length === 0) {
    return undefined;
  }

  const habitatMean = habitatSamples.reduce((total, habitat) => total + habitat, 0) / habitatSamples.length;
  return {
    habitatMean,
    habitatBin: founderHabitatBin(habitatMean),
    founderCount: habitatSamples.length
  };
}

export function founderHabitatBin(habitat: number): number {
  const clamped = clamp(habitat, MIN_FOUNDER_HABITAT, MAX_FOUNDER_HABITAT);
  const normalized = (clamped - MIN_FOUNDER_HABITAT) / (MAX_FOUNDER_HABITAT - MIN_FOUNDER_HABITAT);
  return Math.min(FOUNDER_HABITAT_BIN_COUNT - 1, Math.floor(normalized * FOUNDER_HABITAT_BIN_COUNT));
}

export function buildFounderHabitatSchedule(taxa: TaxonHistory[]): TaxonFounderHabitatSchedulePoint[] {
  const birthsByTickAndBin = new Map<string, TaxonFounderHabitatSchedulePoint>();

  for (const taxon of taxa) {
    const habitatBin = taxon.founderContext?.habitatBin;
    if (habitatBin === undefined) {
      continue;
    }

    const key = `${taxon.firstSeenTick}:${habitatBin}`;
    const existing = birthsByTickAndBin.get(key);
    if (existing) {
      existing.births += 1;
      continue;
    }

    birthsByTickAndBin.set(key, {
      tick: taxon.firstSeenTick,
      habitatBin,
      births: 1
    });
  }

  return [...birthsByTickAndBin.values()].sort(
    (left, right) => left.tick - right.tick || left.habitatBin - right.habitatBin
  );
}

export function founderHabitatSchedulesEqual(
  left: TaxonFounderHabitatSchedulePoint[],
  right: TaxonFounderHabitatSchedulePoint[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((point, index) => {
    const other = right[index];
    return other !== undefined && point.tick === other.tick && point.habitatBin === other.habitatBin && point.births === other.births;
  });
}

export function requiresFounderHabitatMatch(
  matchedNullFounderContext: MatchedNullFounderContext
): matchedNullFounderContext is 'founderHabitatBin' {
  return matchedNullFounderContext === 'founderHabitatBin';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
