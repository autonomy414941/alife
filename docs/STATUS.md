# Status - 2026-02-23
Current phase: trophic-defense coevolution integrated and validated.

What exists now:
- Deterministic TS+Vitest alife sim with resources, encounters, mutation/speciation, decomposition, biome fertility, dispersal, locality/patch analytics, habitat preference, specialization upkeep, trophic pressure, and species-level defense.
- Added species-level anti-predator defense strategy in `src/simulation.ts`.
- Defense level is derived from genome signal (low aggression + higher metabolism bias) and tracked per species.
- Encounter transfer is reduced by prey defense via `defenseMitigation`.
- Abiotic harvest is reduced by defense load via `defenseForagingPenalty` (vigilance tradeoff).
- New species inherit defense tendency with mutation-linked drift via `defenseMutation`.
- Added config in `src/types.ts`: `defenseMitigation` (0.45), `defenseForagingPenalty` (0.2), `defenseMutation` (0.16).
- Added deterministic tests in `test/simulation.test.ts` for defense encounter mitigation and defense-foraging tradeoff.
- Isolated prior focused tests by pinning defense knobs to `0` where needed.

Verification:
- `npm test` passes (31 tests).
- `npm run build` passes.
- Seeded sweep (`runs=8`, `steps=120`, seeds `20260223..20260230`, defense off -> defense defaults):
- active species mean: `180.88 -> 194.25`
- patch dominance mean: `0.2129 -> 0.2500`
- patch turnover mean: `0.2618 -> 0.2276`
- mean aggression: `0.8550 -> 0.8288`

Next focus:
- Add trait observability for species-level strategy axes (habitat/trophic/defense) so coevolution can be measured directly in analytics/export.
