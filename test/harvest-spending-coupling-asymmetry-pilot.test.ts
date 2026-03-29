import { describe, expect, it } from 'vitest';
import { runHarvestSpendingCouplingAsymmetryPilot } from '../src/harvest-spending-coupling-asymmetry-pilot';

describe('harvest-spending coupling asymmetry pilot', () => {
  it('produces bounded reserve trajectories that diverge by shared harvest-spending policy', () => {
    const artifact = runHarvestSpendingCouplingAsymmetryPilot({
      generatedAt: '2026-03-29T00:00:00.000Z',
      steps: 8
    });

    expect(artifact.generatedAt).toBe('2026-03-29T00:00:00.000Z');
    expect(artifact.arms).toHaveLength(3);
    expect(artifact.arms.every((arm) => arm.trajectory.length === 8)).toBe(true);

    const control = artifact.arms.find((arm) => arm.label === 'control');
    const primarySpecialist = artifact.arms.find((arm) => arm.label === 'primary_specialist');
    const secondarySpecialist = artifact.arms.find((arm) => arm.label === 'secondary_specialist');

    expect(control).toBeDefined();
    expect(primarySpecialist).toBeDefined();
    expect(secondarySpecialist).toBeDefined();

    expect(primarySpecialist?.finalSecondaryShare).toBeLessThan(control?.finalSecondaryShare ?? 1);
    expect(secondarySpecialist?.finalSecondaryShare).toBeGreaterThan(control?.finalSecondaryShare ?? 0);
    expect(artifact.interpretation.primarySpecialistRetainsLessSecondaryThanControl).toBe(true);
    expect(artifact.interpretation.secondarySpecialistRetainsMoreSecondaryThanControl).toBe(true);
    expect(artifact.interpretation.specialistSecondaryShareGap).toBeGreaterThan(0.4);
  });
});
