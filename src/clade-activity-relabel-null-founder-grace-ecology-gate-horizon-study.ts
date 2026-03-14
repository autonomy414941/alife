import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import { parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT as STATIC_HABITAT_BASELINE_ARTIFACT
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does cladogenesisEcologyAdvantageThreshold=0.1 preserve or improve founder-grace coexistence on the canonical 4000-step relabel-null panel when compared against the founder-grace baseline at -1?';
const PREDICTION =
  'If ecology gating filters weak founders rather than broadly suppressing new clades, the 0.1 run should improve activeCladeDeltaVsNullMean versus the -1 founder-grace baseline and recover threshold-1.0 persistent activity while keeping matched birth schedules.';

export const BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_establishment_horizon_2026-03-14.json';
export const FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_founder_grace_ecology_gate_horizon_2026-03-14.json';
export const HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD =
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES[0];
export const HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD =
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES[1];

export interface CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  ecologyGateBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  ecologyGatePersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  ecologyGatePersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  ecologyGateActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  ecologyGateDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    staticHabitatBaselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    newCladeSettlementCrowdingGraceTicks: number;
    baselineCladogenesisEcologyAdvantageThreshold: number;
    ecologyGateCladogenesisEcologyAdvantageThreshold: number;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    ecologyGateSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison[];
  ecologyGateStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  ecologyGateStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy(
  input: RunCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyInput = {}
): CladeActivityRelabelNullFounderGraceEcologyGateHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const founderGraceStudyInput = buildFounderGraceEcologyGateHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
  );
  const ecologyGateStudyInput = buildFounderGraceEcologyGateHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(ecologyGateStudyInput);
  const baselineStudy = input.baselineStudy ?? loadFounderGraceBaselineStudy();
  const ecologyGateStudy = input.ecologyGateStudy ?? runCladeActivityRelabelNullStudy(ecologyGateStudyInput);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
      staticHabitatBaselineArtifact: STATIC_HABITAT_BASELINE_ARTIFACT,
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      baselineCladogenesisEcologyAdvantageThreshold:
        HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      ecologyGateCladogenesisEcologyAdvantageThreshold:
        HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      founderGraceSimulationConfig: founderGraceStudyInput.simulation?.config ?? {},
      ecologyGateSimulationConfig: ecologyGateStudyInput.simulation?.config ?? {}
    },
    comparison: compareFounderGraceEcologyGateHorizonStudies(ecologyGateStudy, baselineStudy),
    ecologyGateStudy
  };
}

export function compareFounderGraceEcologyGateHorizonStudies(
  ecologyGateStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullFounderGraceEcologyGateHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(ecologyGateStudy, baselineStudy).map((comparison) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (thresholdResult) => thresholdResult.cladogenesisThreshold === comparison.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${comparison.cladogenesisThreshold}`
      );
    }

    const founderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Founder-grace baseline',
      comparison.baselineDiagnostics
    );
    const ecologyGateActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Ecology-gate study',
      comparison.currentDiagnostics
    );

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      founderGraceBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      ecologyGateBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      founderGracePersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      ecologyGatePersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsFounderGrace:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      founderGracePersistentActivityMeanDeltaVsNullMean:
        comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      ecologyGatePersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsFounderGrace:
        comparison.persistentActivityMeanImprovementVsBaseline,
      founderGraceActiveCladeDeltaVsNullMean,
      ecologyGateActiveCladeDeltaVsNullMean,
      activeCladeDeltaImprovementVsFounderGrace:
        ecologyGateActiveCladeDeltaVsNullMean - founderGraceActiveCladeDeltaVsNullMean,
      founderGraceDiagnostics: comparison.baselineDiagnostics,
      ecologyGateDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildFounderGraceEcologyGateHorizonStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  cladogenesisEcologyAdvantageThreshold: number
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
          adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
          newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
          cladogenesisEcologyAdvantageThreshold
        }
      }
    },
    generatedAt
  );
}

function requireResolvedStudyConfig(studyInput: RunCladeActivityRelabelNullStudyInput): {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
} {
  if (
    studyInput.steps === undefined ||
    studyInput.windowSize === undefined ||
    studyInput.burnIn === undefined ||
    studyInput.seeds === undefined ||
    studyInput.stopWhenExtinct === undefined ||
    studyInput.minSurvivalTicks === undefined ||
    studyInput.cladogenesisThresholds === undefined
  ) {
    throw new Error('Founder-grace ecology-gate horizon study requires a fully resolved study input');
  }

  return {
    steps: studyInput.steps,
    windowSize: studyInput.windowSize,
    burnIn: studyInput.burnIn,
    seeds: studyInput.seeds,
    stopWhenExtinct: studyInput.stopWhenExtinct,
    minSurvivalTicks: studyInput.minSurvivalTicks,
    cladogenesisThresholds: studyInput.cladogenesisThresholds
  };
}

function loadFounderGraceBaselineStudy(): CladeActivityRelabelNullStudyExport {
  const baselineArtifactPath = resolve(__dirname, '..', BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT);
  const parsed = JSON.parse(readFileSync(baselineArtifactPath, 'utf8')) as {
    founderGraceStudy?: CladeActivityRelabelNullStudyExport;
  };

  if (
    !parsed.founderGraceStudy ||
    !Array.isArray(parsed.founderGraceStudy.thresholdResults) ||
    parsed.founderGraceStudy.thresholdResults.length === 0
  ) {
    throw new Error(
      `Baseline artifact ${BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT} is not a new-clade establishment horizon study export`
    );
  }

  return parsed.founderGraceStudy;
}

function requireActiveCladeDeltaVsNullMean(
  label: string,
  diagnostics: CladeActivityRelabelNullDiagnosticSnapshot
): number {
  if (diagnostics.activeCladeDeltaVsNullMean === null) {
    throw new Error(`${label} is missing activeCladeDeltaVsNullMean diagnostics`);
  }

  return diagnostics.activeCladeDeltaVsNullMean;
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullFounderGraceEcologyGateHorizonStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
