import { describe, expect, it } from 'vitest';
import { runResourceLayerAsymmetryPilot } from '../src/resource-layer-asymmetry-pilot';

describe('resource-layer-asymmetry-pilot', () => {
  it('shows mirrored availability staying matched while the asymmetric arm diverges', () => {
    const artifact = runResourceLayerAsymmetryPilot({
      generatedAt: '2026-03-28T00:00:00.000Z',
      steps: 4
    });

    expect(artifact.generatedAt).toBe('2026-03-28T00:00:00.000Z');
    expect(artifact.scenarios).toHaveLength(2);

    const mirrored = artifact.scenarios.find((scenario) => scenario.label === 'mirrored');
    const asymmetric = artifact.scenarios.find((scenario) => scenario.label === 'asymmetric');

    expect(mirrored).toBeDefined();
    expect(asymmetric).toBeDefined();

    expect(mirrored!.maxAbsoluteTotalDelta).toBeCloseTo(0, 10);
    expect(mirrored!.maxMeanAbsoluteCellDelta).toBeCloseTo(0, 10);
    expect(asymmetric!.maxAbsoluteTotalDelta).toBeGreaterThan(0.1);
    expect(asymmetric!.maxMeanAbsoluteCellDelta).toBeGreaterThan(0.01);
    expect(artifact.conclusion.mirroredStaysMatched).toBe(true);
    expect(artifact.conclusion.asymmetricBreaksMirroring).toBe(true);
  });
});
