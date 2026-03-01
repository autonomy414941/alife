import { describe, expect, it } from 'vitest';
import {
  DISTURBANCE_GRID_STUDY_CSV_COLUMNS,
  EXPERIMENT_AGGREGATE_CSV_COLUMNS,
  METRICS_CSV_COLUMNS,
  buildRunExport,
  disturbanceGridStudyToCsv,
  disturbanceGridStudyToJson,
  experimentAggregateToCsv,
  metricsToCsv,
  runExportToJson
} from '../src/export';
import { runDisturbanceGridStudy, runExperiment } from '../src/experiment';
import { LifeSimulation } from '../src/simulation';

describe('run export', () => {
  it('builds a JSON export payload for aligned run series', () => {
    const sim = new LifeSimulation({
      seed: 51,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const runData = sim.runWithAnalytics(2, 2);
    const exportData = buildRunExport({
      generatedAt: '2026-02-21T00:00:00.000Z',
      analyticsWindow: 2,
      summaries: runData.summaries,
      analytics: runData.analytics,
      history: sim.history()
    });

    const parsed = JSON.parse(runExportToJson(exportData));
    expect(parsed.generatedAt).toBe('2026-02-21T00:00:00.000Z');
    expect(parsed.analyticsWindow).toBe(2);
    expect(parsed.summaries).toHaveLength(2);
    expect(parsed.analytics).toHaveLength(2);
    expect(parsed.history.species).toHaveLength(1);
  });

  it('renders one CSV row per tick with a stable header', () => {
    const sim = new LifeSimulation({
      seed: 52,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const runData = sim.runWithAnalytics(3, 2);
    const csv = metricsToCsv(runData.summaries, runData.analytics);
    const lines = csv.trimEnd().split('\n');

    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(METRICS_CSV_COLUMNS.join(','));

    const row1 = lines[1].split(',');
    const row3 = lines[3].split(',');
    const tickIndex = METRICS_CSV_COLUMNS.indexOf('tick');
    const windowSizeIndex = METRICS_CSV_COLUMNS.indexOf('window_size');
    const strategySpeciesIndex = METRICS_CSV_COLUMNS.indexOf('strategy_active_species');
    const habitatMeanIndex = METRICS_CSV_COLUMNS.indexOf('strategy_habitat_preference_mean');
    const trophicWeightedIndex = METRICS_CSV_COLUMNS.indexOf('strategy_trophic_level_weighted_mean');
    const defenseStdIndex = METRICS_CSV_COLUMNS.indexOf('strategy_defense_level_stddev');
    const forcingCycleIndex = METRICS_CSV_COLUMNS.indexOf('forcing_cycle_length');
    const forcingPhaseIndex = METRICS_CSV_COLUMNS.indexOf('forcing_phase');
    const forcingRegenIndex = METRICS_CSV_COLUMNS.indexOf('forcing_regen_multiplier');
    const forcingContrastIndex = METRICS_CSV_COLUMNS.indexOf('forcing_fertility_contrast_multiplier');
    const disturbanceEventsIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_events_window');
    const disturbanceRadiusIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_radius');
    const disturbanceRefugiaIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_refugia_fraction');
    const disturbancePopulationShockIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_last_population_shock');
    const disturbanceAffectedCellIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_last_affected_cell_fraction');
    const disturbanceEventRefugiaIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_last_refugia_cell_fraction');
    const resilienceRecoveryTicksIndex = METRICS_CSV_COLUMNS.indexOf('resilience_recovery_ticks');
    const resilienceRecoveryRelapsesIndex = METRICS_CSV_COLUMNS.indexOf('resilience_recovery_relapses');
    const resilienceSustainedRecoveryTicksIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_sustained_recovery_ticks'
    );
    const resiliencePopulationTroughDepthIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_population_trough_depth'
    );
    const resiliencePopulationTroughTicksIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_population_trough_ticks'
    );
    const resilienceDelayedShockIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_delayed_population_shock_depth'
    );
    const resilienceTurnoverSpikeIndex = METRICS_CSV_COLUMNS.indexOf('resilience_turnover_spike');
    const resilienceMemoryEventCountIndex = METRICS_CSV_COLUMNS.indexOf('resilience_memory_event_count');
    const resilienceMemoryRecoveredFractionIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_memory_recovered_event_fraction'
    );
    const resilienceMemoryRelapseFractionIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_memory_relapse_event_fraction'
    );
    const resilienceMemoryStabilityMeanIndex = METRICS_CSV_COLUMNS.indexOf('resilience_memory_stability_index_mean');
    const resilienceLatestEventPhaseIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_latest_event_seasonal_phase'
    );
    const resilienceLatestRecoveryLagTicksIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_latest_event_recovery_lag_ticks'
    );
    const resilienceMemoryRecoveryLagMeanIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_memory_recovery_lag_ticks_mean'
    );
    const resilienceMemoryEventPhaseMeanIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_memory_event_phase_mean'
    );
    const resilienceMemoryEventPhaseConcentrationIndex = METRICS_CSV_COLUMNS.indexOf(
      'resilience_memory_event_phase_concentration'
    );

    expect(Number(row1[tickIndex])).toBe(1);
    expect(Number(row1[windowSizeIndex])).toBe(1);
    expect(Number(row1[strategySpeciesIndex])).toBe(runData.analytics[0].strategy.activeSpecies);
    expect(Number(row1[habitatMeanIndex])).toBeCloseTo(runData.analytics[0].strategy.habitatPreference.mean, 10);
    expect(Number(row1[forcingCycleIndex])).toBe(runData.analytics[0].forcing.cycleLength);
    expect(Number(row1[forcingPhaseIndex])).toBeCloseTo(runData.analytics[0].forcing.phase, 10);
    expect(Number(row3[tickIndex])).toBe(3);
    expect(Number(row3[windowSizeIndex])).toBe(2);
    expect(Number(row3[trophicWeightedIndex])).toBeCloseTo(runData.analytics[2].strategy.trophicLevel.weightedMean, 10);
    expect(Number(row3[defenseStdIndex])).toBeCloseTo(runData.analytics[2].strategy.defenseLevel.stdDev, 10);
    expect(Number(row3[forcingRegenIndex])).toBeCloseTo(runData.analytics[2].forcing.regenMultiplier, 10);
    expect(Number(row3[forcingContrastIndex])).toBeCloseTo(
      runData.analytics[2].forcing.fertilityContrastMultiplier,
      10
    );
    expect(Number(row1[disturbanceEventsIndex])).toBe(runData.analytics[0].disturbance.eventsInWindow);
    expect(Number(row1[disturbanceRadiusIndex])).toBe(runData.analytics[0].disturbance.radius);
    expect(Number(row1[disturbanceRefugiaIndex])).toBeCloseTo(
      runData.analytics[0].disturbance.refugiaFraction,
      10
    );
    expect(Number(row1[disturbancePopulationShockIndex])).toBeCloseTo(
      runData.analytics[0].disturbance.lastEventPopulationShock,
      10
    );
    expect(Number(row1[disturbanceAffectedCellIndex])).toBeCloseTo(
      runData.analytics[0].disturbance.lastEventAffectedCellFraction,
      10
    );
    expect(Number(row1[disturbanceEventRefugiaIndex])).toBeCloseTo(
      runData.analytics[0].disturbance.lastEventRefugiaCellFraction,
      10
    );
    expect(Number(row3[resilienceRecoveryTicksIndex])).toBe(runData.analytics[2].resilience.recoveryTicks);
    expect(Number(row3[resilienceRecoveryRelapsesIndex])).toBe(
      runData.analytics[2].resilience.recoveryRelapses
    );
    expect(Number(row3[resilienceSustainedRecoveryTicksIndex])).toBe(
      runData.analytics[2].resilience.sustainedRecoveryTicks
    );
    expect(Number(row3[resiliencePopulationTroughDepthIndex])).toBeCloseTo(
      runData.analytics[2].resilience.populationTroughDepth,
      10
    );
    expect(Number(row3[resiliencePopulationTroughTicksIndex])).toBe(
      runData.analytics[2].resilience.populationTroughTicks
    );
    expect(Number(row3[resilienceDelayedShockIndex])).toBeCloseTo(
      runData.analytics[2].resilience.delayedPopulationShockDepth,
      10
    );
    expect(Number(row3[resilienceTurnoverSpikeIndex])).toBeCloseTo(
      runData.analytics[2].resilience.turnoverSpike,
      10
    );
    expect(Number(row3[resilienceMemoryEventCountIndex])).toBe(runData.analytics[2].resilience.memoryEventCount);
    expect(Number(row3[resilienceMemoryRecoveredFractionIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryRecoveredEventFraction,
      10
    );
    expect(Number(row3[resilienceMemoryRelapseFractionIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryRelapseEventFraction,
      10
    );
    expect(Number(row3[resilienceMemoryStabilityMeanIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryStabilityIndexMean,
      10
    );
    expect(Number(row3[resilienceLatestEventPhaseIndex])).toBeCloseTo(
      runData.analytics[2].resilience.latestEventSeasonalPhase,
      10
    );
    expect(Number(row3[resilienceLatestRecoveryLagTicksIndex])).toBeCloseTo(
      runData.analytics[2].resilience.latestEventRecoveryLagTicks,
      10
    );
    expect(Number(row3[resilienceMemoryRecoveryLagMeanIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryRecoveryLagTicksMean,
      10
    );
    expect(Number(row3[resilienceMemoryEventPhaseMeanIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryEventPhaseMean,
      10
    );
    expect(Number(row3[resilienceMemoryEventPhaseConcentrationIndex])).toBeCloseTo(
      runData.analytics[2].resilience.memoryEventPhaseConcentration,
      10
    );
  });

  it('rejects mismatched summary and analytics lengths', () => {
    const sim = new LifeSimulation({ seed: 53 });
    const runData = sim.runWithAnalytics(2, 2);
    expect(() => metricsToCsv(runData.summaries.slice(0, 1), runData.analytics)).toThrow(
      'Summary/analytics length mismatch'
    );
  });

  it('renders aggregate experiment metrics to one-row CSV', () => {
    const experiment = runExperiment({
      runs: 2,
      steps: 4,
      analyticsWindow: 2,
      seed: 201,
      generatedAt: '2026-02-21T00:00:00.000Z'
    });

    const csv = experimentAggregateToCsv(experiment);
    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(EXPERIMENT_AGGREGATE_CSV_COLUMNS.join(','));

    const row = lines[1].split(',');
    expect(Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('runs')])).toBe(2);
    expect(Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('extinct_runs')])).toBe(
      experiment.aggregate.extinctRuns
    );
    expect(Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_stability_index_mean')])).toBeCloseTo(
      experiment.aggregate.finalResilienceStabilityIndex.mean,
      10
    );
    expect(Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_stability_index_min')])).toBeCloseTo(
      experiment.aggregate.finalResilienceStabilityIndex.min,
      10
    );
    expect(Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_stability_index_max')])).toBeCloseTo(
      experiment.aggregate.finalResilienceStabilityIndex.max,
      10
    );
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_memory_stability_index_mean')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceMemoryStabilityIndex.mean, 10);
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_memory_stability_index_min')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceMemoryStabilityIndex.min, 10);
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_memory_stability_index_max')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceMemoryStabilityIndex.max, 10);
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_relapse_event_fraction_mean')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceRelapseEventFraction.mean, 10);
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_relapse_event_fraction_min')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceRelapseEventFraction.min, 10);
    expect(
      Number(row[EXPERIMENT_AGGREGATE_CSV_COLUMNS.indexOf('final_resilience_relapse_event_fraction_max')])
    ).toBeCloseTo(experiment.aggregate.finalResilienceRelapseEventFraction.max, 10);
  });

  it('renders disturbance grid study JSON and one row per grid cell in CSV', () => {
    const study = runDisturbanceGridStudy({
      runs: 2,
      steps: 12,
      analyticsWindow: 4,
      seed: 71,
      intervals: [6, 9],
      amplitudes: [0.2],
      localRadius: 2,
      localRefugiaFraction: 0.35,
      generatedAt: '2026-02-28T00:00:00.000Z'
    });

    const parsedJson = JSON.parse(disturbanceGridStudyToJson(study));
    expect(parsedJson.generatedAt).toBe('2026-02-28T00:00:00.000Z');
    expect(parsedJson.cells).toHaveLength(2);
    expect(parsedJson.summary.cells).toBe(2);

    const csv = disturbanceGridStudyToCsv(study);
    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(DISTURBANCE_GRID_STUDY_CSV_COLUMNS.join(','));

    const firstRow = lines[1].split(',');
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('interval')])).toBe(study.cells[0].interval);
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('amplitude')])).toBeCloseTo(
      study.cells[0].amplitude,
      10
    );
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('path_dependence_gain_mean')])
    ).toBeCloseTo(study.cells[0].pairedDeltas.pathDependenceGain.mean, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('global_latest_event_phase_mean')])
    ).toBeCloseTo(study.cells[0].timingDiagnostics.globalLatestEventPhaseMean, 10);
    expect(
      Number(
        firstRow[
          DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf(
            'global_memory_event_phase_concentration_mean'
          )
        ]
      )
    ).toBeCloseTo(study.cells[0].timingDiagnostics.globalMemoryEventPhaseConcentrationMean, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('latest_recovery_lag_reduction_mean')])
    ).toBeCloseTo(study.cells[0].pairedDeltas.latestRecoveryLagReduction.mean, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('memory_recovery_lag_reduction_mean')])
    ).toBeCloseTo(study.cells[0].pairedDeltas.memoryRecoveryLagReduction.mean, 10);
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('hypothesis_support')])).toBe(
      study.cells[0].hypothesisSupport ? 1 : 0
    );
  });
});
