import { Rng } from './rng';
import { TaxonBirthSchedulePoint, TaxonHistory } from './types';

interface PseudoCladeAccumulator {
  id: number;
  firstSeenTick: number;
  populationByTick: number[];
  birthsByTick: number[];
  deathsByTick: number[];
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
}

export function buildMatchedSchedulePseudoClades(input: {
  species: TaxonHistory[];
  clades: TaxonHistory[];
  maxTick: number;
  relabelSeed: number;
}): TaxonHistory[] {
  const rng = new Rng(input.relabelSeed);
  const speciesByTick = new Map<number, TaxonHistory[]>();
  for (const taxon of input.species) {
    const speciesAtTick = speciesByTick.get(taxon.firstSeenTick);
    if (speciesAtTick) {
      speciesAtTick.push(taxon);
    } else {
      speciesByTick.set(taxon.firstSeenTick, [taxon]);
    }
  }

  const cladeBirthsByTick = new Map<number, number>();
  for (const schedulePoint of buildTaxonBirthSchedule(input.clades)) {
    cladeBirthsByTick.set(schedulePoint.tick, schedulePoint.births);
  }

  const pseudoClades: PseudoCladeAccumulator[] = [];
  const ticks = [...new Set([...speciesByTick.keys(), ...cladeBirthsByTick.keys()])].sort((a, b) => a - b);
  let nextPseudoCladeId = 1;

  for (const tick of ticks) {
    const speciesBornAtTick = rng.shuffle([...(speciesByTick.get(tick) ?? [])]);
    const birthsRequired = cladeBirthsByTick.get(tick) ?? 0;
    if (birthsRequired > speciesBornAtTick.length) {
      throw new Error(`Pseudo-clade null requires at least ${birthsRequired} species at tick ${tick}`);
    }

    for (let founderIndex = 0; founderIndex < birthsRequired; founderIndex += 1) {
      const pseudoClade = createPseudoCladeAccumulator(nextPseudoCladeId, tick, input.maxTick);
      nextPseudoCladeId += 1;
      assignSpeciesToPseudoClade(pseudoClade, speciesBornAtTick[founderIndex], input.maxTick);
      pseudoClades.push(pseudoClade);
    }

    const remainingSpecies = speciesBornAtTick.slice(birthsRequired);
    if (remainingSpecies.length === 0) {
      continue;
    }

    const candidatePseudoClades =
      tick === 0
        ? pseudoClades.filter((pseudoClade) => pseudoClade.firstSeenTick === 0)
        : pseudoClades.filter((pseudoClade) => pseudoClade.populationByTick[tick - 1] > 0);
    if (candidatePseudoClades.length === 0) {
      throw new Error(`Pseudo-clade null found no active clades before tick ${tick}`);
    }

    for (const species of remainingSpecies) {
      assignSpeciesToPseudoClade(rng.pick(candidatePseudoClades), species, input.maxTick);
    }
  }

  const pseudoHistory = pseudoClades.map((pseudoClade) => finalizePseudoCladeAccumulator(pseudoClade, input.maxTick));
  const actualBirthSchedule = buildTaxonBirthSchedule(input.clades);
  const pseudoBirthSchedule = buildTaxonBirthSchedule(pseudoHistory);
  if (!taxonBirthSchedulesEqual(actualBirthSchedule, pseudoBirthSchedule)) {
    throw new Error('Pseudo-clade null failed to preserve the clade birth schedule');
  }

  return pseudoHistory;
}

export function countActiveTaxaAtTick(taxa: TaxonHistory[], tick: number): number {
  return taxa.filter((taxon) => {
    const lastPoint = taxon.timeline[taxon.timeline.length - 1];
    return lastPoint !== undefined && lastPoint.tick === tick && lastPoint.population > 0;
  }).length;
}

export function buildTaxonBirthSchedule(taxa: TaxonHistory[]): TaxonBirthSchedulePoint[] {
  const birthsByTick = new Map<number, number>();
  for (const taxon of taxa) {
    birthsByTick.set(taxon.firstSeenTick, (birthsByTick.get(taxon.firstSeenTick) ?? 0) + 1);
  }

  return [...birthsByTick.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tick, births]) => ({
      tick,
      births
    }));
}

export function taxonBirthSchedulesEqual(
  left: TaxonBirthSchedulePoint[],
  right: TaxonBirthSchedulePoint[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (schedulePoint, index) =>
      schedulePoint.tick === right[index]?.tick && schedulePoint.births === right[index]?.births
  );
}

function createPseudoCladeAccumulator(id: number, firstSeenTick: number, maxTick: number): PseudoCladeAccumulator {
  return {
    id,
    firstSeenTick,
    populationByTick: Array.from({ length: maxTick + 1 }, () => 0),
    birthsByTick: Array.from({ length: maxTick + 1 }, () => 0),
    deathsByTick: Array.from({ length: maxTick + 1 }, () => 0),
    totalBirths: 0,
    totalDeaths: 0,
    peakPopulation: 0
  };
}

function assignSpeciesToPseudoClade(pseudoClade: PseudoCladeAccumulator, species: TaxonHistory, maxTick: number): void {
  for (const point of species.timeline) {
    if (point.tick < 0 || point.tick > maxTick) {
      continue;
    }
    pseudoClade.populationByTick[point.tick] += point.population;
    pseudoClade.birthsByTick[point.tick] += point.births;
    pseudoClade.deathsByTick[point.tick] += point.deaths;
    pseudoClade.peakPopulation = Math.max(pseudoClade.peakPopulation, pseudoClade.populationByTick[point.tick]);
  }

  pseudoClade.totalBirths += species.totalBirths;
  pseudoClade.totalDeaths += species.totalDeaths;
}

function finalizePseudoCladeAccumulator(pseudoClade: PseudoCladeAccumulator, maxTick: number): TaxonHistory {
  let extinctTick: number | null = null;
  let lastRecordedTick = maxTick;
  for (let tick = Math.max(1, pseudoClade.firstSeenTick); tick <= maxTick; tick += 1) {
    if (pseudoClade.populationByTick[tick - 1] > 0 && pseudoClade.populationByTick[tick] === 0) {
      extinctTick = tick;
      lastRecordedTick = tick;
      break;
    }
  }

  const timeline = [];
  for (let tick = pseudoClade.firstSeenTick; tick <= lastRecordedTick; tick += 1) {
    timeline.push({
      tick,
      population: pseudoClade.populationByTick[tick],
      births: pseudoClade.birthsByTick[tick],
      deaths: pseudoClade.deathsByTick[tick]
    });
  }

  return {
    id: pseudoClade.id,
    firstSeenTick: pseudoClade.firstSeenTick,
    extinctTick,
    totalBirths: pseudoClade.totalBirths,
    totalDeaths: pseudoClade.totalDeaths,
    peakPopulation: pseudoClade.peakPopulation,
    timeline
  };
}
