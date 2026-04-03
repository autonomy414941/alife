import {
  getPolicyStateValue,
  isActivePolicyParameter,
  POLICY_PARAMETER_KEYS,
  resolveBehavioralPolicyFlags
} from './behavioral-control';
import { PolicyFitnessRecord } from './policy-fitness';
import {
  Agent,
  PolicyObservabilitySummary,
  PolicyParameterObservability
} from './types';

export interface PolicyDecisionStats {
  harvestDecisions: number;
  harvestPolicyGuided: number;
  movement: {
    decisions: number;
    policyGated: number;
    energyReservePolicyActive: number;
    recentHarvestPolicyActive: number;
    blockedByEnergyReserve: number;
    blockedByRecentHarvest: number;
    energyReserveNearThreshold: number;
    recentHarvestNearThreshold: number;
  };
  reproduction: {
    decisions: number;
    policyGated: number;
    harvestThresholdPolicyActive: number;
    suppressedByHarvestThreshold: number;
    harvestThresholdNearThreshold: number;
  };
}

export function summarizePolicyObservability(
  agents: ReadonlyArray<Pick<Agent, 'policyState' | 'genomeV2'>>,
  records: ReadonlyArray<PolicyFitnessRecord>,
  decisionStats: PolicyDecisionStats
): PolicyObservabilitySummary {
  const population = agents.length;
  let anyPolicyAgents = 0;
  let harvestPolicyAgents = 0;
  let movementPolicyAgents = 0;
  let reproductionPolicyAgents = 0;

  for (const agent of agents) {
    const flags = resolveBehavioralPolicyFlags(agent);
    anyPolicyAgents += Number(flags.hasAnyPolicy);
    harvestPolicyAgents += Number(flags.hasHarvestPolicy);
    movementPolicyAgents += Number(flags.hasMovementPolicy);
    reproductionPolicyAgents += Number(flags.hasReproductionPolicy);
  }

  return {
    activation: {
      anyPolicyAgentFraction: population === 0 ? 0 : anyPolicyAgents / population,
      harvestPolicyAgentFraction: population === 0 ? 0 : harvestPolicyAgents / population,
      movementPolicyAgentFraction: population === 0 ? 0 : movementPolicyAgents / population,
      reproductionPolicyAgentFraction: population === 0 ? 0 : reproductionPolicyAgents / population,
      decisionGatedFraction: gatedFraction(
        decisionStats.movement.policyGated + decisionStats.reproduction.policyGated,
        decisionStats.movement.decisions + decisionStats.reproduction.decisions
      ),
      harvestDecisionGuidedFraction: gatedFraction(
        decisionStats.harvestPolicyGuided,
        decisionStats.harvestDecisions
      ),
      movementDecisionGatedFraction: gatedFraction(
        decisionStats.movement.policyGated,
        decisionStats.movement.decisions
      ),
      reproductionDecisionGatedFraction: gatedFraction(
        decisionStats.reproduction.policyGated,
        decisionStats.reproduction.decisions
      )
    },
    movement: {
      decisions: decisionStats.movement.decisions,
      gatedDecisions: decisionStats.movement.policyGated,
      energyReservePolicyActiveDecisions: decisionStats.movement.energyReservePolicyActive,
      recentHarvestPolicyActiveDecisions: decisionStats.movement.recentHarvestPolicyActive,
      blockedByEnergyReserve: decisionStats.movement.blockedByEnergyReserve,
      blockedByRecentHarvest: decisionStats.movement.blockedByRecentHarvest,
      energyReserveNearThreshold: decisionStats.movement.energyReserveNearThreshold,
      recentHarvestNearThreshold: decisionStats.movement.recentHarvestNearThreshold
    },
    reproduction: {
      decisions: decisionStats.reproduction.decisions,
      gatedDecisions: decisionStats.reproduction.policyGated,
      harvestThresholdPolicyActiveDecisions: decisionStats.reproduction.harvestThresholdPolicyActive,
      suppressedByHarvestThreshold: decisionStats.reproduction.suppressedByHarvestThreshold,
      harvestThresholdNearThreshold: decisionStats.reproduction.harvestThresholdNearThreshold
    },
    observations: summarizeDecisionObservations(records),
    parameters: POLICY_PARAMETER_KEYS.map((key) => summarizePolicyParameter(key, agents, records))
  };
}

function summarizeDecisionObservations(
  records: ReadonlyArray<PolicyFitnessRecord>
): PolicyObservabilitySummary['observations'] {
  const observations = records
    .map((record) => record.observation)
    .filter((observation): observation is NonNullable<PolicyFitnessRecord['observation']> => observation !== undefined);

  return {
    decisions: observations.length,
    meanAge: arithmeticMean(observations.map((observation) => observation.age)),
    meanLocalFertility: arithmeticMean(observations.map((observation) => observation.localFertility)),
    meanLocalCrowding: arithmeticMean(observations.map((observation) => observation.localCrowding)),
    meanPrimaryResourceLevel: arithmeticMean(
      observations.map((observation) => observation.primaryResourceLevel)
    ),
    meanSecondaryResourceLevel: arithmeticMean(
      observations.map((observation) => observation.secondaryResourceLevel)
    ),
    meanSecondaryResourceFraction: arithmeticMean(
      observations.map((observation) => observation.secondaryResourceFraction)
    ),
    meanTicksSinceDisturbance: arithmeticMean(
      observations.map((observation) => observation.ticksSinceDisturbance)
    ),
    meanRecentDisturbanceCount: arithmeticMean(
      observations.map((observation) => observation.recentDisturbanceCount)
    ),
    meanSameLineageShare: arithmeticMean(observations.map((observation) => observation.sameLineageShare))
  };
}

function summarizePolicyParameter(
  key: string,
  agents: ReadonlyArray<Pick<Agent, 'policyState' | 'genomeV2'>>,
  records: ReadonlyArray<PolicyFitnessRecord>
): PolicyParameterObservability {
  const values = agents
    .filter((agent) => isActivePolicyParameter(agent, key))
    .map((agent) => getPolicyStateValue(agent, key, 0));
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
