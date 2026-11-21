import {
  THREE, isDown, box, cyl, sph, cone, mat, mesh, addLights, followSun,
  makeHare, makeWolf, animateLimbs, lerpAngle, damp, clamp,
} from './common.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const SPOTS = [
  [-5.5, 1.2, -5.2], [-1.5, 1.6, -5.2], [3, 0.9, -5.2], [6.2, 1.4, -5.2],
  [-8.4, 1.0, -1.5], [8.4, 1.1, 0.5], [-3, 0.05, 1], [4, 0.05, 2.5],
];

/** Chapter 3a: the Wolf keeps punching holes in the hull. Plug leaks, pump water, reach the harbour. */
export class Ship {
  constructor(ctx, cfg) {
    this.ctx = ctx; this.cfg = cfg;
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9cc7e6);
    scene.fog = new THREE.Fog(0x9cc7e6, 40, 120);
    this.sun = addLights(scene, { sky: 0xe6f4ff, ground: 0x446688, intensity: 1.0 });
    followSun(this.sun, new THREE.Vector3());

    // sea + distant snowy mountains
    this.sea = box(300, 1, 300, mat(0x2a6fa8)); this.sea.position.y = -1.4; this.sea.castShadow = false; scene.add(this.sea);
    for (let i = 0; i < 9; i++) {
      const m = cone(14 + (i % 3) * 5, 22 + (i % 4) * 6, 0xdde8f2, 6); m.position.set(-90 + i * 24, 8, -90 - (i % 2) * 20); m.castShadow = false; scene.add(m);
    }

    const room = this.room = new THREE.Group(); scene.add(room);
    const floor = box(18, 0.5, 11.4, 0x9b6f43); floor.position.y = -0.25; room.add(floor);
    const back = box(18.8, 4.2, 0.5, 0x6b4a32); back.position.set(0, 2, -5.9); room.add(back);
    for (const s of [-1, 1]) { const w = box(0.5, 4.2, 11.6, 0x6b4a32); w.position.set(s * 9.15, 2, 0); room.add(w); }
    // portholes
    for (const x of [-6, 0, 6]) {
      const p = cyl(0.5, 0.5, 0.2, mat(0xaee0ff, 0x335566), 16); p.rotation.x = Math.PI / 2; p.position.set(x, 3.2, -5.6); room.add(p);
    }
    this.water = box(17.6, 1, 10.8, mat(0x2d8fd8, 0x103050, { transparent: true, opacity: 0.55 }));
    this.water.castShadow = false; this.water.receiveShadow = false; room.add(this.water);

    // pump
    this.pump = new THREE.Group();
    this.pump.add(cyl(0.7, 0.8, 0.5, 0x555b66, 14));
    const col = cyl(0.25, 0.25, 2, 0x8f98a6, 10); col.position.y = 1.2; this.pump.add(col);
    this.handle = box(1.6, 0.14, 0.14, 0xe0b030); this.handle.position.y = 2.3; this.pump.add(this.handle);
    this.pump.position.set(-7.4, 0.25, 3.6); room.add(this.pump);
    this.pumpPos = new THREE.Vector3(-7.4, 0, 3.6);

    // leaks
    this.leaks = SPOTS.map(([x, y, z]) => {
      const g = new THREE.Group();
      const hole = sph(0.42, 0x1a1410, 10); hole.scale.z = 0.5;
      const jet = cyl(0.1, 0.22, 1.4, mat(0x9fdcff, 0x2266aa, { transparent: true, opacity: 0.7 }), 8);
      jet.position.set(0, -0.2, 0.6); jet.rotation.x = Math.PI / 2.6; jet.castShadow = false;
      const cork = cyl(0.3, 0.3, 0.3, 0xb8864b, 10); cork.rotation.x = Math.PI / 2;
      g.add(hole, jet, cork);
      if (z > -5) { g.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; if (y < 0.1) { hole.scale.set(1, 0.2, 1); jet.rotation.x = 0; jet.position.set(0, 0.6, 0); jet.scale.set(1, 1, 1); } }
      g.position.set(x, y, z); room.add(g);
      const l = { g, hole, jet, cork, state: 'closed', prog: 0, pos: new THREE.Vector3(x, 0, z), edge: z < -4 ? 'back' : 'side' };
      hole.visible = false; jet.visible = false; cork.visible = false;
      return l;
    });

    this.hare = makeHare(); this.hare.position.set(0, 0, 3); room.add(this.hare);
    this.wolf = makeWolf({ scale: 0.95 }); this.wolf.position.set(4, 0, -2); room.add(this.wolf);
    this.pos = new THREE.Vector3(0, 0, 3);
    this.wpos = new THREE.Vector3(4, 0, -2);
    this.face = 0; this.wface = 0;

    this.time = 0; this.dur = cfg.duration ?? 55;
    this.waterLvl = 0.12; this.wTarget = null; this.wWait = 3; this.punch = 0; this.interval = 6.2;
    this.t = 0; this.phase = 0; this.over = false;
    this.pumping = false; this.working = null;
    ui.toast('The Wolf is punching holes! Plug leaks and pump out the water until the ship docks!', 5000);
    this.update(0.001);
  }

  openCount() { return this.leaks.filter((l) => l.state === 'open').length; }

  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt; const t = this.t;
    if (this.over) return;
    this.time += dt;

    // rocking
    this.room.rotation.z = Math.sin(t * 1.2) * 0.035;
    this.room.rotation.x = Math.sin(t * 0.8) * 0.02;
    this.room.position.y = Math.sin(t * 1.7) * 0.1;
    this.sea.position.y = -1.4 + Math.sin(t * 0.9) * 0.15;

    // move hare
    const ix = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const iz = (isDown('KeyS', 'ArrowDown') ? 1 : 0) - (isDown('KeyW', 'ArrowUp') ? 1 : 0);
    const len = Math.hypot(ix, iz);
    const act = isDown('KeyE', 'Space', 'Enter', 'KeyF');
    const sp = 6.4 * (1 - this.waterLvl * 0.45);
    if (len > 0 && !(act && this.working)) {
      this.pos.x = clamp(this.pos.x + (ix / len) * sp * dt, -8.3, 8.3);
      this.pos.z = clamp(this.pos.z + (iz / len) * sp * dt, -4.6, 4.8);
      this.face = lerpAngle(this.face, Math.atan2(ix, iz), damp(16, dt));
    }

    // wolf AI
    this.wolfAI(dt);

    // actions: plug nearest open leak, else pump
    let nearLeak = null, nd = 2.0;
    for (const l of this.leaks) {
      if (l.state !== 'open') continue;
      const d = Math.hypot(this.pos.x - l.pos.x, this.pos.z - l.pos.z);
      if (d < nd) { nd = d; nearLeak = l; }
    }
    const nearPump = Math.hypot(this.pos.x - this.pumpPos.x, this.pos.z - this.pumpPos.z) < 2.0;
    this.working = null; this.pumping = false;
    if (nearLeak) {
      this.working = 'plug';
      ui.hint(act ? 'Plugging…' : 'Hold E to plug the leak!');
      if (act) {
        nearLeak.prog += dt / 0.85;
        if (Math.floor(t * 10) % 3 === 0) sfx.plug();
        if (nearLeak.prog >= 1) { nearLeak.state = 'plugged'; nearLeak.prog = 0; nearLeak.jet.visible = false; nearLeak.cork.visible = true; sfx.pop(); ui.toast('Plugged!', 900); }
      } else nearLeak.prog = Math.max(0, nearLeak.prog - dt);
    } else if (nearPump) {
      this.working = 'pump';
      ui.hint(act ? 'Pumping!' : 'Hold E to pump out the water!');
      if (act) { this.pumping = true; if (Math.floor(t * 8) % 2 === 0) sfx.pump(); }
    } else ui.hint(null);

    // water
    const inflow = this.openCount() * 0.0165;
    const outflow = this.pumping ? 0.085 : 0;
    this.waterLvl = clamp(this.waterLvl + (inflow - outflow) * dt, 0, 1.05);
    const h = Math.max(0.02, this.waterLvl * 3.4);
    this.water.scale.y = h; this.water.position.y = h / 2;
    this.handle.position.y = 2.3 + (this.pumping ? Math.sin(t * 16) * 0.25 : 0);
    for (const l of this.leaks) if (l.state === 'open') l.jet.scale.y = 0.8 + Math.sin(t * 20 + l.pos.x) * 0.15;

    // meshes
    this.hare.position.copy(this.pos); this.hare.rotation.y = this.face;
    animateLimbs(this.hare, t * 12, len > 0 && !this.working ? 0.9 : 0.05);
    if (this.working && act) { this.hare.userData.armL.rotation.x = -1.2 + Math.sin(t * 18) * 0.6; this.hare.userData.armR.rotation.x = -1.2 - Math.sin(t * 18) * 0.6; }
    this.wolf.position.copy(this.wpos); this.wolf.rotation.y = this.wface;

    // HUD
    ui.bar('a', 'Harbour', this.time / this.dur);
    ui.bar('b', 'Water level', this.waterLvl, this.waterLvl > 0.7);
    ui.info(`🕳 Open leaks <b>${this.openCount()}</b>`);

    // camera
    const cam = this.ctx.camera;
    cam.position.set(0, 10.5, 13.5); cam.lookAt(0, 1.2, 0.5);

    if (this.waterLvl >= 1) { this.over = true; ui.hint(null); ui.bar('a', null); ui.bar('b', null); this.ctx.lose('Glub glub! The cabin filled with water. Nu, zayats…'); }
    else if (this.time >= this.dur) { this.over = true; ui.hint(null); ui.bar('a', null); ui.bar('b', null); this.ctx.win(); }
  }

  wolfAI(dt) {
    const w = this.wpos;
    if (this.phase === 0) { // waiting
      this.wWait -= dt;
      animateLimbs(this.wolf, 0, 0.05);
      if (this.wWait <= 0) {
        const free = this.leaks.filter((l) => l.state !== 'open');
        if (free.length === 0) { this.wWait = 2; return; }
        this.wTarget = free[Math.floor(Math.random() * free.length)];
        this.phase = 1;
      }
    } else if (this.phase === 1) { // walking to spot
      const tp = this.wTarget.pos;
      const stand = new THREE.Vector3(tp.x, 0, tp.z + (this.wTarget.edge === 'back' ? 1.1 : 0));
      if (this.wTarget.edge === 'side') stand.x = tp.x + (tp.x < 0 ? 1.1 : -1.1);
      const dx = stand.x - w.x, dz = stand.z - w.z, d = Math.hypot(dx, dz);
      if (d < 0.25) { this.phase = 2; this.punch = 0.7; this.wface = Math.atan2(tp.x - w.x, tp.z - w.z - (this.wTarget.edge === 'back' ? 1 : 0)); }
      else {
        w.x += dx / d * 4.2 * dt; w.z += dz / d * 4.2 * dt;
        this.wface = lerpAngle(this.wface, Math.atan2(dx, dz), damp(12, dt));
        animateLimbs(this.wolf, this.t * 11, 0.8);
      }
    } else if (this.phase === 2) { // punching
      this.punch -= dt;
      this.wolf.userData.armR.rotation.x = -1.6 + Math.sin(this.punch * 30) * 0.8;
      if (this.punch <= 0) {
        const l = this.wTarget;
        l.state = 'open'; l.prog = 0; l.hole.visible = true; l.jet.visible = true; l.cork.visible = false;
        sfx.boom(); ui.toast(['Wolf: "Oops!"', 'BONK! Another hole!', 'Wolf: "It was an accident!"', 'CRACK! Leak!'][Math.floor(Math.random() * 4)], 1400);
        this.phase = 0;
        this.interval = Math.max(3.4, this.interval - 0.25);
        this.wWait = this.interval;
      }
    }
  }
}
