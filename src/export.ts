import {
  DisturbanceGridStudyExport,
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
  'forcing_cycle_length',
  'forcing_phase',
  'forcing_wave',
  'forcing_regen_multiplier',
  'forcing_fertility_contrast_multiplier',
  'disturbance_interval',
  'disturbance_phase_offset',
  'disturbance_energy_loss',
  'disturbance_resource_loss',
  'disturbance_radius',
  'disturbance_refugia_fraction',
  'disturbance_events_window',
  'disturbance_last_event_tick',
  'disturbance_last_population_shock',
  'disturbance_last_resource_shock',
  'disturbance_last_affected_cell_fraction',
  'disturbance_last_refugia_cell_fraction',
  'resilience_recovery_ticks',
  'resilience_recovery_progress',
  'resilience_recovery_relapses',
  'resilience_sustained_recovery_ticks',
  'resilience_population_trough_depth',
  'resilience_population_trough_ticks',
  'resilience_delayed_population_shock_depth',
  'resilience_pre_turnover_rate',
  'resilience_post_turnover_rate',
  'resilience_turnover_spike',
  'resilience_extinction_burst_depth',
  'resilience_memory_event_count',
  'resilience_memory_recovered_event_fraction',
  'resilience_memory_relapse_event_fraction',
  'resilience_memory_stability_index_mean',
  'resilience_latest_event_seasonal_phase',
  'resilience_latest_event_recovery_lag_ticks',
  'resilience_memory_recovery_lag_ticks_mean',
  'resilience_memory_event_phase_mean',
  'resilience_memory_event_phase_concentration',
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
  'final_species_net_diversification_rate_max',
  'final_resilience_stability_index_mean',
  'final_resilience_stability_index_min',
  'final_resilience_stability_index_max',
  'final_resilience_memory_stability_index_mean',
  'final_resilience_memory_stability_index_min',
  'final_resilience_memory_stability_index_max',
  'final_resilience_relapse_event_fraction_mean',
  'final_resilience_relapse_event_fraction_min',
  'final_resilience_relapse_event_fraction_max'
] as const;

export const DISTURBANCE_GRID_STUDY_CSV_COLUMNS = [
  'interval',
  'amplitude',
  'phase',
  'global_resilience_stability_mean',
  'local_resilience_stability_mean',
  'global_memory_stability_mean',
  'local_memory_stability_mean',
  'global_relapse_event_fraction_mean',
  'local_relapse_event_fraction_mean',
  'delta_resilience_stability_mean',
  'delta_resilience_stability_min',
  'delta_resilience_stability_max',
  'delta_resilience_stability_positive_fraction',
  'delta_memory_stability_mean',
  'delta_memory_stability_min',
  'delta_memory_stability_max',
  'delta_memory_stability_positive_fraction',
  'relapse_event_reduction_mean',
  'relapse_event_reduction_min',
  'relapse_event_reduction_max',
  'relapse_event_reduction_positive_fraction',
  'turnover_spike_reduction_mean',
  'turnover_spike_reduction_min',
  'turnover_spike_reduction_max',
  'turnover_spike_reduction_positive_fraction',
  'path_dependence_gain_mean',
  'path_dependence_gain_min',
  'path_dependence_gain_max',
  'path_dependence_gain_positive_fraction',
  'global_latest_event_phase_mean',
  'local_latest_event_phase_mean',
  'global_memory_event_phase_concentration_mean',
  'local_memory_event_phase_concentration_mean',
  'latest_recovery_lag_reduction_mean',
  'latest_recovery_lag_reduction_min',
  'latest_recovery_lag_reduction_max',
  'latest_recovery_lag_reduction_positive_fraction',
  'memory_recovery_lag_reduction_mean',
  'memory_recovery_lag_reduction_min',
  'memory_recovery_lag_reduction_max',
  'memory_recovery_lag_reduction_positive_fraction',
  'hypothesis_support'
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

export function disturbanceGridStudyToJson(exportData: DisturbanceGridStudyExport): string {
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
        point.forcing.cycleLength,
        point.forcing.phase,
        point.forcing.wave,
        point.forcing.regenMultiplier,
        point.forcing.fertilityContrastMultiplier,
        point.disturbance.interval,
        point.disturbance.phaseOffset,
        point.disturbance.energyLoss,
        point.disturbance.resourceLoss,
        point.disturbance.radius,
        point.disturbance.refugiaFraction,
        point.disturbance.eventsInWindow,
        point.disturbance.lastEventTick,
        point.disturbance.lastEventPopulationShock,
        point.disturbance.lastEventResourceShock,
        point.disturbance.lastEventAffectedCellFraction,
        point.disturbance.lastEventRefugiaCellFraction,
        point.resilience.recoveryTicks,
        point.resilience.recoveryProgress,
        point.resilience.recoveryRelapses,
        point.resilience.sustainedRecoveryTicks,
        point.resilience.populationTroughDepth,
        point.resilience.populationTroughTicks,
        point.resilience.delayedPopulationShockDepth,
        point.resilience.preDisturbanceTurnoverRate,
        point.resilience.postDisturbanceTurnoverRate,
        point.resilience.turnoverSpike,
        point.resilience.extinctionBurstDepth,
        point.resilience.memoryEventCount,
        point.resilience.memoryRecoveredEventFraction,
        point.resilience.memoryRelapseEventFraction,
        point.resilience.memoryStabilityIndexMean,
        point.resilience.latestEventSeasonalPhase,
        point.resilience.latestEventRecoveryLagTicks,
        point.resilience.memoryRecoveryLagTicksMean,
        point.resilience.memoryEventPhaseMean,
        point.resilience.memoryEventPhaseConcentration,
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
    aggregate.finalSpeciesNetDiversificationRate.max,
    aggregate.finalResilienceStabilityIndex.mean,
    aggregate.finalResilienceStabilityIndex.min,
    aggregate.finalResilienceStabilityIndex.max,
    aggregate.finalResilienceMemoryStabilityIndex.mean,
    aggregate.finalResilienceMemoryStabilityIndex.min,
    aggregate.finalResilienceMemoryStabilityIndex.max,
    aggregate.finalResilienceRelapseEventFraction.mean,
    aggregate.finalResilienceRelapseEventFraction.min,
    aggregate.finalResilienceRelapseEventFraction.max
  ]);
  return `${EXPERIMENT_AGGREGATE_CSV_COLUMNS.join(',')}\n${row}\n`;
}

export function disturbanceGridStudyToCsv(exportData: DisturbanceGridStudyExport): string {
  const rows = [DISTURBANCE_GRID_STUDY_CSV_COLUMNS.join(',')];

  for (const cell of exportData.cells) {
    rows.push(
      toCsvRow([
        cell.interval,
        cell.amplitude,
        cell.phase,
        cell.global.finalResilienceStabilityIndex.mean,
        cell.local.finalResilienceStabilityIndex.mean,
        cell.global.finalResilienceMemoryStabilityIndex.mean,
        cell.local.finalResilienceMemoryStabilityIndex.mean,
        cell.global.finalResilienceRelapseEventFraction.mean,
        cell.local.finalResilienceRelapseEventFraction.mean,
        cell.pairedDeltas.resilienceStabilityDelta.mean,
        cell.pairedDeltas.resilienceStabilityDelta.min,
        cell.pairedDeltas.resilienceStabilityDelta.max,
        cell.pairedDeltas.resilienceStabilityDelta.positiveFraction,
        cell.pairedDeltas.memoryStabilityDelta.mean,
        cell.pairedDeltas.memoryStabilityDelta.min,
        cell.pairedDeltas.memoryStabilityDelta.max,
        cell.pairedDeltas.memoryStabilityDelta.positiveFraction,
        cell.pairedDeltas.relapseEventReduction.mean,
        cell.pairedDeltas.relapseEventReduction.min,
        cell.pairedDeltas.relapseEventReduction.max,
        cell.pairedDeltas.relapseEventReduction.positiveFraction,
        cell.pairedDeltas.turnoverSpikeReduction.mean,
        cell.pairedDeltas.turnoverSpikeReduction.min,
        cell.pairedDeltas.turnoverSpikeReduction.max,
        cell.pairedDeltas.turnoverSpikeReduction.positiveFraction,
        cell.pairedDeltas.pathDependenceGain.mean,
        cell.pairedDeltas.pathDependenceGain.min,
        cell.pairedDeltas.pathDependenceGain.max,
        cell.pairedDeltas.pathDependenceGain.positiveFraction,
        cell.timingDiagnostics.globalLatestEventPhaseMean,
        cell.timingDiagnostics.localLatestEventPhaseMean,
        cell.timingDiagnostics.globalMemoryEventPhaseConcentrationMean,
        cell.timingDiagnostics.localMemoryEventPhaseConcentrationMean,
        cell.pairedDeltas.latestRecoveryLagReduction.mean,
        cell.pairedDeltas.latestRecoveryLagReduction.min,
        cell.pairedDeltas.latestRecoveryLagReduction.max,
        cell.pairedDeltas.latestRecoveryLagReduction.positiveFraction,
        cell.pairedDeltas.memoryRecoveryLagReduction.mean,
        cell.pairedDeltas.memoryRecoveryLagReduction.min,
        cell.pairedDeltas.memoryRecoveryLagReduction.max,
        cell.pairedDeltas.memoryRecoveryLagReduction.positiveFraction,
        cell.hypothesisSupport ? 1 : 0
      ])
    );
  }

  return `${rows.join('\n')}\n`;
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
