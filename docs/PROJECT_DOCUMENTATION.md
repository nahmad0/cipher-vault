# Cipher Vault — project documentation

## 1. What this project is

Cipher Vault is a single-player, browser-based 3D capture-the-flag game for beginner cybersecurity education. The player explores a training facility, opens consoles, investigates fictional evidence, submits flags, and unlocks extraction. It uses React, TypeScript, and Three.js.

Two deployment targets use the same game components:

| Target | Entry | Build | Output |
| --- | --- | --- | --- |
| Sites / Cloudflare Worker | `app/page.tsx` | `npm run build` | `dist/` |
| Static hosting / GitHub Pages | `github-pages/main.tsx` | `npm run build:pages` | `dist-pages/` |

The website directory is `public/websites/index.html`. It is a standalone HTML document with inline CSS and no JavaScript or external dependencies. It links to Nabil Allimi’s newsletter, personal portfolio, and this game.

## 2. Installation and local development

Use Node.js 24 and npm. From the project directory:

```sh
npm ci
npm run dev
```

Open the Local URL printed by the terminal, normally `http://localhost:3000/`. The directory is at `http://localhost:3000/websites/`. Leave the terminal running while using the preview. Stop it with Ctrl+C.

To test exactly the files intended for GitHub Pages:

```sh
npm run build:pages
npm run preview:pages
```

Open the URL printed by this second server, normally `http://127.0.0.1:4173/`. A static build must be served over HTTP; opening its game `index.html` through `file://` is not supported. The separate website directory itself can be opened directly as HTML, but its relative game link requires the intended deployed folder structure.

## 3. Player guide

1. Choose **Enter the facility** or resume a saved operation.
2. Move toward an available console. The objective buttons set a walking destination.
3. Press **E** near the console or use the interaction button.
4. Read the objective and evidence. Clicking an evidence filename runs `cat` for that file.
5. Submit the exact flag through the flag field or `submit CTF{...}`.
6. Read the defensive debrief. Completing a prerequisite unlocks later labs.
7. Capture all five flags, return to the south extraction gate, and press **E**.

### Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move relative to the camera |
| Shift | Run |
| Left-click floor | Walk directly toward the clicked location |
| E | Open a nearby lab or use extraction |
| V / camera selector | Switch overhead and third-person views |
| Q / R in third-person | Orbit camera |
| Right-button drag in third-person | Orbit camera |
| On-screen rotation buttons | Hold to orbit; also keyboard accessible |
| Escape | Close lab, help, or reset confirmation |
| Terminal Up / Down | Browse command history |

On narrow screens, on-screen movement buttons are available. Click-to-walk uses direct steering, not pathfinding; use intermediate clicks or keyboard movement around obstacles. Third-person follows the player and pulls closer when geometry blocks the line of sight. Switching views preserves the player’s position and progress, but cancels an existing walk target.

If WebGL initialization fails, objective buttons provide access to the same labs without 3D movement. No account or audio permission is required. Capture sounds start muted and can be enabled with the sound button.

## 4. Curriculum and progression

| Lab | Topic | Prerequisites | Base XP |
| --- | --- | --- | --- |
| Ghost signal | Encoding versus encryption | None | 100 |
| After hours | Authentication-log analysis | None | 150 |
| Wrong clearance | Broken object-level authorization | Ghost signal | 200 |
| In plain sight | Cleartext credential exposure | After hours | 200 |
| Contain the breach | Incident containment | Wrong clearance + In plain sight | 300 |

Maximum score is 950 XP. Each revealed hint deducts 15 XP from that lab’s earned points. The scoring function has a minimum award of 25 XP per solved lab. Wrong submissions do not deduct points. A solved flag cannot award points twice. The completion screen shows score, elapsed time, and flags captured.

The mission timer runs while an operation is active, including while a lab is open. It pauses in help, reset confirmation, the background browser tab, and after extraction. Reviewing the facility after completion resumes the timer.

## 5. Terminal commands

| Command | Purpose | Example |
| --- | --- | --- |
| `help` | List supported commands | `help` |
| `ls` | List this lab’s files | `ls` |
| `cat <file>` | Read evidence | `cat auth.log` |
| `grep <text> <file>` | Case-insensitive line filtering | `grep failed auth.log` |
| `decode <base64>` | Decode Base64 text | `decode SGVsbG8=` |
| `request <path>` | Query the access-control simulation | `request /api/reports/1042` |
| `submit CTF{...}` | Submit a flag | `submit CTF{your_answer}` |
| `clear` | Clear visible terminal output | `clear` |

These are simulated commands. They cannot execute operating-system commands, evaluate code, read local computer files, or make real network requests. Evidence paths refer only to entries in the current challenge’s file map. Flag comparison is case-sensitive after trimming surrounding whitespace.

## 6. Source layout

```text
app/
  page.tsx                 Sites entry; loads the game client-side
  layout.tsx               Page metadata and global stylesheet
  globals.css              Game interface and responsive layout
components/game/
  Game.tsx                 Mission state, UI, lab terminal, persistence
  World.tsx                Three.js scene, input, movement, cameras
lib/challenges.ts          Challenge registry, commands, score, save parsing
github-pages/
  index.html               Static HTML shell
  main.tsx                 React entry for GitHub Pages
public/websites/index.html Standalone personal website directory
vite.config.ts            Existing Sites / Worker build configuration
vite.pages.config.ts      Static build configuration; relative asset URLs
.github/workflows/
  deploy-pages.yml         GitHub Pages build and deployment workflow
tests/challenges.test.mjs  Progression, solvability, command, and save tests
docs/                     Documentation and hosting guide
```

`Game` owns React state. `World` receives current props through a ref so the render loop can read changes without destroying the Three.js scene. Meshes and materials are procedural. Geometry, materials, textures, animation frames, event listeners, and the renderer are cleaned up when the component unmounts.

## 7. Saving and privacy

| Browser storage key | Contents |
| --- | --- |
| `cipher-vault-v1` | Solved IDs, hint counts, elapsed seconds, extraction state |
| `cipher-vault-camera` | `overhead` or `third-person` |

Storage is local to the browser and website origin. Moving between localhost, Sites, and GitHub Pages does not transfer progress. Paths on the same origin share localStorage, so copies of this game under the same `nahmad0.github.io` domain use the same keys. Change the keys to isolate separate campaigns.

The reset control clears mission progress after confirmation; it preserves the camera preference. Corrupted saves fall back to a fresh state. If saving is unavailable, the game remains playable for the session and shows **SAVE UNAVAILABLE**. The game does not implement analytics, multiplayer synchronization, or server-side player storage.

## 8. Add or change a challenge

Add a `Challenge` entry in `lib/challenges.ts` with:

- A unique `id`, title, category, color, point value, and unused `[x, z]` position.
- A briefing and a `files` map containing enough evidence to solve it.
- Ordered hints, an exact flag answer, and a defensive lesson.
- A `requires` array containing valid challenge IDs. Avoid prerequisite cycles.

Consoles are generated from the registry. Add a simulation branch to `runCommand` only when a new command or service is needed; never replace the dispatcher with `eval`, a shell, or unrestricted network access.

Add a test proving that the answer can be derived from the evidence and that the prerequisite graph is reachable. The current campaign includes hardcoded five-lab wording and counts in the UI and tests: update those when changing the number of labs. Review map dimensions, obstacle placement, spawn and extraction positions, and camera labels for larger layouts. Version the save key or implement a migration when IDs or score semantics change.

## 9. Edit the website directory

Open `public/websites/index.html`. Each website is one `<article class="card">` containing a normal anchor. Edit its `href`, title, description, and category. Copy an existing article to add another site. Keep meaningful `aria-label` text and use the full HTTPS address for external sites.

The current external addresses were provided by the owner:

- Newsletter: `https://nahmad0.github.io/`
- Portfolio: `https://nahmad0.github.io/nallimi/`
- GitHub profile: `https://github.com/nahmad0`

Cipher Vault uses `../` so the directory links to the game one folder above on localhost and under a GitHub repository path. If publishing the directory separately, replace the Cipher Vault card’s link with the deployed game URL. See the separate hosting guide before moving the directory to another repository.

## 10. Verification

```sh
npm test
npm run typecheck
npm run build:pages
npm run build
```

Tests cover prerequisite reachability, each lab’s solvability, invalid terminal input, hint scoring, corrupted save recovery, and duplicate/unknown solved IDs. Production builds check both deployment targets. These checks do not replace a manual browser playthrough, touch-device testing, accessibility review, or load testing.

For a manual release check: enter both camera modes, rotate and move near racks, solve the two initial labs, verify unlocks, reveal a hint, reload to verify persistence, finish extraction, and test reset. For GitHub Pages, also verify the game at `/cipher-vault/`, the directory at `/cipher-vault/websites/`, and every card destination.

## 11. Scope and scaling boundary

This prototype is suitable for self-guided learning. Answers and flag checking are in the browser bundle, and local scores can be edited. Do not treat the score as a trusted competition ranking or assessment result.

A competitive service would need authenticated sessions, server-only flag validation, per-player lab secrets, rate limits, central progress storage, transactional completion records, and an authoritative leaderboard. Real vulnerable workloads need isolated disposable lab infrastructure with quotas, restricted egress, expiration, and cleanup. GitHub Pages cannot supply those services; use a separately hosted backend if adding them.

Multiplayer, real attack targets, hosted lab containers, global leaderboards, cross-device accounts, and obstacle-aware pathfinding are not implemented. For a larger world, load zones on demand and reduce draw calls with shared geometry or instancing. The static target can serve the current game without running a server process at request time; this is not a claim that multiplayer load or large-world performance has been tested.

## 12. Troubleshooting

| Symptom | Check |
| --- | --- |
| Localhost does not open | Start `npm run dev`; use its exact printed URL and port |
| Static preview shows an old version | Rebuild with `npm run build:pages` before previewing |
| Character stops while click-walking | A rack or console blocks the direct path; steer around it |
| Keys type instead of moving | Close the terminal; controls are disabled while a lab is open |
| Progress differs across hosts | Saves are local to each browser origin |
| 3D unavailable | Enable browser hardware acceleration if supported; use fallback lab buttons |
| GitHub game missing CSS or scripts | Deploy `dist-pages`, not source or the Worker `dist` folder |
| Newsletter disappears | A different site was deployed to `nahmad0.github.io`; use a separate project repository |
