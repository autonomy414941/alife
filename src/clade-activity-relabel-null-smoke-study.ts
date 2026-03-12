import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullShortSmokeStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { CladeActivityRelabelNullStudyExport, SimulationConfig } from './types';

export interface GeneratedAtCliOptions {
  generatedAt?: string;
}

type SmokeSettingValue = boolean | number | string;

export interface CladeActivityRelabelNullSmokeSummary {
  birthScheduleMatchedAllSeeds: boolean;
  persistentWindowFractionDeltaVsNullMean: number;
  persistentActivityMeanDeltaVsNullMean: number;
}

export type CladeActivityRelabelNullSmokeResult<TSettingName extends string, TValue extends SmokeSettingValue> = Record<
  TSettingName,
  TValue
> & {
  studyInput: RunCladeActivityRelabelNullStudyInput;
  summary: CladeActivityRelabelNullSmokeSummary;
  study: CladeActivityRelabelNullStudyExport;
};

export interface RunCladeActivityRelabelNullSmokeStudyOptions<
  TSettingName extends string,
  TValue extends SmokeSettingValue
> {
  label: string;
  generatedAt?: string;
  question: string;
  prediction: string;
  settingName: TSettingName;
  valueConfigName?: string;
  values: readonly TValue[];
  fixedConfig?: Partial<SimulationConfig>;
  buildSettingConfig?: (value: TValue) => Partial<SimulationConfig>;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export interface CladeActivityRelabelNullSmokeStudyExport<
  TSettingName extends string,
  TValue extends SmokeSettingValue
> {
  generatedAt: string;
  question: string;
  prediction: string;
  config: Record<string, unknown>;
  results: Array<CladeActivityRelabelNullSmokeResult<TSettingName, TValue>>;
}

export function parseGeneratedAtCli(args: string[]): GeneratedAtCliOptions {
  const options: GeneratedAtCliOptions = {};

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

export function runCladeActivityRelabelNullSmokeStudy<TSettingName extends string, TValue extends SmokeSettingValue>(
  input: RunCladeActivityRelabelNullSmokeStudyOptions<TSettingName, TValue>
): CladeActivityRelabelNullSmokeStudyExport<TSettingName, TValue> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const fixedConfig = {
    ...(input.studyInput?.simulation?.config ?? {}),
    ...(input.fixedConfig ?? {})
  };
  const valueConfigName = input.valueConfigName ?? `${input.settingName}Values`;
  const values = [...input.values];
  const shortStudyInput = buildCladeActivityRelabelNullShortSmokeStudyInput(input.studyInput, generatedAt);
  const results = values.map((value) =>
    runCladeActivityRelabelNullSmokeResult({
      label: input.label,
      generatedAt,
      settingName: input.settingName,
      value,
      fixedConfig,
      buildSettingConfig: input.buildSettingConfig,
      studyInput: input.studyInput
    })
  );

  return {
    generatedAt,
    question: input.question,
    prediction: input.prediction,
    config: {
      steps: shortStudyInput.steps,
      windowSize: shortStudyInput.windowSize,
      burnIn: shortStudyInput.burnIn,
      seeds: shortStudyInput.seeds,
      stopWhenExtinct: shortStudyInput.stopWhenExtinct,
      minSurvivalTicks: shortStudyInput.minSurvivalTicks,
      cladogenesisThresholds: shortStudyInput.cladogenesisThresholds,
      ...omitConfigKey(fixedConfig, input.settingName),
      [valueConfigName]: values
    },
    results
  };
}

function runCladeActivityRelabelNullSmokeResult<TSettingName extends string, TValue extends SmokeSettingValue>(input: {
  label: string;
  generatedAt: string;
  settingName: TSettingName;
  value: TValue;
  fixedConfig: Partial<SimulationConfig>;
  buildSettingConfig?: (value: TValue) => Partial<SimulationConfig>;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}): CladeActivityRelabelNullSmokeResult<TSettingName, TValue> {
  const buildSettingConfig =
    input.buildSettingConfig ??
    ((value: TValue) => ({ [input.settingName]: value }) as Partial<SimulationConfig>);
  const studyInput = buildCladeActivityRelabelNullShortSmokeStudyInput(
    {
      ...input.studyInput,
      simulation: {
        ...input.studyInput?.simulation,
        config: {
          ...input.fixedConfig,
          ...buildSettingConfig(input.value)
        }
      }
    },
    input.generatedAt
  );
  const study = runCladeActivityRelabelNullStudy(studyInput);

  return {
    [input.settingName]: input.value,
    studyInput,
    summary: summarizeCladeActivityRelabelNullSmokeStudy(study, input.label),
    study
  } as CladeActivityRelabelNullSmokeResult<TSettingName, TValue>;
}

function summarizeCladeActivityRelabelNullSmokeStudy(
  study: CladeActivityRelabelNullStudyExport,
  label: string
): CladeActivityRelabelNullSmokeSummary {
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error(`${label} produced no threshold results`);
  }

  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error(`${label} produced no aggregate results`);
  }

  return {
    birthScheduleMatchedAllSeeds: thresholdResult.seedResults.every((seedResult) => seedResult.birthScheduleMatched),
    persistentWindowFractionDeltaVsNullMean: aggregate.persistentWindowFractionDeltaVsNull.mean,
    persistentActivityMeanDeltaVsNullMean: aggregate.persistentActivityMeanDeltaVsNull.mean
  };
}

function omitConfigKey(config: Partial<SimulationConfig>, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(config).filter(([configKey]) => configKey !== key));
}
