import {
  buildActivitySeedPanelThresholdAggregate,
  buildActivitySeedPanelThresholdSeedResult,
  buildNullableNumericAggregate,
  buildNumericAggregate,
  divideOrNull,
  findThresholdResult,
  max
} from './activity-thresholds';
import {
  CladeActivityCladogenesisSweepSeedResult,
  CladeActivityPersistenceSummary,
  CladeActivityProbeSummary,
  CladeActivitySeedPanelSeedResult,
  CladeActivitySeedPanelThresholdSeedResult,
  CladeSpeciesActivityCouplingSeedResult,
  CladeSpeciesActivityCouplingThresholdAggregate,
  CladeSpeciesActivityCouplingThresholdSeedResult,
  CladeSpeciesCountAggregate,
  CladeSpeciesCountSummary,
  EvolutionHistorySnapshot,
  SpeciesActivityPersistenceSummary,
  SpeciesActivityProbeSummary,
  SpeciesActivitySeedPanelSeedResult,
  SpeciesActivitySeedPanelThresholdSeedResult,
  StepSummary,
  TaxonHistory
} from './types';

export interface ActivitySeedResultInput {
  seed: number;
  finalSummary: StepSummary;
  history: EvolutionHistorySnapshot;
  windowSize: number;
  burnIn: number;
  minSurvivalTicks: number[];
}

export interface SpeciesActivitySeedPanelResultDependencies {
  analyzeSpeciesActivitySummary: (input: {
    species: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
  }) => SpeciesActivityProbeSummary;
  analyzePersistentSpeciesActivitySummary: (input: {
    species: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
    minSurvivalTicks: number;
  }) => SpeciesActivityPersistenceSummary;
}

export interface CladeActivitySeedPanelResultDependencies {
  analyzeCladeActivitySummary: (input: {
    clades: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
  }) => CladeActivityProbeSummary;
  analyzePersistentCladeActivitySummary: (input: {
    clades: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
    minSurvivalTicks: number;
  }) => CladeActivityPersistenceSummary;
}

export function buildSpeciesActivitySeedPanelSeedResult(
  input: ActivitySeedResultInput,
  dependencies: SpeciesActivitySeedPanelResultDependencies
): SpeciesActivitySeedPanelSeedResult {
  const rawSummary = dependencies.analyzeSpeciesActivitySummary({
    species: input.history.species,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.finalSummary.tick
  });

  return {
    seed: input.seed,
    finalSummary: input.finalSummary,
    rawSummary,
    thresholds: input.minSurvivalTicks.map((threshold) =>
      buildActivitySeedPanelThresholdSeedResult({
        minSurvivalTicks: threshold,
        summary: dependencies.analyzePersistentSpeciesActivitySummary({
          species: input.history.species,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          maxTick: input.finalSummary.tick,
          minSurvivalTicks: threshold
        })
      })
    )
  };
}

export function buildCladeActivitySeedPanelSeedResult(
  input: ActivitySeedResultInput,
  dependencies: CladeActivitySeedPanelResultDependencies
): CladeActivitySeedPanelSeedResult {
  const rawSummary = dependencies.analyzeCladeActivitySummary({
    clades: input.history.clades,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.finalSummary.tick
  });

  return {
    seed: input.seed,
    finalSummary: input.finalSummary,
    rawSummary,
    thresholds: input.minSurvivalTicks.map((threshold) =>
      buildActivitySeedPanelThresholdSeedResult({
        minSurvivalTicks: threshold,
        summary: dependencies.analyzePersistentCladeActivitySummary({
          clades: input.history.clades,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          maxTick: input.finalSummary.tick,
          minSurvivalTicks: threshold
        })
      })
    )
  };
}

export function buildCladeActivityCladogenesisSeedResult(
  input: ActivitySeedResultInput,
  dependencies: CladeActivitySeedPanelResultDependencies
): CladeActivityCladogenesisSweepSeedResult {
  const activity = buildCladeActivitySeedPanelSeedResult(input, dependencies);

  return {
    ...activity,
    counts: buildCladeSpeciesCountSummary(input.finalSummary, input.history.clades.length, input.history.species.length)
  };
}

export function buildCladeSpeciesActivityCouplingSeedResult(
  input: ActivitySeedResultInput,
  dependencies: SpeciesActivitySeedPanelResultDependencies & CladeActivitySeedPanelResultDependencies
): CladeSpeciesActivityCouplingSeedResult {
  const species = buildSpeciesActivitySeedPanelSeedResult(input, dependencies);
  const clade = buildCladeActivitySeedPanelSeedResult(input, dependencies);

  return {
    seed: input.seed,
    finalSummary: input.finalSummary,
    speciesRawSummary: species.rawSummary,
    cladeRawSummary: clade.rawSummary,
    thresholds: input.minSurvivalTicks.map((minSurvivalTicks) =>
      buildCladeSpeciesActivityCouplingThresholdSeedResult({
        minSurvivalTicks,
        species: findThresholdResult(species.seed, minSurvivalTicks, species.thresholds),
        clade: findThresholdResult(clade.seed, minSurvivalTicks, clade.thresholds)
      })
    )
  };
}

export function buildCladeSpeciesActivityCouplingThresholdAggregate(
  minSurvivalTicks: number,
  seedResults: CladeSpeciesActivityCouplingSeedResult[]
): CladeSpeciesActivityCouplingThresholdAggregate {
  const thresholdResults = seedResults.map((seedResult) =>
    findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds)
  );
  const speciesSeedResults = seedResults.map((seedResult) => ({
    seed: seedResult.seed,
    thresholds: seedResult.thresholds.map((threshold) => threshold.species)
  }));
  const cladeSeedResults = seedResults.map((seedResult) => ({
    seed: seedResult.seed,
    thresholds: seedResult.thresholds.map((threshold) => threshold.clade)
  }));

  return {
    minSurvivalTicks,
    species: buildActivitySeedPanelThresholdAggregate(minSurvivalTicks, speciesSeedResults),
    clade: buildActivitySeedPanelThresholdAggregate(minSurvivalTicks, cladeSeedResults),
    cladeToSpeciesPersistentWindowFraction: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.cladeToSpeciesPersistentWindowFraction === null
          ? []
          : [threshold.cladeToSpeciesPersistentWindowFraction]
      )
    ),
    persistentWindowFractionDelta: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentWindowFractionDelta)
    ),
    cladeToSpeciesPersistentActivityMeanRatio: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.cladeToSpeciesPersistentActivityMeanRatio === null
          ? []
          : [threshold.cladeToSpeciesPersistentActivityMeanRatio]
      )
    ),
    persistentActivityMeanDelta: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentActivityMeanDelta)
    ),
    cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio === null
          ? []
          : [threshold.cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio]
      )
    ),
    persistentAbundanceWeightedActivityMeanDelta: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentAbundanceWeightedActivityMeanDelta)
    )
  };
}

export function buildCladeSpeciesCountAggregate(
  seedResults: CladeActivityCladogenesisSweepSeedResult[]
): CladeSpeciesCountAggregate {
  return {
    activeClades: buildNumericAggregate(seedResults.map((seedResult) => seedResult.counts.activeClades)),
    activeSpecies: buildNumericAggregate(seedResults.map((seedResult) => seedResult.counts.activeSpecies)),
    totalClades: buildNumericAggregate(seedResults.map((seedResult) => seedResult.counts.totalClades)),
    totalSpecies: buildNumericAggregate(seedResults.map((seedResult) => seedResult.counts.totalSpecies)),
    activeCladeToSpeciesRatio: buildNumericAggregate(
      seedResults.map((seedResult) => seedResult.counts.activeCladeToSpeciesRatio)
    ),
    totalCladeToSpeciesRatio: buildNumericAggregate(
      seedResults.map((seedResult) => seedResult.counts.totalCladeToSpeciesRatio)
    )
  };
}

export function truncateEvolutionHistory(history: EvolutionHistorySnapshot, maxTick: number): EvolutionHistorySnapshot {
  return {
    clades: truncateTaxonHistory(history.clades, maxTick),
    species: truncateTaxonHistory(history.species, maxTick),
    extinctClades: history.clades.filter((clade) => clade.extinctTick !== null && clade.extinctTick <= maxTick).length,
    extinctSpecies: history.species.filter((species) => species.extinctTick !== null && species.extinctTick <= maxTick)
      .length
  };
}

function buildCladeSpeciesActivityCouplingThresholdSeedResult(input: {
  minSurvivalTicks: number;
  species: SpeciesActivitySeedPanelThresholdSeedResult;
  clade: CladeActivitySeedPanelThresholdSeedResult;
}): CladeSpeciesActivityCouplingThresholdSeedResult {
  return {
    minSurvivalTicks: input.minSurvivalTicks,
    species: input.species,
    clade: input.clade,
    cladeToSpeciesPersistentWindowFraction: divideOrNull(
      input.clade.persistentWindowFraction,
      input.species.persistentWindowFraction
    ),
    persistentWindowFractionDelta: input.clade.persistentWindowFraction - input.species.persistentWindowFraction,
    cladeToSpeciesPersistentActivityMeanRatio: divideOrNull(
      input.clade.summary.postBurnInPersistentNewActivityMean,
      input.species.summary.postBurnInPersistentNewActivityMean
    ),
    persistentActivityMeanDelta:
      input.clade.summary.postBurnInPersistentNewActivityMean -
      input.species.summary.postBurnInPersistentNewActivityMean,
    cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio: divideOrNull(
      input.clade.summary.postBurnInPersistentNewAbundanceWeightedActivityMean,
      input.species.summary.postBurnInPersistentNewAbundanceWeightedActivityMean
    ),
    persistentAbundanceWeightedActivityMeanDelta:
      input.clade.summary.postBurnInPersistentNewAbundanceWeightedActivityMean -
      input.species.summary.postBurnInPersistentNewAbundanceWeightedActivityMean
  };
}

function buildCladeSpeciesCountSummary(
  finalSummary: StepSummary,
  totalClades: number,
  totalSpecies: number
): CladeSpeciesCountSummary {
  return {
    activeClades: finalSummary.activeClades,
    activeSpecies: finalSummary.activeSpecies,
    totalClades,
    totalSpecies,
    activeCladeToSpeciesRatio: divideOrZero(finalSummary.activeClades, finalSummary.activeSpecies),
    totalCladeToSpeciesRatio: divideOrZero(totalClades, totalSpecies)
  };
}

function truncateTaxonHistory(taxa: TaxonHistory[], maxTick: number): TaxonHistory[] {
  return taxa.flatMap((taxon) => {
    if (taxon.firstSeenTick > maxTick) {
      return [];
    }

    const timeline = taxon.timeline.filter((point) => point.tick <= maxTick);
    if (timeline.length === 0) {
      return [];
    }

    return [
      {
        id: taxon.id,
        firstSeenTick: taxon.firstSeenTick,
        extinctTick: taxon.extinctTick !== null && taxon.extinctTick <= maxTick ? taxon.extinctTick : null,
        totalBirths: timeline.reduce((total, point) => total + point.births, 0),
        totalDeaths: timeline.reduce((total, point) => total + point.deaths, 0),
        peakPopulation: max(timeline.map((point) => point.population)),
        founderContext: taxon.founderContext === undefined ? undefined : { ...taxon.founderContext },
        timeline
      }
    ];
  });
}

function divideOrZero(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
