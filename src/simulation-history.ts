import { buildFounderContextFromSums } from './clade-activity-relabel-null-founder-context';
import { Agent, TaxonHistory, TaxonTimelinePoint } from './types';

type FounderContextAgent = Pick<Agent, 'species' | 'lineage' | 'x' | 'y'>;

export interface TaxonHistoryState {
  id: number;
  firstSeenTick: number;
  extinctTick: number | null;
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
  founderHabitatSum: number;
  founderLocalCrowdingSum: number;
  founderCount: number;
  lastPopulation: number;
  timeline: TaxonTimelinePoint[];
}

export interface FounderContextSamples {
  habitatSamples: number[];
  localCrowdingSamples: number[];
}

export function collectFounderContextSamples(
  agents: ReadonlyArray<FounderContextAgent>,
  idOf: (agent: FounderContextAgent) => number,
  tick: number,
  occupancy: number[][],
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number,
  neighborhoodCrowdingAt: (x: number, y: number, occupancy: number[][]) => number
): Map<number, FounderContextSamples> {
  const samples = new Map<number, FounderContextSamples>();
  for (const agent of agents) {
    const id = idOf(agent);
    const current = samples.get(id) ?? emptyFounderContextSamples();
    current.habitatSamples.push(effectiveBiomeFertilityAt(agent.x, agent.y, tick));
    current.localCrowdingSamples.push(neighborhoodCrowdingAt(agent.x, agent.y, occupancy));
    samples.set(id, current);
  }
  return samples;
}

export function seedTaxonHistory(
  history: Map<number, TaxonHistoryState>,
  founderContextSamples: Map<number, FounderContextSamples>,
  tick: number
): void {
  for (const [id, samples] of founderContextSamples) {
    const sums = sumFounderContextSamples(samples);
    history.set(id, {
      id,
      firstSeenTick: tick,
      extinctTick: null,
      totalBirths: sums.founderCount,
      totalDeaths: 0,
      peakPopulation: sums.founderCount,
      founderHabitatSum: sums.founderHabitatSum,
      founderLocalCrowdingSum: sums.founderLocalCrowdingSum,
      founderCount: sums.founderCount,
      lastPopulation: sums.founderCount,
      timeline: [{ tick, population: sums.founderCount, births: sums.founderCount, deaths: 0 }]
    });
  }
}

export function updateTaxonHistory(
  history: Map<number, TaxonHistoryState>,
  tick: number,
  populationCounts: Map<number, number>,
  birthsCounts: Map<number, number>,
  deathsCounts: Map<number, number>,
  founderContextSamples: Map<number, FounderContextSamples>
): number {
  const idsToRecord = new Set<number>();
  for (const id of populationCounts.keys()) {
    idsToRecord.add(id);
  }
  for (const id of birthsCounts.keys()) {
    idsToRecord.add(id);
  }
  for (const id of deathsCounts.keys()) {
    idsToRecord.add(id);
  }
  for (const [id, state] of history) {
    if (state.extinctTick === null || state.lastPopulation > 0) {
      idsToRecord.add(id);
    }
  }

  let extinctionDelta = 0;

  for (const id of idsToRecord) {
    const population = populationCounts.get(id) ?? 0;
    const births = birthsCounts.get(id) ?? 0;
    const deaths = deathsCounts.get(id) ?? 0;

    let state = history.get(id);
    if (!state) {
      const sums = sumFounderContextSamples(founderContextSamples.get(id) ?? emptyFounderContextSamples());
      state = {
        id,
        firstSeenTick: tick,
        extinctTick: null,
        totalBirths: 0,
        totalDeaths: 0,
        peakPopulation: 0,
        founderHabitatSum: sums.founderHabitatSum,
        founderLocalCrowdingSum: sums.founderLocalCrowdingSum,
        founderCount: sums.founderCount,
        lastPopulation: 0,
        timeline: []
      };
      history.set(id, state);
    }

    const hadPopulationBeforeStep = state.lastPopulation > 0 || births > 0;
    const wasExtinct = state.extinctTick !== null;

    state.totalBirths += births;
    state.totalDeaths += deaths;
    state.peakPopulation = Math.max(state.peakPopulation, population);

    if (wasExtinct && population > 0) {
      state.extinctTick = null;
      extinctionDelta -= 1;
    }

    if (state.extinctTick === null && hadPopulationBeforeStep && population === 0) {
      state.extinctTick = tick;
      extinctionDelta += 1;
    }

    state.timeline.push({ tick, population, births, deaths });
    state.lastPopulation = population;
  }

  return extinctionDelta;
}

export function exportTaxonHistory(history: Map<number, TaxonHistoryState>): TaxonHistory[] {
  return [...history.values()]
    .sort((left, right) => left.id - right.id)
    .map((entry) => ({
      id: entry.id,
      firstSeenTick: entry.firstSeenTick,
      extinctTick: entry.extinctTick,
      totalBirths: entry.totalBirths,
      totalDeaths: entry.totalDeaths,
      peakPopulation: entry.peakPopulation,
      founderContext: buildFounderContextFromSums({
        founderHabitatSum: entry.founderHabitatSum,
        founderLocalCrowdingSum: entry.founderLocalCrowdingSum,
        founderCount: entry.founderCount
      }),
      timeline: entry.timeline.map((point) => ({ ...point }))
    }));
}

function emptyFounderContextSamples(): FounderContextSamples {
  return { habitatSamples: [], localCrowdingSamples: [] };
}

function sumFounderContextSamples(samples: FounderContextSamples): {
  founderHabitatSum: number;
  founderLocalCrowdingSum: number;
  founderCount: number;
} {
  return {
    founderHabitatSum: samples.habitatSamples.reduce((total, sample) => total + sample, 0),
    founderLocalCrowdingSum: samples.localCrowdingSamples.reduce((total, sample) => total + sample, 0),
    founderCount: samples.habitatSamples.length
  };
}
