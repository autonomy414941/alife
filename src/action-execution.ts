import { Agent, Genome } from './types';
import { ActionType, ActionSelectionContext } from './action-selection';
import { addAgentEnergy, spendAgentEnergy } from './agent-energy';
import { updateHarvestMemory } from './behavioral-control';
import { resolveDualResourceHarvest, resolveResourceHarvestShares } from './resource-harvest';

export interface ActionExecutionContext {
  primaryAvailable: number;
  secondaryAvailable: number;
  localFertility: number;
  localCrowding: number;
  harvestCapacity: number;
  moveCost: number;
  policyCouplingEnabled: boolean;
}

export interface ActionExecutionResult {
  actionType: ActionType;
  primaryHarvested: number;
  secondaryHarvested: number;
  energySpent: number;
  shouldMove: boolean;
  shouldAttemptReproduction: boolean;
}

export function executeAction(
  agent: Agent,
  actionType: ActionType,
  context: ActionExecutionContext
): ActionExecutionResult {
  const result: ActionExecutionResult = {
    actionType,
    primaryHarvested: 0,
    secondaryHarvested: 0,
    energySpent: 0,
    shouldMove: false,
    shouldAttemptReproduction: false
  };

  switch (actionType) {
    case 'harvest_primary':
      return executeHarvestPrimary(agent, context, result);
    case 'harvest_secondary':
      return executeHarvestSecondary(agent, context, result);
    case 'move_toward_fertility':
      return executeMoveTowardFertility(agent, context, result);
    case 'reproduce_cautiously':
      return executeReproduceCautiously(agent, context, result);
    case 'rest':
      return executeRest(agent, context, result);
    default:
      return result;
  }
}

function executeHarvestPrimary(
  agent: Agent,
  context: ActionExecutionContext,
  result: ActionExecutionResult
): ActionExecutionResult {
  const harvest = resolveDualResourceHarvest({
    primaryAvailable: context.primaryAvailable,
    secondaryAvailable: context.secondaryAvailable,
    genome: agent.genome,
    baseCapacity: context.harvestCapacity,
    secondaryPreferenceShare: 0.1
  });

  addAgentEnergy(agent, {
    primary: harvest.primaryHarvest,
    secondary: harvest.secondaryHarvest
  });

  const totalHarvest = harvest.primaryHarvest + harvest.secondaryHarvest;
  updateHarvestMemory(agent, totalHarvest);

  result.primaryHarvested = harvest.primaryHarvest;
  result.secondaryHarvested = harvest.secondaryHarvest;

  return result;
}

function executeHarvestSecondary(
  agent: Agent,
  context: ActionExecutionContext,
  result: ActionExecutionResult
): ActionExecutionResult {
  const harvest = resolveDualResourceHarvest({
    primaryAvailable: context.primaryAvailable,
    secondaryAvailable: context.secondaryAvailable,
    genome: agent.genome,
    baseCapacity: context.harvestCapacity,
    secondaryPreferenceShare: 0.9
  });

  addAgentEnergy(agent, {
    primary: harvest.primaryHarvest,
    secondary: harvest.secondaryHarvest
  });

  const totalHarvest = harvest.primaryHarvest + harvest.secondaryHarvest;
  updateHarvestMemory(agent, totalHarvest);

  result.primaryHarvested = harvest.primaryHarvest;
  result.secondaryHarvested = harvest.secondaryHarvest;

  return result;
}

function executeMoveTowardFertility(
  agent: Agent,
  context: ActionExecutionContext,
  result: ActionExecutionResult
): ActionExecutionResult {
  result.shouldMove = true;

  return result;
}

function executeReproduceCautiously(
  agent: Agent,
  context: ActionExecutionContext,
  result: ActionExecutionResult
): ActionExecutionResult {
  result.shouldAttemptReproduction = true;

  return result;
}

function executeRest(
  agent: Agent,
  context: ActionExecutionContext,
  result: ActionExecutionResult
): ActionExecutionResult {
  return result;
}
