import { LifeSimulation } from './simulation';

const STEPS = 200;
const REPORT_EVERY = 25;

const simulation = new LifeSimulation({ seed: 20260221 });

for (let i = 0; i < STEPS; i += 1) {
  const summary = simulation.step();
  if (summary.tick % REPORT_EVERY === 0 || summary.population === 0) {
    const turnover = simulation.analytics(REPORT_EVERY);
    console.log(
      `tick=${summary.tick} population=${summary.population} births=${summary.births} deaths=${summary.deaths} ` +
      `meanEnergy=${summary.meanEnergy.toFixed(2)} ` +
        `traits(m=${summary.meanGenome.metabolism.toFixed(2)},h=${summary.meanGenome.harvest.toFixed(2)},a=${summary.meanGenome.aggression.toFixed(2)}) ` +
        `species=${summary.activeSpecies} clades=${summary.activeClades} domSpecies=${summary.dominantSpeciesShare.toFixed(2)} ` +
        `selection(dm=${summary.selectionDifferential.metabolism.toFixed(2)},dh=${summary.selectionDifferential.harvest.toFixed(2)},da=${summary.selectionDifferential.aggression.toFixed(2)}) ` +
        `extinctions(step:s=${summary.speciesExtinctions},c=${summary.cladeExtinctions};total:s=${summary.cumulativeExtinctSpecies},c=${summary.cumulativeExtinctClades}) ` +
        `turnover(rate:spec=${turnover.species.speciationRate.toFixed(2)},ext=${turnover.species.extinctionRate.toFixed(2)},net=${turnover.species.netDiversificationRate.toFixed(2)})`
    );
  }
  if (summary.population === 0) {
    break;
  }
}

const final = simulation.snapshot();
const history = simulation.history();
const turnover = simulation.analytics(REPORT_EVERY);
console.log(
  `final tick=${final.tick} population=${final.population} meanEnergy=${final.meanEnergy.toFixed(2)} ` +
    `species=${final.activeSpecies} clades=${final.activeClades} domSpecies=${final.dominantSpeciesShare.toFixed(2)} ` +
    `extinctSpecies=${final.extinctSpecies} extinctClades=${final.extinctClades}`
);
console.log(
  `history tracked clades=${history.clades.length} species=${history.species.length}`
);
console.log(
  `turnover window=${turnover.window.size} specRate=${turnover.species.speciationRate.toFixed(2)} ` +
    `extRate=${turnover.species.extinctionRate.toFixed(2)} netRate=${turnover.species.netDiversificationRate.toFixed(2)} ` +
    `lifespan(extinctMean=${turnover.species.extinctLifespan.mean.toFixed(2)},extinctMax=${turnover.species.extinctLifespan.max.toFixed(2)},activeMean=${turnover.species.activeAge.mean.toFixed(2)})`
);
