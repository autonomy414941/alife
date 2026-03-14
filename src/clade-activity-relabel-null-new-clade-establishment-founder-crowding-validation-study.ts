import {
  runGeneratedAtStudyCli,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';
import {
  runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';

export {
  runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
export type {
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport,
  RunCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyInput
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';

export function runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy({
        generatedAt
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyCli(process.argv.slice(2));
}
