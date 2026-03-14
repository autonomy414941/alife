import {
  buildFounderHabitatCrowdingSchedule,
  buildFounderHabitatSchedule,
  founderHabitatCrowdingSchedulesEqual,
  founderHabitatSchedulesEqual,
  requiresFounderHabitatCrowdingMatch,
  requiresFounderHabitatMatch
} from './clade-activity-relabel-null-founder-context';
import { Rng } from './rng';
import { MatchedNullFounderContext, TaxonBirthSchedulePoint, TaxonHistory } from './types';

interface PseudoCladeAccumulator {
  id: number;
  firstSeenTick: number;
  populationByTick: number[];
  birthsByTick: number[];
  deathsByTick: number[];
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
  founderContext?: TaxonHistory['founderContext'];
}

export function buildMatchedSchedulePseudoClades(input: {
  species: TaxonHistory[];
  clades: TaxonHistory[];
  maxTick: number;
  relabelSeed: number;
  matchedNullFounderContext?: MatchedNullFounderContext;
}): TaxonHistory[] {
  const rng = new Rng(input.relabelSeed);
  const matchedNullFounderContext = input.matchedNullFounderContext ?? 'none';
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

    const founderSpecies = pickFounderSpeciesAtTick({
      tick,
      birthsRequired,
      speciesBornAtTick,
      clades: input.clades,
      matchedNullFounderContext
    });
    const founderSpeciesIds = new Set(founderSpecies.map((species) => species.id));
    for (const founder of founderSpecies) {
      const pseudoClade = createPseudoCladeAccumulator(nextPseudoCladeId, tick, input.maxTick);
      nextPseudoCladeId += 1;
      pseudoClade.founderContext = founder.founderContext === undefined ? undefined : { ...founder.founderContext };
      assignSpeciesToPseudoClade(pseudoClade, founder, input.maxTick);
      pseudoClades.push(pseudoClade);
    }

    const remainingSpecies = speciesBornAtTick.filter((species) => !founderSpeciesIds.has(species.id));
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
  if (requiresFounderHabitatCrowdingMatch(matchedNullFounderContext)) {
    const actualFounderHabitatCrowdingSchedule = buildFounderHabitatCrowdingSchedule(input.clades);
    const pseudoFounderHabitatCrowdingSchedule = buildFounderHabitatCrowdingSchedule(pseudoHistory);
    if (
      !founderHabitatCrowdingSchedulesEqual(
        actualFounderHabitatCrowdingSchedule,
        pseudoFounderHabitatCrowdingSchedule
      )
    ) {
      throw new Error('Pseudo-clade null failed to preserve the founder habitat/crowding schedule');
    }
  } else if (requiresFounderHabitatMatch(matchedNullFounderContext)) {
    const actualFounderHabitatSchedule = buildFounderHabitatSchedule(input.clades);
    const pseudoFounderHabitatSchedule = buildFounderHabitatSchedule(pseudoHistory);
    if (!founderHabitatSchedulesEqual(actualFounderHabitatSchedule, pseudoFounderHabitatSchedule)) {
      throw new Error('Pseudo-clade null failed to preserve the founder habitat schedule');
    }
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
    founderContext: pseudoClade.founderContext === undefined ? undefined : { ...pseudoClade.founderContext },
    timeline
  };
}

function pickFounderSpeciesAtTick(input: {
  tick: number;
  birthsRequired: number;
  speciesBornAtTick: TaxonHistory[];
  clades: TaxonHistory[];
  matchedNullFounderContext: MatchedNullFounderContext;
}): TaxonHistory[] {
  if (!requiresFounderHabitatMatch(input.matchedNullFounderContext)) {
    return input.speciesBornAtTick.slice(0, input.birthsRequired);
  }

  if (requiresFounderHabitatCrowdingMatch(input.matchedNullFounderContext)) {
    const requiredCountsByHabitatAndCrowdingBin = new Map<
      string,
      { habitatBin: number; localCrowdingBin: number; births: number }
    >();
    for (const clade of input.clades) {
      if (clade.firstSeenTick !== input.tick) {
        continue;
      }
      const habitatBin = clade.founderContext?.habitatBin;
      const localCrowdingBin = clade.founderContext?.localCrowdingBin;
      if (habitatBin === undefined || localCrowdingBin === undefined) {
        throw new Error(`Clade ${clade.id} is missing founder habitat/crowding context at tick ${input.tick}`);
      }
      const key = `${habitatBin}:${localCrowdingBin}`;
      const existing = requiredCountsByHabitatAndCrowdingBin.get(key);
      if (existing) {
        existing.births += 1;
      } else {
        requiredCountsByHabitatAndCrowdingBin.set(key, { habitatBin, localCrowdingBin, births: 1 });
      }
    }

    const selected = new Set<number>();
    for (const { habitatBin, localCrowdingBin, births } of [...requiredCountsByHabitatAndCrowdingBin.values()].sort(
      (left, right) =>
        left.habitatBin - right.habitatBin || left.localCrowdingBin - right.localCrowdingBin
    )) {
      const candidates = input.speciesBornAtTick.filter(
        (species) =>
          species.founderContext?.habitatBin === habitatBin &&
          species.founderContext?.localCrowdingBin === localCrowdingBin &&
          !selected.has(species.id)
      );
      if (candidates.length < births) {
        throw new Error(
          `Pseudo-clade null requires at least ${births} species in habitat bin ${habitatBin} / crowding bin ${localCrowdingBin} at tick ${input.tick}`
        );
      }
      for (const species of candidates.slice(0, births)) {
        selected.add(species.id);
      }
    }

    const founders = input.speciesBornAtTick.filter((species) => selected.has(species.id));
    if (founders.length !== input.birthsRequired) {
      throw new Error(`Pseudo-clade null failed to select ${input.birthsRequired} founders at tick ${input.tick}`);
    }

    return founders;
  }

  const requiredCountsByHabitatBin = new Map<number, number>();
  for (const clade of input.clades) {
    if (clade.firstSeenTick !== input.tick) {
      continue;
    }
    const habitatBin = clade.founderContext?.habitatBin;
    if (habitatBin === undefined) {
      throw new Error(`Clade ${clade.id} is missing founder habitat context at tick ${input.tick}`);
    }
    requiredCountsByHabitatBin.set(habitatBin, (requiredCountsByHabitatBin.get(habitatBin) ?? 0) + 1);
  }

  const selected = new Set<number>();
  for (const [habitatBin, births] of [...requiredCountsByHabitatBin.entries()].sort((left, right) => left[0] - right[0])) {
    const candidates = input.speciesBornAtTick.filter(
      (species) => species.founderContext?.habitatBin === habitatBin && !selected.has(species.id)
    );
    if (candidates.length < births) {
      throw new Error(
        `Pseudo-clade null requires at least ${births} species in habitat bin ${habitatBin} at tick ${input.tick}`
      );
    }
    for (const species of candidates.slice(0, births)) {
      selected.add(species.id);
    }
  }

  const founders = input.speciesBornAtTick.filter((species) => selected.has(species.id));
  if (founders.length !== input.birthsRequired) {
    throw new Error(`Pseudo-clade null failed to select ${input.birthsRequired} founders at tick ${input.tick}`);
  }

  return founders;
}
