import {
  EvolutionAnalyticsSnapshot,
  EvolutionHistorySnapshot,
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
  'clade_active_age_max'
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
        point.clades.activeAge.max
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
