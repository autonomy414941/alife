import { describe, it, expect } from 'vitest';
import { LifeSimulation } from '../src/simulation';

describe('Causal trace integration', () => {
  it('should record movement and harvest events when enabled', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 5,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0,
        causalTraceMaxEventsPerTick: 100
      }
    });

    sim.step();

    const collector = sim.causalTrace();
    const events = collector.getEvents();

    expect(events.length).toBeGreaterThan(0);

    const movementEvents = collector.getEventsByType('movement');
    const harvestEvents = collector.getEventsByType('harvest');

    expect(movementEvents.length).toBeGreaterThan(0);
    expect(harvestEvents.length).toBeGreaterThan(0);
  });

  it('should not record events when disabled', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 5,
        causalTraceEnabled: false
      }
    });

    sim.step();

    const collector = sim.causalTrace();
    const events = collector.getEvents();

    expect(events.length).toBe(0);
  });

  it('should record death events', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 5,
        maxAge: 2,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0
      }
    });

    for (let i = 0; i < 5; i++) {
      sim.step();
    }

    const collector = sim.causalTrace();
    const deathEvents = collector.getEventsByType('death');

    expect(deathEvents.length).toBeGreaterThan(0);
  });

  it('should record encounter events', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 5,
        height: 5,
        initialAgents: 20,
        moveCost: 0,
        dispersalPressure: 0,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0
      }
    });

    for (let i = 0; i < 10; i++) {
      sim.step();
      const collector = sim.causalTrace();
      const encounterEvents = collector.getEventsByType('encounter');
      if (encounterEvents.length > 0) {
        expect(encounterEvents.length).toBeGreaterThan(0);
        return;
      }
    }

    const collector = sim.causalTrace();
    const encounterEvents = collector.getEventsByType('encounter');
    expect(encounterEvents.length).toBeGreaterThan(0);
  });

  it('should record reproduction and settlement events with phenotype deltas', () => {
    const sim = new LifeSimulation({
      seed: 7,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 1,
        reproduceProbability: 1,
        policyMutationProbability: 1,
        policyMutationMagnitude: 0.4,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2 },
          policyState: new Map([
            ['reproduction_harvest_threshold', 0.5],
            ['movement_energy_reserve_threshold', 0.5]
          ])
        }
      ]
    });

    sim.step();

    const collector = sim.causalTrace();
    const reproductionEvents = collector.getEventsByType('reproduction');
    const settlementEvents = collector.getEventsByType('settlement');

    expect(reproductionEvents.length).toBeGreaterThan(0);
    expect(settlementEvents.length).toBeGreaterThan(0);

    const reproductionEvent = reproductionEvents[0];
    const settlementEvent = settlementEvents[0];
    if (reproductionEvent?.type !== 'reproduction' || settlementEvent?.type !== 'settlement') {
      throw new Error('expected reproduction and settlement events');
    }

    expect(reproductionEvent.phenotypeDelta.length).toBeGreaterThan(0);
    expect(reproductionEvent.parentLineage).toBe(settlementEvent.parentLineage);
    expect(reproductionEvent.offspringId).toBe(settlementEvent.offspringId);
    expect(settlementEvent.phenotypeDelta).toEqual(reproductionEvent.phenotypeDelta);
  });

  it('should allow filtering by lineage', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 5,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0
      }
    });

    sim.step();

    const collector = sim.causalTrace();
    const snapshot = sim.snapshot();
    const firstAgent = snapshot.agents[0];

    const lineageEvents = collector.getEventsByLineage(firstAgent.lineage);
    expect(lineageEvents.length).toBeGreaterThan(0);

    for (const event of lineageEvents) {
      if (event.type === 'movement' || event.type === 'harvest' || event.type === 'encounter' || event.type === 'death') {
        expect(event.lineage).toBe(firstAgent.lineage);
      }
    }
  });

  it('should respect sampling rate', () => {
    const simFull = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 10,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 1.0
      }
    });

    const simSampled = new LifeSimulation({
      seed: 42,
      config: {
        width: 10,
        height: 10,
        initialAgents: 10,
        causalTraceEnabled: true,
        causalTraceSamplingRate: 0.1
      }
    });

    simFull.step();
    simSampled.step();

    const fullEvents = simFull.causalTrace().getEventCount();
    const sampledEvents = simSampled.causalTrace().getEventCount();

    expect(sampledEvents).toBeLessThan(fullEvents);
  });
});
