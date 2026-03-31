import { createGenomeV2, setTrait } from './genome-v2';
import { LifeSimulation } from './simulation';

export interface PolicyCouplingReplayCounterfactualInput {
  seed?: number;
  burnInSteps?: number;
  branchSteps?: number;
  generatedAt?: string;
}

export interface PolicyCouplingReplayBranchResult {
  label: 'policy_coupled' | 'policy_decoupled';
  policyCouplingEnabled: boolean;
  finalTick: number;
  finalPopulation: number;
  finalActiveSpecies: number;
  finalMeanEnergy: number;
  anyPolicyAgentFraction: number;
  decisionGatedFraction: number;
  reproductionDecisionGatedFraction: number;
}

export interface PolicyCouplingReplayCounterfactualArtifact {
  generatedAt: string;
  question: string;
  methodology: string;
  sharedBaseline: {
    tick: number;
    population: number;
    activeSpecies: number;
    meanEnergy: number;
  };
  policyCoupled: PolicyCouplingReplayBranchResult;
  policyDecoupled: PolicyCouplingReplayBranchResult;
  delta: {
    population: number;
    activeSpecies: number;
    meanEnergy: number;
    decisionGatedFraction: number;
    reproductionDecisionGatedFraction: number;
  };
}

export function runPolicyCouplingReplayCounterfactual(
  input: PolicyCouplingReplayCounterfactualInput = {}
): PolicyCouplingReplayCounterfactualArtifact {
  const seed = input.seed ?? 20_260_331;
  const burnInSteps = input.burnInSteps ?? 2;
  const branchSteps = input.branchSteps ?? 4;

  const baseline = new LifeSimulation({
    seed,
    config: {
      width: 1,
      height: 1,
      maxResource: 0,
      resourceRegen: 0,
      metabolismCostBase: 0,
      moveCost: 0,
      harvestCap: 0,
      reproduceThreshold: 10,
      reproduceProbability: 1,
      offspringEnergyFraction: 0.5,
      mutationAmount: 0,
      policyMutationProbability: 0,
      policyMutationMagnitude: 0,
      speciationThreshold: 10,
      maxAge: 100
    },
    initialAgents: [buildReplaySeedAgent()]
  });

  baseline.run(burnInSteps);
  const sharedBaseline = baseline.snapshot();
  const replayState = baseline.captureReplayState();

  const policyCoupled = baseline.fork({ policyCouplingEnabled: true });
  const policyDecoupled = LifeSimulation.fromReplayState(replayState, {
    policyCouplingEnabled: false
  });

  const coupledSeries = policyCoupled.run(branchSteps);
  const decoupledSeries = policyDecoupled.run(branchSteps);
  const coupledFinal = coupledSeries.at(-1) ?? policyCoupled.step();
  const decoupledFinal = decoupledSeries.at(-1) ?? policyDecoupled.step();

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'How much does policy payoff coupling change population outcomes when both branches start from the same live world state?',
    methodology:
      `Seed one genomeV2 policy-active agent, run ${burnInSteps} burn-in steps, capture a replay state, and fork paired ` +
      `branches that differ only in policyCouplingEnabled for ${branchSteps} steps.`,
    sharedBaseline: {
      tick: sharedBaseline.tick,
      population: sharedBaseline.population,
      activeSpecies: sharedBaseline.activeSpecies,
      meanEnergy: sharedBaseline.meanEnergy
    },
    policyCoupled: summarizeBranch('policy_coupled', true, coupledFinal),
    policyDecoupled: summarizeBranch('policy_decoupled', false, decoupledFinal),
    delta: {
      population: decoupledFinal.population - coupledFinal.population,
      activeSpecies: decoupledFinal.activeSpecies - coupledFinal.activeSpecies,
      meanEnergy: decoupledFinal.meanEnergy - coupledFinal.meanEnergy,
      decisionGatedFraction:
        (decoupledFinal.policyObservability?.activation.decisionGatedFraction ?? 0) -
        (coupledFinal.policyObservability?.activation.decisionGatedFraction ?? 0),
      reproductionDecisionGatedFraction:
        (decoupledFinal.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0) -
        (coupledFinal.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0)
    }
  };
}

function buildReplaySeedAgent() {
  const genomeV2 = createGenomeV2();
  setTrait(genomeV2, 'reproduction_harvest_threshold', 1);
  setTrait(genomeV2, 'reproduction_harvest_threshold_steepness', 10);

  return {
    x: 0,
    y: 0,
    energy: 30,
    genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
    genomeV2
  };
}

function summarizeBranch(
  label: PolicyCouplingReplayBranchResult['label'],
  policyCouplingEnabled: boolean,
  finalSummary: ReturnType<LifeSimulation['step']>
): PolicyCouplingReplayBranchResult {
  return {
    label,
    policyCouplingEnabled,
    finalTick: finalSummary.tick,
    finalPopulation: finalSummary.population,
    finalActiveSpecies: finalSummary.activeSpecies,
    finalMeanEnergy: finalSummary.meanEnergy,
    anyPolicyAgentFraction: finalSummary.policyObservability?.activation.anyPolicyAgentFraction ?? 0,
    decisionGatedFraction: finalSummary.policyObservability?.activation.decisionGatedFraction ?? 0,
    reproductionDecisionGatedFraction:
      finalSummary.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0
  };
}
