import { describe, expect, it } from 'vitest';
import {
  computeResilienceStabilityIndex,
  runDisturbanceGridStudy,
  runExperiment
} from '../src/experiment';

describe('runExperiment', () => {
  it('is deterministic for the same seed sweep configuration', () => {
    const input = {
      runs: 3,
      steps: 6,
      analyticsWindow: 3,
      seed: 91,
      seedStep: 2,
      generatedAt: '2026-02-21T00:00:00.000Z'
    };

    const first = runExperiment(input);
    const second = runExperiment(input);

    expect(first).toEqual(second);
    expect(first.runs.map((run) => run.seed)).toEqual([91, 93, 95]);
    expect(first.aggregate.runs).toBe(3);
  });

  it('supports extinction-stop experiments and aggregates run lengths', () => {
    const result = runExperiment({
      runs: 2,
      steps: 10,
      analyticsWindow: 5,
      seed: 300,
      stopWhenExtinct: true,
      simulation: {
        config: {
          width: 1,
          height: 1,
          maxResource: 0,
          resourceRegen: 0,
          metabolismCostBase: 1,
          moveCost: 0,
          harvestCap: 0,
          reproduceProbability: 0,
          maxAge: 100
        },
        initialAgents: [
          {
            x: 0,
            y: 0,
            energy: 0.2,
            genome: { metabolism: 1, harvest: 1, aggression: 0 }
          }
        ]
      },
      generatedAt: '2026-02-21T00:00:00.000Z'
    });

    expect(result.runs).toHaveLength(2);
    expect(result.runs.every((run) => run.stepsExecuted === 1)).toBe(true);
    expect(result.runs.every((run) => run.extinct)).toBe(true);
    expect(result.aggregate.extinctRuns).toBe(2);
    expect(result.aggregate.extinctionRate).toBe(1);
    expect(result.aggregate.stepsExecuted).toEqual({ mean: 1, min: 1, max: 1 });
    expect(result.aggregate.finalPopulation).toEqual({ mean: 0, min: 0, max: 0 });
    expect(result.aggregate.finalSpeciesExtinctionRate).toEqual({ mean: 1, min: 1, max: 1 });
    expect(result.aggregate.finalSpeciesNetDiversificationRate).toEqual({ mean: -1, min: -1, max: -1 });
    const resilienceStability = result.runs.map((run) => run.finalResilienceStabilityIndex);
    const resilienceMemoryStability = result.runs.map((run) => run.finalResilienceMemoryStabilityIndex);
    const resilienceRelapseEventFraction = result.runs.map((run) => run.finalResilienceRelapseEventFraction);
    expect(resilienceStability.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(resilienceMemoryStability.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(resilienceRelapseEventFraction.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(result.aggregate.finalResilienceStabilityIndex).toEqual(summarize(resilienceStability));
    expect(result.aggregate.finalResilienceMemoryStabilityIndex).toEqual(summarize(resilienceMemoryStability));
    expect(result.aggregate.finalResilienceRelapseEventFraction).toEqual(summarize(resilienceRelapseEventFraction));
  });

  it('clamps resilience stability-index inputs to keep formula bounded', () => {
    const clippedHigh = computeResilienceStabilityIndex(
      resilienceSnapshot({
        recoveryProgress: 2,
        sustainedRecoveryTicks: -2,
        recoveryRelapses: -5
      })
    );
    const clippedLow = computeResilienceStabilityIndex(
      resilienceSnapshot({
        recoveryProgress: -0.5,
        sustainedRecoveryTicks: 4,
        recoveryRelapses: 2
      })
    );
    const relapsePenalty = computeResilienceStabilityIndex(
      resilienceSnapshot({
        recoveryProgress: 1,
        sustainedRecoveryTicks: 2,
        recoveryRelapses: 3
      })
    );

    expect(clippedHigh).toBeCloseTo(1, 10);
    expect(clippedLow).toBeCloseTo(0, 10);
    expect(relapsePenalty).toBeCloseTo(0.5, 10);
  });
});

describe('runDisturbanceGridStudy', () => {
  it('is deterministic and preserves paired-delta invariants', () => {
    const input = {
      runs: 2,
      steps: 16,
      analyticsWindow: 6,
      seed: 41,
      seedStep: 1,
      intervals: [8, 12],
      amplitudes: [0.2, 0.35],
      localRadius: 2,
      localRefugiaFraction: 0.35,
      generatedAt: '2026-02-28T00:00:00.000Z'
    };

    const first = runDisturbanceGridStudy(input);
    const second = runDisturbanceGridStudy(input);

    expect(first).toEqual(second);
    expect(first.cells).toHaveLength(4);
    expect(first.summary.cells).toBe(4);
    expect(first.config.phases).toEqual([0]);
    expect(first.summary.supportedCells).toBeGreaterThanOrEqual(0);
    expect(first.summary.supportedCells).toBeLessThanOrEqual(4);
    expect(first.summary.supportFraction).toBeGreaterThanOrEqual(0);
    expect(first.summary.supportFraction).toBeLessThanOrEqual(1);
    expect(first.summary.globalMemoryEventPhaseConcentration.mean).toBeGreaterThanOrEqual(0);
    expect(first.summary.globalMemoryEventPhaseConcentration.mean).toBeLessThanOrEqual(1);
    expect(first.summary.localMemoryEventPhaseConcentration.mean).toBeGreaterThanOrEqual(0);
    expect(first.summary.localMemoryEventPhaseConcentration.mean).toBeLessThanOrEqual(1);

    for (const cell of first.cells) {
      expect(cell.phase).toBeCloseTo(0, 10);
      const resilienceDelta = cell.pairedDeltas.resilienceStabilityDelta.mean;
      const memoryDelta = cell.pairedDeltas.memoryStabilityDelta.mean;
      expect(cell.pairedDeltas.pathDependenceGain.mean).toBeCloseTo(memoryDelta - resilienceDelta, 10);
      expect(cell.hypothesisSupport).toBe(
        cell.pairedDeltas.relapseEventReduction.mean > 0 && cell.pairedDeltas.pathDependenceGain.mean > 0
      );
      expectPairedAggregate(cell.pairedDeltas.resilienceStabilityDelta);
      expectPairedAggregate(cell.pairedDeltas.memoryStabilityDelta);
      expectPairedAggregate(cell.pairedDeltas.relapseEventReduction);
      expectPairedAggregate(cell.pairedDeltas.turnoverSpikeReduction);
      expectPairedAggregate(cell.pairedDeltas.pathDependenceGain);
      expectPairedAggregate(cell.pairedDeltas.latestRecoveryLagReduction);
      expectPairedAggregate(cell.pairedDeltas.memoryRecoveryLagReduction);
      expect(cell.timingDiagnostics.globalLatestEventPhaseMean).toBeGreaterThanOrEqual(0);
      expect(cell.timingDiagnostics.globalLatestEventPhaseMean).toBeLessThanOrEqual(1);
      expect(cell.timingDiagnostics.localLatestEventPhaseMean).toBeGreaterThanOrEqual(0);
      expect(cell.timingDiagnostics.localLatestEventPhaseMean).toBeLessThanOrEqual(1);
      expect(cell.timingDiagnostics.globalMemoryEventPhaseConcentrationMean).toBeGreaterThanOrEqual(0);
      expect(cell.timingDiagnostics.globalMemoryEventPhaseConcentrationMean).toBeLessThanOrEqual(1);
      expect(cell.timingDiagnostics.localMemoryEventPhaseConcentrationMean).toBeGreaterThanOrEqual(0);
      expect(cell.timingDiagnostics.localMemoryEventPhaseConcentrationMean).toBeLessThanOrEqual(1);
    }
  });

  it('expands grid cells across explicit phase offsets', () => {
    const study = runDisturbanceGridStudy({
      runs: 1,
      steps: 10,
      analyticsWindow: 4,
      seed: 12,
      intervals: [5],
      amplitudes: [0.2, 0.3],
      phases: [0, 0.5]
    });

    expect(study.cells).toHaveLength(4);
    expect(study.config.phases).toEqual([0, 0.5]);
    expect(study.cells.map((cell) => cell.phase)).toEqual([0, 0.5, 0, 0.5]);
  });

  it('validates grid inputs', () => {
    expect(() =>
      runDisturbanceGridStudy({
        runs: 1,
        steps: 8,
        analyticsWindow: 4,
        seed: 3,
        intervals: [],
        amplitudes: [0.2]
      })
    ).toThrow('intervals must not be empty');

    expect(() =>
      runDisturbanceGridStudy({
        runs: 1,
        steps: 8,
        analyticsWindow: 4,
        seed: 3,
        intervals: [6],
        amplitudes: [1.2]
      })
    ).toThrow('amplitudes[0] must be between 0 and 1');

    expect(() =>
      runDisturbanceGridStudy({
        runs: 1,
        steps: 8,
        analyticsWindow: 4,
        seed: 3,
        intervals: [6],
        amplitudes: [0.2],
        localRadius: -1
      })
    ).toThrow('localRadius must be >= 0');

    expect(() =>
      runDisturbanceGridStudy({
        runs: 1,
        steps: 8,
        analyticsWindow: 4,
        seed: 3,
        intervals: [6],
        amplitudes: [0.2],
        phases: []
      })
    ).toThrow('phases must not be empty');

    expect(() =>
      runDisturbanceGridStudy({
        runs: 1,
        steps: 8,
        analyticsWindow: 4,
        seed: 3,
        intervals: [6],
        amplitudes: [0.2],
        phases: [Number.NaN]
      })
    ).toThrow('phases[0] must be finite');
  });
});

function summarize(values: number[]): { mean: number; min: number; max: number } {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0 };
  }
  let min = values[0];
  let max = values[0];
  let total = 0;
  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    total += value;
  }
  return { mean: total / values.length, min, max };
}

function expectPairedAggregate(value: {
  mean: number;
  min: number;
  max: number;
  positiveFraction: number;
}): void {
  expect(value.mean).toBeGreaterThanOrEqual(value.min);
  expect(value.mean).toBeLessThanOrEqual(value.max);
  expect(value.positiveFraction).toBeGreaterThanOrEqual(0);
  expect(value.positiveFraction).toBeLessThanOrEqual(1);
}

function resilienceSnapshot(overrides: Partial<Parameters<typeof computeResilienceStabilityIndex>[0]>) {
  return {
    recoveryTicks: 0,
    recoveryProgress: 0,
    recoveryRelapses: 0,
    sustainedRecoveryTicks: 0,
    populationTroughDepth: 0,
    populationTroughTicks: 0,
    delayedPopulationShockDepth: 0,
    preDisturbanceTurnoverRate: 0,
    postDisturbanceTurnoverRate: 0,
    turnoverSpike: 0,
    extinctionBurstDepth: 0,
    memoryEventCount: 0,
    memoryRecoveredEventFraction: 0,
    memoryRelapseEventFraction: 0,
    memoryStabilityIndexMean: 0,
    latestEventSeasonalPhase: 0,
    latestEventRecoveryLagTicks: 0,
    memoryRecoveryLagTicksMean: 0,
    memoryEventPhaseMean: 0,
    memoryEventPhaseConcentration: 0,
    ...overrides
  };
}
