import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildRunExport, metricsToCsv, runExportToJson } from './export';
import { LifeSimulation } from './simulation';

interface CliOptions {
  steps: number;
  reportEvery: number;
  seed: number;
  window: number;
  exportJson?: string;
  exportCsv?: string;
}

const DEFAULT_OPTIONS: CliOptions = {
  steps: 200,
  reportEvery: 25,
  seed: 20260221,
  window: 25
};

let options: CliOptions;
try {
  options = parseCli(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  printHelp();
  process.exit(1);
}
const simulation = new LifeSimulation({ seed: options.seed });
const runData = simulation.runWithAnalytics(options.steps, options.window, true);

for (let i = 0; i < runData.summaries.length; i += 1) {
  const summary = runData.summaries[i];
  const turnover = runData.analytics[i];
  if (summary.tick % options.reportEvery === 0 || summary.population === 0) {
    console.log(
      `tick=${summary.tick} population=${summary.population} births=${summary.births} deaths=${summary.deaths} ` +
        `meanEnergy=${summary.meanEnergy.toFixed(2)} ` +
        `traits(m=${summary.meanGenome.metabolism.toFixed(2)},h=${summary.meanGenome.harvest.toFixed(2)},a=${summary.meanGenome.aggression.toFixed(2)}) ` +
        `species=${summary.activeSpecies} clades=${summary.activeClades} domSpecies=${summary.dominantSpeciesShare.toFixed(2)} ` +
        `selection(dm=${summary.selectionDifferential.metabolism.toFixed(2)},dh=${summary.selectionDifferential.harvest.toFixed(2)},da=${summary.selectionDifferential.aggression.toFixed(2)}) ` +
        `extinctions(step:s=${summary.speciesExtinctions},c=${summary.cladeExtinctions};total:s=${summary.cumulativeExtinctSpecies},c=${summary.cumulativeExtinctClades}) ` +
        `turnover(rate:spec=${turnover.species.speciationRate.toFixed(2)},ext=${turnover.species.extinctionRate.toFixed(2)},net=${turnover.species.netDiversificationRate.toFixed(2)})`
    );
  }
}

const final = simulation.snapshot();
const history = simulation.history();
const turnover = runData.analytics[runData.analytics.length - 1] ?? simulation.analytics(options.window);
console.log(
  `final tick=${final.tick} population=${final.population} meanEnergy=${final.meanEnergy.toFixed(2)} ` +
    `species=${final.activeSpecies} clades=${final.activeClades} domSpecies=${final.dominantSpeciesShare.toFixed(2)} ` +
    `extinctSpecies=${final.extinctSpecies} extinctClades=${final.extinctClades}`
);
console.log(
  `history tracked clades=${history.clades.length} species=${history.species.length}`
);
console.log(
  `turnover window=${turnover.window.size} specRate=${turnover.species.speciationRate.toFixed(2)} ` +
    `extRate=${turnover.species.extinctionRate.toFixed(2)} netRate=${turnover.species.netDiversificationRate.toFixed(2)} ` +
    `lifespan(extinctMean=${turnover.species.extinctLifespan.mean.toFixed(2)},extinctMax=${turnover.species.extinctLifespan.max.toFixed(2)},activeMean=${turnover.species.activeAge.mean.toFixed(2)})`
);

if (options.exportJson || options.exportCsv) {
  const exportData = buildRunExport({
    analyticsWindow: options.window,
    summaries: runData.summaries,
    analytics: runData.analytics,
    history
  });
  if (options.exportJson) {
    writeOutputFile(options.exportJson, runExportToJson(exportData));
    console.log(`export json=${resolve(process.cwd(), options.exportJson)}`);
  }
  if (options.exportCsv) {
    writeOutputFile(options.exportCsv, metricsToCsv(exportData.summaries, exportData.analytics));
    console.log(`export csv=${resolve(process.cwd(), options.exportCsv)}`);
  }
}

function parseCli(args: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS };
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    switch (flag) {
      case '--steps':
        options.steps = parsePositiveInt(flag, args[++i]);
        break;
      case '--report-every':
        options.reportEvery = parsePositiveInt(flag, args[++i]);
        break;
      case '--seed':
        options.seed = parseInteger(flag, args[++i]);
        break;
      case '--window':
        options.window = parsePositiveInt(flag, args[++i]);
        break;
      case '--export-json':
        options.exportJson = parsePath(flag, args[++i]);
        break;
      case '--export-csv':
        options.exportCsv = parsePath(flag, args[++i]);
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return options;
}

function parsePositiveInt(flag: string, raw: string | undefined): number {
  const value = parseInteger(flag, raw);
  if (value <= 0) {
    throw new Error(`${flag} must be > 0`);
  }
  return value;
}

function parseInteger(flag: string, raw: string | undefined): number {
  if (raw === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`Invalid integer for ${flag}: ${raw}`);
  }
  return Number(raw);
}

function parsePath(flag: string, raw: string | undefined): string {
  if (!raw) {
    throw new Error(`Missing value for ${flag}`);
  }
  return raw;
}

function writeOutputFile(outputPath: string, content: string): void {
  const absolutePath = resolve(process.cwd(), outputPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, 'utf8');
}

function printHelp(): void {
  console.log(
    [
      'Usage: npm start -- [options]',
      '  --steps <n>         Number of simulation steps (default: 200)',
      '  --report-every <n>  Console report interval in ticks (default: 25)',
      '  --window <n>        Rolling analytics window size (default: 25)',
      '  --seed <n>          RNG seed (default: 20260221)',
      '  --export-json <p>   Write full run export JSON',
      '  --export-csv <p>    Write per-tick metrics CSV',
      '  --help              Show this message'
    ].join('\n')
  );
}
