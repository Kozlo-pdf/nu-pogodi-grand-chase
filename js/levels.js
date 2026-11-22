import { Arena } from './arena.js';
import { Runner } from './runner.js';
import { Ship } from './ship.js';
import { Ending } from './ending.js';
import {
  balcony, fairground, construction, highwayObstacle, highwayScenery, museumObstacle, museumScenery,
  skiObstacle, skiScenery, PLAT_CONTROLS, RUN_CONTROLS,
} from './builders.js';
import { circus, beach, village, metro, bigTopBoss } from './levels2.js';

export const LEVELS = [
  {
    act: 'Act 1 · The Urban Pursuit', title: 'Prologue – The Balcony Escape',
    intro: 'A sunny morning. The Hare is watering his flowers when the Wolf spots him from the street and fires a grappling hook! Hop across the neighbouring balconies – a long way, past crumbling ledges and swinging hooks – and snip the Wolf\'s line.',
    controls: PLAT_CONTROLS,
    outro: 'Snip! The Wolf crashes straight onto the Hippo policeman\'s motorcycle. "Nu, zayats, nu, pogodi!" The Hare dashes into the amusement park…',
    make: balcony,
  },
  {
    act: 'Act 1 · The Urban Pursuit', title: 'Chapter 1 – Trouble at the Fairground',
    intro: 'Collect four golden tickets to ride the exit tram: one in the Hall of Mirrors, one on the shooting-gallery stand, one at the top of the Ferris wheel and one on the carousel roof. Watch out for the Wolf\'s rolling traps and the bumper cars!',
    controls: PLAT_CONTROLS,
    outro: 'Four tickets punched! But the Wolf has hijacked the magic stage show…',
    make: fairground,
  },
  {
    act: 'Act 1 · Boss Encounter', title: 'The Magician\'s Stage',
    intro: 'On the open-air magic stage, pull the levers to open the magician\'s box, then lure the Wolf onto the glowing pad. Trap him four times to launch him out of the park!',
    controls: 'WASD / Arrows: run  •  E: pull a lever  •  Touch the Wolf and you lose a heart',
    outro: 'BOOM! The Wolf shoots out of the park, spinning like a firework. The Hare grabs his bicycle…',
    make: (ctx) => new Arena(ctx, { need: 4, speed: 5.3 }),
  },
  {
    act: 'Act 2 · Chaos in Transit', title: 'Chapter 2 – Highway Mayhem',
    intro: 'The Hare pedals toward the train station while the Wolf pursues him on a stolen motorcycle, then a sports car, and finally a runaway steamroller. Dodge, jump and slide!',
    controls: RUN_CONTROLS,
    outro: 'The steamroller flips over and the Wolf vanishes in a cloud of dust! The Hare ducks into the metro…',
    make: (ctx) => new Runner(ctx, {
      sky: 0x9fd6ff, ground: 0x3d3d44, side: 0x6aa84f, length: 1050, seed: 11,
      speed0: 14, speed1: 19, player: 'bike', hint: 'The Wolf is right behind you! Jump the barriers, slide under signs, and swerve around cars.',
      phases: [
        { at: 0, kind: 'motorcycle' },
        { at: 0.34, kind: 'car', msg: 'The Wolf swaps to a sports car!' },
        { at: 0.67, kind: 'steamroller', msg: 'A runaway STEAMROLLER!' },
      ],
      makeObstacle: highwayObstacle, scenery: highwayScenery, finishMsg: 'The Wolf lost control!', caught: 'The Wolf caught you! Nu, zayats…',
    }),
  },
  {
    act: 'Act 2 · Chaos in Transit', title: 'Chapter 2a – The Metro Tunnel',
    intro: 'Underground! The Wolf dashes after the Hare through a dark metro tunnel, and then he hijacks a subway train. Jump the turnstiles, slide under the pipes and dodge the parked carriages.',
    controls: RUN_CONTROLS,
    outro: 'The train derails into the tunnel wall. The Hare pops out of the station right next to a building site…',
    make: metro,
  },
  {
    act: 'Act 2 · Chaos in Transit', title: 'Chapter 2b – Construction Site',
    intro: 'The shortcut to the station runs across a very tall high-rise construction site. Leap between girders, ride the crane platforms and time your jumps past the wrecking balls. It\'s a long climb!',
    controls: PLAT_CONTROLS,
    outro: 'A pile of bricks tumbles down. The Hare dives into the nearest tent: a travelling circus!',
    make: construction,
  },
  {
    act: 'Act 2 · The Circus', title: 'Chapter 2c – Under the Big Top',
    intro: 'Cross the circus rafters: tightropes, crumbling planks, moving platforms and swinging trapezes. Platforms with pale tops crumble if you stand on them too long!',
    controls: PLAT_CONTROLS,
    outro: 'The Hare reaches the ring – and so does the Wolf, wearing a ringmaster\'s hat…',
    make: circus,
  },
  {
    act: 'Act 2 · Boss Encounter', title: 'Showdown at the Big Top',
    intro: 'The Wolf is the ringmaster now, and he is faster and angrier. Four levers, a smaller window of time and five tricks needed. Pull a lever, then lure him over the glowing pad!',
    controls: 'WASD / Arrows: run  •  E: pull a lever  •  Touch the Wolf and you lose a heart',
    outro: 'The Wolf flies through the canvas roof and lands in a hospital bed. Everything goes dark…',
    make: bigTopBoss,
  },
  {
    act: 'Act 2 · Interlude', title: 'Interlude – The Hospital Nightmare',
    intro: 'Knocked out by falling bricks, the Wolf dreams of a surreal, upside-down museum. For this short segment YOU are the Wolf, running from a giant, terrifying Robot Hare through rolling cannons and walking armour!',
    controls: RUN_CONTROLS,
    outro: 'The Wolf wakes up in a cold sweat. Where is that Hare? On the beach, of course!',
    make: (ctx) => new Runner(ctx, {
      sky: 0x4a2a78, ground: 0x9a7bc9, side: 0x2a1a44, line: 0xffe38a, length: 800, seed: 23,
      speed0: 14, speed1: 18, player: 'wolf', wobble: true, gap0: 13, hitPenalty: 4.5,
      hint: 'You are the WOLF now! Escape the giant Robot Hare!', progressLabel: 'Wake-up',
      phases: [{ at: 0, kind: 'robot' }], makeObstacle: museumObstacle, scenery: museumScenery,
      light: { sky: 0xffb3f0, ground: 0x442266, sun: 0xffd0ff },
      finishMsg: 'You wake up! Phew…', caught: 'The Robot Hare got you! (It was only a dream… maybe.)',
    }),
  },
  {
    act: 'Act 3 · The Winter Finale', title: 'Chapter 3a – The Boardwalk',
    intro: 'A sunny seaside boardwalk on the way to the harbour. Bounce on the pink umbrellas to reach the high piers, hop across the floating rafts, and don\'t fall in the water!',
    controls: PLAT_CONTROLS,
    outro: 'The Hare slips aboard the winter cruise ship. The Wolf sneaks on right behind him…',
    make: beach,
  },
  {
    act: 'Act 3 · The Winter Finale', title: 'Chapter 3b – The Sea Cruise',
    intro: 'When the Wolf accidentally punches a hole in the hull, the Hare must plug the leaks and pump out the freezing water before the ship docks. This voyage is a long one, and the Wolf will not stop!',
    controls: 'WASD / Arrows: move  •  Hold E: plug a leak (stand next to it) or work the pump (stand next to it)',
    outro: 'The ship scrapes into the snowy harbour just in time. A little mountain village glitters ahead…',
    make: (ctx) => new Ship(ctx, { duration: 85, interval: 5.8 }),
  },
  {
    act: 'Act 3 · The Winter Finale', title: 'Chapter 3c – The Snowy Village',
    intro: 'The village is covered in ice! You slide when you run and are slow to stop. Watch the thin ice (pale platforms crumble), the rolling snowballs, and the edges.',
    controls: PLAT_CONTROLS,
    outro: 'The concert stage is just up the hill. It is almost midnight!',
    make: village,
  },
  {
    act: 'Act 3 · Final Chapter', title: 'The New Year\'s Showdown',
    intro: 'Reach the main concert stage before midnight! The Wolf has disguised himself as Snow Maiden (Snegurochka) and ambushes you on the ski slopes. Survive the downhill run and the avalanche will do the rest.',
    controls: RUN_CONTROLS,
    outro: 'The Wolf crashes straight into the giant New Year\'s tree and ends up tangled in fairy lights like a star!',
    make: (ctx) => new Runner(ctx, {
      sky: 0xcfe8ff, ground: 0xf7faff, side: 0xe3eefa, line: 0xaac4e6, length: 1000, seed: 41, slope: 0.17,
      speed0: 17, speed1: 23, player: 'ski', light: { hemi: 1.9, intensity: 1.4 }, hint: 'Downhill! Snegurochka is… suspiciously hairy.',
      phases: [{ at: 0, kind: 'wolfdress' }], makeObstacle: skiObstacle, scenery: skiScenery, finish: 'avalanche',
      progressLabel: 'Slope', caught: 'Snegurochka caught you! Nu, zayats…',
    }),
  },
  {
    act: 'Finale', title: 'Happy New Year!',
    intro: 'Fireworks light up the sky. Sit back and enjoy the show.',
    controls: '',
    outro: 'The Hare sings the classic New Year\'s song to a cheering crowd while the defeated Wolf shakes his fist from the top of the tree: "Nu, zayats, nu, pogodi!"\n\nThe End.',
    ending: true,
    make: (ctx) => new Ending(ctx),
  },
];
