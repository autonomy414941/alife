import { Rng } from './rng';
import {
  Agent,
  AgentSeed,
  Genome,
  SimulationConfig,
  SimulationSnapshot,
  StepSummary
} from './types';

const DEFAULT_CONFIG: SimulationConfig = {
  width: 20,
  height: 20,
  maxResource: 8,
  resourceRegen: 0.6,
  initialAgents: 24,
  initialEnergy: 12,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  harvestCap: 2.5,
  reproduceThreshold: 20,
  reproduceProbability: 0.35,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  speciationThreshold: 0.25,
  maxAge: 120
};

const MIN_GENOME: Genome = {
  metabolism: 0.3,
  harvest: 0.4,
  aggression: 0
};

const MAX_GENOME: Genome = {
  metabolism: 2.2,
  harvest: 2.8,
  aggression: 1
};

export interface LifeSimulationOptions {
  seed?: number;
  config?: Partial<SimulationConfig>;
  initialAgents?: AgentSeed[];
}

export class LifeSimulation {
  private readonly rng: Rng;

  private readonly config: SimulationConfig;

  private resources: number[][];

  private agents: Agent[];

  private tickCount = 0;

  private nextAgentId = 1;

  private nextSpeciesId = 1;

  constructor(options: LifeSimulationOptions = {}) {
    this.config = { ...DEFAULT_CONFIG, ...(options.config ?? {}) };
    this.rng = new Rng(options.seed ?? 1);
    this.resources = this.buildInitialResources();
    this.agents = options.initialAgents
      ? options.initialAgents.map((seed, index) => this.createAgentFromSeed(seed, index + 1, index + 1))
      : this.spawnInitialPopulation();
    if (this.agents.length > 0) {
      this.nextAgentId = Math.max(...this.agents.map((agent) => agent.id)) + 1;
      this.nextSpeciesId = Math.max(...this.agents.map((agent) => agent.species)) + 1;
    }
  }

  step(): StepSummary {
    const beforeCount = this.agents.length;

    this.regenerateResources();

    const turnOrder = this.rng.shuffle([...this.agents]);
    for (const agent of turnOrder) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      this.processAgentTurn(agent);
    }

    this.resolveEncounters();

    let births = 0;
    const offspring: Agent[] = [];
    for (const agent of [...this.agents]) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      if (agent.energy >= this.config.reproduceThreshold && this.rng.float() < this.config.reproduceProbability) {
        const child = this.reproduce(agent);
        offspring.push(child);
        births += 1;
      }
    }
    this.agents.push(...offspring);

    this.agents = this.agents.filter((agent) => agent.energy > 0 && agent.age <= this.config.maxAge);

    const afterCount = this.agents.length;
    const meanEnergy = this.meanEnergy();
    const meanGenome = this.meanGenome();
    const diversity = this.diversityMetrics();
    this.tickCount += 1;

    return {
      tick: this.tickCount,
      population: afterCount,
      births,
      deaths: beforeCount + births - afterCount,
      meanEnergy,
      meanGenome,
      activeClades: diversity.activeClades,
      activeSpecies: diversity.activeSpecies,
      dominantSpeciesShare: diversity.dominantSpeciesShare,
      selectionDifferential: this.selectionDifferential(meanGenome)
    };
  }

  run(steps: number): StepSummary[] {
    const summaries: StepSummary[] = [];
    for (let i = 0; i < steps; i += 1) {
      summaries.push(this.step());
    }
    return summaries;
  }

  snapshot(): SimulationSnapshot {
    const diversity = this.diversityMetrics();
    return {
      tick: this.tickCount,
      population: this.agents.length,
      meanEnergy: this.meanEnergy(),
      activeClades: diversity.activeClades,
      activeSpecies: diversity.activeSpecies,
      dominantSpeciesShare: diversity.dominantSpeciesShare,
      agents: this.agents.map((agent) => ({
        ...agent,
        genome: { ...agent.genome }
      }))
    };
  }

  setResource(x: number, y: number, value: number): void {
    this.resources[this.wrapY(y)][this.wrapX(x)] = clamp(value, 0, this.config.maxResource);
  }

  private buildInitialResources(): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => this.rng.float() * this.config.maxResource)
    );
  }

  private spawnInitialPopulation(): Agent[] {
    const agents: Agent[] = [];
    for (let i = 0; i < this.config.initialAgents; i += 1) {
      const genome = {
        metabolism: this.randomTrait(MIN_GENOME.metabolism, MAX_GENOME.metabolism),
        harvest: this.randomTrait(MIN_GENOME.harvest, MAX_GENOME.harvest),
        aggression: this.randomTrait(MIN_GENOME.aggression, MAX_GENOME.aggression)
      };
      const id = this.nextAgentId++;
      const lineage = id;
      agents.push({
        id,
        lineage,
        species: this.nextSpeciesId++,
        x: this.rng.int(this.config.width),
        y: this.rng.int(this.config.height),
        energy: this.config.initialEnergy * (0.8 + this.rng.float() * 0.4),
        age: 0,
        genome
      });
    }
    return agents;
  }

  private createAgentFromSeed(seed: AgentSeed, fallbackLineage: number, fallbackSpecies: number): Agent {
    const agent: Agent = {
      id: this.nextAgentId++,
      lineage: seed.lineage ?? fallbackLineage,
      species: seed.species ?? fallbackSpecies,
      x: this.wrapX(seed.x),
      y: this.wrapY(seed.y),
      energy: seed.energy,
      age: seed.age ?? 0,
      genome: {
        metabolism: clamp(seed.genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism),
        harvest: clamp(seed.genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest),
        aggression: clamp(seed.genome.aggression, MIN_GENOME.aggression, MAX_GENOME.aggression)
      }
    };
    return agent;
  }

  private processAgentTurn(agent: Agent): void {
    agent.age += 1;
    agent.energy -= this.config.metabolismCostBase * agent.genome.metabolism;
    if (agent.energy <= 0 || agent.age > this.config.maxAge) {
      return;
    }

    const destination = this.pickDestination(agent);
    const moved = destination.x !== agent.x || destination.y !== agent.y;
    agent.x = destination.x;
    agent.y = destination.y;

    if (moved) {
      agent.energy -= this.config.moveCost * agent.genome.metabolism;
    }
    if (agent.energy <= 0) {
      return;
    }

    const available = this.resources[agent.y][agent.x];
    const harvestAmount = Math.min(available, this.config.harvestCap * agent.genome.harvest);
    this.resources[agent.y][agent.x] -= harvestAmount;
    agent.energy += harvestAmount;
  }

  private pickDestination(agent: Agent): { x: number; y: number } {
    const options = [
      { x: agent.x, y: agent.y },
      { x: this.wrapX(agent.x + 1), y: agent.y },
      { x: this.wrapX(agent.x - 1), y: agent.y },
      { x: agent.x, y: this.wrapY(agent.y + 1) },
      { x: agent.x, y: this.wrapY(agent.y - 1) }
    ];

    let best = options[0];
    let bestScore = -Infinity;

    for (const option of options) {
      const food = this.resources[option.y][option.x];
      const score = food + this.rng.float() * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }

    return best;
  }

  private resolveEncounters(): void {
    const byCell = new Map<string, Agent[]>();

    for (const agent of this.agents) {
      if (agent.energy <= 0) {
        continue;
      }
      const key = `${agent.x},${agent.y}`;
      if (!byCell.has(key)) {
        byCell.set(key, []);
      }
      byCell.get(key)!.push(agent);
    }

    for (const agentsInCell of byCell.values()) {
      if (agentsInCell.length < 2) {
        continue;
      }

      agentsInCell.sort((a, b) => b.genome.aggression - a.genome.aggression || b.energy - a.energy);
      const dominant = agentsInCell[0];

      for (const target of agentsInCell.slice(1)) {
        const pressure = Math.max(0, dominant.genome.aggression - target.genome.aggression + 0.1);
        const stolen = Math.min(target.energy, target.energy * pressure * 0.25);
        if (stolen <= 0) {
          continue;
        }
        target.energy -= stolen;
        dominant.energy += stolen;
      }
    }
  }

  private reproduce(parent: Agent): Agent {
    const childEnergy = parent.energy * this.config.offspringEnergyFraction;
    parent.energy -= childEnergy;
    const childGenome = this.mutateGenome(parent.genome);
    const diverged =
      genomeDistance(parent.genome, childGenome) >= this.config.speciationThreshold;

    const neighbors = [
      { x: parent.x, y: parent.y },
      { x: this.wrapX(parent.x + 1), y: parent.y },
      { x: this.wrapX(parent.x - 1), y: parent.y },
      { x: parent.x, y: this.wrapY(parent.y + 1) },
      { x: parent.x, y: this.wrapY(parent.y - 1) }
    ];
    const childPos = this.rng.pick(neighbors);

    return {
      id: this.nextAgentId++,
      lineage: parent.lineage,
      species: diverged ? this.nextSpeciesId++ : parent.species,
      x: childPos.x,
      y: childPos.y,
      energy: childEnergy,
      age: 0,
      genome: childGenome
    };
  }

  private mutateGenome(genome: Genome): Genome {
    return {
      metabolism: this.mutateTrait(genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism),
      harvest: this.mutateTrait(genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest),
      aggression: this.mutateTrait(genome.aggression, MIN_GENOME.aggression, MAX_GENOME.aggression)
    };
  }

  private mutateTrait(value: number, min: number, max: number): number {
    const delta = (this.rng.float() + this.rng.float() - 1) * this.config.mutationAmount;
    return clamp(value + delta, min, max);
  }

  private randomTrait(min: number, max: number): number {
    return min + this.rng.float() * (max - min);
  }

  private regenerateResources(): void {
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        this.resources[y][x] = clamp(
          this.resources[y][x] + this.config.resourceRegen,
          0,
          this.config.maxResource
        );
      }
    }
  }

  private meanEnergy(): number {
    if (this.agents.length === 0) {
      return 0;
    }
    const total = this.agents.reduce((sum, agent) => sum + agent.energy, 0);
    return total / this.agents.length;
  }

  private meanGenome(): Genome {
    if (this.agents.length === 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const totals = this.agents.reduce(
      (acc, agent) => {
        acc.metabolism += agent.genome.metabolism;
        acc.harvest += agent.genome.harvest;
        acc.aggression += agent.genome.aggression;
        return acc;
      },
      { metabolism: 0, harvest: 0, aggression: 0 }
    );

    return {
      metabolism: totals.metabolism / this.agents.length,
      harvest: totals.harvest / this.agents.length,
      aggression: totals.aggression / this.agents.length
    };
  }

  private diversityMetrics(): { activeClades: number; activeSpecies: number; dominantSpeciesShare: number } {
    if (this.agents.length === 0) {
      return { activeClades: 0, activeSpecies: 0, dominantSpeciesShare: 0 };
    }

    const clades = new Set<number>();
    const speciesCounts = new Map<number, number>();
    for (const agent of this.agents) {
      clades.add(agent.lineage);
      speciesCounts.set(agent.species, (speciesCounts.get(agent.species) ?? 0) + 1);
    }

    const dominantCount = Math.max(...speciesCounts.values());
    return {
      activeClades: clades.size,
      activeSpecies: speciesCounts.size,
      dominantSpeciesShare: dominantCount / this.agents.length
    };
  }

  private selectionDifferential(meanGenome: Genome): Genome {
    if (this.agents.length === 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const totalEnergy = this.agents.reduce((sum, agent) => sum + agent.energy, 0);
    if (totalEnergy <= 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const weightedTotals = this.agents.reduce(
      (acc, agent) => {
        acc.metabolism += agent.genome.metabolism * agent.energy;
        acc.harvest += agent.genome.harvest * agent.energy;
        acc.aggression += agent.genome.aggression * agent.energy;
        return acc;
      },
      { metabolism: 0, harvest: 0, aggression: 0 }
    );

    return {
      metabolism: weightedTotals.metabolism / totalEnergy - meanGenome.metabolism,
      harvest: weightedTotals.harvest / totalEnergy - meanGenome.harvest,
      aggression: weightedTotals.aggression / totalEnergy - meanGenome.aggression
    };
  }

  private isAlive(agentId: number): boolean {
    return this.agents.some((agent) => agent.id === agentId && agent.energy > 0);
  }

  private wrapX(x: number): number {
    const width = this.config.width;
    return ((x % width) + width) % width;
  }

  private wrapY(y: number): number {
    const height = this.config.height;
    return ((y % height) + height) % height;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function genomeDistance(a: Genome, b: Genome): number {
  return (
    Math.abs(a.metabolism - b.metabolism) +
    Math.abs(a.harvest - b.harvest) +
    Math.abs(a.aggression - b.aggression)
  );
}
