import { readFileSync, writeFileSync } from 'fs';
import { PolicyGateStrength } from './policy-signature';

const SIGNATURE_VALIDATION_ARTIFACT =
  'docs/policy_signature_matched_control_validation_2026-04-01.json';
const OUTPUT_ARTIFACT =
  'docs/signature_specific_reproduction_gate_ablation_2026-04-02.json';

interface SignatureSummary {
  signature: {
    key: string;
    reproductionGate: PolicyGateStrength;
    movementGate: string;
    resourceBias: string;
  };
  overall: {
    matchedComparison: {
      policyPositiveExposures: number;
      policyNegativeExposures: number;
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    };
  };
}

interface ArtifactData {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: unknown;
  signatures: SignatureSummary[];
  interpretation: unknown;
}

interface ReproductionGateStratum {
  reproductionGateClass: PolicyGateStrength;
  totalExposures: number;
  signatures: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
  topSignatures: Array<{
    key: string;
    exposures: number;
    harvest: number;
    survival: number;
    reproduction: number;
  }>;
}

interface ReanalysisArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  sourceArtifact: string;
  strata: ReproductionGateStratum[];
  conclusion: {
    mostHarmfulGateClass: PolicyGateStrength | null;
    leastHarmfulGateClass: PolicyGateStrength | null;
    summary: string;
  };
}

function runReanalysis(): ReanalysisArtifact {
  const rawData = readFileSync(SIGNATURE_VALIDATION_ARTIFACT, 'utf-8');
  const data: ArtifactData = JSON.parse(rawData);

  const byGateClass = new Map<PolicyGateStrength, SignatureSummary[]>();

  for (const sig of data.signatures) {
    const gateClass = sig.signature.reproductionGate;
    const existing = byGateClass.get(gateClass);
    if (existing) {
      existing.push(sig);
    } else {
      byGateClass.set(gateClass, [sig]);
    }
  }

  const strata: ReproductionGateStratum[] = [];

  for (const gateClass of ['open', 'guarded', 'strict'] as PolicyGateStrength[]) {
    const signatures = byGateClass.get(gateClass) ?? [];
    const totalExposures = signatures.reduce(
      (sum, sig) =>
        sum + sig.overall.matchedComparison.policyPositiveExposures + sig.overall.matchedComparison.policyNegativeExposures,
      0
    );

    const weightedHarvestAdvantage =
      signatures.reduce((sum, sig) => {
        const weight =
          sig.overall.matchedComparison.policyPositiveExposures + sig.overall.matchedComparison.policyNegativeExposures;
        return sum + sig.overall.matchedComparison.weightedHarvestAdvantage * weight;
      }, 0) / Math.max(1, totalExposures);

    const weightedSurvivalAdvantage =
      signatures.reduce((sum, sig) => {
        const weight =
          sig.overall.matchedComparison.policyPositiveExposures + sig.overall.matchedComparison.policyNegativeExposures;
        return sum + sig.overall.matchedComparison.weightedSurvivalAdvantage * weight;
      }, 0) / Math.max(1, totalExposures);

    const weightedReproductionAdvantage =
      signatures.reduce((sum, sig) => {
        const weight =
          sig.overall.matchedComparison.policyPositiveExposures + sig.overall.matchedComparison.policyNegativeExposures;
        return sum + sig.overall.matchedComparison.weightedReproductionAdvantage * weight;
      }, 0) / Math.max(1, totalExposures);

    const topSignatures = signatures
      .sort((a, b) => {
        const aExposures =
          a.overall.matchedComparison.policyPositiveExposures + a.overall.matchedComparison.policyNegativeExposures;
        const bExposures =
          b.overall.matchedComparison.policyPositiveExposures + b.overall.matchedComparison.policyNegativeExposures;
        return bExposures - aExposures;
      })
      .slice(0, 5)
      .map((sig) => ({
        key: sig.signature.key,
        exposures:
          sig.overall.matchedComparison.policyPositiveExposures + sig.overall.matchedComparison.policyNegativeExposures,
        harvest: sig.overall.matchedComparison.weightedHarvestAdvantage,
        survival: sig.overall.matchedComparison.weightedSurvivalAdvantage,
        reproduction: sig.overall.matchedComparison.weightedReproductionAdvantage
      }));

    strata.push({
      reproductionGateClass: gateClass,
      totalExposures,
      signatures: signatures.length,
      weightedHarvestAdvantage,
      weightedSurvivalAdvantage,
      weightedReproductionAdvantage,
      topSignatures
    });
  }

  strata.sort((a, b) => a.weightedReproductionAdvantage - b.weightedReproductionAdvantage);

  const mostHarmful = strata[0];
  const leastHarmful = strata[strata.length - 1];

  const reproductionRange = Math.abs(mostHarmful.weightedReproductionAdvantage - leastHarmful.weightedReproductionAdvantage);
  const isUniform = reproductionRange < 0.005;

  const conclusion = {
    mostHarmfulGateClass: mostHarmful?.reproductionGateClass ?? null,
    leastHarmfulGateClass: leastHarmful?.reproductionGateClass ?? null,
    summary: isUniform
      ? `Policy effects are approximately uniform across reproduction gate classes. Reproduction advantage ranges from ${mostHarmful.weightedReproductionAdvantage.toFixed(4)} (${mostHarmful.reproductionGateClass}) to ${leastHarmful.weightedReproductionAdvantage.toFixed(4)} (${leastHarmful.reproductionGateClass}), a spread of ${reproductionRange.toFixed(4)}.`
      : `Policy effects differ across reproduction gate classes. ${mostHarmful.reproductionGateClass} shows the most negative reproduction effect (${mostHarmful.weightedReproductionAdvantage.toFixed(4)}), while ${leastHarmful.reproductionGateClass} shows the least negative (${leastHarmful.weightedReproductionAdvantage.toFixed(4)}), a spread of ${reproductionRange.toFixed(4)}.`
  };

  return {
    generatedAt: new Date().toISOString(),
    question:
      'Does the April 1 signature validation show differential policy effects across reproduction gate strength classes (open/guarded/strict)?',
    prediction:
      'If reproduction gating harm is non-uniform, signatures with strict gates should show materially different matched-control deltas than signatures with open gates.',
    methodology:
      'Re-analyze the April 1 policy signature matched control validation artifact, grouping signatures by reproduction gate class (open/guarded/strict). ' +
      'For each gate class, compute exposure-weighted averages of matched harvest, survival, and reproduction advantages. ' +
      'Compare gate classes to test whether policy effects are uniform or concentrated in specific gate strength regimes.',
    sourceArtifact: SIGNATURE_VALIDATION_ARTIFACT,
    strata,
    conclusion
  };
}

const artifact = runReanalysis();
writeFileSync(OUTPUT_ARTIFACT, JSON.stringify(artifact, null, 2) + '\n');
console.log(`Wrote reanalysis to ${OUTPUT_ARTIFACT}`);
console.log(artifact.conclusion.summary);
