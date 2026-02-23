# Status - 2026-02-23
Current phase: trophic axis integrated and validated.

What exists now:
- Deterministic TS+Vitest alife sim with resources, encounters, mutation/speciation, decomposition, biome fertility, dispersal, locality/patch analytics, habitat preference, and specialization upkeep.
- Added species-level trophic strategy in `src/simulation.ts`.
- Trophic level is derived from aggression + low-harvest bias and tracked per species.
- Resource harvest is scaled down by trophic level via `trophicForagingPenalty`.
- Encounter transfer is scaled up by predator-prey trophic gap via `predationPressure`.
- New species inherit trophic tendency with mutation-linked drift via `trophicMutation`.
- Added config in `src/types.ts`: `predationPressure` (0.35), `trophicForagingPenalty` (0.35), `trophicMutation` (0.18).
- Added deterministic tests in `test/simulation.test.ts` for trophic harvest penalty and predation-pressure encounter amplification.
- Isolated the prior specialization-tradeoff comparison by pinning trophic knobs to `0` inside that test.

Verification:
- `npm test` passes (29 tests).
- `npm run build` passes.
- Seeded sweep (`runs=8`, `steps=120`, seeds `20260223..20260230`, neutral -> trophic defaults):
- active species mean: `193.38 -> 180.88`
- patch dominance mean: `0.1999 -> 0.2129`
- patch turnover mean: `0.3164 -> 0.2618`
- mean aggression: `0.8475 -> 0.8550`

Next focus:
- Add anti-predator adaptation (defense/escape) so trophic pressure has a heritable counter-strategy.
