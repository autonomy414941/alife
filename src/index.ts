import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildRunExport,
  experimentAggregateToCsv,
  experimentExportToJson,
  metricsToCsv,
  runExportToJson
} from './export';
import { runExperiment } from './experiment';
import { LifeSimulation } from './simulation';

interface CliOptions {
  steps: number;
  reportEvery: number;
  seed: number;
  window: number;
  experimentRuns: number;
  seedStep: number;
  seasonalCycleLength: number;
  seasonalRegenAmplitude: number;
  seasonalFertilityContrastAmplitude: number;
  disturbanceInterval: number;
  disturbanceEnergyLoss: number;
  disturbanceResourceLoss: number;
  disturbanceRadius: number;
  disturbanceRefugiaFraction: number;
  exportJson?: string;
  exportCsv?: string;
  exportExperimentJson?: string;
  exportExperimentCsv?: string;
}

const DEFAULT_OPTIONS: CliOptions = {
  steps: 200,
  reportEvery: 25,
  seed: 20260221,
  window: 25,
  experimentRuns: 1,
  seedStep: 1,
  seasonalCycleLength: 120,
  seasonalRegenAmplitude: 0,
  seasonalFertilityContrastAmplitude: 0,
  disturbanceInterval: 0,
  disturbanceEnergyLoss: 0,
  disturbanceResourceLoss: 0,
  disturbanceRadius: -1,
  disturbanceRefugiaFraction: 0
};

main();

function main(): void {
  let options: CliOptions;
  try {
    options = parseCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    printHelp();
    process.exit(1);
  }

  const experimentMode =
    options.experimentRuns > 1 || options.exportExperimentJson !== undefined || options.exportExperimentCsv !== undefined;
  if (experimentMode && (options.exportJson || options.exportCsv)) {
    console.error(
      'Cannot combine --export-json/--export-csv with experiment mode. Use --export-experiment-json/--export-experiment-csv.'
    );
    process.exit(1);
  }

  if (experimentMode) {
    runExperimentMode(options);
    return;
  }

  runSingleMode(options);
}

function runSingleMode(options: CliOptions): void {
  const simulation = new LifeSimulation({
    seed: options.seed,
    config: {
      seasonalCycleLength: options.seasonalCycleLength,
      seasonalRegenAmplitude: options.seasonalRegenAmplitude,
      seasonalFertilityContrastAmplitude: options.seasonalFertilityContrastAmplitude,
      disturbanceInterval: options.disturbanceInterval,
      disturbanceEnergyLoss: options.disturbanceEnergyLoss,
      disturbanceResourceLoss: options.disturbanceResourceLoss,
      disturbanceRadius: options.disturbanceRadius,
      disturbanceRefugiaFraction: options.disturbanceRefugiaFraction
    }
  });
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
          `turnover(rate:spec=${turnover.species.speciationRate.toFixed(2)},ext=${turnover.species.extinctionRate.toFixed(2)},net=${turnover.species.netDiversificationRate.toFixed(2)}) ` +
          `strategy(active=${turnover.strategy.activeSpecies},mean(h=${turnover.strategy.habitatPreference.mean.toFixed(2)},` +
          `t=${turnover.strategy.trophicLevel.mean.toFixed(2)},d=${turnover.strategy.defenseLevel.mean.toFixed(2)}),` +
          `weighted(h=${turnover.strategy.habitatPreference.weightedMean.toFixed(2)},` +
          `t=${turnover.strategy.trophicLevel.weightedMean.toFixed(2)},d=${turnover.strategy.defenseLevel.weightedMean.toFixed(2)})) ` +
          `forcing(regen=${turnover.forcing.regenMultiplier.toFixed(2)},contrast=${turnover.forcing.fertilityContrastMultiplier.toFixed(2)},phase=${turnover.forcing.phase.toFixed(2)}) ` +
          `disturbance(last=${turnover.disturbance.lastEventTick},events=${turnover.disturbance.eventsInWindow},` +
          `scope=${turnover.disturbance.radius},affected=${turnover.disturbance.lastEventAffectedCellFraction.toFixed(2)},` +
          `recovery=${turnover.resilience.recoveryTicks},trough=${turnover.resilience.populationTroughDepth.toFixed(2)}@${turnover.resilience.populationTroughTicks},` +
          `delay=${turnover.resilience.delayedPopulationShockDepth.toFixed(2)},spike=${turnover.resilience.turnoverSpike.toFixed(2)},` +
          `burst=${turnover.resilience.extinctionBurstDepth.toFixed(2)}) ` +
          `locality(occ=${turnover.locality.occupiedCellFraction.toFixed(2)},dom=${turnover.locality.meanDominantSpeciesShare.toFixed(2)},chg=${turnover.localityTurnover.changedDominantCellFractionMean.toFixed(2)}) ` +
          `patch(r=${turnover.localityRadius.radius},dom=${turnover.localityRadius.meanDominantSpeciesShare.toFixed(2)},` +
          `align=${turnover.localityRadius.centerDominantAlignment.toFixed(2)},` +
          `chg=${turnover.localityRadiusTurnover.changedDominantCellFractionMean.toFixed(2)})`
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
      `lifespan(extinctMean=${turnover.species.extinctLifespan.mean.toFixed(2)},extinctMax=${turnover.species.extinctLifespan.max.toFixed(2)},activeMean=${turnover.species.activeAge.mean.toFixed(2)}) ` +
      `strategy(active=${turnover.strategy.activeSpecies},mean(h=${turnover.strategy.habitatPreference.mean.toFixed(2)},` +
      `t=${turnover.strategy.trophicLevel.mean.toFixed(2)},d=${turnover.strategy.defenseLevel.mean.toFixed(2)}),` +
      `weighted(h=${turnover.strategy.habitatPreference.weightedMean.toFixed(2)},` +
      `t=${turnover.strategy.trophicLevel.weightedMean.toFixed(2)},d=${turnover.strategy.defenseLevel.weightedMean.toFixed(2)})) ` +
      `forcing(regen=${turnover.forcing.regenMultiplier.toFixed(2)},contrast=${turnover.forcing.fertilityContrastMultiplier.toFixed(2)},phase=${turnover.forcing.phase.toFixed(2)}) ` +
      `disturbance(last=${turnover.disturbance.lastEventTick},events=${turnover.disturbance.eventsInWindow},` +
      `scope=${turnover.disturbance.radius},refugia=${turnover.disturbance.refugiaFraction.toFixed(2)},` +
      `popShock=${turnover.disturbance.lastEventPopulationShock.toFixed(2)},` +
      `resShock=${turnover.disturbance.lastEventResourceShock.toFixed(2)},` +
      `affected=${turnover.disturbance.lastEventAffectedCellFraction.toFixed(2)},` +
      `eventRefugia=${turnover.disturbance.lastEventRefugiaCellFraction.toFixed(2)}) ` +
      `resilience(recovery=${turnover.resilience.recoveryTicks},progress=${turnover.resilience.recoveryProgress.toFixed(2)},` +
      `trough=${turnover.resilience.populationTroughDepth.toFixed(2)}@${turnover.resilience.populationTroughTicks},` +
      `delay=${turnover.resilience.delayedPopulationShockDepth.toFixed(2)},` +
      `preTurn=${turnover.resilience.preDisturbanceTurnoverRate.toFixed(2)},` +
      `postTurn=${turnover.resilience.postDisturbanceTurnoverRate.toFixed(2)},` +
      `spike=${turnover.resilience.turnoverSpike.toFixed(2)},` +
      `burst=${turnover.resilience.extinctionBurstDepth.toFixed(2)}) ` +
      `locality(occ=${turnover.locality.occupiedCellFraction.toFixed(2)},domMean=${turnover.locality.meanDominantSpeciesShare.toFixed(2)},` +
      `domStd=${turnover.locality.dominantSpeciesShareStdDev.toFixed(2)},turnMean=${turnover.localityTurnover.changedDominantCellFractionMean.toFixed(2)},` +
      `turnStd=${turnover.localityTurnover.changedDominantCellFractionStdDev.toFixed(2)}) ` +
      `patch(r=${turnover.localityRadius.radius},domMean=${turnover.localityRadius.meanDominantSpeciesShare.toFixed(2)},` +
      `richness=${turnover.localityRadius.meanSpeciesRichness.toFixed(2)},align=${turnover.localityRadius.centerDominantAlignment.toFixed(2)},` +
      `turnMean=${turnover.localityRadiusTurnover.changedDominantCellFractionMean.toFixed(2)},` +
      `turnStd=${turnover.localityRadiusTurnover.changedDominantCellFractionStdDev.toFixed(2)})`
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
}

function runExperimentMode(options: CliOptions): void {
  const experimentData = runExperiment({
    runs: options.experimentRuns,
    steps: options.steps,
    analyticsWindow: options.window,
    seed: options.seed,
    seedStep: options.seedStep,
    stopWhenExtinct: true,
    simulation: {
      config: {
        seasonalCycleLength: options.seasonalCycleLength,
        seasonalRegenAmplitude: options.seasonalRegenAmplitude,
        seasonalFertilityContrastAmplitude: options.seasonalFertilityContrastAmplitude,
        disturbanceInterval: options.disturbanceInterval,
        disturbanceEnergyLoss: options.disturbanceEnergyLoss,
        disturbanceResourceLoss: options.disturbanceResourceLoss,
        disturbanceRadius: options.disturbanceRadius,
        disturbanceRefugiaFraction: options.disturbanceRefugiaFraction
      }
    }
  });
  const aggregate = experimentData.aggregate;
  const lastSeed = options.seed + (experimentData.config.runs - 1) * options.seedStep;
  const localityOccupied = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.locality.occupiedCellFraction)
  );
  const localityDominance = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.locality.meanDominantSpeciesShare)
  );
  const localityTurnover = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.localityTurnover.changedDominantCellFractionMean)
  );
  const patchDominance = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.localityRadius.meanDominantSpeciesShare)
  );
  const patchAlignment = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.localityRadius.centerDominantAlignment)
  );
  const patchTurnover = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.localityRadiusTurnover.changedDominantCellFractionMean)
  );
  const strategyHabitat = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.habitatPreference.mean)
  );
  const strategyTrophic = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.trophicLevel.mean)
  );
  const strategyDefense = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.defenseLevel.mean)
  );
  const strategyHabitatWeighted = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.habitatPreference.weightedMean)
  );
  const strategyTrophicWeighted = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.trophicLevel.weightedMean)
  );
  const strategyDefenseWeighted = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.strategy.defenseLevel.weightedMean)
  );
  const forcingRegen = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.forcing.regenMultiplier)
  );
  const forcingContrast = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.forcing.fertilityContrastMultiplier)
  );
  const disturbanceEvents = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.disturbance.eventsInWindow)
  );
  const disturbancePopulationShock = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.disturbance.lastEventPopulationShock)
  );
  const disturbanceResourceShock = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.disturbance.lastEventResourceShock)
  );
  const disturbanceAffectedCellFraction = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.disturbance.lastEventAffectedCellFraction)
  );
  const disturbanceEventRefugiaFraction = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.disturbance.lastEventRefugiaCellFraction)
  );
  const resilienceRecoveryTicks = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.recoveryTicks)
  );
  const resilienceRecoveryProgress = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.recoveryProgress)
  );
  const resiliencePopulationTroughDepth = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.populationTroughDepth)
  );
  const resiliencePopulationTroughTicks = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.populationTroughTicks)
  );
  const resilienceDelayedPopulationShock = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.delayedPopulationShockDepth)
  );
  const resilienceTurnoverSpike = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.turnoverSpike)
  );
  const resilienceExtinctionBurst = summarizeNumbers(
    experimentData.runs.map((run) => run.finalAnalytics.resilience.extinctionBurstDepth)
  );

  console.log(
    `experiment runs=${aggregate.runs} seeds=${options.seed}..${lastSeed} extinctionRate=${aggregate.extinctionRate.toFixed(2)} ` +
      `steps(mean=${aggregate.stepsExecuted.mean.toFixed(2)},min=${aggregate.stepsExecuted.min.toFixed(0)},max=${aggregate.stepsExecuted.max.toFixed(0)})`
  );
  console.log(
    `final population(mean=${aggregate.finalPopulation.mean.toFixed(2)},min=${aggregate.finalPopulation.min.toFixed(0)},max=${aggregate.finalPopulation.max.toFixed(0)}) ` +
      `meanEnergy(mean=${aggregate.finalMeanEnergy.mean.toFixed(2)}) ` +
      `species(mean=${aggregate.finalActiveSpecies.mean.toFixed(2)}) clades(mean=${aggregate.finalActiveClades.mean.toFixed(2)})`
  );
  console.log(
    `turnover species(speciation=${aggregate.finalSpeciesSpeciationRate.mean.toFixed(2)},` +
      `extinction=${aggregate.finalSpeciesExtinctionRate.mean.toFixed(2)},` +
      `net=${aggregate.finalSpeciesNetDiversificationRate.mean.toFixed(2)})`
  );
  console.log(
    `locality occupied(mean=${localityOccupied.mean.toFixed(2)}) ` +
    `dominance(mean=${localityDominance.mean.toFixed(2)}) ` +
    `turnover(mean=${localityTurnover.mean.toFixed(2)})`
  );
  console.log(
    `patch radius=${experimentData.runs[0]?.finalAnalytics.localityRadius.radius ?? 0} ` +
      `dominance(mean=${patchDominance.mean.toFixed(2)}) ` +
      `alignment(mean=${patchAlignment.mean.toFixed(2)}) ` +
      `turnover(mean=${patchTurnover.mean.toFixed(2)})`
  );
  console.log(
    `strategy mean(h=${strategyHabitat.mean.toFixed(2)},t=${strategyTrophic.mean.toFixed(2)},d=${strategyDefense.mean.toFixed(2)}) ` +
      `weighted(h=${strategyHabitatWeighted.mean.toFixed(2)},` +
      `t=${strategyTrophicWeighted.mean.toFixed(2)},d=${strategyDefenseWeighted.mean.toFixed(2)})`
  );
  console.log(
    `forcing regen(mean=${forcingRegen.mean.toFixed(2)}) contrast(mean=${forcingContrast.mean.toFixed(2)})`
  );
  console.log(
    `disturbance events(mean=${disturbanceEvents.mean.toFixed(2)}) ` +
      `popShock(mean=${disturbancePopulationShock.mean.toFixed(2)}) ` +
      `resShock(mean=${disturbanceResourceShock.mean.toFixed(2)}) ` +
      `affected(mean=${disturbanceAffectedCellFraction.mean.toFixed(2)}) ` +
      `eventRefugia(mean=${disturbanceEventRefugiaFraction.mean.toFixed(2)})`
  );
  console.log(
    `resilience recovery(mean=${resilienceRecoveryTicks.mean.toFixed(2)},progress=${resilienceRecoveryProgress.mean.toFixed(2)}) ` +
      `trough(mean=${resiliencePopulationTroughDepth.mean.toFixed(2)}@${resiliencePopulationTroughTicks.mean.toFixed(2)}) ` +
      `delay(mean=${resilienceDelayedPopulationShock.mean.toFixed(2)}) ` +
      `spike(mean=${resilienceTurnoverSpike.mean.toFixed(2)}) ` +
      `burst(mean=${resilienceExtinctionBurst.mean.toFixed(2)})`
  );

  if (options.exportExperimentJson) {
    writeOutputFile(options.exportExperimentJson, experimentExportToJson(experimentData));
    console.log(`export experiment_json=${resolve(process.cwd(), options.exportExperimentJson)}`);
  }
  if (options.exportExperimentCsv) {
    writeOutputFile(options.exportExperimentCsv, experimentAggregateToCsv(experimentData));
    console.log(`export experiment_csv=${resolve(process.cwd(), options.exportExperimentCsv)}`);
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
      case '--experiment-runs':
        options.experimentRuns = parsePositiveInt(flag, args[++i]);
        break;
      case '--seed-step':
        options.seedStep = parsePositiveInt(flag, args[++i]);
        break;
      case '--season-cycle':
        options.seasonalCycleLength = parsePositiveInt(flag, args[++i]);
        break;
      case '--season-regen-amp':
        options.seasonalRegenAmplitude = parseUnitInterval(flag, args[++i]);
        break;
      case '--season-contrast-amp':
        options.seasonalFertilityContrastAmplitude = parseUnitInterval(flag, args[++i]);
        break;
      case '--disturbance-interval':
        options.disturbanceInterval = parseNonNegativeInt(flag, args[++i]);
        break;
      case '--disturbance-energy-loss':
        options.disturbanceEnergyLoss = parseUnitInterval(flag, args[++i]);
        break;
      case '--disturbance-resource-loss':
        options.disturbanceResourceLoss = parseUnitInterval(flag, args[++i]);
        break;
      case '--disturbance-radius':
        options.disturbanceRadius = parseInteger(flag, args[++i]);
        break;
      case '--disturbance-refugia':
        options.disturbanceRefugiaFraction = parseUnitInterval(flag, args[++i]);
        break;
      case '--export-json':
        options.exportJson = parsePath(flag, args[++i]);
        break;
      case '--export-csv':
        options.exportCsv = parsePath(flag, args[++i]);
        break;
      case '--export-experiment-json':
        options.exportExperimentJson = parsePath(flag, args[++i]);
        break;
      case '--export-experiment-csv':
        options.exportExperimentCsv = parsePath(flag, args[++i]);
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

function parseNonNegativeInt(flag: string, raw: string | undefined): number {
  const value = parseInteger(flag, raw);
  if (value < 0) {
    throw new Error(`${flag} must be >= 0`);
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

function parseNumber(flag: string, raw: string | undefined): number {
  if (raw === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for ${flag}: ${raw}`);
  }
  return value;
}

function parseUnitInterval(flag: string, raw: string | undefined): number {
  const value = parseNumber(flag, raw);
  if (value < 0 || value > 1) {
    throw new Error(`${flag} must be between 0 and 1`);
  }
  return value;
}

function parsePath(flag: string, raw: string | undefined): string {
  if (!raw) {
    throw new Error(`Missing value for ${flag}`);
  }
  return raw;
}

function summarizeNumbers(values: number[]): { mean: number; min: number; max: number } {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0 };
  }
  let min = values[0];
  let max = values[0];
  let total = 0;
  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    total += value;
  }
  return { mean: total / values.length, min, max };
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
      '  --experiment-runs <n> Run a seeded sweep with n runs (default: 1)',
      '  --seed-step <n>     Seed increment between experiment runs (default: 1)',
      '  --season-cycle <n>  Seasonal cycle length in ticks (default: 120)',
      '  --season-regen-amp <n> Seasonal regeneration amplitude 0..1 (default: 0)',
      '  --season-contrast-amp <n> Seasonal fertility-contrast amplitude 0..1 (default: 0)',
      '  --disturbance-interval <n> Disturbance interval in ticks; 0 disables (default: 0)',
      '  --disturbance-energy-loss <n> Disturbance per-agent energy-loss fraction 0..1 (default: 0)',
      '  --disturbance-resource-loss <n> Disturbance per-cell resource-loss fraction 0..1 (default: 0)',
      '  --disturbance-radius <n> Disturbance Manhattan radius; -1 applies globally (default: -1)',
      '  --disturbance-refugia <n> Fraction of targeted disturbance cells spared as refugia 0..1 (default: 0)',
      '  --export-json <p>   Write full run export JSON',
      '  --export-csv <p>    Write per-tick metrics CSV',
      '  --export-experiment-json <p>  Write experiment sweep JSON',
      '  --export-experiment-csv <p>   Write aggregate experiment CSV',
      '  --help              Show this message'
    ].join('\n')
  );
}
