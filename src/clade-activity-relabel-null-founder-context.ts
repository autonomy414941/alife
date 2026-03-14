import {
  MatchedNullFounderContext,
  TaxonFounderContext,
  TaxonFounderHabitatCrowdingSchedulePoint,
  TaxonFounderHabitatSchedulePoint,
  TaxonHistory
} from './types';

const MIN_FOUNDER_HABITAT = 0.1;
const MAX_FOUNDER_HABITAT = 2;
export const FOUNDER_HABITAT_BIN_COUNT = 4;
const MAX_FOUNDER_LOCAL_CROWDING = 4;
export const FOUNDER_LOCAL_CROWDING_BIN_COUNT = 4;

export function buildFounderContextFromSums(input: {
  founderHabitatSum: number;
  founderLocalCrowdingSum: number;
  founderCount: number;
}): TaxonFounderContext | undefined {
  if (input.founderCount === 0) {
    return undefined;
  }

  const habitatMean = input.founderHabitatSum / input.founderCount;
  const localCrowdingMean = input.founderLocalCrowdingSum / input.founderCount;
  return {
    habitatMean,
    habitatBin: founderHabitatBin(habitatMean),
    localCrowdingMean,
    localCrowdingBin: founderLocalCrowdingBin(localCrowdingMean),
    founderCount: input.founderCount
  };
}

export function founderHabitatBin(habitat: number): number {
  const clamped = clamp(habitat, MIN_FOUNDER_HABITAT, MAX_FOUNDER_HABITAT);
  const normalized = (clamped - MIN_FOUNDER_HABITAT) / (MAX_FOUNDER_HABITAT - MIN_FOUNDER_HABITAT);
  return Math.min(FOUNDER_HABITAT_BIN_COUNT - 1, Math.floor(normalized * FOUNDER_HABITAT_BIN_COUNT));
}

export function founderLocalCrowdingBin(crowding: number): number {
  const clamped = clamp(crowding, 0, MAX_FOUNDER_LOCAL_CROWDING);
  const normalized = clamped / MAX_FOUNDER_LOCAL_CROWDING;
  return Math.min(FOUNDER_LOCAL_CROWDING_BIN_COUNT - 1, Math.floor(normalized * FOUNDER_LOCAL_CROWDING_BIN_COUNT));
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

export function buildFounderHabitatCrowdingSchedule(
  taxa: TaxonHistory[]
): TaxonFounderHabitatCrowdingSchedulePoint[] {
  const birthsByTickHabitatAndCrowdingBin = new Map<string, TaxonFounderHabitatCrowdingSchedulePoint>();

  for (const taxon of taxa) {
    const habitatBin = taxon.founderContext?.habitatBin;
    const localCrowdingBin = taxon.founderContext?.localCrowdingBin;
    if (habitatBin === undefined || localCrowdingBin === undefined) {
      continue;
    }

    const key = `${taxon.firstSeenTick}:${habitatBin}:${localCrowdingBin}`;
    const existing = birthsByTickHabitatAndCrowdingBin.get(key);
    if (existing) {
      existing.births += 1;
      continue;
    }

    birthsByTickHabitatAndCrowdingBin.set(key, {
      tick: taxon.firstSeenTick,
      habitatBin,
      localCrowdingBin,
      births: 1
    });
  }

  return [...birthsByTickHabitatAndCrowdingBin.values()].sort(
    (left, right) =>
      left.tick - right.tick ||
      left.habitatBin - right.habitatBin ||
      left.localCrowdingBin - right.localCrowdingBin
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

export function founderHabitatCrowdingSchedulesEqual(
  left: TaxonFounderHabitatCrowdingSchedulePoint[],
  right: TaxonFounderHabitatCrowdingSchedulePoint[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((point, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      point.tick === other.tick &&
      point.habitatBin === other.habitatBin &&
      point.localCrowdingBin === other.localCrowdingBin &&
      point.births === other.births
    );
  });
}

export function requiresFounderHabitatMatch(
  matchedNullFounderContext: MatchedNullFounderContext
): matchedNullFounderContext is 'founderHabitatBin' | 'founderHabitatAndCrowdingBin' {
  return (
    matchedNullFounderContext === 'founderHabitatBin' || matchedNullFounderContext === 'founderHabitatAndCrowdingBin'
  );
}

export function requiresFounderHabitatCrowdingMatch(
  matchedNullFounderContext: MatchedNullFounderContext
): matchedNullFounderContext is 'founderHabitatAndCrowdingBin' {
  return matchedNullFounderContext === 'founderHabitatAndCrowdingBin';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
