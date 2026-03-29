import { describe, it, expect } from 'vitest';
import {
  CausalTraceCollector,
  DEFAULT_CAUSAL_TRACE_CONFIG,
  CausalTraceMovementEvent
} from '../src/causal-trace';

describe('CausalTraceCollector', () => {
  it('should not record events when disabled', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: false
    });

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.5
    );

    expect(collector.getEventCount()).toBe(0);
  });

  it('should record events when enabled and within sampling rate', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 1.0
    });

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.5
    );

    expect(collector.getEventCount()).toBe(1);
    const events = collector.getEvents();
    expect(events[0].type).toBe('movement');
    expect((events[0] as CausalTraceMovementEvent).agentId).toBe(1);
  });

  it('should respect sampling rate', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 0.5
    });

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.3
    );

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 2,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.8
    );

    expect(collector.getEventCount()).toBe(1);
  });

  it('should respect max events per tick', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 1.0,
      maxEventsPerTick: 2
    });

    for (let i = 0; i < 5; i++) {
      collector.recordEvent(
        {
          type: 'movement',
          tick: 1,
          agentId: i,
          lineage: 1,
          species: 1,
          fromX: 0,
          fromY: 0,
          toX: 1,
          toY: 1,
          moved: true,
          policyGated: false,
          energyCost: 0.5
        },
        () => 0.5
      );
    }

    expect(collector.getEventCount()).toBe(2);
  });

  it('should filter events by lineage', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 1.0
    });

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.5
    );

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 2,
        lineage: 2,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.5
    );

    const lineage1Events = collector.getEventsByLineage(1);
    expect(lineage1Events.length).toBe(1);
    expect((lineage1Events[0] as CausalTraceMovementEvent).agentId).toBe(1);
  });

  it('should filter events by species', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 1.0
    });

    collector.recordEvent(
      {
        type: 'harvest',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        x: 0,
        y: 0,
        primaryHarvest: 1.0,
        secondaryHarvest: 0.5,
        policyGuided: false,
        habitatEfficiency: 1.0,
        trophicEfficiency: 1.0,
        defenseEfficiency: 1.0,
        lineageCrowdingEfficiency: 1.0
      },
      () => 0.5
    );

    collector.recordEvent(
      {
        type: 'harvest',
        tick: 1,
        agentId: 2,
        lineage: 2,
        species: 2,
        x: 0,
        y: 0,
        primaryHarvest: 1.0,
        secondaryHarvest: 0.5,
        policyGuided: false,
        habitatEfficiency: 1.0,
        trophicEfficiency: 1.0,
        defenseEfficiency: 1.0,
        lineageCrowdingEfficiency: 1.0
      },
      () => 0.5
    );

    const species1Events = collector.getEventsBySpecies(1);
    expect(species1Events.length).toBe(1);
  });

  it('should clear events', () => {
    const collector = new CausalTraceCollector({
      ...DEFAULT_CAUSAL_TRACE_CONFIG,
      enabled: true,
      samplingRate: 1.0
    });

    collector.recordEvent(
      {
        type: 'movement',
        tick: 1,
        agentId: 1,
        lineage: 1,
        species: 1,
        fromX: 0,
        fromY: 0,
        toX: 1,
        toY: 1,
        moved: true,
        policyGated: false,
        energyCost: 0.5
      },
      () => 0.5
    );

    expect(collector.getEventCount()).toBe(1);
    collector.clear();
    expect(collector.getEventCount()).toBe(0);
  });
});
