// PROTOTYPE - NOT FOR PRODUCTION
// 몸속 원정대: every figure, drawn on the canvas. Bright 2D side-scroller look: dark outlines, big heads,
// rounded footholds, layered backgrounds in each organ's colour. Feet are at (x, y); f = 1 faces right.
'use strict';

const OL = '#2a1c24';
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function stroke(c, w = 2.5, col = OL) { c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function fillS(c, col, w = 2.5) { c.fillStyle = col; c.fill(); stroke(c, w); }
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function shade(hex, k) { // k < 0 darker, > 0 lighter
  const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
}
function eyes(c, x1, x2, y, s = 1, mood = 0) { // big shiny eyes; mood 1 = angry brows, -1 = closed happy
  for (const x of [x1, x2]) {
    if (mood < 0) { c.beginPath(); c.arc(x, y + 1, 3.2 * s, Math.PI * 1.1, Math.PI * 1.9); stroke(c, 2.2 * s); continue; }
    ell(c, x, y, 3.2 * s, 4.4 * s); c.fillStyle = OL; c.fill();
    ell(c, x + 1 * s, y - 1.6 * s, 1.3 * s, 1.5 * s); c.fillStyle = '#fff'; c.fill();
  }
  if (mood > 0) { c.beginPath(); c.moveTo(x1 - 4 * s, y - 8 * s); c.lineTo(x1 + 3 * s, y - 5 * s); c.moveTo(x2 + 4 * s, y - 8 * s); c.lineTo(x2 - 3 * s, y - 5 * s); stroke(c, 2.4 * s); }
}
function blush(c, x, y, s = 1) { ell(c, x, y, 3.5 * s, 2 * s); c.fillStyle = 'rgba(255,120,130,.45)'; c.fill(); }
function shadow(c, x, y, w) { ell(c, x, y + 1, w, w * 0.22); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill(); }

// ---- 원정대원 ------------------------------------------------------------------------------------
const HAIR = ['#4a2f23', '#1f1d2b', '#c77b30', '#e8c25a', '#a8455a', '#5b7bd6'];
const SKIN = ['#ffe2c8', '#f6cfa8', '#e9b88f'];
/** look: { hair, hs (style 0-3), skin }  a: { st: 'stand'|'walk'|'jump'|'climb'|'hurt', t, atk (0..1 or -1) } */
// ---- painted parts (assets/sp): a head per gender, torso · arm · leg per outfit, put together and moved like a puppet
const SP = {};
const THEME_LEDGE = { town: 1, digest: 1, lung: 1, vessel: 1, kidney: 1 };
for (const k of ['head-boy', 'head-girl', ...Object.keys(JOBS).flatMap(j => [`${j}-torso`, `${j}-arm`, `${j}-leg`]), ...['starch', 'protein', 'fat', 'urea'].map(m => 'mon-' + m), ...Object.keys(NPCS).map(n => 'npc-' + n), ...Object.keys(THEME_LEDGE).map(t => 'ledge-' + t)]) { const im = new Image(); im.onload = () => { SP[k] = im; }; im.src = `assets/sp/${k}.png`; }
function dollReady(look, job) { return SP[`head-${look.g}`] && SP[`${job}-torso`] && SP[`${job}-arm`] && SP[`${job}-leg`]; }
/** a part hung from its pivot: top = the top middle (arms, legs), mid = the middle (head), bottom = the bottom middle (torso) */
function part(c, im, x, y, ang, h, pivot, dark) {
  const w = h * im.width / im.height;
  c.save(); c.translate(x, y); c.rotate(ang); if (dark) c.filter = 'brightness(0.78)';
  c.drawImage(im, -w / 2, pivot === 'top' ? -1 : pivot === 'mid' ? -h / 2 : -h, w, h); c.restore();
}
function drawDoll(c, x, y, f, job, look, a) {
  const J = JOBS[job] || JOBS.warrior, O = JOB_LOOK[job] || JOB_LOOK.warrior, P = k => SP[`${job}-${k}`];
  const walk = a.st === 'walk' ? Math.sin(a.t * 12) : 0, air = a.st === 'jump', climb = a.st === 'climb', atk = a.atk >= 0 ? a.atk : -1;
  c.save(); c.translate(x, y);
  if (!climb) shadow(c, 0, 0, 16);
  c.scale(f, 1);
  const bob = a.st === 'walk' ? Math.abs(Math.sin(a.t * 12)) * 2 : a.st === 'stand' ? Math.sin(a.t * 3) * 0.8 : 0;
  c.translate(0, -bob);
  const cs = climb ? Math.sin(a.t * 10) : 0;
  const legA = climb ? cs * 0.5 : air ? -0.55 : walk * 0.55, legB = climb ? -cs * 0.5 : air ? 0.35 : -walk * 0.55;
  part(c, P('leg'), -3, -19, legB, 20, 'top', true);
  part(c, P('leg'), 4, -19, legA, 20, 'top');
  const backArm = climb ? -2.9 + cs * 0.3 : atk >= 0 ? -0.6 : -walk * 0.6 + (air ? -0.8 : 0.15);
  part(c, P('arm'), -4, -35, backArm, 18, 'top', true);
  part(c, P('torso'), 0, O.ty, 0, O.th, 'bottom');
  part(c, SP[`head-${look.g}`], 1, -52 + (a.st === 'walk' ? Math.sin(a.t * 24) * 0.6 : 0), climb ? -0.08 : atk >= 0 ? 0.06 : 0, 38, 'mid'); // side profile: looks where it walks
  const ang = climb ? -2.9 - cs * 0.3 : atk >= 0 ? (J.weapon === 'sword' ? -2.2 + atk * 3.2 : -1.3 + Math.sin(atk * Math.PI) * 0.4) : walk * 0.6 + (air ? -1.2 : -0.1);
  c.save(); c.translate(5, -35); c.rotate(ang);
  part(c, P('arm'), 0, 0, 0, 18, 'top');
  if (!climb) { c.translate(0, 16); c.scale(0.75, 0.75); weapon(c, J.weapon, atk); }
  c.restore();
  if (atk >= 0 && J.weapon === 'sword') {
    c.beginPath(); c.arc(8, -30, 46, -1.6 + atk * 2.4 - 1.1, -1.6 + atk * 2.4, false);
    c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - atk)})`; c.lineWidth = 6; c.stroke();
  }
  c.restore();
}
function drawHero(c, x, y, f, job, look, a) {
  if (look.g && dollReady(look, job)) return drawDoll(c, x, y, f, job, look, a);
  const J = JOBS[job] || JOBS.warrior, hair = HAIR[(look.hair || 0) % HAIR.length], skin = SKIN[(look.skin || 0) % SKIN.length];
  const walk = a.st === 'walk' ? Math.sin(a.t * 12) : 0, air = a.st === 'jump', climb = a.st === 'climb';
  c.save(); c.translate(x, y);
  if (!climb) shadow(c, 0, 0, 16);
  c.scale(f, 1);
  const bob = a.st === 'walk' ? Math.abs(Math.sin(a.t * 12)) * 2 : a.st === 'stand' ? Math.sin(a.t * 3) * 0.8 : 0;
  c.translate(0, -bob);
  if (climb) { drawHeroBack(c, J, hair, skin, look, a); c.restore(); return; }
  // legs
  const legA = air ? -0.5 : walk * 0.55, legB = air ? 0.35 : -walk * 0.55;
  for (const [lx, ang] of [[-5, legB], [5, legA]]) {
    c.save(); c.translate(lx, -15); c.rotate(ang);
    rr(c, -4, 0, 8, 14, 3); fillS(c, '#3b3f5c', 2);
    rr(c, -5, 10, 11, 6, 3); fillS(c, '#5a3a2a', 2);
    c.restore();
  }
  // back arm
  const atk = a.atk >= 0 ? a.atk : -1;
  armDraw(c, -9, -31, atk >= 0 ? -0.6 : -walk * 0.6 + (air ? -0.8 : 0.15), skin, J.color);
  // body (job tunic)
  c.beginPath(); c.moveTo(-11, -34); c.quadraticCurveTo(-13, -14, -12, -12); c.lineTo(12, -12); c.quadraticCurveTo(13, -14, 11, -34); c.closePath();
  fillS(c, J.color); rr(c, -12, -17, 24, 4, 2); fillS(c, shade(J.color, -0.35), 2);
  c.beginPath(); c.moveTo(-4, -34); c.lineTo(0, -28); c.lineTo(4, -34); stroke(c, 2, shade(J.color, 0.5));
  // head
  drawHead(c, hair, skin, look.hs || 0, a.st === 'hurt');
  // front arm + weapon
  const ang = atk >= 0 ? (J.weapon === 'sword' ? -2.2 + atk * 3.2 : -1.3 + Math.sin(atk * Math.PI) * 0.4) : walk * 0.6 + (air ? -1.2 : -0.1);
  c.save(); c.translate(9, -31); c.rotate(ang);
  rr(c, -3.5, 0, 7, 14, 3.5); fillS(c, J.color, 2); ell(c, 0, 15, 4, 4); fillS(c, skin, 2);
  c.translate(0, 16); weapon(c, J.weapon, atk);
  c.restore();
  if (atk >= 0 && J.weapon === 'sword') { // swish
    c.beginPath(); c.arc(8, -30, 46, -1.6 + atk * 2.4 - 1.1, -1.6 + atk * 2.4, false);
    c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - atk)})`; c.lineWidth = 6; c.stroke();
  }
  c.restore();
}
function armDraw(c, x, y, ang, skin, col) {
  c.save(); c.translate(x, y); c.rotate(ang); rr(c, -3.5, 0, 7, 14, 3.5); fillS(c, shade(col, -0.15), 2); ell(c, 0, 15, 4, 4); fillS(c, skin, 2); c.restore();
}
function drawHead(c, hair, skin, hs, hurt) {
  c.save(); c.translate(0, -52);
  // back hair
  c.beginPath(); c.ellipse(-3, 0, 21, 20, 0, 0, Math.PI * 2); fillS(c, hair);
  if (hs === 1) { rr(c, -22, -2, 12, 26, 6); fillS(c, hair); } // long hair
  if (hs === 3) { ell(c, -22, -10, 7, 7); fillS(c, hair); } // bun
  ell(c, 2, 2, 18, 16.5); fillS(c, skin);
  // bangs
  c.beginPath(); c.moveTo(-17, -2); c.quadraticCurveTo(-14, -21, 4, -19); c.quadraticCurveTo(20, -18, 20, -4);
  if (hs === 2) { c.lineTo(15, -9); c.lineTo(11, -2); c.lineTo(6, -10); c.lineTo(1, -2); c.lineTo(-4, -10); c.lineTo(-9, -3); }
  else { c.quadraticCurveTo(10, -11, 3, -6); c.quadraticCurveTo(-4, -12, -9, -4); }
  c.closePath(); fillS(c, hair);
  ell(c, -8, -12, 4, 2.2, -0.4); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  eyes(c, 5, 13, 3, 1, hurt ? -1 : 0); blush(c, 1, 9); blush(c, 16, 9);
  c.beginPath(); c.arc(10, 10, 2.6, 0.2, Math.PI - 0.2); stroke(c, 1.8);
  c.restore();
}
function drawHeroBack(c, J, hair, skin, look, a) {
  const s = Math.sin(a.t * 10);
  for (const [lx, d] of [[-5, s], [5, -s]]) { rr(c, lx - 4, -16 + d * 3, 8, 15, 3); fillS(c, '#3b3f5c', 2); }
  rr(c, -12, -35, 24, 22, 6); fillS(c, J.color);
  for (const [ax, d] of [[-11, -s], [11, s]]) { rr(c, ax - 3.5, -50 + d * 4, 7, 18, 3.5); fillS(c, J.color, 2); ell(c, ax, -50 + d * 4, 4, 4); fillS(c, skin, 2); }
  ell(c, 0, -52, 20, 19); fillS(c, hair);
}
function weapon(c, w, atk) {
  if (w === 'sword') {
    rr(c, -2, -4, 4, 10, 1); fillS(c, '#7a4a2a', 1.8); rr(c, -7, 4, 14, 4, 2); fillS(c, '#d9b44a', 1.8);
    c.beginPath(); c.moveTo(-3.5, 8); c.lineTo(-3.5, 40); c.lineTo(0, 47); c.lineTo(3.5, 40); c.lineTo(3.5, 8); c.closePath(); fillS(c, '#e7eef6', 2);
    c.beginPath(); c.moveTo(0, 10); c.lineTo(0, 40); stroke(c, 1, '#9fb0c4');
  } else if (w === 'star') { star4(c, 0, 4, 8, '#c9d2e0'); }
  else if (w === 'bow') {
    c.save(); c.rotate(0.15); // the bow bends forward, away from the face
    c.beginPath(); c.arc(0, 0, 22, -1.1, 1.1); c.lineWidth = 5; c.strokeStyle = OL; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#8a5a2b'; c.stroke();
    c.beginPath(); c.moveTo(22 * Math.cos(-1.1), 22 * Math.sin(-1.1)); c.lineTo(22 * Math.cos(1.1) - (atk >= 0 ? 6 : 0), 22 * Math.sin(1.1)); stroke(c, 1.2, '#eee');
    c.restore();
  } else if (w === 'wand') {
    rr(c, -2, -2, 4, 30, 2); fillS(c, '#7a4a2a', 1.8); ell(c, 0, 30, 6, 6); fillS(c, '#7fd3ff', 2);
    ell(c, -1.5, 28.5, 2, 2); c.fillStyle = '#fff'; c.fill();
  }
}
function star4(c, x, y, r, col, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
  for (let i = 0; i < 8; i++) { const R = i % 2 ? r * 0.38 : r, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
  c.closePath(); fillS(c, col, 1.8); c.restore();
}

// ---- 몬스터 --------------------------------------------------------------------------------------
function drawMon(c, k, x, y, f, t, flash, hpk) {
  c.save(); c.translate(x, y); shadow(c, 0, 0, k === 'boss' ? 90 : 22); c.scale(f, 1);
  if (flash) c.filter = 'brightness(1.8)';
  const im = SP['mon-' + k];
  if (im) { // the painted mob, moved by kind
    const H = { starch: 50, protein: 32, fat: 56, urea: 64 }[k], w = H * im.width / im.height;
    let sx = 1, sy = 1, dy = 0, rot = 0;
    if (k === 'starch') { sy = 1 + Math.sin(t * 6) * 0.07; sx = 2 - sy; }
    else if (k === 'protein') { dy = -Math.abs(Math.sin(t * 7)) * 3; rot = Math.sin(t * 7) * 0.04; }
    else if (k === 'fat') { dy = -Math.abs(Math.sin(t * 4)) * 14; sy = 1 + Math.sin(t * 8) * 0.05; }
    else if (k === 'urea') { dy = -12 + Math.sin(t * 3) * 5; c.globalAlpha = 0.92; }
    c.translate(0, dy); c.rotate(rot); c.scale(sx, sy); c.drawImage(im, -w / 2, -H, w, H);
  } else if (k === 'starch') {
    const sq = 1 + Math.sin(t * 6) * 0.06;
    c.scale(1 / sq, sq);
    c.beginPath(); c.moveTo(-26, 0); c.bezierCurveTo(-28, -44, 28, -44, 26, 0); c.quadraticCurveTo(0, 5, -26, 0); fillS(c, '#f3eedc');
    ell(c, -10, -26, 6, 4, -0.5); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill();
    for (let i = 0; i < 3; i++) hexa(c, -12 + i * 12, -40 - (i % 2) * 4, 6, '#fff7c9'); // a little 녹말 chain hat
    eyes(c, 2, 14, -16); blush(c, -2, -9); blush(c, 19, -9);
    c.beginPath(); c.arc(9, -9, 3, 0.1, Math.PI - 0.1); stroke(c, 1.8);
  } else if (k === 'protein') {
    const cols = ['#e86a8a', '#f2a03d', '#58b368', '#4f8fe0', '#b46ad6'];
    for (let i = 4; i >= 0; i--) {
      const bx = -28 + i * 14, by = -14 - Math.abs(Math.sin(t * 7 + i * 0.9)) * 7;
      ell(c, bx, by, i === 4 ? 14 : 10, i === 4 ? 13 : 10); fillS(c, cols[i]);
      if (i < 4) { ell(c, bx - 2, by - 4, 3, 2); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill(); }
    }
    const hy = -14 - Math.abs(Math.sin(t * 7 + 3.6)) * 7;
    eyes(c, 26, 33, hy - 3, 0.85); blush(c, 30, hy + 4, 0.8);
  } else if (k === 'fat') {
    const hop = Math.abs(Math.sin(t * 4)) * 14;
    c.translate(0, -hop);
    c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(10, -30, 22, -18, 20, -8); c.bezierCurveTo(18, 4, -18, 4, -20, -8); c.bezierCurveTo(-22, -18, -10, -30, 0, -46); fillS(c, '#f7c948');
    ell(c, -8, -18, 4, 7, 0.3); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    eyes(c, 2, 12, -14, 0.9); blush(c, -1, -7, 0.9); blush(c, 15, -7, 0.9);
  } else if (k === 'urea') {
    const fl = Math.sin(t * 3) * 5;
    c.translate(0, -12 + fl); c.globalAlpha = 0.92;
    c.beginPath(); c.moveTo(-24, 0); c.bezierCurveTo(-28, -60, 28, -60, 24, 0);
    for (let i = 0; i < 4; i++) { const x0 = 24 - i * 12; c.quadraticCurveTo(x0 - 3, 8 + Math.sin(t * 8 + i) * 3, x0 - 6, 0); c.quadraticCurveTo(x0 - 9, -6, x0 - 12, 0); }
    c.closePath(); fillS(c, '#c9a8f0');
    ell(c, -9, -36, 5, 3, -0.5); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    eyes(c, 3, 14, -26, 1, 1); c.beginPath(); c.ellipse(9, -14, 4, 3, 0, 0, Math.PI * 2); c.fillStyle = OL; c.fill();
  } else if (k === 'boss') drawBoss(c, t);
  c.restore();
  if (hpk !== undefined && hpk < 1 && k !== 'boss') { // a small hp bar over a hurt monster
    const m = MONS[k]; rr(c, x - 24, y - m.h - 22, 48, 6, 3); c.fillStyle = '#222'; c.fill();
    rr(c, x - 23, y - m.h - 21, 46 * Math.max(0, hpk), 4, 2); c.fillStyle = '#ff5a5a'; c.fill();
  }
}
function hexa(c, x, y, r, col) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); fillS(c, col, 1.8); }
function drawBoss(c, t) {
  const pul = 1 + Math.sin(t * 2.5) * 0.04;
  if (IMG.boss) { // the painting faces left; drawMon has already turned us to face right
    const [sx, sy, sw, sh] = IMG.bossBox, h = 200, w = h * sw / sh;
    c.save(); c.scale(-pul, 1 / pul); c.drawImage(IMG.boss, sx, sy, sw, sh, -w * 0.4, -h + 4, w, h); c.restore(); return;
  }
  c.save(); c.scale(pul, 1 / pul);
  for (let i = 0; i < 7; i++) { // flagella
    const a = Math.PI * (0.15 + i * 0.12);
    c.beginPath(); c.moveTo(Math.cos(a) * -70, -80 + Math.sin(a) * 60);
    c.bezierCurveTo(-110 - i * 6, -40 + Math.sin(t * 4 + i) * 20, -140, -100 + Math.cos(t * 3 + i) * 30, -160, -60 + i * 10);
    c.lineWidth = 6; c.strokeStyle = OL; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#7ccf5a'; c.stroke();
  }
  c.beginPath();
  for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, r = (i % 2 ? 84 : 96) + Math.sin(t * 3 + i) * 2; c.lineTo(Math.cos(a) * r, -84 + Math.sin(a) * r * 0.86); }
  c.closePath(); fillS(c, '#6fbf4a', 3.5);
  ell(c, 0, -80, 72, 62); c.fillStyle = '#8fd86a'; c.fill();
  for (const [sx, sy, r] of [[-40, -110, 10], [30, -40, 8], [-50, -50, 6], [45, -115, 7]]) { ell(c, sx, sy, r, r); c.fillStyle = '#5aa63a'; c.fill(); }
  eyes(c, 2, 40, -96, 2.4, 1);
  c.beginPath(); c.moveTo(-8, -58); c.quadraticCurveTo(22, -38, 52, -58); c.closePath(); fillS(c, '#7a1f2a', 3);
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-2 + i * 11, -57); c.lineTo(3 + i * 11, -49); c.lineTo(8 + i * 11, -57); c.fillStyle = '#fff'; c.fill(); }
  // crown
  c.beginPath(); c.moveTo(-30, -160); c.lineTo(-34, -196); c.lineTo(-14, -176); c.lineTo(4, -206); c.lineTo(20, -176); c.lineTo(40, -196); c.lineTo(36, -160); c.closePath(); fillS(c, '#ffd23f', 3);
  for (const gx of [-16, 4, 22]) { ell(c, gx, -170, 4, 4); c.fillStyle = '#e8465a'; c.fill(); }
  c.restore();
}

// ---- NPC --------------------------------------------------------------------------------------
function drawNpc(c, id, x, y, t, lit) {
  c.save(); c.translate(x, y); shadow(c, 0, 0, 24);
  const b = Math.sin(t * 2.4) * 1.5;
  c.translate(0, -b);
  const im = SP['npc-' + id];
  if (im) { // painted NPC; the 발전소장 dims until the power is back
    const H = { chief: 92, mito: 78, diaphragm: 72, tissue: 70, alveoli: 80 }[id] || 84, w = H * im.width / im.height;
    if (id === 'mito' && !lit) c.filter = 'saturate(0.45) brightness(0.85)';
    if (id === 'alveoli') c.translate(0, -10 + Math.sin(t * 3) * 4);
    c.drawImage(im, -w / 2, -H, w, H); c.restore(); return;
  }
  if (id === 'chief') {
    rr(c, -16, -36, 32, 36, 10); fillS(c, '#7cc47f');
    ell(c, 0, -52, 22, 20); fillS(c, '#ffe2c8'); eyes(c, -7, 7, -56, 0.9, -1);
    c.beginPath(); c.moveTo(-16, -48); c.quadraticCurveTo(0, -12, 16, -48); c.quadraticCurveTo(0, -38, -16, -48); fillS(c, '#fff');
    c.beginPath(); c.moveTo(-22, -62); c.quadraticCurveTo(0, -96, 22, -62); c.closePath(); fillS(c, '#4f9a5a');
    ell(c, 0, -84, 7, 7); fillS(c, '#9b5fc0'); // 핵 모양 모자 장식
    rr(c, 22, -70, 5, 70, 2); fillS(c, '#8a5a2b', 2); leaf(c, 25, -72, 0.6);
  } else if (id === 'mito') {
    c.save(); c.rotate(-0.08);
    c.beginPath(); c.ellipse(0, -36, 34, 26, 0, 0, Math.PI * 2); fillS(c, lit ? '#ff9f43' : '#c98a55');
    c.beginPath(); c.moveTo(-26, -36); for (let i = 0; i < 6; i++) { c.quadraticCurveTo(-22 + i * 9, i % 2 ? -18 : -54, -18 + i * 9, -36); } stroke(c, 2.4, shade('#ff9f43', -0.4));
    c.restore();
    eyes(c, -6, 10, -40, 1); blush(c, -12, -30); blush(c, 18, -30);
    rr(c, -20, -76, 40, 14, 7); fillS(c, '#ffd23f'); rr(c, -26, -66, 52, 6, 3); fillS(c, '#f2b100', 2);
    if (lit) for (let i = 0; i < 3; i++) star4(c, -40 + i * 40, -90 - Math.abs(Math.sin(t * 3 + i)) * 10, 6, '#fff3a0', t);
  } else if (id === 'villi') {
    for (let i = -2; i <= 2; i++) { rr(c, i * 11 - 5, -50 - Math.abs(i) * -6 + Math.sin(t * 3 + i) * 3, 10, 50 - Math.abs(i) * 6, 5); fillS(c, '#f08aa0', 2); }
    rr(c, -24, -26, 48, 26, 10); fillS(c, '#e86a8a'); eyes(c, -6, 8, -14); blush(c, -12, -6); blush(c, 14, -6);
  } else if (id === 'trachea' || id === 'diaphragm') {
    if (id === 'trachea') { for (let i = 0; i < 5; i++) { rr(c, -15, -70 + i * 13, 30, 12, 6); fillS(c, i % 2 ? '#bfe3f7' : '#9fd2ef', 2); } eyes(c, -6, 6, -56, 0.9); }
    else { c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(0, -80 - Math.sin(t * 2) * 12, 36, 0); c.closePath(); fillS(c, '#e07a6a'); eyes(c, -8, 8, -34); c.beginPath(); c.arc(0, -24, 5, 0.1, Math.PI - 0.1); stroke(c, 2); }
  } else if (id === 'alveoli') {
    for (const [gx, gy] of [[-14, -50], [0, -60], [14, -50], [-8, -36], [8, -36], [0, -24]]) { ell(c, gx, gy, 11, 11); fillS(c, '#ffb3c6', 2); }
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 26, -58, 14, 8, s * 0.5 + Math.sin(t * 8) * 0.2 * s, 0, Math.PI * 2); c.fillStyle = 'rgba(200,240,255,.7)'; c.fill(); stroke(c, 1.5); }
    eyes(c, -5, 7, -46, 0.8); blush(c, -10, -40, 0.8); blush(c, 12, -40, 0.8);
  } else if (id === 'heart') {
    c.beginPath(); c.moveTo(0, -6); c.bezierCurveTo(-46, -36, -24, -76, 0, -54); c.bezierCurveTo(24, -76, 46, -36, 0, -6); fillS(c, '#e8465a');
    ell(c, -14, -52, 5, 3, -0.6); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    eyes(c, -8, 8, -42); rr(c, -18, -80, 36, 10, 4); fillS(c, '#2f3d6b'); rr(c, -10, -92, 20, 14, 5); fillS(c, '#2f3d6b'); star4(c, 0, -86, 4, '#ffd23f');
  } else if (id === 'tissue') {
    c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 30 + Math.sin(i * 2.3) * 3; c.lineTo(Math.cos(a) * r, -32 + Math.sin(a) * r * 0.9); } c.closePath(); fillS(c, '#f5d0a9');
    ell(c, 10, -40, 9, 8); fillS(c, '#9b5fc0', 2); eyes(c, -12, 0, -28, 0.9, -1); blush(c, -16, -20); c.beginPath(); c.arc(-6, -20, 3, 0.1, Math.PI - 0.1); stroke(c, 1.8);
  } else if (id === 'nephron') {
    c.beginPath(); c.moveTo(10, -6); c.bezierCurveTo(-44, 0, -40, -86, 6, -74); c.bezierCurveTo(30, -68, 14, -44, 24, -36); c.bezierCurveTo(40, -24, 34, -8, 10, -6); fillS(c, '#9a6fd6');
    eyes(c, -10, 4, -46); blush(c, -16, -36); rr(c, 22, -48, 22, 8, 3); fillS(c, '#7fd3ff', 2);
  }
  c.restore();
}
function leaf(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -18, 0, -32); c.quadraticCurveTo(-14, -18, 0, 0); fillS(c, '#6cc070', 2); c.restore(); }

// ---- 맵 ------------------------------------------------------------------------------------------
const THEME = {
  town: { sky: ['#bff0d4', '#f6ffe8'], top: '#7ed27a', body: '#c9a06a', edge: '#9a7448' },
  digest: { sky: ['#5a1d33', '#c9506c'], top: '#ff9db3', body: '#b4405e', edge: '#7c2440' },
  lung: { sky: ['#8fd0f5', '#e6f7ff'], top: '#ffc6d4', body: '#c7907e', edge: '#94604f' },
  vessel: { sky: ['#3a0710', '#8c1b25'], top: '#ff8f8f', body: '#c23a44', edge: '#7a1820' },
  kidney: { sky: ['#2c2357', '#7a62c4'], top: '#b9a6f5', body: '#6a52b0', edge: '#463486' },
};
/** the far layers, drawn in screen space with parallax from the camera (cx, cy) */
// painted backgrounds and the boss (assets/, made with an image model); until one loads, the drawn version shows
const IMG = {};
for (const k of ['town', 'digest', 'lung', 'vessel', 'kidney', 'boss']) { const im = new Image(); im.onload = () => { IMG[k] = im; if (k === 'boss') IMG.bossBox = opaqueBox(im); }; im.src = k === 'boss' ? 'assets/boss.png' : `assets/bg-${k}.jpg`; }
function opaqueBox(im) { // the part of a cut-out picture that is not see-through
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  let d; try { d = x.getImageData(0, 0, c.width, c.height).data; } catch (e) { return [0, 0, im.width, im.height]; }
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y += 2) for (let i = 0; i < c.width; i += 2) if (d[(y * c.width + i) * 4 + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 > x0 ? [x0, y0, x1 - x0 + 2, y1 - y0 + 2] : [0, 0, im.width, im.height];
}
const BG_KX = 0.22, BG_KY = 0.08; // how fast the painted layer moves with the camera
function paintedBack(c, im, map, cx, cy, W, H) { // covers the screen and slides a little as you walk the whole map
  const a = im.width / im.height, sw = W + Math.max(0, map.w - W) * BG_KX, sh = H + Math.max(0, map.h - H) * BG_KY;
  const w = Math.max(sw, sh * a), h = w / a;
  const x = -Math.min(w - W, Math.max(0, cx) * BG_KX), y = -Math.min(h - H, Math.max(0, cy) * BG_KY);
  c.drawImage(im, x, y, w, h);
}
function drawBack(c, map, cx, cy, t, W, H, lit) {
  const T = THEME[map.theme], g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const px = (k, w) => ((-cx * k) % w + w) % w, im = IMG[map.theme];
  if (im) { // the painting, then only the moving bits on top
    paintedBack(c, im, map, cx, cy, W, H);
    if (map.theme === 'digest') for (let i = 0; i < 18; i++) { const x = (i * 211) % W, y = (i * 97 + t * 30) % H; ell(c, x, y, 3, 3); c.fillStyle = 'rgba(255,240,180,.5)'; c.fill(); }
    if (map.theme === 'lung' || map.theme === 'town') for (let i = 0; i < 18; i++) { const x = ((i * 173 - cx * 0.3) % W + W) % W, y = H - ((i * 131 + t * 30 + cy * 0.3) % (H + 40)); ell(c, x, y, 5 + (i % 4) * 3, 5 + (i % 4) * 3); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.stroke(); }
    if (map.theme === 'vessel') for (let i = 0; i < 10; i++) { const x = ((i * 157 - t * 90 - cx * 0.5) % (W + 100) + W + 100) % (W + 100) - 50, y = 80 + (i * 83) % (H - 300); rbc(c, x, y, 14, 0.35); }
    if (map.theme === 'kidney') for (let i = 0; i < 20; i++) { const x = (i * 199) % W, y = (i * 113 + t * 60) % H; c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 5, y + 2, x, y + 5); c.quadraticCurveTo(x - 5, y + 2, x, y - 6); c.fillStyle = 'rgba(180,230,255,.5)'; c.fill(); }
    return;
  }
  if (map.theme === 'town') {
    for (let i = 0; i < 9; i++) { const x = px(0.15, 1800) + i * 240 - 300; ell(c, x, H - 150 - (i % 3) * 30, 180, 120); c.fillStyle = 'rgba(120,200,140,.35)'; c.fill(); }
    for (let i = 0; i < 8; i++) { const x = px(0.3, 1600) + i * 260 - 300, h = 120 + (i * 53) % 70; organelleHouse(c, x, H - 90 - cy * 0.05, h, i, lit); }
    for (let i = 0; i < 6; i++) { const x = (i * 337 + t * 12) % (W + 200) - 100; ell(c, x, 80 + (i * 47) % 120, 50, 18); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); }
  } else if (map.theme === 'digest') {
    for (let i = 0; i < 12; i++) { const x = px(0.2, 1500) + i * 140 - 200; c.beginPath(); c.moveTo(x - 50, H); c.quadraticCurveTo(x, H - 240 - (i % 3) * 60, x + 50, H); c.fillStyle = 'rgba(255,120,150,.18)'; c.fill(); }
    for (let i = 0; i < 14; i++) { const x = px(0.4, 1400) + i * 110 - 150; rr(c, x, -20, 34, 120 + (i * 37) % 90, 17); c.fillStyle = 'rgba(255,170,190,.28)'; c.fill(); }
    for (let i = 0; i < 18; i++) { const x = (i * 211) % W, y = (i * 97 + t * 30) % H; ell(c, x, y, 3, 3); c.fillStyle = 'rgba(255,240,180,.35)'; c.fill(); }
  } else if (map.theme === 'lung') {
    c.save(); c.translate(W / 2 - cx * 0.1, H - (cy * 0.25) % 600 + 200); bronchTree(c, 0, 0, -Math.PI / 2, 220, 7); c.restore();
    for (let i = 0; i < 26; i++) { const x = (i * 173 - cx * 0.3) % W, y = H - ((i * 131 + t * 40 + cy * 0.3) % (H + 40)); ell(c, (x + W) % W, y, 6 + (i % 4) * 3, 6 + (i % 4) * 3); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke(); }
  } else if (map.theme === 'vessel') {
    for (let i = 0; i < 10; i++) { const x = px(0.25, 1500) + i * 170 - 200; rr(c, x, 0, 60, H, 30); c.fillStyle = 'rgba(255,90,100,.08)'; c.fill(); }
    for (let i = 0; i < 16; i++) { const x = ((i * 157 - t * 90 - cx * 0.5) % (W + 100) + W + 100) % (W + 100) - 50, y = 80 + (i * 83) % (H - 300); rbc(c, x, y, 16, 0.25); }
  } else if (map.theme === 'kidney') {
    for (let i = 0; i < 7; i++) { const x = px(0.2, 1400) + i * 220 - 200; c.beginPath(); c.moveTo(x, H); c.bezierCurveTo(x - 60, H - 300, x + 160, H - 380, x + 80, H - 520); c.lineWidth = 34; c.strokeStyle = 'rgba(180,160,255,.18)'; c.stroke(); }
    for (let i = 0; i < 20; i++) { const x = (i * 199) % W, y = (i * 113 + t * 60) % H; c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 5, y + 2, x, y + 5); c.quadraticCurveTo(x - 5, y + 2, x, y - 6); c.fillStyle = 'rgba(160,220,255,.4)'; c.fill(); }
  }
}
function organelleHouse(c, x, y, h, i, lit) {
  const cols = ['#ffd1a6', '#c6e6ff', '#ffe8a3', '#e3c6ff'], col = cols[i % 4];
  c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 50, y - h * 0.55); c.quadraticCurveTo(x, y - h * 1.15, x + 50, y - h * 0.55); c.lineTo(x + 50, y); c.closePath(); fillS(c, col);
  rr(c, x - 12, y - 36, 24, 36, 10); fillS(c, '#a8754a', 2);
  for (const wx of [-30, 30]) { ell(c, x + wx * 0.75, y - h * 0.48, 9, 9); fillS(c, lit ? '#fff09a' : '#5a6070', 2); }
}
function bronchTree(c, x, y, a, len, d) {
  if (d === 0 || len < 14) { ell(c, x, y, 16, 16); c.fillStyle = 'rgba(255,190,210,.55)'; c.fill(); return; }
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.lineWidth = d * 5; c.lineCap = 'round'; c.strokeStyle = 'rgba(240,170,180,.5)'; c.stroke();
  bronchTree(c, x2, y2, a - 0.45, len * 0.72, d - 1); bronchTree(c, x2, y2, a + 0.45, len * 0.72, d - 1);
}
function rbc(c, x, y, r, alpha = 1) {
  c.save(); c.globalAlpha = alpha; ell(c, x, y, r, r * 0.8); fillS(c, '#e8404f', 2); ell(c, x, y, r * 0.45, r * 0.32); c.fillStyle = '#b52a38'; c.fill(); c.restore();
}

/** 기관지 나무 in world space: a ringed trunk up the middle, a twig to every branch foothold, 폐포 at the top */
function drawLungTree(c, map) {
  const tx = 750, top = 300, bot = map.ground;
  for (const [x, y, w, k] of map.plats) {
    if (k) continue;
    const ex = x + w / 2, sx = ex < tx ? tx - 50 : tx + 50;
    c.beginPath(); c.moveTo(sx, y + 70); c.quadraticCurveTo((sx + ex) / 2, y + 60, ex, y + 8);
    c.lineCap = 'round'; c.lineWidth = 20; c.strokeStyle = OL; c.stroke(); c.lineWidth = 14; c.strokeStyle = '#f6c3cb'; c.stroke();
  }
  rr(c, tx - 60, top, 120, bot - top, 40); c.fillStyle = '#f3b0ba'; c.fill(); stroke(c, 4);
  for (let y = top + 30; y < bot; y += 44) { rr(c, tx - 56, y, 112, 14, 7); c.fillStyle = '#fbd7dc'; c.fill(); }
  for (const [gx, gy] of [[1080, 250], [1150, 215], [1220, 250], [1110, 290], [1190, 292], [300, 260], [360, 230], [420, 262]]) { ell(c, gx, gy, 30, 28); fillS(c, '#ffb3c6', 3); ell(c, gx - 8, gy - 9, 8, 5, -0.5); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); }
}
const LUNG_STAGES = [[3300, '1단계 · 기관'], [2560, '2단계 · 기관지'], [1820, '3단계 · 더 가는 기관지'], [1080, '4단계 · 폐포 바로 앞'], [340, '꼭대기 · 폐포']];
// painted ledges (assets/sp/ledge-<theme>.png): caps at both ends and a middle that repeats, every other copy mirrored
// so the joins meet. top: how far down the picture its walkable top edge sits.
const LEDGE = {}, LEDGE_TOP = { town: 0.13, digest: 0.11, lung: 0.1, vessel: 0.13, kidney: 0.14 };
function ledgeOf(theme) {
  const im = SP['ledge-' + theme]; if (!im) return null;
  if (!LEDGE[theme]) {
    let body = THEME[theme].body;
    try { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(im.width >> 1, Math.floor(im.height * 0.6), 1, 1).data; if (d[3] > 200) body = `rgb(${d[0]},${d[1]},${d[2]})`; } catch (e) { /* file:// pictures cannot be read back */ }
    LEDGE[theme] = { im, top: LEDGE_TOP[theme] || 0.12, body };
  }
  return LEDGE[theme];
}
function slice3(c, im, sh, x, y, w, h) {
  const cw = im.width * 0.2, k = h / sh, dc = Math.min(cw * k, w / 2), mx = im.width * 0.3, mw = im.width * 0.4, dm = mw * k;
  c.drawImage(im, 0, 0, cw, sh, x, y, dc, h);
  c.drawImage(im, im.width - cw, 0, cw, sh, x + w - dc, y, dc, h);
  for (let p = x + dc, i = 0; p < x + w - dc - 0.5; p += dm, i++) {
    const ww = Math.min(dm, x + w - dc - p), sw = mw * ww / dm;
    if (i % 2) { c.save(); c.translate(p + ww, y); c.scale(-1, 1); c.drawImage(im, mx + mw - sw, 0, sw, sh, 0, 0, ww, h); c.restore(); }
    else c.drawImage(im, mx, 0, sw, sh, p, y, ww, h);
  }
}
/** a foothold in the map's look; solid ground is drawn as a deep block */
function drawPlat(c, map, x, y, w, kind) {
  const T = THEME[map.theme], L = ledgeOf(map.theme);
  if (L) {
    if (kind === 'ground') { // the top of the ledge as a band, then its own body colour all the way down
      const h = 90, sh = L.im.height * 0.5;
      c.fillStyle = L.body; c.fillRect(x, y + h * 0.4, w, map.h - y + 400);
      slice3(c, L.im, sh, x - 20, y - L.top * 2 * h, w + 40, h);
    } else {
      const h = kind === 'floor' ? 46 : 40;
      slice3(c, L.im, L.im.height, x - 6, y - L.top * h, w + 12, h);
    }
    return;
  }
  if (kind === 'ground') {
    c.fillStyle = T.body; c.fillRect(x, y, w, map.h - y + 400);
    c.fillStyle = T.top; c.fillRect(x, y - 4, w, 18);
    c.beginPath(); for (let i = x; i < x + w; i += 26) { c.moveTo(i, y + 14); c.quadraticCurveTo(i + 13, y + 26, i + 26, y + 14); } c.fillStyle = T.top; c.fill();
    c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + w, y - 4); stroke(c, 3);
    for (let i = x + 40; i < x + w; i += 150) { ell(c, i, y + 70 + (i % 3) * 20, 10, 6); c.fillStyle = T.edge; c.fill(); }
    return;
  }
  const hgt = kind === 'floor' ? 26 : 22;
  rr(c, x, y - 4, w, hgt, 10); c.fillStyle = T.body; c.fill(); stroke(c, 2.5);
  rr(c, x - 2, y - 6, w + 4, 11, 6); fillS(c, T.top, 2.5);
  if (map.theme === 'lung') { for (let i = x + 12; i < x + w - 6; i += 22) { ell(c, i, y + 12, 4, 3); c.fillStyle = T.edge; c.fill(); } }
  else if (map.theme === 'town') { for (let i = x + 10; i < x + w - 6; i += 30) leaf(c, i, y - 4, 0.35); }
}
function drawRope(c, x, top, bot) {
  c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot); c.lineWidth = 7; c.strokeStyle = OL; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#c9a26a'; c.stroke();
  for (let y = top + 10; y < bot; y += 16) { c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y + 5); c.lineWidth = 1.5; c.strokeStyle = '#8a6a3a'; c.stroke(); }
}
function drawPortal(c, x, y, t, label) {
  c.save(); c.translate(x, y);
  for (let i = 0; i < 3; i++) {
    c.beginPath(); c.ellipse(0, -46, 24 - i * 6, 46 - i * 10, 0, t * (2 + i) + i, t * (2 + i) + i + Math.PI * 1.5);
    c.lineWidth = 6 - i; c.strokeStyle = ['rgba(120,200,255,.9)', 'rgba(190,240,255,.9)', 'rgba(255,255,255,.95)'][i]; c.stroke();
  }
  for (let i = 0; i < 6; i++) { const a = t * 2 + i; ell(c, Math.cos(a) * 20, -46 + Math.sin(a * 1.3) * 36, 2.5, 2.5); c.fillStyle = '#e6fbff'; c.fill(); }
  c.restore();
}
function drawValve(c, x, y, open, t) { // 판막: two flaps that open toward the right
  c.save(); c.translate(x, y);
  for (const s of [-1, 1]) { c.save(); c.translate(0, s > 0 ? 0 : -150); c.rotate(s * (open ? 0.9 : 0.15)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(40, s * -40, 6, s * -76); c.lineTo(-4, 0); c.closePath(); fillS(c, '#f2a3a8'); c.restore(); }
  c.restore();
}
function drawClot(c, x, y, t) { // 혈전: a rolling clump of platelets
  c.save(); c.translate(x, y - 22); c.rotate(t * 5);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ell(c, Math.cos(a) * 12, Math.sin(a) * 12, 10, 8, a); fillS(c, '#8a2a36', 2); }
  ell(c, 0, 0, 10, 10); fillS(c, '#a53a48', 2);
  c.restore();
}
function drawBlood(c, map, cx, cy, t, W) { // the 혈관 급류 at the bottom
  const y = map.hazard;
  c.beginPath(); c.moveTo(cx, y + 2000);
  for (let x = cx - 40; x < cx + W + 40; x += 20) c.lineTo(x, y + Math.sin(x * 0.03 + t * 4) * 6);
  c.lineTo(cx + W + 40, y + 2000); c.closePath(); c.fillStyle = '#9e1424'; c.fill(); stroke(c, 3);
  for (let i = 0; i < 12; i++) rbc(c, cx + ((i * 173 + t * 160) % (W + 80)) - 40, y + 30 + (i % 3) * 22, 14);
}
function drawItemIcon(c, id, x, y, s = 1) {
  const it = ITEMS[id]; c.save(); c.translate(x, y); c.scale(s, s);
  if (id === 'glucose') hexa(c, 0, 0, 10, it.color);
  else if (id === 'amino') { ell(c, -5, 0, 7, 7); fillS(c, '#e86a8a', 2); ell(c, 5, 0, 7, 7); fillS(c, '#58b368', 2); }
  else if (id === 'fatty') { c.beginPath(); c.moveTo(-10, 6); for (let i = 0; i < 5; i++) c.lineTo(-10 + (i + 1) * 4, i % 2 ? 6 : -6); stroke(c, 3, '#c69a10'); ell(c, -11, 6, 4, 4); fillS(c, it.color, 2); }
  else if (id === 'oxygen') { ell(c, -5, 0, 7, 7); fillS(c, it.color, 2); ell(c, 5, 0, 7, 7); fillS(c, it.color, 2); }
  else if (id === 'co2') { ell(c, -9, 0, 5, 5); fillS(c, '#e8504a', 2); ell(c, 0, 0, 6, 6); fillS(c, '#555c66', 2); ell(c, 9, 0, 5, 5); fillS(c, '#e8504a', 2); }
  else if (id === 'urea') { c.beginPath(); c.moveTo(-9, 8); c.bezierCurveTo(-11, -14, 11, -14, 9, 8); c.lineTo(-9, 8); fillS(c, it.color, 2); }
  else if (id === 'energy') { c.beginPath(); c.moveTo(3, -12); c.lineTo(-7, 2); c.lineTo(0, 2); c.lineTo(-3, 12); c.lineTo(8, -3); c.lineTo(1, -3); c.closePath(); fillS(c, it.color, 2); }
  else { rr(c, -9, -9, 18, 18, 6); fillS(c, it.color, 2); }
  c.restore();
}

// ---- 어려움 장애물 -------------------------------------------------------------------------------
function drawOrb(c, x, y, t, theme) { // 먼지 덩어리 (기관지) or 혈전 덩어리 (혈관): shoves you off
  if (theme === 'vessel') { drawClot(c, x, y + 22, t); return; }
  c.save(); c.translate(x, y); c.rotate(t * 2);
  c.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 17 : 23; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fillS(c, '#9a9488', 2.5);
  c.rotate(-t * 2); ell(c, -6, -3, 3, 3.5); ell(c, 6, -3, 3, 3.5); c.fillStyle = OL; c.fill();
  c.beginPath(); c.moveTo(-10, -10); c.lineTo(-3, -7); c.moveTo(10, -10); c.lineTo(3, -7); stroke(c, 2);
  c.restore();
}
function drawGeyser(c, x, y, h, warn, theme) { // a blast from below: bubbles first, then a column
  const col = theme === 'vessel' ? ['rgba(255,120,120,.85)', '#ffd0d0'] : ['rgba(230,245,255,.9)', '#ffffff'];
  if (warn) { for (let i = 0; i < 5; i++) { ell(c, x - 18 + i * 9, y - 6 - (i % 2) * 6, 5, 5); c.fillStyle = col[0]; c.fill(); stroke(c, 1.5); } return; }
  const g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, col[0]); g.addColorStop(1, col[1]);
  c.beginPath(); c.moveTo(x - 26, y); c.quadraticCurveTo(x - 34, y - h * 0.6, x - 12, y - h); c.lineTo(x + 12, y - h); c.quadraticCurveTo(x + 34, y - h * 0.6, x + 26, y); c.closePath();
  c.fillStyle = g; c.fill(); stroke(c, 2.5, 'rgba(42,28,36,.6)');
}
