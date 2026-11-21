# Nu, Pogodi! The Grand Chase

A free, fan-made 3D slapstick chase game that runs in the browser (three.js, no build step), with its own website.

You play the clever Hare and outwit the scheming Wolf across nine short levels, from a balcony escape to a New Year's Eve finale.

| # | Level | Gameplay |
|---|-------|----------|
| 1 | Prologue – Balcony Escape | 3D platformer, swinging hooks |
| 2 | Chapter 1 – Fairground | Collect 3 golden tickets (hall of mirrors, shooting gallery, Ferris wheel climb) |
| 3 | Boss – Magician's Stage | Lure the Wolf into the magic box using levers |
| 4 | Chapter 2 – Highway Mayhem | 3-lane chase: motorcycle → sports car → steamroller |
| 5 | Chapter 2b – Construction Site | Cranes, girders, wrecking balls |
| 6 | Interlude – Hospital Nightmare | Play as the Wolf, flee the giant Robot Hare |
| 7 | Chapter 3 – Sea Cruise | Plug leaks and pump water before the ship docks |
| 8 | Final – New Year's Showdown | Downhill ski chase, avalanche, giant tree |
| 9 | Finale | Fireworks and the end |

## Controls
`WASD`/arrows move · `Space` jump (double jump in mid-air) · `E` interact/plug/pump · `Q`/`E` rotate camera in platforming levels · runner levels: `A`/`D` lanes, `Space` jump, `S` slide · `Esc` pause · `R` restart · `M` mute. Touch controls appear on touch devices.

## Run locally
ES modules need an HTTP server (opening the file directly will not work):

```sh
python -m http.server 8000
# then open http://localhost:8000
```

`index.html` is the website, `play.html` is the game. Add `?level=N` (0–8) to `play.html` to jump to a level.

## Project layout
```
index.html, css/site.css     marketing website
play.html,  css/game.css     game shell + HUD
js/main.js                   game loop, menus, progress (localStorage)
js/levels.js                 level data and story text
js/platformer.js             3D platformer engine (AABB collisions, moving platforms, hazards)
js/runner.js                 3-lane chase engine (highway, museum, ski)
js/arena.js                  boss fight
js/ship.js                   leak-plugging puzzle
js/ending.js                 finale scene
js/common.js, audio.js, ui.js  helpers; procedural characters and WebAudio sfx
```

## Deploy
Pushing to `main` deploys the site with GitHub Pages via `.github/workflows/pages.yml`
(Settings → Pages → Source: **GitHub Actions**).

## Credits and legal
Unofficial, non-commercial fan tribute. "Nu, pogodi!" and its characters belong to their respective rights holders.
All code, models and sounds here are original (procedurally generated). Code is MIT licensed, see `LICENSE`.
