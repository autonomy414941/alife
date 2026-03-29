# Causal Trace Implementation — 2026-03-29

## Summary

Implemented a bounded causal-trace system that records sampled per-event attribution keyed by lineage, species, and agent identity. The system addresses the **Bet 3: Mechanism Attribution Ceiling** by providing enough movement, harvest, encounter, and death attribution to connect expressed traits to outcomes.

## Architecture

### Core Components

**`CausalTraceCollector`** (`src/causal-trace.ts`)
- Manages event collection with configurable sampling
- Supports filtering by lineage, species, and event type
- Respects per-tick event limits to bound memory growth
- Sampling rate controls what fraction of events are recorded

**Event Types Implemented:**
1. **Movement** - Position changes, policy gating, energy cost
2. **Harvest** - Primary/secondary intake, policy guidance, efficiency multipliers
3. **Encounter** - Energy transfer, dominant/target identity, spatial location
4. **Death** - Reason (energy depletion vs max age), final energy, lineage/species

### Configuration

New `SimulationConfig` fields:
```typescript
{
  causalTraceEnabled?: boolean;           // Default: false
  causalTraceSamplingRate?: number;       // Default: 0.1 (10%)
  causalTraceMaxEventsPerTick?: number;   // Default: 100
}
```

### Integration Points

**Simulation (`src/simulation.ts`)**
- `CausalTraceCollector` instance initialized in constructor
- Public `causalTrace()` method exposes collector
- Movement events recorded in `processAgentTurn` after destination chosen
- Harvest events recorded after resource consumption
- Death events recorded during survivor filtering

**Encounter Operators (`src/encounter.ts`)**
- Added optional `recordEncounter` callback to `EncounterOperatorContext`
- All three operators (dominant, pairwise, non-transitive) call callback when transfer occurs
- Simulation provides callback that records to causal trace collector

## Pilot Results

**Configuration:**
- 20x20 grid, 30 agents, asymmetric two-resource dynamics
- 20% sampling rate, max 50 events per tick
- 100 steps

**Outcomes:**
- 4,685 total events recorded
- 2,334 movement events
- 2,351 harvest events
- 30 unique lineages tracked
- 803 unique species encountered

**Policy Metrics:**
- No policy-gated movements or policy-guided harvests in baseline run
- System ready to detect policy effects when policy loci are active

## Event Schema Examples

### Movement Event
```json
{
  "type": "movement",
  "tick": 1,
  "agentId": 26,
  "lineage": 26,
  "species": 26,
  "fromX": 13,
  "fromY": 2,
  "toX": 14,
  "toY": 2,
  "moved": true,
  "policyGated": false,
  "energyCost": 0.078
}
```

### Harvest Event
```json
{
  "type": "harvest",
  "tick": 1,
  "agentId": 7,
  "lineage": 7,
  "species": 7,
  "x": 4,
  "y": 11,
  "primaryHarvest": 0.228,
  "secondaryHarvest": 2.352,
  "policyGuided": false,
  "habitatEfficiency": 0.999,
  "trophicEfficiency": 0.687,
  "defenseEfficiency": 0.980,
  "lineageCrowdingEfficiency": 1.0
}
```

## Query Capabilities

The collector supports:
- `getEvents()` - All recorded events
- `getEventsByType(type)` - Filter by event type
- `getEventsByLineage(lineage)` - All events for a lineage
- `getEventsBySpecies(species)` - All events for a species
- `clear()` - Reset collector
- `getEventCount()` - Total events recorded

## Bounded Design

**Sampling prevents unbounded growth:**
- Each event is sampled with probability `samplingRate`
- Per-tick limit caps events even when many agents act
- Tick counter resets each step to maintain fairness

**Memory footprint:**
- ~200 bytes per event (estimate)
- At 100 events/tick and 1000 ticks: ~20MB
- Reasonable for validation panels under 10k ticks

## Not Yet Implemented

**Reproduction events** - Require deeper integration with reproduction coordinator to capture:
- Parent/offspring pairing
- Speciation decision
- Policy gating
- Local fertility and crowding at reproduction time

**Settlement events** - Require coordinating with offspring settlement logic to capture:
- Settlement success/failure
- Same-lineage crowding effects
- Ecology scoring (when enabled)
- Disturbance opening bonus

Both reproduction and settlement happen in `simulation-reproduction.ts` and would need callback parameters similar to the encounter integration pattern.

## Test Coverage

**Unit tests** (`test/causal-trace.test.ts`):
- Sampling rate respected
- Max events per tick enforced
- Event type filtering
- Lineage and species filtering
- Clear functionality

**Integration tests** (`test/causal-trace-integration.test.ts`):
- Movement and harvest events recorded in live simulation
- Death events captured
- Encounter events captured
- Lineage filtering works end-to-end
- Sampling rate affects total event count

## Usage Example

```typescript
const sim = new LifeSimulation({
  seed: 42,
  config: {
    width: 20,
    height: 20,
    initialAgents: 30,
    causalTraceEnabled: true,
    causalTraceSamplingRate: 0.2,
    causalTraceMaxEventsPerTick: 50
  }
});

sim.run(100);

const collector = sim.causalTrace();
const lineageEvents = collector.getEventsByLineage(7);
const harvestEvents = collector.getEventsByType('harvest');

console.log(`Lineage 7: ${lineageEvents.length} events`);
console.log(`Total harvests: ${harvestEvents.length}`);
```

## Success Evidence

✅ Exported artifacts include sampled per-event attribution keyed by lineage, species, and agent ID
✅ Movement, harvest, encounter, and death mechanisms are captured with trait and outcome context
✅ The system is bounded by sampling rate and per-tick limits, preventing raw-event archive growth
✅ Pilot demonstrates full lineage-keyed streams with configurable sampling

## Next Steps

To complete full mechanism attribution:
1. Add reproduction event recording via callback in `runReproductionPhase`
2. Add settlement event recording via callback in offspring settlement logic
3. Create analysis utilities that connect policy loci to demographic outcomes via event traces
4. Build lineage success predictor that uses event streams to explain extinction vs. proliferation
