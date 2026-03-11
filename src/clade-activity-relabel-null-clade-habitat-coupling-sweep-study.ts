import { runCladeActivityRelabelNullCladeHabitatCouplingSweep } from './activity';
import { cladeActivityRelabelNullCladeHabitatCouplingSweepToJson } from './export';

interface CliOptions {
  generatedAt?: string;
}

const options = parseCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullCladeHabitatCouplingSweep({
  generatedAt: options.generatedAt
});

process.stdout.write(cladeActivityRelabelNullCladeHabitatCouplingSweepToJson(study));

function parseCli(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--generated-at') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--generated-at requires a value');
      }
      options.generatedAt = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}
