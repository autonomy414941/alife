import { runCladeActivityRelabelNullCladeHabitatCouplingSweep } from './activity';
import {
  runGeneratedAtStudyCli,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

export function runCladeActivityRelabelNullCladeHabitatCouplingSweepStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullCladeHabitatCouplingSweep({
        generatedAt
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullCladeHabitatCouplingSweepStudyCli(process.argv.slice(2));
}
