import { describe, expect, it } from 'vitest';
import { METRICS_CSV_COLUMNS, buildRunExport, metricsToCsv, runExportToJson } from '../src/export';
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

    expect(Number(row1[tickIndex])).toBe(1);
    expect(Number(row1[windowSizeIndex])).toBe(1);
    expect(Number(row3[tickIndex])).toBe(3);
    expect(Number(row3[windowSizeIndex])).toBe(2);
  });

  it('rejects mismatched summary and analytics lengths', () => {
    const sim = new LifeSimulation({ seed: 53 });
    const runData = sim.runWithAnalytics(2, 2);
    expect(() => metricsToCsv(runData.summaries.slice(0, 1), runData.analytics)).toThrow(
      'Summary/analytics length mismatch'
    );
  });
});
