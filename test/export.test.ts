import { describe, expect, it } from 'vitest';
import {
  runCladeActivityCladogenesisHorizonSweep,
  runCladeActivityCladogenesisSweep,
  runCladeActivityPersistenceSweep,
  runCladeActivityRelabelNullCladeHabitatCouplingSweep,
  runCladeActivityRelabelNullCladeInteractionCouplingSweep,
  runCladeActivityRelabelNullStudy,
  runCladeActivitySeedPanel,
  runCladeSpeciesActivityCouplingStudy,
  runSpeciesActivityHorizonSweep,
  runSpeciesActivityPersistenceSweep,
  runSpeciesActivitySeedPanel,
  runSpeciesActivityProbe
} from '../src/activity';
import {
  DISTURBANCE_GRID_STUDY_CSV_COLUMNS,
  EXPERIMENT_AGGREGATE_CSV_COLUMNS,
  METRICS_CSV_COLUMNS,
  buildRunExport,
  cladeActivityCladogenesisHorizonSweepToJson,
  cladeActivityCladogenesisSweepToJson,
  cladeActivityPersistenceSweepToJson,
  cladeActivityRelabelNullCladeHabitatCouplingSweepToJson,
  cladeActivityRelabelNullCladeInteractionCouplingSweepToJson,
  cladeActivityRelabelNullToJson,
  cladeActivitySeedPanelToJson,
  cladeSpeciesActivityCouplingToJson,
  disturbanceGridStudyToCsv,
  disturbanceGridStudyToJson,
  experimentAggregateToCsv,
  metricsToCsv,
  runExportToJson,
  speciesActivityHorizonSweepToJson,
  speciesActivityPersistenceSweepToJson,
  speciesActivityProbeToJson,
  speciesActivitySeedPanelToJson
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
    const disturbancePhaseOffsetIndex = METRICS_CSV_COLUMNS.indexOf('disturbance_phase_offset');
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
    expect(Number(row1[disturbancePhaseOffsetIndex])).toBeCloseTo(
      runData.analytics[0].disturbance.phaseOffset,
      10
    );
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
    expect(parsedJson.config.phases).toEqual([0]);
    expect(parsedJson.summary.cells).toBe(2);
    expect(parsedJson.summary.pathDependenceGainCi95ClassificationCounts).toEqual(
      study.summary.pathDependenceGainCi95ClassificationCounts
    );
    expect(parsedJson.summary.pathDependenceGainCi95RobustPositiveFraction).toBeCloseTo(
      study.summary.pathDependenceGainCi95RobustPositiveFraction,
      10
    );
    expect(parsedJson.summary.pathDependenceGainCi95Decision).toBe(study.summary.pathDependenceGainCi95Decision);
    expect(parsedJson.summary.pathDependenceGainCi95LowerBoundTopCells).toEqual(
      study.summary.pathDependenceGainCi95LowerBoundTopCells
    );
    expect(parsedJson.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty).toEqual(
      study.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty
    );

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
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('phase')])).toBeCloseTo(
      study.cells[0].phase,
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
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('seed_blocks')])).toBe(
      study.cells[0].reproducibility.blocks
    );
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('hypothesis_support_block_fraction')])
    ).toBeCloseTo(study.cells[0].reproducibility.hypothesisSupportFraction, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('path_dependence_positive_block_fraction')])
    ).toBeCloseTo(study.cells[0].reproducibility.pathDependenceGainPositiveBlockFraction, 10);
    expect(
      Number(
        firstRow[
          DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf(
            'resilience_delta_positive_fraction_block_mean'
          )
        ]
      )
    ).toBeCloseTo(study.cells[0].reproducibility.resilienceStabilityPositiveFraction.mean, 10);
    expect(
      Number(
        firstRow[
          DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf(
            'path_dependence_gain_positive_fraction_block_max'
          )
        ]
      )
    ).toBeCloseTo(study.cells[0].reproducibility.pathDependenceGainPositiveFraction.max, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('path_dependence_gain_block_mean_se')])
    ).toBeCloseTo(study.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty.standardError, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('path_dependence_gain_block_mean_ci95_low')])
    ).toBeCloseTo(study.cells[0].reproducibility.pathDependenceGainBlockMeanUncertainty.ci95Low, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('memory_stability_delta_block_mean_ci95_high')])
    ).toBeCloseTo(study.cells[0].reproducibility.memoryStabilityDeltaBlockMeanUncertainty.ci95High, 10);
    expect(
      Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('relapse_event_reduction_block_mean')])
    ).toBeCloseTo(study.cells[0].reproducibility.relapseEventReductionBlockMeanUncertainty.mean, 10);
    expect(Number(firstRow[DISTURBANCE_GRID_STUDY_CSV_COLUMNS.indexOf('hypothesis_support')])).toBe(
      study.cells[0].hypothesisSupport ? 1 : 0
    );
  });

  it('renders species-activity probe exports to JSON', () => {
    const probe = runSpeciesActivityProbe({
      steps: 3,
      windowSize: 2,
      burnIn: 1,
      seed: 88,
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-07T00:00:00.000Z'
    });

    const parsed = JSON.parse(speciesActivityProbeToJson(probe));

    expect(parsed.generatedAt).toBe('2026-03-07T00:00:00.000Z');
    expect(parsed.definition.component).toBe('species');
    expect(parsed.windows).toHaveLength(2);
    expect(parsed.summary.totalSpecies).toBeGreaterThan(1);
  });

  it('renders species-activity horizon sweeps to JSON', () => {
    const sweep = runSpeciesActivityHorizonSweep({
      steps: [3, 5],
      windowSize: 2,
      burnIn: 1,
      seed: 88,
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-07T00:00:00.000Z'
    });

    const parsed = JSON.parse(speciesActivityHorizonSweepToJson(sweep));

    expect(parsed.generatedAt).toBe('2026-03-07T00:00:00.000Z');
    expect(parsed.definition.component).toBe('species');
    expect(parsed.config.steps).toEqual([3, 5]);
    expect(parsed.horizons).toHaveLength(2);
    expect(parsed.horizons[0].steps).toBe(3);
  });

  it('renders species-activity persistence sweeps to JSON', () => {
    const sweep = runSpeciesActivityPersistenceSweep({
      steps: 5,
      windowSize: 2,
      burnIn: 1,
      seed: 88,
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-07T00:00:00.000Z'
    });

    const parsed = JSON.parse(speciesActivityPersistenceSweepToJson(sweep));

    expect(parsed.generatedAt).toBe('2026-03-07T00:00:00.000Z');
    expect(parsed.definition.raw.component).toBe('species');
    expect(parsed.config.minSurvivalTicks).toEqual([1, 2]);
    expect(parsed.rawSummary.totalSpecies).toBeGreaterThan(1);
    expect(parsed.thresholds).toHaveLength(2);
    expect(parsed.thresholds[0].summary.minSurvivalTicks).toBe(1);
  });

  it('renders species-activity seed panels to JSON', () => {
    const panel = runSpeciesActivitySeedPanel({
      steps: 6,
      windowSize: 2,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-07T00:00:00.000Z'
    });

    const parsed = JSON.parse(speciesActivitySeedPanelToJson(panel));

    expect(parsed.generatedAt).toBe('2026-03-07T00:00:00.000Z');
    expect(parsed.definition.raw.component).toBe('species');
    expect(parsed.config.seeds).toEqual([88, 89]);
    expect(parsed.seedResults).toHaveLength(2);
    expect(parsed.aggregates).toHaveLength(2);
    expect(parsed.aggregates[0].minSurvivalTicks).toBe(1);
  });

  it('renders clade-activity persistence sweeps to JSON', () => {
    const sweep = runCladeActivityPersistenceSweep({
      steps: 5,
      windowSize: 2,
      burnIn: 1,
      seed: 88,
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-08T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityPersistenceSweepToJson(sweep));

    expect(parsed.generatedAt).toBe('2026-03-08T00:00:00.000Z');
    expect(parsed.definition.raw.component).toBe('clades');
    expect(parsed.config.minSurvivalTicks).toEqual([1, 2]);
    expect(parsed.rawSummary.totalClades).toBe(1);
    expect(parsed.thresholds).toHaveLength(2);
    expect(parsed.thresholds[0].summary.minSurvivalTicks).toBe(1);
  });

  it('renders clade-activity seed panels to JSON', () => {
    const panel = runCladeActivitySeedPanel({
      steps: 6,
      windowSize: 2,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 30,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-08T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivitySeedPanelToJson(panel));

    expect(parsed.generatedAt).toBe('2026-03-08T00:00:00.000Z');
    expect(parsed.definition.raw.component).toBe('clades');
    expect(parsed.config.seeds).toEqual([88, 89]);
    expect(parsed.seedResults).toHaveLength(2);
    expect(parsed.aggregates).toHaveLength(2);
    expect(parsed.aggregates[0].minSurvivalTicks).toBe(1);
  });

  it('renders cladogenesis-threshold sweeps to JSON', () => {
    const sweep = runCladeActivityCladogenesisSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-08T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityCladogenesisSweepToJson(sweep));

    expect(parsed.generatedAt).toBe('2026-03-08T00:00:00.000Z');
    expect(parsed.definition.seedPanel.raw.component).toBe('clades');
    expect(parsed.config.cladogenesisThresholds).toEqual([-1, 0]);
    expect(parsed.thresholdResults).toHaveLength(2);
    expect(parsed.thresholdResults[0].cladogenesisThreshold).toBe(-1);
    expect(parsed.thresholdResults[0].seedResults[0].counts.totalSpecies).toBeGreaterThan(0);
  });

  it('renders cladogenesis horizon sweeps to JSON', () => {
    const sweep = runCladeActivityCladogenesisHorizonSweep({
      steps: [4, 6],
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-09T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityCladogenesisHorizonSweepToJson(sweep));

    expect(parsed.generatedAt).toBe('2026-03-09T00:00:00.000Z');
    expect(parsed.definition.seedPanel.raw.component).toBe('clades');
    expect(parsed.config.steps).toEqual([4, 6]);
    expect(parsed.horizons).toHaveLength(2);
    expect(parsed.horizons[0].steps).toBe(4);
    expect(parsed.horizons[0].thresholdResults[0].cladogenesisThreshold).toBe(-1);
    expect(parsed.horizons[1].thresholdResults[1].seedResults[0].counts.totalSpecies).toBeGreaterThan(0);
  });

  it('renders clade/species activity coupling studies to JSON', () => {
    const study = runCladeSpeciesActivityCouplingStudy({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [-1, 0],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-09T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeSpeciesActivityCouplingToJson(study));

    expect(parsed.generatedAt).toBe('2026-03-09T00:00:00.000Z');
    expect(parsed.definition.species.raw.component).toBe('species');
    expect(parsed.definition.clade.raw.component).toBe('clades');
    expect(parsed.config.steps).toBe(6);
    expect(parsed.thresholdResults).toHaveLength(2);
    expect(parsed.thresholdResults[0].seedResults[0].thresholds[0].species.summary.minSurvivalTicks).toBe(1);
    expect(parsed.thresholdResults[1].aggregates[1].cladeToSpeciesPersistentWindowFraction.definedSeeds).toBe(2);
  });

  it('renders clade activity relabel-null studies to JSON', () => {
    const study = runCladeActivityRelabelNullStudy({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: [1, 2],
      cladogenesisThresholds: [0],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-10T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityRelabelNullToJson(study));

    expect(parsed.generatedAt).toBe('2026-03-10T00:00:00.000Z');
    expect(parsed.definition.actual.raw.component).toBe('clades');
    expect(parsed.definition.matchedNull.raw.component).toBe('clades');
    expect(parsed.config.cladogenesisThresholds).toEqual([0]);
    expect(parsed.thresholdResults).toHaveLength(1);
    expect(parsed.thresholdResults[0].seedResults[0].birthScheduleMatched).toBe(true);
    expect(parsed.thresholdResults[0].aggregates[0].actualToNullPersistentWindowFractionRatio.definedSeeds).toBe(2);
  });

  it('renders clade habitat coupling relabel-null sweeps to JSON', () => {
    const study = runCladeActivityRelabelNullCladeHabitatCouplingSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: 1,
      cladogenesisThreshold: 0,
      cladeHabitatCouplingValues: [0, 1],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-11T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityRelabelNullCladeHabitatCouplingSweepToJson(study));

    expect(parsed.generatedAt).toBe('2026-03-11T00:00:00.000Z');
    expect(parsed.definition.study.actual.raw.component).toBe('clades');
    expect(parsed.config.cladogenesisThreshold).toBe(0);
    expect(parsed.config.minSurvivalTicks).toBe(1);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].cladeHabitatCoupling).toBe(0);
    expect(parsed.results[1].cladeHabitatCoupling).toBe(1);
    expect(parsed.results[0].birthScheduleMatchedAllSeeds).toBe(true);
    expect(parsed.results[0].aggregate.actualToNullPersistentWindowFractionRatio.definedSeeds).toBe(2);
  });

  it('renders clade interaction coupling relabel-null sweeps to JSON', () => {
    const study = runCladeActivityRelabelNullCladeInteractionCouplingSweep({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [88, 89],
      minSurvivalTicks: 1,
      cladogenesisThreshold: 0,
      cladeInteractionCouplingValues: [0, 1],
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 0,
          moveCost: 0,
          harvestCap: 0,
          reproduceThreshold: 10,
          reproduceProbability: 1,
          offspringEnergyFraction: 0.5,
          mutationAmount: 0.2,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 100,
            genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
          }
        ]
      },
      generatedAt: '2026-03-11T00:00:00.000Z'
    });

    const parsed = JSON.parse(cladeActivityRelabelNullCladeInteractionCouplingSweepToJson(study));

    expect(parsed.generatedAt).toBe('2026-03-11T00:00:00.000Z');
    expect(parsed.definition.study.actual.raw.component).toBe('clades');
    expect(parsed.config.cladogenesisThreshold).toBe(0);
    expect(parsed.config.minSurvivalTicks).toBe(1);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].cladeInteractionCoupling).toBe(0);
    expect(parsed.results[1].cladeInteractionCoupling).toBe(1);
    expect(parsed.results[0].birthScheduleMatchedAllSeeds).toBe(true);
    expect(parsed.results[0].aggregate.actualToNullPersistentWindowFractionRatio.definedSeeds).toBe(2);
  });
});
