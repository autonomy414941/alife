import { describe, expect, it } from 'vitest';
import {
  HISTORY_MEMORY_SCALING_ARTIFACT,
  classifyPowerLawExponent,
  estimatePowerLawExponent,
  runHistoryMemoryScalingStudy
} from '../src/history-memory-scaling-study';
import { LifeSimulation } from '../src/simulation';

describe('history memory scaling study', () => {
  it('defines the correct artifact path', () => {
    expect(HISTORY_MEMORY_SCALING_ARTIFACT).toBe('docs/history_memory_scaling_2026-03-16.json');
  });

  it('matches retained timeline diagnostics to exported history counts', () => {
    const sim = new LifeSimulation({
      seed: 13,
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
          energy: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.run(2);
    const diagnostics = sim.storageDiagnostics();
    const history = sim.history();
    const cladeTimelinePoints = history.clades.reduce((total, clade) => total + clade.timeline.length, 0);
    const speciesTimelinePoints = history.species.reduce((total, species) => total + species.timeline.length, 0);

    expect(diagnostics.localityFramesRetained).toBe(3);
    expect(diagnostics.cladeHistories).toBe(history.clades.length);
    expect(diagnostics.speciesHistories).toBe(history.species.length);
    expect(diagnostics.cladeTimelinePoints).toBe(cladeTimelinePoints);
    expect(diagnostics.speciesTimelinePoints).toBe(speciesTimelinePoints);
    expect(diagnostics.timelineNumericSlotsRetained).toBe((cladeTimelinePoints + speciesTimelinePoints) * 4);
  });

  it('classifies monotonic linear and quadratic trends by exponent', () => {
    const linearExponent = estimatePowerLawExponent([1, 2, 4, 8], [10, 20, 40, 80]);
    const quadraticExponent = estimatePowerLawExponent([1, 2, 4, 8], [10, 40, 160, 640]);

    expect(classifyPowerLawExponent([1, 2, 4, 8], [10, 20, 40, 80], linearExponent)).toBe('linear');
    expect(classifyPowerLawExponent([1, 2, 4, 8], [10, 40, 160, 640], quadraticExponent)).toBe('quadratic');
  });

  it('runs a minimal history scaling benchmark and keeps timeline growth within the active-taxa bound', () => {
    const study = runHistoryMemoryScalingStudy({
      generatedAt: '2026-03-16T00:00:00.000Z',
      seed: 7,
      horizons: [4, 8],
      simulationConfig: {
        width: 3,
        height: 3,
        initialAgents: 2,
        maxAge: 40
      }
    });

    expect(study.generatedAt).toBe('2026-03-16T00:00:00.000Z');
    expect(study.measurements).toHaveLength(2);
    expect(study.measurements[0]?.horizon).toBe(4);
    expect(study.measurements[1]?.horizon).toBe(8);
    expect(study.measurements.every((measurement) => measurement.stepsExecuted === measurement.horizon)).toBe(true);
    expect(study.measurements.every((measurement) => measurement.storage.localityFramesRetained === measurement.horizon + 1)).toBe(
      true
    );
    expect(study.measurements.every((measurement) => measurement.cladeTimelinePointBoundRatio <= 1)).toBe(true);
    expect(study.measurements.every((measurement) => measurement.speciesTimelinePointBoundRatio <= 1)).toBe(true);
    expect(study.summary.cladeTimelineRetention.classification).toBe('bounded_by_cumulative_active_taxa');
    expect(study.summary.speciesTimelineRetention.classification).toBe('bounded_by_cumulative_active_taxa');
  });
});
