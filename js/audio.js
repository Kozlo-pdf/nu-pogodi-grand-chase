// Tiny WebAudio sfx + looping bouncy chiptune. No asset files needed.
let actx = null;
let muted = false;
let musicTimer = null;

function ac() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
  }
  return actx;
}
export function unlockAudio() {
  const c = ac();
  if (c && c.state === 'suspended') c.resume();
}
function tone(freq, dur, type = 'square', vol = 0.05, slide = 0, delay = 0) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.03);
}

export function rumble(ms = 140, strong = 0.8, weak = 0.5) {
  try {
    for (const g of navigator.getGamepads ? navigator.getGamepads() : []) {
      if (g && g.vibrationActuator && g.vibrationActuator.playEffect) g.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    }
  } catch (e) { /* no haptics */ }
}

export const sfx = {
  jump: () => tone(300, 0.16, 'square', 0.045, 450),
  air: () => tone(480, 0.14, 'square', 0.04, 500),
  coin: () => { tone(880, 0.08, 'square', 0.04); tone(1320, 0.14, 'square', 0.04, 0, 0.07); },
  hit: () => { tone(180, 0.35, 'sawtooth', 0.07, -120); rumble(180, 0.9, 0.5); },
  pull: () => tone(220, 0.12, 'triangle', 0.08, 200),
  trap: () => { [440, 330, 220, 110].forEach((f, i) => tone(f, 0.16, 'square', 0.06, 0, i * 0.09)); },
  plug: () => tone(150, 0.1, 'triangle', 0.08, 120),
  pump: () => tone(110, 0.08, 'sine', 0.07, 40),
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'square', 0.05, 0, i * 0.12)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.05, 0, i * 0.14)); },
  boom: () => { tone(90, 0.6, 'sawtooth', 0.09, -60); rumble(320, 1, 0.8); },
  pop: () => tone(700, 0.1, 'sine', 0.06, -400),
};

const NOTES = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 494, 392, 330, 392];
const BASS = [131, 131, 98, 98, 110, 110, 87, 87];
export function startMusic() {
  if (musicTimer) return;
  let i = 0;
  musicTimer = setInterval(() => {
    if (muted || document.hidden) return;
    tone(NOTES[i % NOTES.length], 0.16, 'triangle', 0.028);
    if (i % 2 === 0) tone(BASS[(i >> 1) % BASS.length], 0.3, 'sine', 0.05);
    i++;
  }, 210);
}
export function toggleMute() {
  muted = !muted;
  return muted;
}
