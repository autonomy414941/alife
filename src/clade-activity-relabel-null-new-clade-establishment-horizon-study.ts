import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  BASELINE_BEST_SHORT_STACK_ARTIFACT,
} from './clade-activity-relabel-null-clade-habitat-coupling-horizon-study';
import {
  FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
  STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
  buildConfiguredFounderEstablishmentStudyInput,
  loadEmbeddedStudyFromArtifact
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  buildFounderCrowdingValidationExport,
  buildFounderHabitatValidationExport,
  buildHorizonStudyExport,
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport,
  CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport,
  CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport,
  HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
} from './clade-activity-relabel-null-new-clade-establishment-horizon-result-builders';
import {
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING
} from './clade-activity-relabel-null-new-clade-establishment-smoke-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import { CladeActivityRelabelNullStudyExport } from './types';

const QUESTION =
  'Does newCladeSettlementCrowdingGraceTicks=36 preserve the short-horizon founder-support gain on the canonical 4000-step relabel-null panel when compared against the static cladeHabitatCoupling=0.75 baseline with adaptive memory disabled?';
const PREDICTION =
  'If the settlement-grace gain is not just an adaptive-memory stack artifact, the founder-grace run should improve persistentActivityMeanDeltaVsNullMean and activeCladeDeltaVsNullMean versus the static habitat baseline at cladogenesis thresholds 1.0 and 1.2 without breaking matched birth schedules.';

export const BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json';

export interface RunCladeActivityRelabelNullNewCladeEstablishmentHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  founderGraceStudy?: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  currentNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  currentNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  habitatMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
  habitatAndCrowdingMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatAndCrowdingMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const staticHabitatStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const baselineStudy = input.baselineStudy ?? loadStaticHabitatBaselineStudy();
  const founderGraceStudy = input.founderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceStudyInput);

  return buildHorizonStudyExport(
    generatedAt,
    QUESTION,
    PREDICTION,
    BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
    BASELINE_BEST_SHORT_STACK_ARTIFACT,
    staticHabitatStudyInput,
    founderGraceStudyInput,
    baselineStudy,
    founderGraceStudy
  );
}

export function runCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  return buildFounderHabitatValidationExport(
    generatedAt,
    input.studyInput,
    input.currentNullBaselineStudy,
    input.currentNullFounderGraceStudy,
    input.habitatMatchedNullBaselineStudy,
    input.habitatMatchedNullFounderGraceStudy,
    (generatedAt, studyInput, baselineStudy, founderGraceStudy) =>
      runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
        generatedAt,
        studyInput,
        baselineStudy,
        founderGraceStudy
      })
  );
}

export function runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  return buildFounderCrowdingValidationExport(
    generatedAt,
    input.studyInput,
    input.habitatMatchedNullBaselineStudy,
    input.habitatMatchedNullFounderGraceStudy,
    input.habitatAndCrowdingMatchedNullBaselineStudy,
    input.habitatAndCrowdingMatchedNullFounderGraceStudy,
    (generatedAt, studyInput, baselineStudy, founderGraceStudy) =>
      runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
        generatedAt,
        studyInput,
        baselineStudy,
        founderGraceStudy
      })
  );
}

function loadStaticHabitatBaselineStudy(): CladeActivityRelabelNullStudyExport {
  return loadEmbeddedStudyFromArtifact(
    BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
    'habitatCoupledStudy',
    'a habitat-coupling horizon study export'
  );
}

export {
  HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
  type CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport,
  type CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport,
  type CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport
} from './clade-activity-relabel-null-new-clade-establishment-horizon-result-builders';
export { compareNewCladeEstablishmentHorizonStudies } from './clade-activity-relabel-null-new-clade-establishment-comparisons';
export type {
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison
} from './clade-activity-relabel-null-new-clade-establishment-comparisons';

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
