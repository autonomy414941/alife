import { Agent, SimulationConfig } from './types';

type EncounterConfig = Pick<SimulationConfig, 'predationPressure' | 'defenseMitigation'>;

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

export const dominantEncounterOperator: EncounterOperator = (agentsInCell, context) => {
  if (agentsInCell.length < 2) {
    return;
  }

  agentsInCell.sort((a, b) => b.genome.aggression - a.genome.aggression || b.energy - a.energy);
  const dominant = agentsInCell[0];

  for (const target of agentsInCell.slice(1)) {
    const stolen = resolveDominantEncounterTransfer(dominant, target, context);
    if (stolen <= 0) {
      continue;
    }

    target.energy -= stolen;
    dominant.energy += stolen;
  }
};

function resolveDominantEncounterTransfer(
  dominant: Agent,
  target: Agent,
  context: EncounterOperatorContext
): number {
  const pressure = Math.max(0, dominant.genome.aggression - target.genome.aggression + 0.1);
  const trophicGap =
    context.blendedTrophicLevel(dominant.species, dominant.lineage) -
    context.blendedTrophicLevel(target.species, target.lineage);
  const predationMultiplier =
    1 + Math.max(0, context.config.predationPressure) * Math.max(0, trophicGap);
  const mitigation = clamp(context.config.defenseMitigation, 0, 0.95);
  const defenseMultiplier = Math.max(
    0.05,
    1 - mitigation * context.blendedDefenseLevel(target.species, target.lineage)
  );
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

      const [dominant, target] =
        a.genome.aggression > b.genome.aggression ||
        (a.genome.aggression === b.genome.aggression && a.energy >= b.energy)
          ? [a, b]
          : [b, a];

      const stolen = resolveDominantEncounterTransfer(dominant, target, context);
      if (stolen <= 0) {
        continue;
      }

      target.energy -= stolen;
      dominant.energy += stolen;
    }
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
