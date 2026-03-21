import { POLICY_PARAMETER_KEYS, resolveBehavioralPolicyFlags } from './behavioral-control';
import { PolicyFitnessRecord } from './policy-fitness';
import {
  Agent,
  PolicyObservabilitySummary,
  PolicyParameterObservability
} from './types';

export interface PolicyDecisionStats {
  movementDecisions: number;
  movementPolicyGated: number;
  reproductionDecisions: number;
  reproductionPolicyGated: number;
}

export function summarizePolicyObservability(
  agents: ReadonlyArray<Pick<Agent, 'internalState'>>,
  records: ReadonlyArray<PolicyFitnessRecord>,
  decisionStats: PolicyDecisionStats
): PolicyObservabilitySummary {
  const population = agents.length;
  let anyPolicyAgents = 0;
  let movementPolicyAgents = 0;
  let reproductionPolicyAgents = 0;

  for (const agent of agents) {
    const flags = resolveBehavioralPolicyFlags(agent);
    anyPolicyAgents += Number(flags.hasAnyPolicy);
    movementPolicyAgents += Number(flags.hasMovementPolicy);
    reproductionPolicyAgents += Number(flags.hasReproductionPolicy);
  }

  return {
    activation: {
      anyPolicyAgentFraction: population === 0 ? 0 : anyPolicyAgents / population,
      movementPolicyAgentFraction: population === 0 ? 0 : movementPolicyAgents / population,
      reproductionPolicyAgentFraction: population === 0 ? 0 : reproductionPolicyAgents / population,
      decisionGatedFraction: gatedFraction(
        decisionStats.movementPolicyGated + decisionStats.reproductionPolicyGated,
        decisionStats.movementDecisions + decisionStats.reproductionDecisions
      ),
      movementDecisionGatedFraction: gatedFraction(
        decisionStats.movementPolicyGated,
        decisionStats.movementDecisions
      ),
      reproductionDecisionGatedFraction: gatedFraction(
        decisionStats.reproductionPolicyGated,
        decisionStats.reproductionDecisions
      )
    },
    parameters: POLICY_PARAMETER_KEYS.map((key) => summarizePolicyParameter(key, agents, records))
  };
}

function summarizePolicyParameter(
  key: string,
  agents: ReadonlyArray<Pick<Agent, 'internalState'>>,
  records: ReadonlyArray<PolicyFitnessRecord>
): PolicyParameterObservability {
  const values = agents
    .map((agent) => agent.internalState?.get(key) ?? 0)
    .filter((value) => value > 0);
  const mean = arithmeticMean(values);

  return {
    key,
    prevalence: agents.length === 0 ? 0 : values.length / agents.length,
    mean,
    variance: populationVariance(values, mean),
    outcomeCorrelation: {
      harvestIntake: pearsonCorrelation(
        records.map((record) => record.policyValues?.[key] ?? 0),
        records.map((record) => record.harvestIntake)
      ),
      survivalRate: pearsonCorrelation(
        records.map((record) => record.policyValues?.[key] ?? 0),
        records.map((record) => Number(record.survived))
      ),
      reproductionRate: pearsonCorrelation(
        records.map((record) => record.policyValues?.[key] ?? 0),
        records.map((record) => record.offspringProduced)
      )
    }
  };
}

function gatedFraction(gated: number, total: number): number {
  return total === 0 ? 0 : gated / total;
}

function arithmeticMean(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

function populationVariance(values: ReadonlyArray<number>, mean: number): number {
  if (values.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of values) {
    const delta = value - mean;
    total += delta * delta;
  }
  return total / values.length;
}

function pearsonCorrelation(left: ReadonlyArray<number>, right: ReadonlyArray<number>): number {
  if (left.length === 0 || left.length !== right.length) {
    return 0;
  }

  const leftMean = arithmeticMean(left);
  const rightMean = arithmeticMean(right);

  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let i = 0; i < left.length; i += 1) {
    const leftDelta = left[i] - leftMean;
    const rightDelta = right[i] - rightMean;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
  }

  if (leftVariance === 0 || rightVariance === 0) {
    return 0;
  }

  return covariance / Math.sqrt(leftVariance * rightVariance);
}
