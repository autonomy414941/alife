import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT as STATIC_HABITAT_BASELINE_ARTIFACT,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
import {
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES
} from './clade-activity-relabel-null-new-clade-encounter-restraint-smoke-study';
import { parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does newCladeEncounterRestraintGraceBoost=2 preserve the short-horizon newborn encounter-restraint gain on the canonical 4000-step relabel-null panel when compared against the founder-grace static habitat baseline?';
const PREDICTION =
  'If post-founding same-lineage conflict still suppresses concurrent clade survival after settlement grace, the encounter-restraint run should improve activeCladeDeltaVsNullMean versus the boost-0 founder-grace baseline while keeping matched birth schedules on the canonical horizon surface.';

export const BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_establishment_horizon_2026-03-14.json';
export const NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_encounter_restraint_horizon_2026-03-14.json';
export const HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST =
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[0];
export const HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST =
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[1];

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  encounterRestraintBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  encounterRestraintPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  encounterRestraintPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  encounterRestraintActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  encounterRestraintDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
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
    baselineNewCladeEncounterRestraintGraceBoost: number;
    encounterRestraintNewCladeEncounterRestraintGraceBoost: number;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    encounterRestraintSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[];
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  encounterRestraintStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const founderGraceStudyInput = buildNewCladeEncounterRestraintHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST
  );
  const encounterRestraintStudyInput = buildNewCladeEncounterRestraintHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(encounterRestraintStudyInput);
  const baselineStudy = input.baselineStudy ?? loadFounderGraceBaselineStudy();
  const encounterRestraintStudy =
    input.encounterRestraintStudy ?? runCladeActivityRelabelNullStudy(encounterRestraintStudyInput);

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
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
      baselineNewCladeEncounterRestraintGraceBoost:
        HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      encounterRestraintNewCladeEncounterRestraintGraceBoost:
        HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      founderGraceSimulationConfig: founderGraceStudyInput.simulation?.config ?? {},
      encounterRestraintSimulationConfig: encounterRestraintStudyInput.simulation?.config ?? {}
    },
    comparison: compareNewCladeEncounterRestraintHorizonStudies(encounterRestraintStudy, baselineStudy),
    encounterRestraintStudy
  };
}

export function compareNewCladeEncounterRestraintHorizonStudies(
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(encounterRestraintStudy, baselineStudy).map((comparison) => {
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
    const encounterRestraintActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Encounter-restraint study',
      comparison.currentDiagnostics
    );

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      founderGraceBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      encounterRestraintBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      founderGracePersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      encounterRestraintPersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsFounderGrace:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      founderGracePersistentActivityMeanDeltaVsNullMean:
        comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      encounterRestraintPersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsFounderGrace:
        comparison.persistentActivityMeanImprovementVsBaseline,
      founderGraceActiveCladeDeltaVsNullMean,
      encounterRestraintActiveCladeDeltaVsNullMean,
      activeCladeDeltaImprovementVsFounderGrace:
        encounterRestraintActiveCladeDeltaVsNullMean - founderGraceActiveCladeDeltaVsNullMean,
      founderGraceDiagnostics: comparison.baselineDiagnostics,
      encounterRestraintDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildNewCladeEncounterRestraintHorizonStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  newCladeEncounterRestraintGraceBoost: number
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
          adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
          newCladeSettlementCrowdingGraceTicks:
            HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
          newCladeEncounterRestraintGraceBoost
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
    throw new Error(
      'New-clade encounter-restraint horizon study requires a fully resolved study input'
    );
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
  const study = runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
