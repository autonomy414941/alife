import { describe, it, expect } from 'vitest';
import { runTrajectoryPersistenceAnalysis } from '../src/trajectory-persistence-analysis';

describe('trajectory-persistence-analysis', () => {
  it('runs a bounded trajectory persistence analysis', { timeout: 30000 }, () => {
    const result = runTrajectoryPersistenceAnalysis({
      generatedAt: '2026-03-31T05:00:00.000Z',
      seeds: [9101],
      steps: 50
    });

    expect(result.generatedAt).toBe('2026-03-31T05:00:00.000Z');
    expect(result.policyEnabled.runs.length).toBe(1);
    expect(result.policyNeutral.runs.length).toBe(1);
    expect(result.policyEnabled.runs[0]?.speciesPersistence).toBeDefined();
    expect(result.policyEnabled.runs[0]?.cladePersistence).toBeDefined();
    expect(result.policyEnabled.runs[0]?.descendantPersistence).toBeDefined();
    expect(result.conclusion.outcome).toMatch(/durable|mixed|transient/);
  });

  it('computes deltas and percent deltas', { timeout: 30000 }, () => {
    const result = runTrajectoryPersistenceAnalysis({
      generatedAt: '2026-03-31T05:00:00.000Z',
      seeds: [9101],
      steps: 50
    });

    expect(typeof result.delta.speciesActiveDiversityAUC).toBe('number');
    expect(typeof result.delta.descendantLifespan).toBe('number');
    expect(result.percentDelta.speciesActiveDiversityAUC === null || typeof result.percentDelta.speciesActiveDiversityAUC === 'number').toBe(true);
  });
});
