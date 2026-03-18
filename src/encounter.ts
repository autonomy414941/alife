import { transferAgentEnergy } from './agent-energy';
import { getTrait } from './genome-v2';
import { Agent, SimulationConfig } from './types';

type EncounterConfig = Pick<SimulationConfig, 'predationPressure' | 'defenseMitigation'>;
type EncounterArchetype = 'metabolism' | 'harvest' | 'aggression';

export interface EncounterOperatorContext {
  config: EncounterConfig;
  blendedTrophicLevel: (species: number, lineage: number) => number;
  blendedDefenseLevel: (species: number, lineage: number) => number;
  lineageTransferMultiplier: (
    dominant: Pick<Agent, 'lineage'>,
    target: Pick<Agent, 'lineage'>
  ) => number;
}

export type EncounterOperator = (agentsInCell: Agent[], context: EncounterOperatorContext) => void;

const NON_TRANSITIVE_DOMINANCE_BONUS = 1;
const NON_TRANSITIVE_ADVANTAGE: Record<EncounterArchetype, EncounterArchetype> = {
  metabolism: 'aggression',
  aggression: 'harvest',
  harvest: 'metabolism'
};

export const dominantEncounterOperator: EncounterOperator = (agentsInCell, context) => {
  if (agentsInCell.length < 2) {
    return;
  }

  agentsInCell.sort((a, b) => b.genome.aggression - a.genome.aggression || b.energy - a.energy);
  const dominant = agentsInCell[0];

  for (const target of agentsInCell.slice(1)) {
    const stolen = resolveEncounterTransfer(dominant, target, context);
    if (stolen <= 0) {
      continue;
    }

    transferAgentEnergy(target, dominant, stolen);
  }
};

function resolveDominantEncounterTransfer(
  dominant: Agent,
  target: Agent,
  context: EncounterOperatorContext
): number {
  return resolveEncounterTransfer(dominant, target, context);
}

function resolveEncounterTransfer(
  dominant: Agent,
  target: Agent,
  context: EncounterOperatorContext,
  dominanceBonus = 0
): number {
  const pressure = Math.max(0, dominant.genome.aggression + dominanceBonus - target.genome.aggression + 0.1);
  const trophicGap = trophicLevel(dominant, context) - trophicLevel(target, context);
  const predationMultiplier =
    1 + Math.max(0, context.config.predationPressure) * Math.max(0, trophicGap);
  const mitigation = clamp(context.config.defenseMitigation, 0, 0.95);
  const defenseMultiplier = Math.max(0.05, 1 - mitigation * defenseLevel(target, context));
  const lineageMultiplier = context.lineageTransferMultiplier(dominant, target);

  return Math.min(
    target.energy,
    target.energy * pressure * 0.25 * predationMultiplier * defenseMultiplier * lineageMultiplier
  );
}

export const pairwiseEncounterOperator: EncounterOperator = (agentsInCell, context) => {
  if (agentsInCell.length < 2) {
    return;
  }

  for (let i = 0; i < agentsInCell.length; i++) {
    for (let j = i + 1; j < agentsInCell.length; j++) {
      const a = agentsInCell[i];
      const b = agentsInCell[j];

      const [dominant, target] = resolveAggressionDominance(a, b);

      const stolen = resolveDominantEncounterTransfer(dominant, target, context);
      if (stolen <= 0) {
        continue;
      }

      transferAgentEnergy(target, dominant, stolen);
    }
  }
};

export const nonTransitiveEncounterOperator: EncounterOperator = (agentsInCell, context) => {
  if (agentsInCell.length < 2) {
    return;
  }

  for (let i = 0; i < agentsInCell.length; i++) {
    for (let j = i + 1; j < agentsInCell.length; j++) {
      const a = agentsInCell[i];
      const b = agentsInCell[j];
      const archetypeDominance = compareNonTransitiveArchetypes(a, b);
      const [dominant, target] =
        archetypeDominance === 0
          ? resolveAggressionDominance(a, b)
          : archetypeDominance > 0
            ? [a, b]
            : [b, a];
      const stolen = resolveEncounterTransfer(
        dominant,
        target,
        context,
        archetypeDominance === 0 ? 0 : NON_TRANSITIVE_DOMINANCE_BONUS
      );
      if (stolen <= 0) {
        continue;
      }

      transferAgentEnergy(target, dominant, stolen);
    }
  }
};

function compareNonTransitiveArchetypes(a: Agent, b: Agent): number {
  const aArchetype = classifyEncounterArchetype(a);
  const bArchetype = classifyEncounterArchetype(b);

  if (aArchetype === bArchetype) {
    return 0;
  }

  return NON_TRANSITIVE_ADVANTAGE[aArchetype] === bArchetype ? 1 : -1;
}

function classifyEncounterArchetype(agent: Agent): EncounterArchetype {
  const axes: Array<{ archetype: EncounterArchetype; value: number }> = [
    { archetype: 'metabolism', value: agent.genome.metabolism },
    { archetype: 'harvest', value: agent.genome.harvest },
    { archetype: 'aggression', value: agent.genome.aggression }
  ];
  axes.sort((a, b) => b.value - a.value || encounterArchetypePriority(a.archetype) - encounterArchetypePriority(b.archetype));
  return axes[0].archetype;
}

function encounterArchetypePriority(archetype: EncounterArchetype): number {
  switch (archetype) {
    case 'metabolism':
      return 0;
    case 'harvest':
      return 1;
    case 'aggression':
      return 2;
  }
}

function resolveAggressionDominance(a: Agent, b: Agent): [Agent, Agent] {
  return a.genome.aggression > b.genome.aggression ||
    (a.genome.aggression === b.genome.aggression && a.energy >= b.energy)
    ? [a, b]
    : [b, a];
}

function trophicLevel(agent: Agent, context: EncounterOperatorContext): number {
  if (agent.genomeV2 !== undefined) {
    return clamp(getTrait(agent.genomeV2, 'trophic_level'), 0, 1);
  }
  return clamp(context.blendedTrophicLevel(agent.species, agent.lineage), 0, 1);
}

function defenseLevel(agent: Agent, context: EncounterOperatorContext): number {
  if (agent.genomeV2 !== undefined) {
    return clamp(getTrait(agent.genomeV2, 'defense_level'), 0, 1);
  }
  return clamp(context.blendedDefenseLevel(agent.species, agent.lineage), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
