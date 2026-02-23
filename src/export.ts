import {
  EvolutionAnalyticsSnapshot,
  EvolutionHistorySnapshot,
  SimulationExperimentExport,
  SimulationRunExport,
  StepSummary
} from './types';

export interface BuildRunExportInput {
  analyticsWindow: number;
  summaries: StepSummary[];
  analytics: EvolutionAnalyticsSnapshot[];
  history: EvolutionHistorySnapshot;
  generatedAt?: string;
}

export const METRICS_CSV_COLUMNS = [
  'tick',
  'population',
  'births',
  'deaths',
  'mean_energy',
  'mean_metabolism',
  'mean_harvest',
  'mean_aggression',
  'active_clades',
  'active_species',
  'dominant_species_share',
  'selection_diff_metabolism',
  'selection_diff_harvest',
  'selection_diff_aggression',
  'clade_extinctions_step',
  'species_extinctions_step',
  'cumulative_extinct_clades',
  'cumulative_extinct_species',
  'window_start_tick',
  'window_end_tick',
  'window_size',
  'species_speciations_window',
  'species_extinctions_window',
  'species_speciation_rate',
  'species_extinction_rate',
  'species_turnover_rate',
  'species_net_diversification_rate',
  'species_extinct_lifespan_count',
  'species_extinct_lifespan_mean',
  'species_extinct_lifespan_max',
  'species_active_age_count',
  'species_active_age_mean',
  'species_active_age_max',
  'clade_originations_window',
  'clade_extinctions_window',
  'clade_origination_rate',
  'clade_extinction_rate',
  'clade_turnover_rate',
  'clade_net_diversification_rate',
  'clade_extinct_lifespan_count',
  'clade_extinct_lifespan_mean',
  'clade_extinct_lifespan_max',
  'clade_active_age_count',
  'clade_active_age_mean',
  'clade_active_age_max',
  'strategy_active_species',
  'strategy_habitat_preference_mean',
  'strategy_habitat_preference_stddev',
  'strategy_habitat_preference_min',
  'strategy_habitat_preference_max',
  'strategy_habitat_preference_weighted_mean',
  'strategy_trophic_level_mean',
  'strategy_trophic_level_stddev',
  'strategy_trophic_level_min',
  'strategy_trophic_level_max',
  'strategy_trophic_level_weighted_mean',
  'strategy_defense_level_mean',
  'strategy_defense_level_stddev',
  'strategy_defense_level_min',
  'strategy_defense_level_max',
  'strategy_defense_level_weighted_mean',
  'locality_occupied_cells',
  'locality_occupied_cell_fraction',
  'locality_mean_dominant_species_share',
  'locality_dominant_species_share_stddev',
  'locality_mean_species_richness',
  'locality_turnover_transitions',
  'locality_turnover_changed_cell_fraction_mean',
  'locality_turnover_changed_cell_fraction_stddev',
  'locality_turnover_per_cell_mean',
  'locality_turnover_per_cell_stddev',
  'locality_turnover_per_cell_max',
  'locality_radius',
  'locality_radius_mean_dominant_species_share',
  'locality_radius_dominant_species_share_stddev',
  'locality_radius_mean_species_richness',
  'locality_radius_center_dominant_alignment',
  'locality_radius_turnover_transitions',
  'locality_radius_turnover_changed_cell_fraction_mean',
  'locality_radius_turnover_changed_cell_fraction_stddev',
  'locality_radius_turnover_per_cell_mean',
  'locality_radius_turnover_per_cell_stddev',
  'locality_radius_turnover_per_cell_max'
] as const;

export const EXPERIMENT_AGGREGATE_CSV_COLUMNS = [
  'runs',
  'extinct_runs',
  'extinction_rate',
  'steps_executed_mean',
  'steps_executed_min',
  'steps_executed_max',
  'final_population_mean',
  'final_population_min',
  'final_population_max',
  'final_mean_energy_mean',
  'final_mean_energy_min',
  'final_mean_energy_max',
  'final_active_clades_mean',
  'final_active_clades_min',
  'final_active_clades_max',
  'final_active_species_mean',
  'final_active_species_min',
  'final_active_species_max',
  'final_dominant_species_share_mean',
  'final_dominant_species_share_min',
  'final_dominant_species_share_max',
  'final_species_speciation_rate_mean',
  'final_species_speciation_rate_min',
  'final_species_speciation_rate_max',
  'final_species_extinction_rate_mean',
  'final_species_extinction_rate_min',
  'final_species_extinction_rate_max',
  'final_species_net_diversification_rate_mean',
  'final_species_net_diversification_rate_min',
  'final_species_net_diversification_rate_max'
] as const;

export function buildRunExport(input: BuildRunExportInput): SimulationRunExport {
  assertAlignedSeries(input.summaries, input.analytics);
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    analyticsWindow: normalizeWindow(input.analyticsWindow),
    summaries: input.summaries,
    analytics: input.analytics,
    history: input.history
  };
}

export function runExportToJson(exportData: SimulationRunExport): string {
  return `${JSON.stringify(exportData, null, 2)}\n`;
}

export function experimentExportToJson(exportData: SimulationExperimentExport): string {
  return `${JSON.stringify(exportData, null, 2)}\n`;
}

export function metricsToCsv(summaries: StepSummary[], analytics: EvolutionAnalyticsSnapshot[]): string {
  assertAlignedSeries(summaries, analytics);
  const rows: string[] = [METRICS_CSV_COLUMNS.join(',')];

  for (let i = 0; i < summaries.length; i += 1) {
    const summary = summaries[i];
    const point = analytics[i];
    rows.push(
      toCsvRow([
        summary.tick,
        summary.population,
        summary.births,
        summary.deaths,
        summary.meanEnergy,
        summary.meanGenome.metabolism,
        summary.meanGenome.harvest,
        summary.meanGenome.aggression,
        summary.activeClades,
        summary.activeSpecies,
        summary.dominantSpeciesShare,
        summary.selectionDifferential.metabolism,
        summary.selectionDifferential.harvest,
        summary.selectionDifferential.aggression,
        summary.cladeExtinctions,
        summary.speciesExtinctions,
        summary.cumulativeExtinctClades,
        summary.cumulativeExtinctSpecies,
        point.window.startTick,
        point.window.endTick,
        point.window.size,
        point.species.speciationsInWindow,
        point.species.extinctionsInWindow,
        point.species.speciationRate,
        point.species.extinctionRate,
        point.species.turnoverRate,
        point.species.netDiversificationRate,
        point.species.extinctLifespan.count,
        point.species.extinctLifespan.mean,
        point.species.extinctLifespan.max,
        point.species.activeAge.count,
        point.species.activeAge.mean,
        point.species.activeAge.max,
        point.clades.originationsInWindow,
        point.clades.extinctionsInWindow,
        point.clades.originationRate,
        point.clades.extinctionRate,
        point.clades.turnoverRate,
        point.clades.netDiversificationRate,
        point.clades.extinctLifespan.count,
        point.clades.extinctLifespan.mean,
        point.clades.extinctLifespan.max,
        point.clades.activeAge.count,
        point.clades.activeAge.mean,
        point.clades.activeAge.max,
        point.strategy.activeSpecies,
        point.strategy.habitatPreference.mean,
        point.strategy.habitatPreference.stdDev,
        point.strategy.habitatPreference.min,
        point.strategy.habitatPreference.max,
        point.strategy.habitatPreference.weightedMean,
        point.strategy.trophicLevel.mean,
        point.strategy.trophicLevel.stdDev,
        point.strategy.trophicLevel.min,
        point.strategy.trophicLevel.max,
        point.strategy.trophicLevel.weightedMean,
        point.strategy.defenseLevel.mean,
        point.strategy.defenseLevel.stdDev,
        point.strategy.defenseLevel.min,
        point.strategy.defenseLevel.max,
        point.strategy.defenseLevel.weightedMean,
        point.locality.occupiedCells,
        point.locality.occupiedCellFraction,
        point.locality.meanDominantSpeciesShare,
        point.locality.dominantSpeciesShareStdDev,
        point.locality.meanSpeciesRichness,
        point.localityTurnover.transitions,
        point.localityTurnover.changedDominantCellFractionMean,
        point.localityTurnover.changedDominantCellFractionStdDev,
        point.localityTurnover.perCellDominantTurnoverMean,
        point.localityTurnover.perCellDominantTurnoverStdDev,
        point.localityTurnover.perCellDominantTurnoverMax,
        point.localityRadius.radius,
        point.localityRadius.meanDominantSpeciesShare,
        point.localityRadius.dominantSpeciesShareStdDev,
        point.localityRadius.meanSpeciesRichness,
        point.localityRadius.centerDominantAlignment,
        point.localityRadiusTurnover.transitions,
        point.localityRadiusTurnover.changedDominantCellFractionMean,
        point.localityRadiusTurnover.changedDominantCellFractionStdDev,
        point.localityRadiusTurnover.perCellDominantTurnoverMean,
        point.localityRadiusTurnover.perCellDominantTurnoverStdDev,
        point.localityRadiusTurnover.perCellDominantTurnoverMax
      ])
    );
  }

  return `${rows.join('\n')}\n`;
}

export function experimentAggregateToCsv(exportData: SimulationExperimentExport): string {
  const { aggregate } = exportData;
  const row = toCsvRow([
    aggregate.runs,
    aggregate.extinctRuns,
    aggregate.extinctionRate,
    aggregate.stepsExecuted.mean,
    aggregate.stepsExecuted.min,
    aggregate.stepsExecuted.max,
    aggregate.finalPopulation.mean,
    aggregate.finalPopulation.min,
    aggregate.finalPopulation.max,
    aggregate.finalMeanEnergy.mean,
    aggregate.finalMeanEnergy.min,
    aggregate.finalMeanEnergy.max,
    aggregate.finalActiveClades.mean,
    aggregate.finalActiveClades.min,
    aggregate.finalActiveClades.max,
    aggregate.finalActiveSpecies.mean,
    aggregate.finalActiveSpecies.min,
    aggregate.finalActiveSpecies.max,
    aggregate.finalDominantSpeciesShare.mean,
    aggregate.finalDominantSpeciesShare.min,
    aggregate.finalDominantSpeciesShare.max,
    aggregate.finalSpeciesSpeciationRate.mean,
    aggregate.finalSpeciesSpeciationRate.min,
    aggregate.finalSpeciesSpeciationRate.max,
    aggregate.finalSpeciesExtinctionRate.mean,
    aggregate.finalSpeciesExtinctionRate.min,
    aggregate.finalSpeciesExtinctionRate.max,
    aggregate.finalSpeciesNetDiversificationRate.mean,
    aggregate.finalSpeciesNetDiversificationRate.min,
    aggregate.finalSpeciesNetDiversificationRate.max
  ]);
  return `${EXPERIMENT_AGGREGATE_CSV_COLUMNS.join(',')}\n${row}\n`;
}

function normalizeWindow(value: number): number {
  return Math.max(1, Math.floor(value));
}

function assertAlignedSeries(summaries: StepSummary[], analytics: EvolutionAnalyticsSnapshot[]): void {
  if (summaries.length !== analytics.length) {
    throw new Error(
      `Summary/analytics length mismatch: summaries=${summaries.length} analytics=${analytics.length}`
    );
  }
  for (let i = 0; i < summaries.length; i += 1) {
    if (summaries[i].tick !== analytics[i].tick) {
      throw new Error(
        `Tick mismatch at index ${i}: summaryTick=${summaries[i].tick} analyticsTick=${analytics[i].tick}`
      );
    }
  }
}

function toCsvRow(values: Array<number | string>): string {
  return values
    .map((value) => escapeCsv(typeof value === 'number' ? numberToString(value) : value))
    .join(',');
}

function numberToString(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  return String(value);
}

function escapeCsv(value: string): string {
  if (!/[,"\n]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}
