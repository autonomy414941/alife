import {
  buildTaxonBirthSchedule,
  taxonBirthSchedulesEqual
} from './clade-activity-relabel-null-matched-schedule';
import { Rng } from './rng';
import { TaxonHistory } from './types';

export function buildPermutedCladeProfileNull(input: {
  clades: TaxonHistory[];
  maxTick: number;
  relabelSeed: number;
}): TaxonHistory[] {
  const birthTicks = expandBirthSchedule(input.clades);
  const prototypes = new Rng(input.relabelSeed).shuffle([...input.clades]);
  if (birthTicks.length !== prototypes.length) {
    throw new Error('Permuted clade-profile null requires one prototype per observed clade birth');
  }

  const pseudoClades = birthTicks.map((firstSeenTick, index) =>
    shiftCladeProfile(prototypes[index], firstSeenTick, input.maxTick, index + 1)
  );
  const actualBirthSchedule = buildTaxonBirthSchedule(input.clades);
  const pseudoBirthSchedule = buildTaxonBirthSchedule(pseudoClades);
  if (!taxonBirthSchedulesEqual(actualBirthSchedule, pseudoBirthSchedule)) {
    throw new Error('Permuted clade-profile null failed to preserve the clade birth schedule');
  }

  return pseudoClades;
}

function expandBirthSchedule(clades: TaxonHistory[]): number[] {
  return buildTaxonBirthSchedule(clades).flatMap((schedulePoint) =>
    Array.from({ length: schedulePoint.births }, () => schedulePoint.tick)
  );
}

function shiftCladeProfile(
  prototype: TaxonHistory | undefined,
  firstSeenTick: number,
  maxTick: number,
  id: number
): TaxonHistory {
  if (!prototype) {
    throw new Error('Permuted clade-profile null is missing a prototype clade');
  }

  const tickOffset = firstSeenTick - prototype.firstSeenTick;
  const timeline = prototype.timeline
    .map((point) => ({
      tick: point.tick + tickOffset,
      population: point.population,
      births: point.births,
      deaths: point.deaths
    }))
    .filter((point) => point.tick >= firstSeenTick && point.tick <= maxTick);

  const firstPoint = timeline[0];
  if (!firstPoint || firstPoint.tick !== firstSeenTick) {
    throw new Error(`Permuted clade-profile null failed to shift prototype ${prototype.id} to tick ${firstSeenTick}`);
  }

  return {
    id,
    firstSeenTick,
    extinctTick:
      prototype.extinctTick === null || prototype.extinctTick + tickOffset > maxTick
        ? null
        : prototype.extinctTick + tickOffset,
    totalBirths: timeline.reduce((sum, point) => sum + point.births, 0),
    totalDeaths: timeline.reduce((sum, point) => sum + point.deaths, 0),
    peakPopulation: timeline.reduce((peak, point) => Math.max(peak, point.population), 0),
    timeline
  };
}
