import { describe, expect, it } from 'vitest';
import {
  RESOURCE_METABOLISM_FUNGIBILITY_DIAGNOSTIC_ARTIFACT,
  runResourceMetabolismFungibilityDiagnostics
} from '../src/resource-metabolism-fungibility-diagnostics';

describe('resource metabolism fungibility diagnostics', () => {
  it('defines the correct artifact path', () => {
    expect(RESOURCE_METABOLISM_FUNGIBILITY_DIAGNOSTIC_ARTIFACT).toBe(
      'docs/resource_metabolism_fungibility_diagnostics_2026-03-16.json'
    );
  });

  it('shows that harvested resource identity collapses into scalar energy', () => {
    const diagnostics = runResourceMetabolismFungibilityDiagnostics({
      generatedAt: '2026-03-16T00:00:00.000Z'
    });

    expect(diagnostics.generatedAt).toBe('2026-03-16T00:00:00.000Z');
    expect(diagnostics.structuralEvidence.retainsDistinctInternalEnergyPools).toBe(false);
    expect(diagnostics.structuralEvidence.harvestAddsOnlyTotalHarvestToAgentEnergy).toBe(true);
    expect(diagnostics.matchedHarvestCollapse.identicalPostHarvestAgentState).toBe(true);
    expect(diagnostics.matchedHarvestCollapse.postHarvestEnergyDelta).toBe(0);
    expect(diagnostics.downstreamCostEquivalence.metabolismAfterMatchedHarvest.identicalEnergyLoss).toBe(true);
    expect(diagnostics.downstreamCostEquivalence.metabolismAfterMatchedHarvest.energyLossDelta).toBe(0);
    expect(diagnostics.downstreamCostEquivalence.reproductionAfterMatchedHarvest.identicalOutcome).toBe(true);
    expect(diagnostics.specialistVsGeneralist.sharedEnvironmentHarvest.harvestDifferentiationOnlyAtIntake).toBe(true);
    expect(diagnostics.specialistVsGeneralist.matchedEnergyMetabolism.identicalEnergyLoss).toBe(true);
    expect(diagnostics.specialistVsGeneralist.matchedEnergyReproduction.identicalScalarOutcome).toBe(true);
    expect(diagnostics.specialistVsGeneralist.showsDistinctInternalStateAtMatchedTotalEnergy).toBe(false);
    expect(diagnostics.diagnosis).toContain('fungible energy scalar');
  });
});
