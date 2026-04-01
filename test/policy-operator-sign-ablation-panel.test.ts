import { describe, expect, it } from 'vitest';
import { runPolicyOperatorSignAblationPanel } from '../src/policy-operator-sign-ablation-panel';

describe('policy-operator-sign-ablation-panel', () => {
  it('produces a replay-based ablation panel across all direct payoff-coupling combinations', { timeout: 30000 }, () => {
    const artifact = runPolicyOperatorSignAblationPanel({
      generatedAt: '2026-04-01T00:00:00.000Z',
      seeds: [9301],
      burnInSteps: 12,
      branchSteps: 12,
      windowSize: 6
    });

    expect(artifact.generatedAt).toBe('2026-04-01T00:00:00.000Z');
    expect(artifact.sharedBaselines).toHaveLength(1);
    expect(artifact.arms).toHaveLength(8);
    expect(artifact.config.policyMutationProbability).toBe(0.65);

    const none = artifact.arms.find((arm) => arm.label === 'none');
    const all = artifact.arms.find((arm) => arm.label === 'all');

    expect(none?.policyCoupling).toEqual({
      harvestGuidance: false,
      reserveSpending: false,
      reproductionGating: false
    });
    expect(all?.policyCoupling).toEqual({
      harvestGuidance: true,
      reserveSpending: true,
      reproductionGating: true
    });
    expect(none?.runs).toHaveLength(1);
    expect(all?.runs).toHaveLength(1);
    expect(artifact.operatorAttribution).toHaveLength(3);
    expect(artifact.operatorAttribution.every((entry) => entry.contexts.length === 4)).toBe(true);
    expect(artifact.conclusion.mostHelpfulOperator).toMatch(/harvestGuidance|reserveSpending|reproductionGating/);
    expect(artifact.conclusion.mostHarmfulOperator).toMatch(/harvestGuidance|reserveSpending|reproductionGating/);
  });
});
