import { buildBestShortStackSimulationConfig } from './clade-activity-relabel-null-best-short-stack';
import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD = -1;
const CLADOGENESIS_TRAIT_NOVELTY_THRESHOLD_VALUES = [-1, 0.02];

export function runCladeActivityRelabelNullCladogenesisTraitNoveltySmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Cladogenesis trait novelty smoke study',
        generatedAt,
        question:
          'Does requiring ecological trait novelty before cladogenesis improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
        prediction:
          'If redundant founders are diluting persistent activity, a small positive trait-novelty gate should improve persistentActivityMeanDeltaVsNullMean while keeping the relabel-null birth schedules matched within each setting.',
        settingName: 'cladogenesisTraitNoveltyThreshold',
        valueConfigName: 'cladogenesisTraitNoveltyThresholdValues',
        values: CLADOGENESIS_TRAIT_NOVELTY_THRESHOLD_VALUES,
        fixedConfig: buildBestShortStackSimulationConfig({
          cladogenesisEcologyAdvantageThreshold: CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
        })
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullCladogenesisTraitNoveltySmokeStudyCli(process.argv.slice(2));
}
