# Cipher Vault

A playable single-player 3D cybersecurity CTF prototype. Explore an isometric training facility, investigate five fictional labs, submit flags, unlock prerequisites, and return to the south gate to extract.

## Run

Node.js 22.13+ is required (Node 24 recommended for the native TypeScript test runner).

```sh
npm ci
npm run dev
```

Open the Local URL printed by the server. WASD / arrows move relative to the camera, Shift runs, clicking the floor walks directly toward that point, and E opens nearby consoles. Click movement is direct steering, not obstacle-aware pathfinding; use intermediate floor clicks or keyboard movement to navigate around racks. Touch controls are available on narrow screens. Escape closes panels. If WebGL is unavailable, objective buttons offer the same labs without 3D movement.

## Validate

```sh
node --test tests/challenges.test.mjs
npx tsc --noEmit
npm run build
```

The production build targets Cloudflare Workers through Sites. Training progress uses browser localStorage; it is not shared between devices. Sounds are optional and muted initially. All art is procedural geometry; no external media downloads or API keys are required.

## Extend the curriculum

`lib/challenges.ts` contains typed challenge definitions: unique ID, category, coordinates, points, prerequisite IDs, briefing, evidence files, hints, flag, and defensive debrief. `components/game/World.tsx` creates consoles from that registry and owns rendering and movement. `components/game/Game.tsx` owns mission UI and progress. `runCommand` is an explicit command dispatcher: it does not invoke a shell, evaluate user code, or issue network requests.

To add a lab, add a registry entry with an unused position and existing prerequisite IDs. Extend `runCommand` only if the lab needs a new simulation. Add a solvability test. Update operation-specific five-lab copy, spawn space, and prerequisite layout for larger campaigns. Version the storage key or add a migration when changing saved progress semantics.

## Production scaling boundary

This is an extensible educational prototype, not a competitive CTF backend. Flags and validation are intentionally client-side and can be inspected; local scores can be edited. Do not use these scores for trusted rankings or assessments.

For a competitive service, separate the content catalog and 3D client from an authenticated session/flag API; store flag hashes and per-player randomized secrets exclusively on the server; use transactional unique `(session, challenge)` completion records; rate-limit submissions; persist progress centrally; and keep answer-bearing evidence in session-specific lab services. Run real vulnerable workloads in isolated disposable containers with quotas, controlled egress, per-session networks, timeouts, and teardown. Do not expose intentionally vulnerable services from the application worker. Serve static assets through a CDN and load zones on demand as the map grows. Multiplayer movement requires an authoritative simulation service and is not implemented here.

## Current scope

Five labs cover Base64 versus encryption, authentication-log correlation, broken object-level authorization, cleartext credential exposure, and incident containment. Prerequisite gates, XP, paid hints, debriefs, local save/resume, reset, extraction, and completion are included. This project has no accounts, real attack targets, hosted lab containers, multiplayer, or global leaderboard. Browser interaction/visual QA is separate from the automated logic, type, and build checks.
