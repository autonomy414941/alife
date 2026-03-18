import { Agent, AgentSeed } from './types';
import { getTrait } from './genome-v2';

type EnergyCarrier = Pick<Agent, 'energy' | 'energyPrimary' | 'energySecondary' | 'genomeV2'>;

export interface AgentEnergyPools {
  primary: number;
  secondary: number;
  total: number;
}

export function getAgentEnergyPools(agent: EnergyCarrier): AgentEnergyPools {
  const fallbackTotal = Math.max(0, agent.energy);
  if (agent.energyPrimary === undefined && agent.energySecondary === undefined) {
    return {
      primary: fallbackTotal,
      secondary: 0,
      total: fallbackTotal
    };
  }

  const secondary = Math.max(0, agent.energySecondary ?? 0);
  const primary = Math.max(
    0,
    agent.energyPrimary ?? Math.max(0, fallbackTotal - secondary)
  );
  return {
    primary,
    secondary,
    total: primary + secondary
  };
}

export function syncAgentEnergy(agent: EnergyCarrier): AgentEnergyPools {
  const pools = getAgentEnergyPools(agent);
  agent.energyPrimary = pools.primary;
  agent.energySecondary = pools.secondary;
  agent.energy = pools.total;
  return pools;
}

export function assignAgentEnergy(
  agent: EnergyCarrier,
  pools: {
    primary: number;
    secondary: number;
  }
): AgentEnergyPools {
  agent.energyPrimary = Math.max(0, pools.primary);
  agent.energySecondary = Math.max(0, pools.secondary);
  return syncAgentEnergy(agent);
}

export function initializeAgentEnergy(agent: EnergyCarrier, seed: Pick<AgentSeed, 'energy' | 'energyPrimary' | 'energySecondary'>): AgentEnergyPools {
  if (seed.energyPrimary !== undefined || seed.energySecondary !== undefined) {
    return assignAgentEnergy(agent, {
      primary: seed.energyPrimary ?? Math.max(0, seed.energy - Math.max(0, seed.energySecondary ?? 0)),
      secondary: seed.energySecondary ?? 0
    });
  }

  return assignAgentEnergy(agent, {
    primary: seed.energy,
    secondary: 0
  });
}

export function addAgentEnergy(
  agent: EnergyCarrier,
  delta: {
    primary?: number;
    secondary?: number;
  }
): AgentEnergyPools {
  const current = syncAgentEnergy(agent);
  return assignAgentEnergy(agent, {
    primary: current.primary + Math.max(0, delta.primary ?? 0),
    secondary: current.secondary + Math.max(0, delta.secondary ?? 0)
  });
}

export function spendAgentEnergy(
  agent: EnergyCarrier,
  amount: number
): AgentEnergyPools {
  const current = syncAgentEnergy(agent);
  const requested = Math.max(0, amount);
  if (current.total <= 0 || requested <= 0) {
    return { primary: 0, secondary: 0, total: 0 };
  }

  let primaryEfficiency = 1.0;
  let secondaryEfficiency = 1.0;

  if (agent.genomeV2 && agent.genomeV2.traits.has('metabolic_efficiency_primary')) {
    const eff = agent.genomeV2.traits.get('metabolic_efficiency_primary')!;
    primaryEfficiency = 2.0 - 2.0 * eff;
  }
  if (agent.genomeV2 && agent.genomeV2.traits.has('metabolic_efficiency_secondary')) {
    const eff = agent.genomeV2.traits.get('metabolic_efficiency_secondary')!;
    secondaryEfficiency = 2.0 - 2.0 * eff;
  }

  const spentTotal = Math.min(current.total, requested);
  const rawPrimarySpent = spentTotal * (current.primary / current.total);
  const rawSecondarySpent = spentTotal - rawPrimarySpent;

  const primarySpent = rawPrimarySpent * primaryEfficiency;
  const secondarySpent = rawSecondarySpent * secondaryEfficiency;

  assignAgentEnergy(agent, {
    primary: current.primary - primarySpent,
    secondary: current.secondary - secondarySpent
  });
  return {
    primary: primarySpent,
    secondary: secondarySpent,
    total: primarySpent + secondarySpent
  };
}

export function transferAgentEnergy(
  source: EnergyCarrier,
  target: EnergyCarrier,
  amount: number
): AgentEnergyPools {
  const transferred = spendAgentEnergy(source, amount);
  addAgentEnergy(target, transferred);
  return transferred;
}

export function scaleAgentEnergy(agent: EnergyCarrier, multiplier: number): AgentEnergyPools {
  const current = syncAgentEnergy(agent);
  const scale = Math.max(0, multiplier);
  return assignAgentEnergy(agent, {
    primary: current.primary * scale,
    secondary: current.secondary * scale
  });
}
