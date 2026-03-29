import { LifeSimulation } from './simulation';
import { writeFileSync } from 'fs';

const sim = new LifeSimulation({
  seed: 42,
  config: {
    width: 20,
    height: 20,
    initialAgents: 30,
    maxResource: 8,
    maxResource2: 4,
    resource2Regen: 0.3,
    seasonalCycleLength: 120,
    seasonalRegenAmplitude: 0.3,
    resource2SeasonalRegenAmplitude: 0.4,
    resource2SeasonalPhaseOffset: 60,
    biomeBands: 4,
    biomeContrast: 0.45,
    causalTraceEnabled: true,
    causalTraceSamplingRate: 0.2,
    causalTraceMaxEventsPerTick: 50
  }
});

const summaries = sim.run(100);

const collector = sim.causalTrace();
const events = collector.getEvents();

console.log('Causal Trace Pilot Results');
console.log('==========================');
console.log(`Total events recorded: ${events.length}`);
console.log(`Sampling rate: 0.2 (20%)`);
console.log();

const eventCounts = {
  movement: collector.getEventsByType('movement').length,
  harvest: collector.getEventsByType('harvest').length,
  encounter: collector.getEventsByType('encounter').length,
  death: collector.getEventsByType('death').length,
  reproduction: collector.getEventsByType('reproduction').length,
  settlement: collector.getEventsByType('settlement').length
};

console.log('Events by type:');
for (const [type, count] of Object.entries(eventCounts)) {
  console.log(`  ${type}: ${count}`);
}
console.log();

const snapshot = sim.snapshot();
console.log(`Final population: ${snapshot.population}`);
console.log(`Active species: ${snapshot.activeSpecies}`);
console.log(`Active clades: ${snapshot.activeClades}`);
console.log();

const lineages = new Set<number>();
const species = new Set<number>();
for (const event of events) {
  if (event.type === 'movement' || event.type === 'harvest' || event.type === 'encounter' || event.type === 'death') {
    lineages.add(event.lineage);
    species.add(event.species);
  }
}

console.log(`Unique lineages in trace: ${lineages.size}`);
console.log(`Unique species in trace: ${species.size}`);
console.log();

const movementEvents = collector.getEventsByType('movement');
const policyGatedMovements = movementEvents.filter((e: any) => e.policyGated).length;
console.log(`Policy-gated movements: ${policyGatedMovements} / ${movementEvents.length} (${((policyGatedMovements / movementEvents.length) * 100).toFixed(1)}%)`);

const harvestEvents = collector.getEventsByType('harvest');
const policyGuidedHarvests = harvestEvents.filter((e: any) => e.policyGuided).length;
console.log(`Policy-guided harvests: ${policyGuidedHarvests} / ${harvestEvents.length} (${((policyGuidedHarvests / harvestEvents.length) * 100).toFixed(1)}%)`);
console.log();

if (lineages.size > 0) {
  const sampleLineage = Array.from(lineages)[0];
  const lineageEvents = collector.getEventsByLineage(sampleLineage);
  console.log(`Sample lineage ${sampleLineage} events:`);
  console.log(`  Total: ${lineageEvents.length}`);
  const lineageEventCounts: Record<string, number> = {};
  for (const event of lineageEvents) {
    lineageEventCounts[event.type] = (lineageEventCounts[event.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(lineageEventCounts)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();
}

const encounterEvents = collector.getEventsByType('encounter');
if (encounterEvents.length > 0) {
  const sampleEncounter = encounterEvents[0] as any;
  console.log('Sample encounter event:');
  console.log(`  Tick: ${sampleEncounter.tick}`);
  console.log(`  Dominant: agent ${sampleEncounter.agentId} (lineage ${sampleEncounter.lineage}, species ${sampleEncounter.species})`);
  console.log(`  Target: agent ${sampleEncounter.targetId} (lineage ${sampleEncounter.targetLineage}, species ${sampleEncounter.targetSpecies})`);
  console.log(`  Energy transfer: ${sampleEncounter.energyTransfer.toFixed(3)}`);
  console.log(`  Location: (${sampleEncounter.x}, ${sampleEncounter.y})`);
  console.log();
}

const deathEvents = collector.getEventsByType('death');
const deathReasons: Record<string, number> = {};
for (const event of deathEvents) {
  const e = event as any;
  deathReasons[e.reason] = (deathReasons[e.reason] || 0) + 1;
}
console.log('Death reasons:');
for (const [reason, count] of Object.entries(deathReasons)) {
  console.log(`  ${reason}: ${count}`);
}
console.log();

const output = {
  config: {
    samplingRate: 0.2,
    maxEventsPerTick: 50,
    steps: 100
  },
  summary: {
    totalEvents: events.length,
    eventCounts,
    uniqueLineages: lineages.size,
    uniqueSpecies: species.size,
    finalPopulation: snapshot.population,
    activeSpecies: snapshot.activeSpecies,
    activeClades: snapshot.activeClades
  },
  policyMetrics: {
    policyGatedMovements,
    totalMovements: movementEvents.length,
    policyGuidedHarvests,
    totalHarvests: harvestEvents.length
  },
  deathReasons,
  sampleEvents: {
    movement: movementEvents[0],
    harvest: harvestEvents[0],
    encounter: encounterEvents[0] || null,
    death: deathEvents[0] || null
  }
};

writeFileSync('docs/causal_trace_pilot_2026-03-29.json', JSON.stringify(output, null, 2));

console.log('Full results exported to docs/causal_trace_pilot_2026-03-29.json');
