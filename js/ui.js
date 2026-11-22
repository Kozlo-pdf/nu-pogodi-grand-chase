const $ = (id) => document.getElementById(id);
let toastTimer = 0;
let cardOpen = false;
let primary = null;

export const ui = {
  title(t) { $('hud-title').textContent = t; },
  info(html) { $('hud-info').innerHTML = html; },
  hint(t) {
    const e = $('hint');
    if (t) { e.textContent = t; e.classList.add('on'); } else e.classList.remove('on');
  },
  toast(t, ms = 2400) {
    const e = $('toast');
    e.textContent = t; e.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => e.classList.remove('on'), ms);
  },
  bar(slot, label, frac, danger = false) {
    const b = $('bar-' + slot);
    if (label === null) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    b.querySelector('span').textContent = label;
    b.querySelector('i').style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
    b.classList.toggle('danger', danger);
  },
  hud(on) { $('hud').classList.toggle('hidden', !on); },
  card({ kicker = '', title, body = '', controls = '', buttons = [] }) {
    const c = $('card');
    c.innerHTML = '';
    const mk = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    };
    if (kicker) c.append(mk('div', 'kicker', kicker));
    c.append(mk('h2', '', title));
    if (body) c.append(mk('p', 'body', body));
    if (controls) c.append(mk('p', 'controls', controls));
    const row = mk('div', 'btns');
    primary = null;
    buttons.forEach((b, i) => {
      const el = mk('button', i === 0 ? 'primary' : '', b.label);
      el.onclick = () => b.onClick();
      row.append(el);
      if (i === 0) primary = el;
    });
    c.append(row);
    $('card-wrap').classList.remove('hidden');
    cardOpen = true;
    if (primary) primary.focus({ preventScroll: true });
  },
  hideCard() { $('card-wrap').classList.add('hidden'); cardOpen = false; primary = null; },
  get cardOpen() { return cardOpen; },
  clickPrimary() { if (primary) primary.click(); },
  enter() { const ae = document.activeElement; if (!ae || ae === document.body || ae === primary || !ae.closest || !ae.closest('#card')) { if (primary) primary.click(); } },
  clickFocused() { const ae = document.activeElement; if (ae && ae.closest && ae.closest('#card') && ae.tagName === 'BUTTON') ae.click(); else if (primary) primary.click(); },
  moveFocus(d) {
    const bs = [...document.querySelectorAll('#card button')]; if (!bs.length) return;
    let i = bs.indexOf(document.activeElement); i = i < 0 ? 0 : (i + d + bs.length) % bs.length; bs[i].focus({ preventScroll: true });
  },
};
