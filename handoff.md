# Handoff: Nu, Pogodi! The Grand Chase (game 1)

Fan-made 3D slapstick chase game. Plain ES modules + three.js r160 (vendored in `vendor/`), no build step.

- Repo: https://github.com/Kozlo-pdf/nu-pogodi-grand-chase
- Live: https://kozlo-pdf.github.io/nu-pogodi-grand-chase/ (game: `/play.html`)
- Sequel: https://github.com/Kozlo-pdf/nu-pogodi-2-world-tour (built from this engine; has the newer, more capable platformer/hub code)
- Deploy: push to `main` -> `.github/workflows/pages.yml`. Occasional transient failure ("Found 0 artifact(s)"): re-run with `gh run rerun <id>`.

## Status
14 levels, website, gamepad support, polished models: built, pushed, deployed. Verified with headless-Chrome bots (no human playtest). Estimated ~30-45 min; the owner's reported times (33:31.01 and 29:20.56, shown as "Time to beat" in the sequel's README/site only) fit this range if they belong to this game. The user specified: **do not lengthen the "skate" (runner/ski) levels**; Highway, Interlude and Ski are intentionally unchanged from the first version (the later Metro runner was added as a new level, not a lengthening).

## Run / test
```sh
python -m http.server 8000        # or PLAY.bat; file:// does not work (module CORS, page explains)
```
Debug: `play.html?level=N` (0-13), `&auto=1` skip the intro card.
Tests (`tests/`): `bot.html?level=N&nohaz=1[&sx=60]` is a geometry bot for the x-axis platformers (levels 0,1,5,6,9,11); `sim.html?level=N[&hold=1|&shipbot=1|&arenabot=1]` smoke-runs the other types. Run via headless Chrome `--dump-dom` and read the `RESULT` line.

## Architecture (js/)
`main.js` loop/menus/progress; `levels.js` the ordered `LEVELS`; `builders.js` platformer level data + runner theme builders (obstacles/scenery/exports); `levels2.js` newer levels (circus, beach, village, metro, big-top boss); `platformer.js` (data-driven 3D platformer: crumble, bounce, ice, moving platforms, hazards); `runner.js` (3-lane chase + finish scenes incl. avalanche); `arena.js` (lever/box boss); `ship.js` (leak puzzle); `ending.js` (fireworks scene); `props.js` (shared model kit); `common.js` (helpers, Hare/Wolf/Robot builders, input + gamepad); `ui.js`, `audio.js`.
Platform coordinates are **top-centre**. Progress key `nupogodi.progress.v2` (localStorage).

## Chapters (= `?level=N`)

| # | Chapter | Type / engine | Notes |
|---|---|---|---|
| 0 | Prologue: Balcony Escape | `Platformer` (`builders.js: balcony`) | ~150-unit side path of balconies, crumbling ledges, a moving balcony, 7 swinging-hook pendulums; goal at x=149. Bot-verified (`bot.html?level=0&nohaz=1`). |
| 1 | Ch1: Fairground | `Platformer` (`fairground`) | **4 golden tickets** (hall of mirrors, shooting gallery stand, Ferris wheel top, carousel roof); sliders = rolling traps/bumper cars; goal (tram) at x=156 needs all 4. Zones verified via bot from `sx=60`. |
| 2 | Boss: Magician's Stage | `Arena` | Pull levers (E) to open the glowing pad, lure the Wolf over it; **4 traps** needed, 3 hearts. Bot `arenabot` wins. |
| 3 | Ch2: Highway Mayhem | `Runner` (`player:'bike'`) | Wolf chases on motorcycle -> car -> steamroller (phases at 0.34/0.67). **Unchanged by request.** |
| 4 | Ch2a: Metro Tunnel | `Runner` (`levels2.js: metro`) | Tunnel with ceiling, Wolf on foot then a hijacked subway train. |
| 5 | Ch2b: Construction Site | `Platformer` | Long girder climb, crane platforms, wrecking balls; goal at x=154,y=18. |
| 6 | Ch2c: Under the Big Top | `Platformer` (`levels2.js: circus`) | Tightropes, crumbling planks, trapezes. |
| 7 | Boss: Showdown at the Big Top | `Arena` (`bigTopBoss`) | 4 levers, 5 traps, faster Wolf, shorter pad window; **the naive bot loses (intended hard)**. |
| 8 | Interlude: Hospital Nightmare | `Runner` (`player:'wolf'`, wobble cam) | Play as the Wolf fleeing the Robot Hare. **Unchanged by request.** |
| 9 | Ch3a: Boardwalk | `Platformer` (`beach`) | **Bounce pads** (pink umbrellas), rafts, water kill plane. |
| 10 | Ch3b: Sea Cruise | `Ship` (85 s, interval 5.8) | Wolf punches new leaks; hold E to plug / pump. Bot `shipbot` wins. |
| 11 | Ch3c: Snowy Village | `Platformer` (`village`, `ice:true`) | Slippery ground, thin ice (crumble), snowball sliders. |
| 12 | Final: New Year's Showdown | `Runner` (`player:'ski'`, `slope`, `finish:'avalanche'`) | Snegurochka-Wolf chase, avalanche and tree finale. **Unchanged by request.** |
| 13 | Finale: Happy New Year | `Ending` | Fireworks, crowd, tangled Wolf; ~22 s then credits. |

Runner invariants: obstacles are procedurally generated from a seed and always passable (low = jump, high = slide, wall = switch lane); 3 hits = caught (`gap` bar). Avalanche finish: wave + Wolf slides into the giant tree, then `ctx.win()`.
Platformer invariants: respawn at the last `cp` platform; hazards = pendulums/sliders; `killY` per level; double jump; variable jump height (cut while Space is released, **suppressed after bounce pads**).

## Controls (keyboard / PS4)
Move WASD/arrows/stick/D-pad, jump Space/W/✕, slide S, interact in Arena/Ship E or F/□, camera Q/E (platformers) / right stick, pause Esc/Options, restart R/Share, mute M/L3. Menus: D-pad + ✕. Square maps to F here because E rotates the camera. Rumble on hits.

## Known issues / unverified
- No human playtest; difficulty is bot-estimated. The circus boss may be too hard for some players.
- Pendulum timing was only bot-checked with hazards disabled for geometry (`nohaz=1`); hazard fairness is judged analytically (swing windows), not played.
- `bot.html` expects x-axis layouts; it does not play the Fairground ticket maze.
- Digital stick only (no analog), no analog triggers beyond camera.
- Headless screenshots can miss the Hare (respawn invulnerability flicker timing); not a real bug.

## Repo / identity notes
- Commits here use the machine's global git identity (`Kozlo-pdf`); a few earlier ones were made when `user.email` was an unrelated address only in the **sequel** repo (already rewritten there). `gh` is installed per user via winget and logged in as `Kozlo-pdf`.
- Legal: unofficial, non-commercial fan tribute; names/characters belong to their rights holders; all art/sound is original/procedural; code MIT.

## Suggested next steps
1. Playtest and tune the Big Top boss and the pendulum levels.
2. Port the sequel's newer platformer features back if needed (wall-jump, per-character params, launch pads) or keep this game frozen.
3. Add CI that runs the headless tests on push.
