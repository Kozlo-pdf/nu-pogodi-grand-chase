import {
  THREE, isDown, wasHit, box, cyl, sph, cone, mat, mesh, addLights, followSun, noShadow,
  makeHare, makeWolf, makeRobotHare, makeWheel, animateLimbs, mulberry32, damp, clamp, lerp,
} from './common.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const LW = 3.2; // lane width

/** Three-lane endless-runner style chase (highway, museum nightmare, ski finale). */
export class Runner {
  constructor(ctx, cfg) {
    this.ctx = ctx; this.cfg = cfg;
    const L = this.L = cfg.length;
    const rng = this.rng = mulberry32(cfg.seed ?? 7);
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(cfg.sky);
    scene.fog = new THREE.Fog(cfg.sky, 40, 150);
    this.sun = addLights(scene, cfg.light);
    this.world = new THREE.Group(); scene.add(this.world);
    this.world.rotation.x = -(cfg.slope || 0);
    const W = this.world;

    const zLen = L + 320, zMid = (40 - (L + 280)) / 2;
    const ground = box(LW * 3 + 1.6, 1, zLen, cfg.ground); ground.position.set(0, -0.5, zMid); ground.castShadow = false; W.add(ground);
    const side = box(260, 1, zLen, cfg.side); side.position.set(0, -0.62, zMid); side.castShadow = false; W.add(side);
    if (cfg.ceiling) { const ce = box(120, 1, zLen, cfg.ceiling); ce.position.set(0, 10.5, zMid); ce.castShadow = false; W.add(ce); }
    for (const x of [-LW / 2, LW / 2]) {
      const line = box(0.1, 0.05, zLen, cfg.line ?? 0xffffff); line.position.set(x, 0.02, zMid); line.castShadow = false; W.add(line);
    }

    // scenery
    for (let z = 30; z > -(L + 160); z -= cfg.sceneryStep ?? 13) {
      for (const s of [-1, 1]) {
        const o = cfg.scenery(rng, s);
        o.position.x = s * (LW * 1.5 + 3.5 + rng() * 15);
        o.position.z = z - rng() * 6;
        noShadow(o);
        W.add(o);
      }
    }

    // obstacles + coins
    this.obs = []; this.coins = [];
    let z = -50;
    while (z > -(L - 40)) {
      const prog = -z / L, r = rng();
      const kind = r < 0.4 ? 'low' : r < 0.65 ? 'high' : 'wall';
      let lanes;
      if (kind === 'high') lanes = [0, 1, 2];
      else if (kind === 'low') lanes = rng() < 0.5 ? [Math.floor(rng() * 3)] : [0, 1, 2].filter((i) => i !== Math.floor(rng() * 3));
      else { const free = Math.floor(rng() * 3); lanes = [0, 1, 2].filter((i) => i !== free); }
      if (kind === 'high') {
        const m = cfg.makeObstacle('high', rng, LW * 3); m.position.set(0, 0, z); W.add(m);
      } else {
        for (const ln of lanes) { const m = cfg.makeObstacle(kind, rng, LW - 0.8); m.position.set((ln - 1) * LW, 0, z); W.add(m); }
      }
      this.obs.push({ z, kind, lanes });
      // coin line after the obstacle
      const cl = Math.floor(rng() * 3);
      for (let i = 0; i < 4; i++) {
        const c = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 14), mat(0xffd23f, 0x775500)); c.rotation.z = Math.PI / 2;
        c.position.set((cl - 1) * LW, 1.1, z - 4 - i * 2); c.castShadow = false; W.add(c);
        this.coins.push({ m: c, x: (cl - 1) * LW, z: z - 4 - i * 2, got: false });
      }
      z -= 16 + rng() * 9 - prog * 3;
    }

    // finish props
    this.finishing = false; this.ft = 0;
    if (cfg.finish === 'avalanche') this.buildTree(-(L + 58));

    // player
    this.rider = this.buildRider(cfg.player);
    W.add(this.rider.group);
    this.p = { x: 0, y: 0, z: 0, vy: 0, lane: 1, duck: 0 };
    this.speed = cfg.speed0; this.stumble = 0; this.invuln = 0;
    this.gap = cfg.gap0 ?? 12; this.hits = 0; this.score = 0; this.t = 0;
    this.chaser = null; this.phaseIdx = -1;
    this.chaserX = 0;
    this.camFocus = 0;
    this.wob = 0;
    this.updateHud();
    this.updatePhase(0);
    this.layout(0);
    this.camera(true, 0);
    ui.toast(cfg.hint ?? '', 4000);
  }

  /* ---------- builders ---------- */
  buildRider(kind) {
    const group = new THREE.Group(); let inner, wheels = [];
    if (kind === 'wolf') inner = makeWolf();
    else inner = makeHare();
    inner.rotation.y = Math.PI;
    group.add(inner);
    if (kind === 'bike') {
      inner.position.y = 0.38; inner.scale.setScalar(0.82);
      const w1 = makeWheel(0.4), w2 = makeWheel(0.4);
      w1.position.z = -0.65; w2.position.z = 0.65;
      const frame = box(0.07, 0.07, 1.3, 0xd43a3a); frame.position.y = 0.62;
      const bar = box(0.8, 0.06, 0.06, 0x333333); bar.position.set(0, 1.0, -0.62);
      const post = box(0.06, 0.45, 0.06, 0x333333); post.position.set(0, 0.8, -0.62);
      group.add(w1, w2, frame, bar, post); wheels = [w1, w2];
    } else if (kind === 'ski') {
      inner.position.y = 0.07;
      for (const s of [-1, 1]) { const sk = box(0.18, 0.07, 1.9, 0xd43a3a); sk.position.set(s * 0.22, 0.035, 0); group.add(sk); }
    }
    return { group, inner, wheels, kind };
  }

  setChaser(kind) {
    if (this.chaser) this.world.remove(this.chaser.g);
    const g = new THREE.Group(); const c = { g, kind, wheels: [], anim: null };
    const wolfOn = (y, z, sc) => { const w = makeWolf({ scale: sc }); w.rotation.y = Math.PI; w.position.set(0, y, z); g.add(w); return w; };
    if (kind === 'motorcycle') {
      const w1 = makeWheel(0.42), w2 = makeWheel(0.42); w1.position.z = -0.75; w2.position.z = 0.75;
      const body = box(0.55, 0.45, 1.6, 0xc0392b); body.position.y = 0.75;
      const lamp = sph(0.2, mat(0xffffcc, 0xaaaa44), 8); lamp.position.set(0, 1.0, -0.95);
      g.add(w1, w2, body, lamp); c.wheels = [w1, w2]; wolfOn(0.55, 0.15, 0.9);
    } else if (kind === 'car') {
      const body = box(2.1, 0.7, 4, 0xd8232a); body.position.y = 0.75;
      const wind = box(1.7, 0.5, 0.1, 0x9fdcff); wind.position.set(0, 1.35, -0.55); wind.rotation.x = -0.4;
      g.add(body, wind);
      for (const sx of [-1, 1]) for (const sz of [-1.3, 1.3]) { const w = makeWheel(0.42); w.position.set(sx * 1.1, 0, sz); g.add(w); c.wheels.push(w); }
      for (const sx of [-1, 1]) { const l = sph(0.22, mat(0xffffcc, 0xaaaa44), 8); l.position.set(sx * 0.7, 0.85, -2.0); g.add(l); }
      wolfOn(0.85, 0.5, 0.8);
    } else if (kind === 'steamroller') {
      const body = box(2.5, 1.5, 3.4, 0xf0b400); body.position.set(0, 1.6, 0.6);
      const cab = box(2.1, 0.12, 1.6, 0x6b4f00); cab.position.set(0, 3.0, 1.0);
      const roller = cyl(1.15, 1.15, 2.8, 0x8a8a8a, 20); roller.rotation.z = Math.PI / 2; roller.position.set(0, 1.15, -1.7);
      const pipe = cyl(0.15, 0.15, 1.2, 0x333333, 8); pipe.position.set(0.8, 3.0, 0.2);
      g.add(body, cab, roller, pipe); c.wheels = [roller];
      for (const sx of [-1, 1]) { const w = makeWheel(1.1); w.position.set(sx * 1.4, 0, 1.4); g.add(w); c.wheels.push(w); }
      wolfOn(2.1, 1.1, 0.9);
    } else if (kind === 'train') {
      const body = box(3.4, 3.2, 9, 0x2a64b8); body.position.set(0, 1.9, 2);
      const stripe = box(3.45, 0.5, 9.05, 0xffffff); stripe.position.set(0, 1.5, 2);
      const win = box(3.5, 0.9, 7, 0x9fdcff); win.position.set(0, 2.5, 2.3);
      g.add(body, stripe, win);
      for (const sx of [-1, 1]) { const l = sph(0.28, mat(0xffffcc, 0xffffaa), 8); l.position.set(sx * 1.0, 1.3, -2.55); g.add(l); }
      wolfOn(3.5, 0.5, 0.9);
    } else if (kind === 'robot') {
      const r = makeRobotHare(); r.scale.setScalar(2.6); r.rotation.y = Math.PI; g.add(r); c.anim = r;
    } else if (kind === 'wolfdress') {
      const w = makeWolf({ dress: true, scale: 1.05 }); w.rotation.y = Math.PI; w.position.y = 0.07; g.add(w); c.anim = w;
      for (const s of [-1, 1]) { const sk = box(0.2, 0.07, 2.0, 0xe23a3a); sk.position.set(s * 0.26, 0.035, 0); g.add(sk); }
    } else { // plain wolf
      const w = makeWolf(); w.rotation.y = Math.PI; g.add(w); c.anim = w;
    }
    this.world.add(g); this.chaser = c;
    noShadowSkip(g);
  }

  buildTree(z) {
    const g = new THREE.Group();
    const trunk = cyl(0.8, 1.0, 3, 0x5b3a21, 10); trunk.position.y = 1.5; g.add(trunk);
    for (let i = 0; i < 5; i++) { const c = cone(6.5 - i * 1.15, 5, 0x1f7a3a, 14); c.position.y = 4.5 + i * 3.2; g.add(c); }
    const star = sph(0.9, mat(0xffe14d, 0xaa8800), 8); star.position.y = 21.5; g.add(star);
    this.lights = [];
    for (let i = 0; i < 40; i++) {
      const y = 3 + Math.random() * 16, rad = Math.max(0.5, 6.6 - (y - 3) * 0.37);
      const a = Math.random() * Math.PI * 2;
      const b = sph(0.22, mat([0xff4455, 0xffdd44, 0x55ddff, 0x66ff88][i % 4], 0x444444), 6);
      b.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); g.add(b); this.lights.push(b);
    }
    g.position.set(0, 0, z); this.world.add(g); this.tree = g; this.treeZ = z;
    this.lightsOn = false;
  }

  updatePhase(prog) {
    const ph = this.cfg.phases; let idx = 0;
    for (let i = 0; i < ph.length; i++) if (prog >= ph[i].at) idx = i;
    if (idx !== this.phaseIdx) {
      this.phaseIdx = idx; this.setChaser(ph[idx].kind);
      if (ph[idx].msg && this.t > 0.1) ui.toast(ph[idx].msg, 3000);
    }
  }

  updateHud() {
    ui.info(`🪙 <b>${this.score}</b> &nbsp; 💥 Hits <b>${this.hits}</b>`);
  }

  /* ---------- update ---------- */
  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt;
    const cfg = this.cfg, p = this.p;
    const prog = clamp(-p.z / this.L, 0, 1);
    this.invuln = Math.max(0, this.invuln - dt);
    this.stumble = Math.max(0, this.stumble - dt);

    if (!this.finishing) {
      // lane change
      if (wasHit('KeyA', 'ArrowLeft')) p.lane = Math.max(0, p.lane - 1);
      if (wasHit('KeyD', 'ArrowRight')) p.lane = Math.min(2, p.lane + 1);
      // jump / duck
      const onGround = p.y <= 0.001 && p.vy <= 0;
      if (wasHit('Space', 'KeyW', 'ArrowUp') && onGround) { p.vy = 11.2; p.duck = 0; sfx.jump(); }
      if (wasHit('KeyS', 'ArrowDown')) { if (onGround) p.duck = 0.75; else p.vy = Math.min(p.vy, -14); }
      p.duck = Math.max(0, p.duck - dt);
      p.vy -= 30 * dt; p.y += p.vy * dt;
      if (p.y < 0) { p.y = 0; p.vy = 0; }

      const target = lerp(cfg.speed0, cfg.speed1, prog);
      const goal = this.stumble > 0 ? target * 0.55 : target;
      this.speed += (goal - this.speed) * damp(3, dt);
    } else {
      this.speed += (0 - this.speed) * damp(1.6, dt);
      p.vy -= 30 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0;
    }
    p.z -= this.speed * dt;
    p.x += ((p.lane - 1) * LW - p.x) * damp(14, dt);

    // collisions
    const ducking = p.duck > 0 && p.y <= 0.05;
    if (!this.finishing && this.invuln <= 0) {
      for (const o of this.obs) {
        if (Math.abs(o.z - p.z) > 1.05) continue;
        let hitL = false;
        for (const ln of o.lanes) if (Math.abs(p.x - (ln - 1) * LW) < 1.45) hitL = true;
        if (!hitL) continue;
        const bad = o.kind === 'low' ? p.y < 1.0 : o.kind === 'high' ? !ducking : true;
        if (bad) { this.hit(); break; }
      }
    }
    for (const c of this.coins) {
      if (c.got) continue;
      c.m.rotation.x += dt * 4;
      if (Math.abs(c.z - p.z) < 1.0 && Math.abs(c.x - p.x) < 1.2 && Math.abs(1.1 - (p.y + 0.9)) < 1.3) {
        c.got = true; c.m.visible = false; this.score++; this.gap = Math.min(cfg.gapMax ?? 15, this.gap + 0.25); sfx.coin(); this.updateHud();
      }
    }

    // chaser
    if (!this.finishing) {
      this.gap = Math.min(cfg.gapMax ?? 15, this.gap + dt * (cfg.gapRegen ?? 0.45));
      if (this.gap <= 2.2) { this.ctx.lose(cfg.caught ?? 'Caught!'); this.finishing = 'lost'; }
    }
    if (this.finishing !== 'lost') this.updatePhase(prog);
    this.updateChaser(dt);

    // progress
    ui.bar('a', cfg.progressLabel ?? 'Progress', prog);
    ui.bar('b', 'Chaser distance', (this.gap - 2.2) / ((cfg.gapMax ?? 15) - 2.2), this.gap < 6);

    if (prog >= 1 && !this.finishing) this.startFinish();
    if (this.finishing === true) this.updateFinish(dt);

    this.layout(dt);
    this.camera(false, dt);
    const wp = new THREE.Vector3(); this.rider.group.getWorldPosition(wp);
    followSun(this.sun, wp);
  }

  hit() {
    this.hits++; this.invuln = 1.3; this.stumble = 0.9; this.gap -= this.cfg.hitPenalty ?? 4;
    sfx.hit(); this.updateHud();
    ui.toast(this.gap < 6 ? 'He\'s right behind you!' : 'Ouch!', 1000);
    this.shake = 0.4;
  }

  startFinish() {
    this.finishing = true; this.ft = 0; this.fin = 0;
    ui.bar('a', null); ui.bar('b', null);
    if (this.cfg.finish === 'avalanche') {
      this.wave = box(10, 6, 14, mat(0xffffff, 0x445566, { transparent: true, opacity: 0.92 }));
      this.wave.position.set(11, 3, this.p.z + 55); this.world.add(this.wave);
      ui.toast('⛰ The slope shakes... AVALANCHE!', 3500); sfx.boom();
    } else {
      ui.toast(this.cfg.finishMsg ?? 'You lost him!', 3000);
    }
  }

  updateFinish(dt) {
    this.ft += dt; const c = this.chaser.g;
    if (this.cfg.finish === 'avalanche') {
      this.wave.position.z -= 36 * dt;
      this.wave.position.x = lerp(this.wave.position.x, 4, damp(0.6, dt));
      if (this.fin === 0) {
        // wolf overtakes and heads straight for the big tree
        c.position.z -= 24 * dt;
        this.chaserX += (0 - this.chaserX) * damp(3, dt);
        if (c.position.z <= this.treeZ + 5) { this.fin = 1; this.ft = 0; sfx.boom(); ui.toast('🎄 CRASH! Tangled in the fairy lights!', 3500); }
      } else {
        c.position.z = this.treeZ + 5; c.position.y = 12; c.rotation.z = lerp(c.rotation.z, 0.5, damp(4, dt));
        c.rotation.x = lerp(c.rotation.x, -0.4, damp(4, dt));
        this.wave.scale.multiplyScalar(1 - dt * 0.9);
        this.tree.children.forEach((b, i) => { if (b.material && i > 6) b.material = mat([0xff4455, 0xffdd44, 0x55ddff, 0x66ff88][(i + Math.floor(this.ft * 6)) % 4], 0x888888); });
        if (this.ft > 2.8) { this.finishing = 'done'; this.ctx.win(); }
      }
      this.camFocus = lerp(this.camFocus, 1, damp(1.5, dt));
    } else {
      this.chaser.g.rotation.z += 5 * dt; this.chaser.g.position.y += 7 * dt; this.chaser.g.position.z += -2 * dt;
      if (this.ft > 2.4) { this.finishing = 'done'; this.ctx.win(); }
    }
  }

  updateChaser(dt) {
    const c = this.chaser; if (!c) return;
    const g = c.g, p = this.p;
    if (this.finishing === true) {
      if (this.cfg.finish !== 'avalanche') { /* handled in updateFinish */ }
      g.position.x = this.chaserX;
    } else {
      this.chaserX += (p.x - this.chaserX) * damp(2.5, dt);
      g.position.set(this.chaserX, Math.sin(this.t * 9) * 0.05, p.z + this.gap);
    }
    if (this.finishing === 'lost') g.position.z = p.z + 2.2;
    if (c.anim) animateLimbs(c.anim, this.t * 12, 0.9);
    for (const w of c.wheels) w.rotation.x -= this.speed * dt / 0.5;
  }

  layout(dt) {
    const p = this.p, r = this.rider, g = r.group;
    g.position.set(p.x, p.y, p.z);
    g.rotation.z = (((p.lane - 1) * LW) - p.x) * -0.05;
    const ducking = p.duck > 0 && p.y <= 0.05;
    r.inner.scale.y = (r.kind === 'bike' ? 0.82 : 1) * (ducking ? 0.55 : 1);
    g.visible = this.invuln <= 0 || Math.floor(this.t * 14) % 2 === 0;
    const air = p.y > 0.05;
    if (r.kind === 'ski') {
      const u = r.inner.userData;
      u.armL.rotation.x = -0.6; u.armR.rotation.x = -0.6; u.legL.rotation.x = 0.2; u.legR.rotation.x = 0.2;
    } else if (r.kind === 'bike') { animateLimbs(r.inner, this.t * 10, 0.5, false); }
    else animateLimbs(r.inner, this.t * 14, 0.9, air);
    for (const w of r.wheels) w.rotation.x -= this.speed * dt / 0.4;
    if (this.cfg.finish === 'avalanche' && this.tree) {
      const near = p.z < this.treeZ + 140;
      if (near !== this.lightsOn) this.lightsOn = near;
    }
  }

  camera(snap, dt) {
    const cfg = this.cfg, p = this.p;
    this.shake = Math.max(0, (this.shake || 0) - dt);
    const sh = this.shake ? (Math.random() - 0.5) * this.shake * 0.8 : 0;
    const fz = this.camFocus > 0.01 && this.chaser ? lerp(p.z, this.chaser.g.position.z, this.camFocus * 0.8) : p.z;
    const fx = p.x * 0.6;
    const W = this.world; W.updateMatrixWorld(true);
    const cp = new THREE.Vector3(fx + sh, 4.3 + (this.camFocus * 4), fz + 8.5 + this.camFocus * 6);
    const lp = new THREE.Vector3(fx, 1.3 + this.camFocus * 6, fz - 11);
    W.localToWorld(cp); W.localToWorld(lp);
    const cam = this.ctx.camera;
    if (snap) cam.position.copy(cp); else cam.position.lerp(cp, damp(9, dt));
    if (cfg.wobble) { this.wob += dt; cam.up.set(Math.sin(this.wob * 0.9) * 0.28, 1, 0); } else cam.up.set(0, 1, 0);
    cam.lookAt(lp);
  }
}

function noShadowSkip(o) { o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); }
