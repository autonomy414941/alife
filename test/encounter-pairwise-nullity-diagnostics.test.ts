import { describe, it } from 'vitest';
import {
  emitPairwiseNullityDiagnostics,
  runPairwiseNullityDiagnostics
} from '../src/encounter-pairwise-nullity-diagnostics';

const ARTIFACT_PATH =
  'docs/encounter_pairwise_nullity_diagnostics_2026-03-17.json';

describe('Pairwise Nullity Diagnostics', () => {
  it(
    'measures encounter diagnostics for dominant vs pairwise operators',
    () => {
      const study = runPairwiseNullityDiagnostics({
        generatedAt: '2026-03-17T00:00:00.000Z',
        seed: 20260317,
        steps: 100
      });
      emitPairwiseNullityDiagnostics(ARTIFACT_PATH, study);
    },
    10000
  );
});
