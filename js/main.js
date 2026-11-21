import { THREE, wasHit, endFrame, bindTouch, disposeScene, makeHare, makeWolf } from './common.js';
import { LEVELS } from './levels.js';
import { ui } from './ui.js';
import { sfx, unlockAudio, startMusic, toggleMute } from './audio.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
bindTouch();

/* ---------- progress ---------- */
const KEY = 'nupogodi.progress.v1';
const loadProgress = () => { try { return Math.min(LEVELS.length - 1, parseInt(localStorage.getItem(KEY) || '0', 10) || 0); } catch (e) { return 0; } };
const saveProgress = (n) => { try { if (n > loadProgress()) localStorage.setItem(KEY, String(n)); } catch (e) { /* ignore */ } };

/* ---------- game state ---------- */
let level = null, index = 0, running = false, paused = false;
const ctx = {
  camera,
  win() { finishLevel(); },
  lose(msg) { failLevel(msg); },
};

function clearHud() { ui.bar('a', null); ui.bar('b', null); ui.hint(null); ui.info(''); }

function build() {
  if (level) { disposeScene(level.scene); level = null; }
  clearHud();
  camera.up.set(0, 1, 0);
  level = LEVELS[index].make(ctx);
  ui.title(LEVELS[index].title);
  ui.hud(true);
}

function introCard(i) {
  index = i; build(); running = false; paused = false;
  const d = LEVELS[i];
  ui.card({
    kicker: d.act, title: d.title, body: d.intro, controls: d.controls,
    buttons: [{ label: 'Let\'s go!  (Enter)', onClick: begin }, { label: 'Main menu', onClick: menu }],
  });
}

function begin() {
  unlockAudio(); startMusic();
  ui.hideCard(); running = true; paused = false;
}

function restart() {
  build(); running = true; paused = false; ui.hideCard();
}

function finishLevel() {
  if (!running) return;
  running = false; sfx.win(); clearHud();
  const d = LEVELS[index];
  saveProgress(index + 1);
  const last = index >= LEVELS.length - 1;
  ui.card({
    kicker: last ? 'The End' : 'Level complete!', title: last ? 'Nu, zayats, nu, pogodi!' : d.title,
    body: d.outro,
    buttons: last
      ? [{ label: 'Play again', onClick: () => introCard(0) }, { label: 'Main menu', onClick: menu }]
      : [{ label: 'Next  (Enter)', onClick: () => introCard(index + 1) }, { label: 'Replay level', onClick: () => introCard(index) }],
  });
}

function failLevel(msg) {
  if (!running) return;
  running = false; sfx.lose(); clearHud();
  ui.card({
    kicker: 'Oh no!', title: 'Nu, pogodi!', body: msg || 'Try again!',
    buttons: [{ label: 'Retry  (Enter)', onClick: restart }, { label: 'Main menu', onClick: menu }],
  });
}

function pauseGame() {
  if (!running) return;
  running = false; paused = true;
  ui.card({
    title: 'Paused', body: LEVELS[index].title, controls: LEVELS[index].controls,
    buttons: [{ label: 'Resume  (Esc)', onClick: () => { running = true; paused = false; ui.hideCard(); } },
      { label: 'Restart level', onClick: restart }, { label: 'Main menu', onClick: menu }],
  });
}

function chapterSelect() {
  const max = loadProgress();
  ui.card({
    kicker: 'Chapter select', title: 'Where to?',
    body: max === 0 ? 'Finish levels to unlock more.' : '',
    buttons: [
      ...LEVELS.map((d, i) => (i <= max ? { label: `${i + 1}. ${d.title}`, onClick: () => introCard(i) } : null)).filter(Boolean),
      { label: '← Back', onClick: menu },
    ],
  });
}

function menu() {
  index = 0;
  if (level) { disposeScene(level.scene); level = null; }
  clearHud(); ui.hud(false); running = false; paused = false;
  const max = loadProgress();
  const buttons = [{ label: max > 0 ? 'New game' : 'Play  (Enter)', onClick: () => introCard(0) }];
  if (max > 0) buttons.unshift({ label: `Continue – ${LEVELS[max].title}`, onClick: () => introCard(max) });
  buttons.push({ label: 'Chapter select', onClick: chapterSelect });
  ui.card({
    kicker: 'A fan-made 3D slapstick chase',
    title: 'Nu, Pogodi! The Grand Chase',
    body: 'Play the clever Hare, outwit the scheming Wolf and make the New Year\'s Eve concert on time.',
    buttons,
  });
}

/* ---------- idle backdrop for the menu ---------- */
const menuScene = new THREE.Scene();
menuScene.background = new THREE.Color(0xffd9a8);
{
  menuScene.add(new THREE.HemisphereLight(0xffffff, 0x886644, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(5, 10, 8); menuScene.add(sun);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 60), new THREE.MeshStandardMaterial({ color: 0x74b05a }));
  ground.position.y = -0.5; menuScene.add(ground);
}
{
  const h = makeHare(), w = makeWolf();
  h.position.set(-1.8, 0, 0); h.rotation.y = 0.5; w.position.set(1.8, 0, 0); w.rotation.y = -0.5;
  menuScene.add(h, w);
  menuScene.userData.actors = [h, w];
}

/* ---------- loop ---------- */
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = clock.getDelta();

  if (wasHit('KeyM')) { const m = toggleMute(); ui.toast(m ? 'Sound off' : 'Sound on', 900); }
  if (ui.cardOpen) {
    if (wasHit('Enter')) ui.clickPrimary();
    else if (paused && wasHit('Escape', 'KeyP')) ui.clickPrimary();
  } else if (running) {
    if (wasHit('Escape', 'KeyP')) pauseGame();
    else if (wasHit('KeyR')) restart();
  }

  if (running && level) {
    level.update(dt);
    renderer.render(level.scene, camera);
  } else if (level) {
    renderer.render(level.scene, camera);
  } else {
    const t = performance.now() / 1000;
    (menuScene.userData.actors || []).forEach((a, i) => { a.position.y = Math.abs(Math.sin(t * 3 + i * 2)) * 0.3; });
    camera.up.set(0, 1, 0);
    camera.position.set(0, 2.2, 7); camera.lookAt(0, 1.4, 0);
    renderer.render(menuScene, camera);
  }
  endFrame();
}

/* ---------- boot ---------- */
const params = new URLSearchParams(location.search);
if (params.has('level')) {
  const n = Math.max(0, Math.min(LEVELS.length - 1, parseInt(params.get('level'), 10) || 0));
  introCard(n);
  if (params.has('auto')) begin(); // debug/testing: skip the intro card
} else menu();
// expose for debugging / automated tests
window.__game = { get level() { return level; }, get running() { return running; }, begin, ctx };
frame();
