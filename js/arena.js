import {
  THREE, isDown, wasHit, box, cyl, sph, cone, mat, mesh, addLights, followSun,
  makeHare, makeWolf, animateLimbs, lerpAngle, damp, clamp,
} from './common.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const RADIUS = 13;

/** Boss fight 1: trick the Wolf into the magician's box using the stage levers. */
export class Arena {
  constructor(ctx, cfg) {
    this.ctx = ctx; this.cfg = cfg;
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a1030);
    scene.fog = new THREE.Fog(0x2a1030, 40, 110);
    this.sun = addLights(scene, { sky: 0xffd9e8, ground: 0x442244, intensity: 1.0 });
    followSun(this.sun, new THREE.Vector3());

    // stage
    const stage = cyl(RADIUS + 1, RADIUS + 1.4, 1, 0x9c3a3a, 40); stage.position.y = -0.5; scene.add(stage);
    const ring = mesh(new THREE.TorusGeometry(RADIUS + 1, 0.25, 8, 48), mat(0xffd34d, 0x664400)); ring.rotation.x = Math.PI / 2; scene.add(ring);
    const floor = cyl(RADIUS * 3, RADIUS * 3, 1, 0x1c0b22, 8); floor.position.y = -1.6; scene.add(floor);
    // curtains
    for (let i = -3; i <= 3; i++) {
      const c = box(4.4, 16, 0.6, i % 2 ? 0x8e1b2e : 0xb1253a);
      c.position.set(i * 4.6, 7, -17); scene.add(c);
    }
    const top = box(34, 2, 1, 0xffd34d); top.position.set(0, 15.2, -16.4); scene.add(top);
    // bulbs
    this.bulbs = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const b = sph(0.22, mat(0xfff0a0, 0xaa8800), 8);
      b.position.set(Math.cos(a) * (RADIUS + 1), 0.3, Math.sin(a) * (RADIUS + 1)); scene.add(b); this.bulbs.push(b);
    }

    // magic pad
    this.pad = cyl(2.2, 2.2, 0.12, mat(0x553366, 0x221133), 24); this.pad.position.y = 0.06; scene.add(this.pad);
    this.padStar = mesh(new THREE.TorusGeometry(1.7, 0.1, 6, 5), mat(0xffffff, 0x333333)); this.padStar.rotation.x = Math.PI / 2; this.padStar.position.y = 0.2; scene.add(this.padStar);
    this.boxMesh = box(2.6, 2.6, 2.6, mat(0xcc3344, 0x330000)); this.boxMesh.visible = false; scene.add(this.boxMesh);
    const stripe = box(2.7, 0.5, 2.7, 0xffffff); this.boxMesh.add(stripe);
    this.padOpen = 0;

    // levers
    this.levers = [[-8.5, 3], [8.5, 3], [0, -9]].map(([x, z]) => {
      const g = new THREE.Group();
      g.add(box(1.2, 0.5, 1.2, 0x444444));
      const stick = new THREE.Group();
      const rod = cyl(0.07, 0.07, 1.4, 0xcccccc, 8); rod.position.y = 0.7;
      const knob = sph(0.22, mat(0xff4444, 0x550000), 10); knob.position.y = 1.45;
      stick.add(rod, knob); stick.position.y = 0.3; stick.rotation.z = 0.7;
      g.add(stick); g.position.set(x, 0.25, z); scene.add(g);
      return { g, stick, x, z, cd: 0 };
    });

    this.hare = makeHare(); scene.add(this.hare);
    this.wolf = makeWolf(); scene.add(this.wolf);
    this.pos = new THREE.Vector3(0, 0, 9);
    this.wpos = new THREE.Vector3(-10, 0, -8);
    this.face = Math.PI; this.wface = 0; this.runPhase = 0;
    this.lives = 3; this.traps = 0; this.invuln = 1.5;
    this.state = 'chase'; this.st = 0; this.wolfVy = 0; this.t = 0;
    this.stun = 1.2;
    this.update(0.001);
    this.updateHud();
    ui.toast('Pull a lever [E], then run through the glowing pad with the Wolf on your tail!', 4500);
  }

  updateHud() {
    ui.info(`${'❤️'.repeat(this.lives)}${'🖤'.repeat(3 - this.lives)} &nbsp; Wolf trapped <b>${this.traps}/3</b>`);
  }

  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt; const t = this.t;
    this.invuln = Math.max(0, this.invuln - dt);
    this.padOpen = Math.max(0, this.padOpen - dt);
    const open = this.padOpen > 0;

    // --- player ---
    const ix = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const iz = (isDown('KeyS', 'ArrowDown') ? 1 : 0) - (isDown('KeyW', 'ArrowUp') ? 1 : 0);
    let len = Math.hypot(ix, iz);
    const sp = 7.4;
    if (len > 0) {
      this.pos.x += (ix / len) * sp * dt; this.pos.z += (iz / len) * sp * dt;
      this.face = lerpAngle(this.face, Math.atan2(ix, iz), damp(16, dt));
    }
    const pr = Math.hypot(this.pos.x, this.pos.z);
    if (pr > RADIUS) { this.pos.x *= RADIUS / pr; this.pos.z *= RADIUS / pr; }

    // levers
    let near = null;
    for (const l of this.levers) {
      l.cd = Math.max(0, l.cd - dt);
      l.stick.rotation.z = THREE.MathUtils.lerp(l.stick.rotation.z, l.cd > 0 ? -0.7 : 0.7, damp(12, dt));
      if (l.cd <= 0 && Math.hypot(this.pos.x - l.x, this.pos.z - l.z) < 1.8) near = l;
    }
    ui.hint(near ? 'Press E to pull the lever!' : null);
    if (near && wasHit('KeyE', 'KeyF', 'Enter')) {
      near.cd = 9; this.padOpen = 6; sfx.pull();
      ui.toast('✨ The magic box opens! Lure the Wolf over the pad!', 2200);
    }

    // pad visuals
    this.pad.material = open ? mat(0x33ff99, 0x118844) : mat(0x553366, 0x221133);
    this.padStar.rotation.z += dt * (open ? 4 : 0.5);
    this.bulbs.forEach((b, i) => { b.visible = open ? Math.floor(t * 8 + i) % 2 === 0 : true; });

    // --- wolf ---
    if (this.state === 'chase') {
      this.stun = Math.max(0, this.stun - dt);
      if (this.stun <= 0) {
        const dx = this.pos.x - this.wpos.x, dz = this.pos.z - this.wpos.z;
        const d = Math.hypot(dx, dz) || 1;
        const ws = 5.1 + this.traps * 0.5;
        this.wpos.x += (dx / d) * ws * dt; this.wpos.z += (dz / d) * ws * dt;
        this.wface = lerpAngle(this.wface, Math.atan2(dx, dz), damp(12, dt));
        animateLimbs(this.wolf, t * 11, 0.9);
        // caught player
        if (d < 1.1 && this.invuln <= 0) this.hurt();
        // trapped?
        if (open && Math.hypot(this.wpos.x, this.wpos.z) < 1.7) this.trap();
      }
    } else if (this.state === 'trapped') {
      this.st += dt;
      this.boxMesh.position.set(0, 1.3, 0);
      this.boxMesh.rotation.z = Math.sin(this.st * 40) * 0.06 * (1 - this.st / 1.4);
      if (this.st > 1.4) { this.state = 'launch'; this.st = 0; this.wolfVy = 14; sfx.boom(); }
    } else if (this.state === 'launch') {
      this.st += dt;
      this.wolfVy -= 4 * dt;
      this.boxMesh.position.y += this.wolfVy * dt * 2.2;
      this.boxMesh.rotation.x += dt * 5;
      if (this.st > 1.6) {
        this.boxMesh.visible = false; this.wolf.visible = true; this.boxMesh.rotation.set(0, 0, 0);
        if (this.traps >= 3) { this.state = 'done'; this.ctx.win(); }
        else {
          this.state = 'chase'; this.stun = 2;
          const a = Math.random() * Math.PI * 2;
          this.wpos.set(Math.cos(a) * 12, 0, Math.sin(a) * 12);
          ui.toast('The Wolf is back, and angrier!', 2000);
        }
      }
    }

    // meshes
    this.hare.position.copy(this.pos); this.hare.rotation.y = this.face;
    this.hare.visible = this.invuln <= 0 || Math.floor(t * 14) % 2 === 0;
    this.runPhase += dt * 12;
    animateLimbs(this.hare, this.runPhase, len > 0 ? 0.9 : 0.05);
    this.wolf.position.copy(this.wpos); this.wolf.rotation.y = this.wface;

    // camera
    const cam = this.ctx.camera;
    cam.position.set(this.pos.x * 0.35, 19, 17 + this.pos.z * 0.3);
    cam.lookAt(this.pos.x * 0.3, 0, this.pos.z * 0.3 - 1);
  }

  hurt() {
    this.lives--; this.invuln = 2; sfx.hit(); this.updateHud();
    const a = Math.atan2(this.wpos.z, this.wpos.x);
    this.wpos.set(Math.cos(a) * 11, 0, Math.sin(a) * 11); this.stun = 1.4;
    this.pos.set(0, 0, 9);
    if (this.lives <= 0) { this.state = 'over'; ui.hint(null); this.ctx.lose('The Wolf pounced on you! Nu, zayats...'); }
    else ui.toast('Ouch! The Wolf got you!', 1600);
  }

  trap() {
    this.state = 'trapped'; this.st = 0; this.traps++; this.padOpen = 0;
    this.boxMesh.visible = true; this.wolf.visible = false;
    this.boxMesh.position.set(0, 1.3, 0);
    sfx.trap(); this.updateHud();
    ui.toast(this.traps >= 3 ? '🎩 Final trick! Nu, pogodi!' : `🎩 Trapped in the box! ${this.traps}/3`, 2200);
  }
}
