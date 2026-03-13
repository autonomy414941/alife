import { SimulationConfig } from './types';

export const DISTURBANCE_COLONIZATION_MODES = [
  'off',
  'localizedOpening',
  'localizedOpeningLineageAbsent'
] as const;

export type DisturbanceColonizationMode = (typeof DISTURBANCE_COLONIZATION_MODES)[number];

const DISTURBANCE_COLONIZATION_CONFIG: Record<DisturbanceColonizationMode, Partial<SimulationConfig>> = {
  off: {
    disturbanceInterval: 0,
    disturbanceEnergyLoss: 0,
    disturbanceResourceLoss: 0,
    disturbanceRadius: -1,
    disturbanceRefugiaFraction: 0,
    disturbanceSettlementOpeningTicks: 0,
    disturbanceSettlementOpeningBonus: 0,
    disturbanceSettlementOpeningLineageAbsentOnly: false
  },
  localizedOpening: {
    disturbanceInterval: 50,
    disturbanceEnergyLoss: 0.5,
    disturbanceResourceLoss: 0,
    disturbanceRadius: 2,
    disturbanceRefugiaFraction: 0.5,
    disturbanceSettlementOpeningTicks: 10,
    disturbanceSettlementOpeningBonus: 0.75,
    disturbanceSettlementOpeningLineageAbsentOnly: false
  },
  localizedOpeningLineageAbsent: {
    disturbanceInterval: 50,
    disturbanceEnergyLoss: 0.5,
    disturbanceResourceLoss: 0,
    disturbanceRadius: 2,
    disturbanceRefugiaFraction: 0.5,
    disturbanceSettlementOpeningTicks: 10,
    disturbanceSettlementOpeningBonus: 0.75,
    disturbanceSettlementOpeningLineageAbsentOnly: true
  }
};

export function buildDisturbanceColonizationConfig(
  mode: DisturbanceColonizationMode
): Partial<SimulationConfig> {
  return {
    ...DISTURBANCE_COLONIZATION_CONFIG[mode]
  };
}
