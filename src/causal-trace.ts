import { PhenotypeDeltaEntry } from './types';

export type CausalEventType = 'movement' | 'harvest' | 'encounter' | 'reproduction' | 'settlement' | 'death';

export interface CausalTraceMovementEvent {
  type: 'movement';
  tick: number;
  agentId: number;
  lineage: number;
  species: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moved: boolean;
  policyGated: boolean;
  energyCost: number;
}

export interface CausalTraceHarvestEvent {
  type: 'harvest';
  tick: number;
  agentId: number;
  lineage: number;
  species: number;
  x: number;
  y: number;
  primaryHarvest: number;
  secondaryHarvest: number;
  policyGuided: boolean;
  habitatEfficiency: number;
  trophicEfficiency: number;
  defenseEfficiency: number;
  lineageCrowdingEfficiency: number;
}

export interface CausalTraceEncounterEvent {
  type: 'encounter';
  tick: number;
  agentId: number;
  lineage: number;
  species: number;
  targetId: number;
  targetLineage: number;
  targetSpecies: number;
  energyTransfer: number;
  x: number;
  y: number;
}

export interface CausalTraceReproductionEvent {
  type: 'reproduction';
  tick: number;
  parentId: number;
  parentLineage: number;
  parentSpecies: number;
  parentX: number;
  parentY: number;
  offspringId: number;
  offspringLineage: number;
  offspringSpecies: number;
  x: number;
  y: number;
  parentEnergy: number;
  offspringEnergy: number;
  policyGated: boolean;
  localFertility: number;
  localCrowding: number;
  speciationOccurred: boolean;
  foundedNewClade: boolean;
  phenotypeDelta: PhenotypeDeltaEntry[];
}

export interface CausalTraceSettlementEvent {
  type: 'settlement';
  tick: number;
  parentId: number;
  parentLineage: number;
  offspringId: number;
  offspringLineage: number;
  offspringSpecies: number;
  phenotypeDelta: PhenotypeDeltaEntry[];
  parentSpecies: number;
  x: number;
  y: number;
  settled: boolean;
  movedFromParentCell: boolean;
  localFertility: number;
  localCrowding: number;
  sameLineageCrowding: number;
}

export interface CausalTraceDeathEvent {
  type: 'death';
  tick: number;
  agentId: number;
  lineage: number;
  species: number;
  x: number;
  y: number;
  age: number;
  reason: 'energy_depletion' | 'max_age';
  finalEnergy: number;
}

export type CausalTraceEvent =
  | CausalTraceMovementEvent
  | CausalTraceHarvestEvent
  | CausalTraceEncounterEvent
  | CausalTraceReproductionEvent
  | CausalTraceSettlementEvent
  | CausalTraceDeathEvent;

export interface CausalTraceSamplingConfig {
  enabled: boolean;
  samplingRate: number;
  maxEventsPerTick: number;
  trackEventTypes: Set<CausalEventType>;
}

export interface CausalTraceCollectorState {
  events: CausalTraceEvent[];
  currentTickEventCount: number;
  currentTick: number;
}

export const DEFAULT_CAUSAL_TRACE_CONFIG: CausalTraceSamplingConfig = {
  enabled: false,
  samplingRate: 0.1,
  maxEventsPerTick: 100,
  trackEventTypes: new Set(['movement', 'harvest', 'encounter', 'reproduction', 'settlement', 'death'])
};

export class CausalTraceCollector {
  private events: CausalTraceEvent[] = [];
  private currentTickEventCount = 0;
  private currentTick = -1;

  constructor(private config: CausalTraceSamplingConfig) {}

  recordEvent(event: CausalTraceEvent, rng: () => number): void {
    if (!this.config.enabled) {
      return;
    }
    if (!this.config.trackEventTypes.has(event.type)) {
      return;
    }
    if (event.tick !== this.currentTick) {
      this.currentTick = event.tick;
      this.currentTickEventCount = 0;
    }
    if (this.currentTickEventCount >= this.config.maxEventsPerTick) {
      return;
    }
    if (rng() > this.config.samplingRate) {
      return;
    }
    this.events.push(event);
    this.currentTickEventCount += 1;
  }

  getEvents(): CausalTraceEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
    this.currentTickEventCount = 0;
    this.currentTick = -1;
  }

  getEventCount(): number {
    return this.events.length;
  }

  snapshotState(): CausalTraceCollectorState {
    return {
      events: this.events.map((event) => cloneCausalTraceEvent(event)),
      currentTickEventCount: this.currentTickEventCount,
      currentTick: this.currentTick
    };
  }

  restoreState(state: CausalTraceCollectorState): void {
    this.events = state.events.map((event) => cloneCausalTraceEvent(event));
    this.currentTickEventCount = state.currentTickEventCount;
    this.currentTick = state.currentTick;
  }

  getEventsByType(type: CausalEventType): CausalTraceEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  getEventsByLineage(lineage: number): CausalTraceEvent[] {
    return this.events.filter((e) => {
      if (e.type === 'movement' || e.type === 'harvest' || e.type === 'encounter' || e.type === 'death') {
        return e.lineage === lineage;
      }
      if (e.type === 'reproduction') {
        return e.parentLineage === lineage || e.offspringLineage === lineage;
      }
      if (e.type === 'settlement') {
        return e.parentLineage === lineage || e.offspringLineage === lineage;
      }
      return false;
    });
  }

  getEventsBySpecies(species: number): CausalTraceEvent[] {
    return this.events.filter((e) => {
      if (e.type === 'movement' || e.type === 'harvest' || e.type === 'encounter' || e.type === 'death') {
        return e.species === species;
      }
      if (e.type === 'reproduction') {
        return e.parentSpecies === species || e.offspringSpecies === species;
      }
      if (e.type === 'settlement') {
        return e.offspringSpecies === species || e.parentSpecies === species;
      }
      return false;
    });
  }
}

function cloneCausalTraceEvent(event: CausalTraceEvent): CausalTraceEvent {
  if (event.type === 'reproduction' || event.type === 'settlement') {
    return {
      ...event,
      phenotypeDelta: event.phenotypeDelta.map((entry) => ({ ...entry }))
    };
  }

  return { ...event };
}
