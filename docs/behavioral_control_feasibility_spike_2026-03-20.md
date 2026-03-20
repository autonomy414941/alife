# Behavioral Control Feasibility Spike

## Question

Can the simulator absorb a minimal per-agent internal state surface and one policy-gated decision without breaking default ecology or requiring a broad rewrite?

## Slice Implemented

- Added optional `internalState: Map<string, number>` to `Agent` and `AgentSeed`.
- Added one observed runtime signal: `last_harvest_total`.
- Added one opt-in policy parameter: `reproduction_harvest_threshold`.
- Wired reproduction gating so an agent can require a minimum same-turn harvest before reproducing.
- Kept the default path unchanged for agents without policy state.

## Verification

- Focused tests confirm default reproduction still succeeds when no behavioral policy is present.
- Focused tests confirm a seeded agent with `reproduction_harvest_threshold=1` reproduces after a productive turn and does not reproduce after a zero-harvest turn.
- Offspring inherit the configured policy state while resetting the transient `last_harvest_total` signal to `0`.

## API Surface

- New file: `src/behavioral-control.ts`
- New internal-state keys:
  - `last_harvest_total`
  - `reproduction_harvest_threshold`
- Existing reproduction code only depends on numeric lookups from the agent-local map; no config schema or global registry changes were needed.

## Coupling Risks

- `Map<string, number>` is flexible enough for a spike, but stringly typed keys will become brittle if multiple decisions start reading and writing overlapping state.
- The current spike mixes controller parameters and transient memory in the same map. A larger expansion should likely separate heritable policy parameters from ephemeral observations.
- Reproduction was low-risk because it already has a single gate. Movement, encounters, and harvest would touch the main turn loop more heavily and should probably share a common policy evaluation boundary before broader rollout.

## Conclusion

Behavioral control looks feasible within the current architecture. A narrow policy layer can be introduced with low coupling if it stays opt-in and starts at existing decision gates. The main design risk is not raw implementation complexity; it is keeping policy parameters, observations, and inheritance semantics coherent as more decisions become stateful.
