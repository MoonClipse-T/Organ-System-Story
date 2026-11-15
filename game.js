// PROTOTYPE - NOT FOR PRODUCTION
// Question: 기관계마다 다른 메이플식 퀘스트를 깨다 보면 소화·호흡·순환·배설이 세포 호흡으로 이어진다는 걸 아이들이 놀면서 느끼는가?
// Date: 2026-11-16
// 몸속 원정대: login → 입장 문제 → 직업·성별 → 세포 마을 (파티는 여기서만). Each quest: every member does the task,
// the leader writes the answer, the teacher OKs it, the party moves on (QUESTS in data.js). The teacher can also send
// a party a 거짓말 탐지기 trial and open its boss lair; a party missing any organ system cannot win there.
'use strict';

const params = new URLSearchParams(location.search);
const tune = new Proxy({}, { get: (_, k) => CONFIG[k].value });
const STEP = 1 / 60, W = 1280, H = 720, FONT = "'Jua', 'Malgun Gothic', sans-serif";
const clock = window.GAME_CLOCK || { now: () => performance.now() / 1000 };
let seed = Number(params.get('seed')) || CONFIG.seed;
function rng() { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const hash2 = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }; // same on every tablet
const events = [];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// ---- Screen ---------------------------------------------------------------------------------------
const canvas = $('#game'), ctx = canvas.getContext('2d');
const VIEW = { k: 1 };
function fit() {
  const k = Math.min(innerWidth / W, innerHeight / H), r = k * (devicePixelRatio || 1);
  canvas.width = Math.round(W * r); canvas.height = Math.round(H * r);
  canvas.style.width = Math.round(W * k) + 'px'; canvas.style.height = Math.round(H * k) + 'px';
  canvas.style.marginTop = Math.max(0, Math.floor((innerHeight - H * k) / 2)) + 'px';
  ctx.setTransform(r, 0, 0, r, 0, 0); VIEW.k = k;
}
addEventListener('resize', fit); fit();
function text(s, x, y, size, c, align = 'center', outline = null) {
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = c; ctx.fillText(s, x, y);
}

// ---- Input ----------------------------------------------------------------------------------------
const down = new Set(), hit = new Set();
const pressed = c => hit.has(c), held = c => down.has(c);
const typing = () => document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
addEventListener('keydown', e => {
  startAudio(); if (typing()) return;
  if (!e.repeat) { down.add(e.code); hit.add(e.code); }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'AltLeft'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => down.delete(e.code));
addEventListener('blur', () => down.clear());
const K = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], jump: ['Space', 'AltLeft', 'KeyC'], atk: ['KeyZ', 'ControlLeft', 'KeyJ'], skill: ['KeyX', 'KeyK'] };
const isHeld = a => K[a].some(held), isHit = a => K[a].some(pressed);
document.querySelectorAll('[data-key]').forEach(b => { // the tablet buttons hold a key while pressed
  const code = b.dataset.key;
  const on = e => { e.preventDefault(); startAudio(); if (!down.has(code)) hit.add(code); down.add(code); b.classList.add('on'); b.setPointerCapture?.(e.pointerId); };
  const off = e => { e.preventDefault(); down.delete(code); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
});

// ---- Sound: tones + optional music files (assets/bgm-<name>.mp3, the teacher's own) -------------------
let audio = null, muted = false;
function startAudio() {
  if (!audio) { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const out = ac.createGain(); out.gain.value = tune.volume; out.connect(ac.destination); audio = { ac, out }; } catch (e) { return; } }
  if (audio.ac.state === 'suspended') audio.ac.resume();
  if (BGM.want && BGM.el.paused && !muted) BGM.el.play().catch(() => {});
}
function tone(freq, dur, type = 'square', vol = 0.15, slide = 0) {
  if (!audio || muted) return;
  const t = audio.ac.currentTime, o = audio.ac.createOscillator(), g = audio.ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(audio.out); o.start(t); o.stop(t + dur);
}
const SFX = {
  jump: () => tone(520, 0.12, 'sine', 0.12, 1.6), hit: () => tone(180, 0.08, 'square', 0.12, 0.6), swing: () => tone(700, 0.06, 'triangle', 0.08, 0.5),
  pick: () => { tone(880, 0.07, 'sine', 0.12); setTimeout(() => tone(1320, 0.09, 'sine', 0.12), 60); }, hurt: () => tone(140, 0.2, 'sawtooth', 0.12, 0.5),
  portal: () => tone(300, 0.4, 'sine', 0.15, 3), lvup: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.15), i * 90)),
  quest: () => [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.15), i * 110)),
  alarm: () => [880, 660, 880, 660].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.12), i * 160)),
};
const BGM = { el: new Audio(), want: '' };
BGM.el.loop = true; BGM.el.volume = 0.45;
function music(name) {
  if (BGM.want === name) return; BGM.want = name; BGM.el.src = `assets/bgm-${name}.mp3`;
  BGM.el.onerror = () => { BGM.want = ''; }; // no file: silence, the game still plays
  if (audio && !muted) BGM.el.play().catch(() => {});
}
function setMuted(m) { muted = m; if (audio) audio.out.gain.value = m ? 0 : tune.volume; if (m) BGM.el.pause(); else if (BGM.want) BGM.el.play().catch(() => {}); $('#bMute').textContent = m ? '소리 켜기' : '소리 끄기'; }

// ---- The adventurer ---------------------------------------------------------------------------------
const SAVE_KEY = 'bq:save';
// what is saved: { name, job, st{STR..}, look{g}, lv, exp, inv{}, fl{pro, left, loaded, exhaled, urine, seen, trials{}}, pid, lastSt, quiz, map, x, y }
let S = null;
function save() { if (S && G.me) sset(SAVE_KEY, JSON.stringify({ ...S, map: G.map && G.map.inst ? 'town' : G.mapId, x: Math.round(G.me.x), y: Math.round(G.me.y) })); }
function loadSave() { try { return JSON.parse(sget(SAVE_KEY) || 'null'); } catch (e) { return null; } }
const job = () => JOBS[S.job];
const mainStat = () => S.st[job().main];
const maxHp = () => Math.round(tune.hp_base + S.lv * tune.hp_per_lv + job().hpBonus + S.st.STR * 1);
const maxMp = () => Math.round(job().mpBase + S.lv * 5 + S.st.INT * 1.5);
const expNeed = () => tune.exp_per_lv * S.lv;
const has = (id, n = 1) => (S.inv[id] || 0) >= n;
function give(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; }
function take(id, n = 1) { S.inv[id] = Math.max(0, (S.inv[id] || 0) - n); if (!S.inv[id]) delete S.inv[id]; }

// ---- World state --------------------------------------------------------------------------------------
const G = {
  scene: 'login', t: 0, mapId: 'town', mapKey: 'town', map: null, me: null, cam: { x: 0, y: 0 }, mons: [], others: {}, drops: [], fx: [], nums: [], shots: [], fade: 0,
  host: false, net: null, ch: 0, id: '', unsub: [], killSeen: -1, hitSeq: 0, hitLog: [], hitSeen: {}, killLog: [], snapAt: 0, nextSend: 0, sentAt: 0, nextHost: 0, spawnAt: 0,
  P: null, pOff: null, banner: null, dlg: null, dead: false, sporeHit: {}, partyInv: null, trial: null, toxin: 0, toxinT: 0, modal: false,
};
const stage = () => (G.P ? G.P.st || 1 : S.fl.pro ? 1 : 0); // the party's quest step (QUESTS index)
const isLeader = () => !G.P || G.P.L === G.id;
const memberIds = () => (G.P && G.P.m ? Object.keys(G.P.m) : [G.id]);
const mapName = k => (MAPS[String(k).split('_')[0]] || {}).name || '';
const inMyParty = id => !!(G.P && G.P.m && G.P.m[id]);
function platsOf(map) { // static footholds plus the ground
  const p = map.plats.map(([x, y, w, k], i) => ({ x, y, w, k: k || 'plat', i }));
  if (map.ground) p.push({ x: 0, y: map.ground, w: map.w, k: 'ground', i: -1 });
  return p;
}
function moverAt(m, t) { // [x, y, w, dx, dy, period]: swings out and back
  const s = 0.5 - 0.5 * Math.cos((t / m[5]) * Math.PI * 2);
  return { x: m[0] + m[3] * s, y: m[1] + m[4] * s, w: m[2], k: 'mover' };
}
const netT = () => (G.net ? G.net.now() : Date.now()) / 1000;
// 어려움 장애물, timed on the shared clock so every tablet sees the same thing
const blinkPh = i => (netT() + i * 0.7) % 4.2; // gone while ≥ 2.8, flickers from 2.2
const blinkOff = i => !!(G.map.gim && G.map.gim.blink.includes(i) && blinkPh(i) >= 2.8);
const orbAt = o => ({ x: o[0] + (o[1] - o[0]) * (0.5 - 0.5 * Math.cos((netT() / o[3] + o[4]) * Math.PI * 2)), y: o[2] });
function geyserAt(g) { const ph = ((netT() + g[4]) % g[3]); return { warn: ph < 0.9, on: ph >= 0.9 && ph < 1.7, h: ph >= 0.9 && ph < 1.7 ? g[2] * Math.min(1, (ph - 0.9) / 0.2) : 0 }; }
function footholds() {
  let f = G.statics; if (G.map.gim) f = f.filter(p => !blinkOff(p.i));
  return G.map.movers ? f.concat(G.map.movers.map(m => moverAt(m, netT()))) : f;
}
const spawnY = x => G.map.ground || groundBelow(x, -9999); // where you stand when you arrive at x
function groundBelow(x, y) { // the highest foothold at or below y under x
  let best = null;
  for (const p of G.statics) if (x >= p.x && x <= p.x + p.w && p.y >= y - 2 && (!best || p.y < best.y)) best = p;
  return best ? best.y : (G.map.ground || G.map.h - 100);
}

function newMe(x, y) {
  return { x, y, vx: 0, vy: 0, f: 1, ground: null, rope: null, drop: 0, hurt: 0, inv: 0, atkT: -1, atkCd: 0, skillCd: 0, hp: maxHp(), mp: maxMp(), st: 'stand', at: 0, cp: -1 };
}
function enterMap(id, x, y) {
  const map = MAPS[id];
  G.mapId = id; G.map = map; G.mapKey = map.inst ? `${id}_${S.pid || G.id}` : id;
  G.statics = platsOf(map); G.mons = []; G.drops = []; G.shots = []; G.nums = []; G.killSeen = G.net ? -1 : 0; G.killLog = []; G.snapAt = 0; G.host = false; G.spawnAt = 0;
  G.toxin = 0; G.toxinT = 0; G.sporeHit = {};
  if (x === 'start') x = map.portals[0].x + 60;
  const py = y ?? spawnY(x);
  if (!G.me) G.me = newMe(x, py); else Object.assign(G.me, { x, y: py, vx: 0, vy: 0, ground: null, rope: null, cp: -1 });
  G.cam.x = x - W / 2; G.cam.y = py - H * 0.62; clampCam();
  G.fade = 1; G.banner = { big: map.name, small: map.sub, t: 2.4 };
  music(map.bgm); netMap(); pickHost(); if (!G.net) spawnAll(); save(); hud();
  events.push({ type: 'map', id });
}

// ---- Login / quiz / job (DOM screens) -------------------------------------------------------------------
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hide', s.id !== id)); }
function startLogin() {
  show('login'); G.scene = 'login';
  const sv = loadSave(), auto = sget('bq:auto');
  $('#chans').innerHTML = [1, 2, 3, 4, 5].map(n => `<button class="chan" data-ch="${n}">채널 ${n}</button>`).join('');
  let ch = Number(sget('bq:ch')) || 1;
  const mark = () => document.querySelectorAll('.chan').forEach(b => b.classList.toggle('sel', +b.dataset.ch === ch));
  document.querySelectorAll('.chan').forEach(b => b.onclick = () => { ch = +b.dataset.ch; mark(); }); mark();
  if (sv && sv.job) {
    $('#cont').classList.remove('hide'); $('#cont').textContent = `이어하기 · ${sv.name} (Lv.${sv.lv} ${JOBS[sv.job].name})`;
    $('#cont').onclick = () => { S = sv; sset('bq:ch', ch); go(ch); };
    $('#name').value = sv.name;
  }
  $('#newgame').onclick = () => {
    const name = $('#name').value.trim().slice(0, 8);
    if (!name) { $('#name').focus(); $('#name').placeholder = '이름을 먼저 써 주세요!'; return; }
    S = { name, job: '', st: Object.fromEntries(STATS.map(s => [s, tune.base_stat])), ap: 0, look: { g: 'boy' }, lv: 1, exp: 0, inv: {}, fl: { trials: {} }, pid: '', lastSt: 1 };
    sset('bq:ch', ch); startQuiz();
  };
  if (auto && sv && sv.job) { sset('bq:auto', ''); S = sv; go(ch); }
}
function startQuiz() {
  show('quiz'); G.scene = 'quiz';
  let i = 0, right = 0;
  const ask = () => {
    const Q = QUIZ[i];
    $('#qn').textContent = `입장 문제 ${i + 1} / ${QUIZ.length}`; $('#qq').textContent = Q.q;
    $('#qbar').style.width = `${(i / QUIZ.length) * 100}%`;
    $('#qa').innerHTML = Q.a.map((a, k) => `<button data-k="${k}"><b>${k + 1}</b> ${esc(a)}</button>`).join('');
    $('#qa').querySelectorAll('button').forEach(b => b.onclick = () => {
      const k = +b.dataset.k; if ($('#qa').dataset.lock) return; $('#qa').dataset.lock = 1;
      const ok = k === Q.c; if (ok) { right++; SFX.pick(); } else SFX.hurt();
      b.classList.add(ok ? 'ok' : 'no'); $('#qa').children[Q.c].classList.add('ok');
      setTimeout(() => { delete $('#qa').dataset.lock; i++; if (i < QUIZ.length) ask(); else done(); }, ok ? 650 : 1300);
    });
  };
  const done = () => {
    S.ap = right * tune.ap_per_answer; S.quiz = right;
    $('#qq').innerHTML = `${QUIZ.length}문제 중 <b>${right}</b>개 정답!<br>능력치 포인트 <b>${S.ap}</b> 획득`;
    $('#qbar').style.width = '100%'; $('#qn').textContent = '입장 문제 끝';
    $('#qa').innerHTML = '<button class="go">직업 고르러 가기</button>'; $('#qa .go').onclick = startJob;
    events.push({ type: 'quiz', right });
  };
  ask();
}
function startJob() {
  show('job'); G.scene = 'job';
  $('#jobs').innerHTML = Object.entries(JOBS).map(([k, j]) => `<button class="jcard" data-j="${k}"><canvas width="120" height="120"></canvas><b style="color:${j.color}">${j.name}</b><span>${j.blurb}</span><small>주 능력치 ${j.main} · 스킬 「${j.skill.name}」</small></button>`).join('');
  lookRow();
  document.querySelectorAll('.jcard').forEach(b => {
    b.onclick = () => { S.job = b.dataset.j; document.querySelectorAll('.jcard').forEach(x => x.classList.toggle('sel', x === b)); statPanel(); };
  });
  $('#stats').classList.add('hide');
}
function lookRow() { // 성별 only: each job has its own clothes
  const R = $('#lookRow');
  R.innerHTML = '<b>성별</b>' + GENDERS.map(([g, n]) => `<button class="chan ${S.look.g === g ? 'sel' : ''}" data-g="${g}">${n}</button>`).join('');
  R.querySelectorAll('button').forEach(b => b.onclick = () => { S.look.g = b.dataset.g; lookRow(); });
}
function drawJobCards() {
  document.querySelectorAll('.jcard canvas').forEach(cv => {
    const c = cv.getContext('2d'), j = cv.parentNode.dataset.j, sel = S.job === j;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 120, 120); c.translate(60, 110); c.scale(1.35, 1.35);
    drawHero(c, 0, 0, 1, j, S.look, { st: sel ? 'walk' : 'stand', t: G.t, atk: sel && (G.t % 2.4) < 0.3 ? (G.t % 2.4) / 0.3 : -1 });
  });
}
function statPanel() {
  const P = $('#stats'); P.classList.remove('hide');
  const base = Object.fromEntries(STATS.map(s => [s, tune.base_stat]));
  S.st = { ...base }; let left = S.ap;
  const draw = () => {
    P.innerHTML = `<h3>능력치 올리기 <span>남은 포인트 <b>${left}</b></span></h3>` + STATS.map(s => `<div class="st ${s === job().main ? 'main' : ''}"><span>${s}${s === job().main ? ' ★' : ''}</span><button data-s="${s}" data-d="-1">−</button><b>${S.st[s]}</b><button data-s="${s}" data-d="1">+</button></div>`).join('')
      + `<div class="row"><button id="auto">★ 주 능력치에 모두</button></div><button id="startB" class="go">모험 시작!</button><p class="tip">입장 문제를 맞힌 만큼 포인트가 생겨요. ★ 주 능력치가 높을수록 공격이 세져요.</p>`;
    P.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const s = b.dataset.s, d = +b.dataset.d; if (d > 0 && left > 0) { S.st[s]++; left--; } if (d < 0 && S.st[s] > base[s]) { S.st[s]--; left++; } draw(); });
    $('#auto').onclick = () => { S.st[job().main] += left; left = 0; draw(); };
    $('#startB').onclick = () => { S.st[job().main] += left; S.ap = 0; go(Number(sget('bq:ch')) || 1); };
  };
  draw();
}

// ---- Joining a channel ---------------------------------------------------------------------------------
async function go(ch) {
  show('loading'); G.scene = 'loading'; G.ch = ch; G.id = myId();
  const say = m => { $('#loadMsg').textContent = m; };
  S.fl = S.fl || {}; S.fl.trials = S.fl.trials || {}; S.look = { g: S.look && S.look.g === 'girl' ? 'girl' : 'boy' };
  try { G.net = params.get('offline') ? null : await netConnect(chanBase(ch), say); }
  catch (e) { G.net = null; say('서버에 연결하지 못해 혼자 하기로 시작해요.'); await new Promise(r => setTimeout(r, 1200)); }
  if (G.net) {
    G.net.onKids('p', ps => { G.others = Object.fromEntries(Object.entries(ps || {}).filter(([k]) => k !== G.id)); pickHost(); refreshParty(); });
    G.net.on('inv/' + G.id, iv => { if (iv && G.net.now() - iv.t < 30000 && iv.pid !== S.pid) invitePopup(iv); });
  }
  G.me = null;
  const m = S.map && MAPS[S.map] && !MAPS[S.map].inst ? S.map : 'town';
  enterMap(m, S.map ? S.x : 300, S.map ? S.y : undefined);
  G.me.hp = maxHp(); G.me.mp = maxMp();
  if (S.pid) watchParty(S.pid); else if (!G.net && S.fl.left) makeParty(true);
  show('play'); G.scene = 'play'; startAudio(); hud(); refreshParty();
  $('#chanTag').textContent = `채널 ${ch}${G.net ? '' : ' · 혼자 (선생님 확인 없이 자동 통과)'}`;
  if (!S.fl.pro) toast('셀리 촌장에게 다가가 ↑ 키(또는 촌장을 터치)로 말을 걸어 보세요!');
  events.push({ type: 'join', ch, mode: G.net ? G.net.mode : 'solo' });
}
function netMap() { // listen to the map I am on
  G.unsub.forEach(f => f && f()); G.unsub = [];
  if (!G.net) return;
  const k = G.mapKey;
  G.unsub.push(G.net.on('m/' + k, snap => onSnap(snap)));
  G.unsub.push(G.net.on('k/' + k, kk => onKills(kk)));
  G.unsub.push(G.net.onKids('d/' + k, d => onHits(d)));
}
function fresh(p) { return p && G.net && G.net.now() - p.t < tune.stale_ms; }
const onMyMap = p => fresh(p) && p.m === G.mapKey;
function pickHost() {
  if (!G.map) return;
  const was = G.host;
  if (!G.net) { G.host = true; return; }
  const ids = [G.id, ...Object.entries(G.others).filter(([, p]) => onMyMap(p)).map(([k]) => k)].sort();
  G.host = ids[0] === G.id;
  if (G.host && !was) { // I take over: keep the last picture of the monsters if it is recent, else fill the map (after a moment, when someone may still be sending one)
    if (!G.mons.length || G.net.now() - G.snapAt > 4000) { G.mons = []; G.spawnAt = netT() + (ids.length > 1 ? 1.5 : 0.01); }
    G.mons.forEach(m => { m.tx = undefined; if (m.sx === undefined) m.sx = m.x; });
  }
}

// ---- Monsters (moved by the map's host) ----------------------------------------------------------------
function spawnAll() {
  G.mons = []; let n = 0;
  for (const s of G.map.spawns) {
    const p = s.plat < 0 ? { x: 260, w: G.map.w - 520, y: G.map.ground } : (([x, y, w]) => ({ x, y, w }))(G.map.plats[s.plat]);
    for (let i = 0; i < s.n; i++) {
      const M = MONS[s.k], x = p.x + 30 + ((i + 0.5) / s.n) * (p.w - 60);
      G.mons.push({ id: 'm' + n++, k: s.k, x, y: p.y, lo: p.x + 20, hi: p.x + p.w - 20, sx: x, dir: rng() < 0.5 ? -1 : 1, hp: M.hp, mhp: M.hp, dead: 0, tt: rng() * 2, flash: 0 });
    }
  }
  if (G.mapId === 'lair') spawnBoss();
}
function spawnBoss() {
  const onMap = 1 + Object.values(G.others).filter(onMyMap).length;
  const hp = tune.boss_hp_per_player * Math.max(2, onMap), x = G.map.w * 0.6;
  G.mons = G.mons.filter(m => m.k !== 'boss');
  G.mons.push({ id: 'B', k: 'boss', x, y: G.map.ground, lo: 200, hi: G.map.w - 150, sx: x, dir: -1, hp, mhp: hp, dead: 0, tt: 0, flash: 0, bt: Math.round(netT() * 1000) });
}
function hostTick(dt) {
  const now = netT();
  if (G.spawnAt && now >= G.spawnAt) { G.spawnAt = 0; if (!G.mons.length) spawnAll(); }
  const missing = bossMissing().length;
  for (const m of G.mons) {
    const M = MONS[m.k];
    if (m.dead) { if (m.k !== 'boss' && now >= m.dead) { m.dead = 0; m.hp = m.mhp; m.x = m.sx; m.ag = ''; } continue; }
    const chase = m.ag && now < m.agT ? (m.ag === G.id ? G.me : G.others[m.ag]) : null;
    if (m.k === 'boss') { // walks toward the nearest adventurer; heals while the party is missing an organ system
      const tg = [G.me, ...Object.values(G.others).filter(onMyMap)].reduce((a, p) => (Math.abs(p.x - m.x) < Math.abs(a.x - m.x) ? p : a), G.me);
      m.dir = tg.x < m.x ? -1 : 1; if (Math.abs(tg.x - m.x) > 60) m.x += m.dir * M.speed * dt;
      if (missing) m.hp = Math.min(m.mhp, m.hp + m.mhp * 0.03 * dt);
    } else if (chase && (chase === G.me || onMyMap(chase)) && Math.abs(chase.y - m.y) < 140) { // 맞으면 쫓아옴
      m.dir = chase.x < m.x ? -1 : 1; if (Math.abs(chase.x - m.x) > 12) m.x += m.dir * M.speed * tune.aggro_speed * dt;
    } else {
      m.tt -= dt; if (m.tt <= 0) { m.tt = 1.5 + rng() * 2.5; m.dir = rng() < 0.25 ? 0 : rng() < 0.5 ? -1 : 1; }
      m.x += m.dir * M.speed * dt;
    }
    if (m.x < m.lo) { m.x = m.lo; m.dir = 1; } if (m.x > m.hi) { m.x = m.hi; m.dir = -1; }
  }
  if (G.net && now * 1000 >= G.nextHost) {
    G.nextHost = now * 1000 + 1000 / tune.host_hz;
    G.net.set('m/' + G.mapKey, { h: G.id, t: G.net.now(), l: G.mons.map(m => [m.id, m.k, Math.round(m.x), Math.round(m.y), Math.round(m.hp), m.mhp, m.dir, m.dead ? 1 : 0, m.lo, m.hi, m.bt || 0]) });
  }
}
function onSnap(s) {
  if (!s || !s.l) return;
  G.snapAt = s.t || 0;
  const unpack = ([id, k, x, y, hp, mhp, dir, dead, lo, hi, bt]) => ({ id, k, x, y, sx: x, hp, mhp, dir, dead: dead ? netT() + tune.respawn : 0, lo, hi, tt: 1, flash: 0, bt });
  if (G.host && s.h !== G.id) { // two hosts for a moment: the lower id wins; a newcomer host first takes over the monsters it finds
    if (s.h < G.id) G.host = false;
    else if (G.spawnAt) { G.spawnAt = 0; G.mons = s.l.map(unpack); return; }
    else return;
  }
  if (G.host) return;
  const old = Object.fromEntries(G.mons.map(m => [m.id, m]));
  G.mons = s.l.map(([id, k, x, y, hp, mhp, dir, dead, lo, hi, bt]) => {
    const o = old[id] || { id, k, x, y, flash: 0, sx: x };
    return Object.assign(o, { k, tx: x, y, hp, mhp, dir, dead: dead ? 1 : 0, lo, hi, bt });
  });
}
/** a hit I land: the host applies it, everyone else sends it to the host */
function landHit(m, dmg) {
  if (m.k === 'boss') { // the boss rules: no energy, no damage; no nutrients, almost none
    if (stage() <= 4) { G.nums.push({ x: m.x, y: m.y - 190, v: '보호막! 에너지가 없어요', t: 0, item: true }); return; }
    if (stage() <= 1) dmg = Math.max(1, Math.round(dmg * 0.02));
  }
  G.nums.push({ x: m.x + (rng() - 0.5) * 20, y: m.y - MONS[m.k].h - 10, v: dmg, t: 0, mine: true });
  m.flash = 0.15; SFX.hit();
  if (G.host) applyHit(m.id, dmg, G.id);
  else if (G.net) {
    G.hitSeq = Math.max(G.hitSeq + 1, Date.now()); G.hitLog.push([G.hitSeq, m.id, dmg]); if (G.hitLog.length > 14) G.hitLog.shift();
    G.net.set(`d/${G.mapKey}/${G.id}`, { s: G.hitSeq, h: G.hitLog });
  }
}
function onHits(d) {
  if (!G.host || !d) return;
  for (const [pid, rec] of Object.entries(d)) {
    if (pid === G.id || !rec || !rec.h) continue;
    const seen = G.hitSeen[pid] ?? (G.hitSeen[pid] = rec.s); // hits from before I became host are old news
    for (const [s, mid, dmg] of rec.h) if (s > seen) applyHit(mid, Math.min(9999, dmg | 0), pid);
    G.hitSeen[pid] = Math.max(seen, rec.s);
  }
}
function applyHit(mid, dmg, by) {
  const m = G.mons.find(x => x.id === mid); if (!m || m.dead) return;
  m.hp -= dmg; m.flash = 0.15; m.ag = by; m.agT = netT() + tune.aggro_time;
  if (m.hp <= 0) {
    m.hp = 0; m.dead = m.k === 'boss' ? 1 : netT() + tune.respawn;
    const s = Math.max(((G.killLog[G.killLog.length - 1] || [])[0] || 0) + 1, Math.floor(netT() * 1000)); // grows across hosts
    G.killLog.push([s, m.id, m.k, by, Math.round(m.x), Math.round(m.y)]); if (G.killLog.length > 20) G.killLog.shift();
    if (G.net) G.net.set('k/' + G.mapKey, { s, l: G.killLog, h: G.id });
    else onKills({ s, l: G.killLog });
    if (m.k === 'boss') { G.mons = G.mons.filter(x => x !== m); if (G.net && S.pid) G.net.set(`pty/${S.pid}/br`, { win: G.net.now() }); }
  }
}
function onKills(k) {
  if (!k || !k.l) { if (G.killSeen < 0) G.killSeen = 0; return; }
  if (k.h !== G.id) G.killLog = k.l.slice(); // kept, for when I become the host
  if (G.killSeen < 0) { G.killSeen = k.s; return; } // kills from before I came are old news
  for (const [s, , kind, by, x, y] of k.l) {
    if (s <= G.killSeen) continue;
    G.fx.push({ k: 'die', mk: kind, x, y, t: 0 });
    if (kind === 'boss') bossWin();
    else if (by === G.id || inMyParty(by)) { gainExp(MONS[kind].exp); if (by === G.id) countKill(kind); }
  }
  G.killSeen = Math.max(G.killSeen, k.s);
}
// 파티 사냥: one count for the whole party; each member writes only their own kills (cnt/<step>/<me>), the screen adds them up
const killNeed = k => QUESTS[stage()].kill[k] * memberIds().length;
function killTotal(k) { const c = (G.P && G.P.cnt && G.P.cnt[stage()]) || {}; return Object.values(c).reduce((s, m) => s + ((m && m[k]) || 0), 0); }
function countKill(kind) {
  const q = stage(), Q = QUESTS[q]; if (!Q || !Q.kill || !Q.kill[kind] || killTotal(kind) >= killNeed(kind)) return;
  const mine = { ...((G.P && G.P.cnt && G.P.cnt[q] && G.P.cnt[q][G.id]) || {}) }; mine[kind] = (mine[kind] || 0) + 1;
  if (G.net && S.pid) G.net.set(`pty/${S.pid}/cnt/${q}/${G.id}`, mine);
  if (G.P) { G.P.cnt = G.P.cnt || {}; (G.P.cnt[q] = G.P.cnt[q] || {})[G.id] = mine; }
  G.nums.push({ x: G.me.x, y: G.me.y - 120, v: `${MONS[kind].name} ${killTotal(kind)}/${killNeed(kind)}`, t: 0, item: true });
  if (killsDone()) { SFX.quest(); toast(`사냥 목표 달성! ${NPCS[Q.at].name}에게 가요.`); }
  hud(); refreshParty();
}
const killsDone = () => { const Q = QUESTS[stage()]; return !Q.kill || Object.keys(Q.kill).every(k => killTotal(k) >= killNeed(k)); };
function gainExp(n) {
  S.exp += n; G.nums.push({ x: G.me.x, y: G.me.y - 90, v: `EXP +${n}`, t: 0, exp: true });
  while (S.exp >= expNeed()) {
    S.exp -= expNeed(); S.lv++; S.st[job().main] += 3; G.me.hp = maxHp(); G.me.mp = maxMp();
    G.fx.push({ k: 'lv', x: G.me.x, y: G.me.y, t: 0 }); SFX.lvup(); G.banner = { big: `레벨 업! Lv.${S.lv}`, small: `${job().main} +3`, t: 2 };
  }
  save(); hud();
}

// ---- Boss lair: one per party, opened by the teacher ----------------------------------------------------
const bossMissing = () => (G.mapId === 'lair' ? BOSS_RULES.filter(r => stage() <= r.q) : []);
function bossNow() { return G.mons.find(m => m.k === 'boss' && !m.dead); }
const SPORE = { every: 5, warn: 1.1, fall: 0.6, n: 9, spread: 1000 };
function spores() { // where the boss's spores land this cycle (same on every tablet)
  const b = bossNow(); if (!b || !b.bt) return [];
  const age = netT() - b.bt / 1000; if (age < 3) return [];
  const n = Math.floor(age / SPORE.every), ph = age - n * SPORE.every;
  if (ph > SPORE.warn + SPORE.fall + 0.25) return [];
  return Array.from({ length: SPORE.n }, (_, i) => ({ id: n * 100 + i, x: b.x + (hash2(b.bt % 9973 + n, i) - 0.5) * SPORE.spread, gy: G.map.ground, ph }));
}
function bossWin() {
  if (G.mapId !== 'lair') return;
  gainExp(MONS.boss.exp); S.fl.boss = (S.fl.boss || 0) + 1; save(); SFX.quest();
  G.banner = { big: '세균 대왕을 물리쳤다!', small: '소화·호흡·순환·배설, 그리고 세포 호흡이 모두 함께 일했어요!', t: 6 };
  setTimeout(showLinks, 2500);
}
function bossLose() { // I fell in the lair: say why, from the organ systems the party never finished
  const miss = BOSS_RULES.filter(r => stage() <= r.q), box = $('#card');
  if (G.net && S.pid) G.net.set(`pty/${S.pid}/br`, { lose: G.net.now(), miss: miss.map(r => r.sys) });
  box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:#c8324a"><small>세균 대왕에게 졌어요</small><h2>${miss.length ? '기관계가 모자라요!' : '아쉽게 졌어요'}</h2>`
    + (miss.length ? `<p>우리 몸은 기관계가 <b>모두 함께</b> 일해야 에너지를 얻어요. 이번 파티에 없었던 것:</p><ul class="miss">${miss.map(r => `<li style="--c:${SYS[r.sys].color}"><b>${SYS[r.sys].name} · ${r.name}</b> ${r.text}</li>`).join('')}</ul>`
      : '<p>모든 기관계를 갖췄어요. 포자를 피하고 파티와 함께 다시 도전해요!</p>')
    + '<button class="go">마을로</button></div>';
  box.querySelector('button').onclick = () => { box.classList.add('hide'); G.modal = false; };
}

// ---- Party: up to 4, made in town only; the teacher runs it ------------------------------------------------
function watchParty(pid) {
  if (G.pOff) G.pOff(); G.pOff = null;
  if (!G.net) return;
  G.pOff = G.net.on('pty/' + pid, P => onParty(pid, P));
}
function onParty(pid, P) {
  if (pid !== S.pid) return;
  const was = G.P; G.P = P && P.m && P.m[G.id] ? P : null;
  if (!G.P) { // disbanded, or the teacher took me out: I keep my step and go on alone
    if (was) { toast('파티에서 빠졌어요. 혼자 계속해요.'); S.lastSt = was.st || S.lastSt; }
    S.pid = ''; save(); if (S.fl.left) makeParty(true); refreshParty(); hud(); return;
  }
  S.lastSt = G.P.st || 1;
  if (was && (G.P.st || 1) > (was.st || 1)) stepUp(was.st || 1, G.P.st);
  else if (!was && (S.fl.seen || 0) < (G.P.st || 1) - 1) stepUp(S.fl.seen || 1, G.P.st); // came back to a party that moved on
  reviewNote(was);
  trialNote();
  if (G.P.boss && G.P.boss.t && (!was || !was.boss || was.boss.t !== G.P.boss.t)) { G.banner = { big: '세균 소굴이 열렸어요!', small: '마을 가운데 보스 포탈로 파티와 함께 들어가요.', t: 5, boss: true }; SFX.alarm(); }
  refreshParty(); hud(); save();
}
function stepUp(from, to) { // the teacher passed us: cards for every step we cleared
  S.fl.seen = to - 1; delete S.fl.loaded; delete S.fl.exhaled; delete S.fl.urine;
  const cards = QUESTS.slice(from, to).filter(Q => Q.sys).map(Q => Q.sys);
  SFX.quest(); G.fx.push({ k: 'lv', x: G.me.x, y: G.me.y, t: 0 });
  const next = () => { const s = cards.shift(); if (s) card(s, next); else toast(`통과! 다음: ${QUESTS[to].go}`); };
  next(); save();
}
function reviewNote(was) { // the teacher sent our answer back
  const q = stage(), r = G.P && G.P.rv && G.P.rv[q], r0 = was && was.rv && was.rv[q];
  if (r && !r.ok && (!r0 || r0.t !== r.t)) { SFX.hurt(); toast(`선생님: 다시 써 보세요${r.c ? ' — ' + r.c : ''}`); }
}
function makeParty(solo) {
  const pid = 'P' + G.id;
  const P = { L: G.id, nm: `${S.name}${solo ? '' : '의 파티'}`, st: Math.max(1, S.lastSt || 1), m: { [G.id]: { n: S.name, j: S.job } }, solo: solo ? 1 : 0 };
  S.pid = pid;
  if (!G.net) { G.P = P; if (S.fl.left) G.P.lock = 1; save(); return; }
  G.net.set(`pty/${pid}/L`, G.id); G.net.set(`pty/${pid}/nm`, P.nm); G.net.set(`pty/${pid}/st`, P.st);
  G.net.set(`pty/${pid}/m/${G.id}`, P.m[G.id]); if (solo) G.net.set(`pty/${pid}/solo`, 1);
  if (S.fl.left) G.net.set(`pty/${pid}/lock`, 1);
  watchParty(pid); save();
}
function partyMembers() { return G.P ? Object.keys(G.P.m || {}).filter(id => id !== G.id) : []; }
function canFormParty() { return G.mapId === 'town' && !S.fl.left && !(G.P && G.P.lock); }
function invite(pid) {
  if (!G.net) return;
  if (!canFormParty()) { toast('파티는 처음 세포 마을에서만 만들 수 있어요.'); return; }
  if (!S.pid) makeParty(false);
  if (!isLeader()) { toast('파티장만 초대할 수 있어요.'); return; }
  if (memberIds().length >= 4) { toast('파티는 4명까지예요.'); return; }
  G.net.set('inv/' + pid, { from: G.id, n: S.name, pid: S.pid, t: G.net.now() }); toast(`${G.others[pid].n}에게 파티 초대를 보냈어요.`); refreshParty();
}
function invitePopup(iv) {
  if (G.partyInv && G.partyInv.t === iv.t) return; G.partyInv = iv;
  if (!canFormParty()) { G.net.del('inv/' + G.id); return; }
  const box = $('#invite'); box.classList.remove('hide');
  box.innerHTML = `<p><b>${esc(iv.n)}</b>님이 파티에 초대했어요!</p><button class="go" id="ivY">수락</button><button id="ivN">거절</button>`;
  $('#ivY').onclick = async () => {
    box.classList.add('hide'); G.net.del('inv/' + G.id);
    const P = await G.net.get('pty/' + iv.pid);
    if (!P || P.lock) { toast('그 파티는 벌써 출발했어요.'); return; }
    if (Object.keys(P.m || {}).length >= 4) { toast('그 파티는 꽉 찼어요 (4명).'); return; }
    if (S.pid && S.pid !== iv.pid) leaveParty(true);
    S.pid = iv.pid; G.net.set(`pty/${iv.pid}/m/${G.id}`, { n: S.name, j: S.job }); watchParty(iv.pid); save();
    toast('파티에 들어갔어요! 같은 맵에서 잡으면 경험치와 퀘스트 아이템을 함께 받아요.');
  };
  $('#ivN').onclick = () => { G.net.del('inv/' + G.id); box.classList.add('hide'); };
}
function leaveParty(quiet) {
  if (!S.pid) return;
  if (!canFormParty() && !quiet) { toast('출발한 뒤에는 파티를 나갈 수 없어요. 선생님께 말씀드려요.'); return; }
  if (G.net) { if (isLeader()) G.net.del('pty/' + S.pid); else G.net.del(`pty/${S.pid}/m/${G.id}`); }
  if (G.pOff) G.pOff(); G.pOff = null; G.P = null; S.pid = ''; save(); refreshParty(); hud();
  if (!quiet) toast('파티에서 나왔어요.');
}
function leaveTown() { // the first portal out of town fixes the party (or makes a party of one)
  if (S.fl.left) return; S.fl.left = 1;
  if (!S.pid) makeParty(true);
  else if (G.net) G.net.set(`pty/${S.pid}/lock`, 1); else if (G.P) G.P.lock = 1;
  save();
}
function refreshParty() {
  if (G.scene !== 'play') return;
  const q = stage(), dn = (G.P && G.P.dn && G.P.dn[q]) || {};
  const mem = memberIds().map(id => [id, id === G.id ? { n: S.name, lv: S.lv, hp: G.me.hp, mh: maxHp(), m: G.mapKey, j: S.job } : G.others[id] || { n: (G.P.m[id] || {}).n, lv: '?', m: '', j: (G.P.m[id] || {}).j }]);
  $('#partyBox').innerHTML = G.P && !G.P.solo ? `<div class="ph">${esc(G.P.nm)} (${mem.length}/4)</div>` + mem.map(([id, p]) => `<div class="pm"><span>${G.P.L === id ? '★ ' : ''}${esc(p.n)} <small>Lv.${p.lv} ${JOBS[p.j]?.name || ''}</small>${dn[id] ? '<em>✓</em>' : ''}</span><i><u style="width:${Math.round(100 * (p.hp / p.mh || 0))}%"></u></i><small>${mapName(p.m)}</small></div>`).join('') : '';
  const form = canFormParty();
  const list = Object.entries(G.others).filter(([, p]) => fresh(p));
  $('#plist').innerHTML = (form ? '' : '<p class="tip">파티는 처음 세포 마을에서만 만들 수 있어요. 이제는 선생님만 바꿀 수 있어요.</p>')
    + (list.length ? list.map(([k, p]) => `<div class="pl"><span>${esc(p.n)} <small>Lv.${p.lv} ${JOBS[p.j]?.name || ''} · ${mapName(p.m)}</small></span>${inMyParty(k) ? '<em>파티</em>' : form && !p.lf && !p.pid ? `<button data-inv="${k}">초대</button>` : ''}</div>`).join('') : '<p class="tip">이 채널에 아직 다른 친구가 없어요.</p>');
  $('#plist').querySelectorAll('[data-inv]').forEach(b => b.onclick = () => invite(b.dataset.inv));
  $('#bLeave').classList.toggle('hide', !form || !S.pid);
}

// ---- Quest steps: my task → everyone's done → leader writes → teacher OKs -----------------------------------
const myDone = () => { const Q = QUESTS[stage()]; if (Q && Q.kill && !Q.also) return killsDone(); return !!(G.P && G.P.dn && G.P.dn[stage()] && G.P.dn[stage()][G.id]); };
const allDone = () => { // hunting: the shared count; everything else (and 날숨): every member
  const q = stage(), Q = QUESTS[q], dn = (G.P && G.P.dn && G.P.dn[q]) || {};
  if (Q.kill && !killsDone()) return false;
  return Q.kill && !Q.also ? true : memberIds().every(id => dn[id]);
};
const pending = () => { const q = stage(), s = G.P && G.P.sub && G.P.sub[q], r = G.P && G.P.rv && G.P.rv[q]; return s && (!r || r.t < s.t) ? s : null; };
function markDone() { // my part of this step is finished
  const q = stage();
  if (G.net && S.pid) G.net.set(`pty/${S.pid}/dn/${q}/${G.id}`, 1);
  else if (G.P) { G.P.dn = G.P.dn || {}; (G.P.dn[q] = G.P.dn[q] || {})[G.id] = 1; }
  SFX.quest(); toast(QUESTS[q].ask ? (memberIds().length > 1 ? '내 몫 끝! 파티원이 모두 끝내면 파티장이 답을 써요.' : '퀘스트 끝! 이제 답을 써서 선생님께 보내요.') : '완료!');
  hud(); refreshParty(); save();
  setTimeout(() => { if (allDone() && isLeader() && QUESTS[q].ask) answerBox(); }, 400);
}
function answerBox() { // the leader writes the party's answer to this step's question
  const q = stage(), Q = QUESTS[q]; if (!Q.ask) return;
  if (!isLeader()) { toast('파티장이 답을 써서 선생님께 보내요.'); return; }
  if (!allDone()) { toast('파티원이 모두 퀘스트를 끝내야 답을 보낼 수 있어요.'); return; }
  if (pending()) { toast('선생님이 확인하고 있어요. 조금만 기다려요!'); return; }
  const box = $('#answer'), r = G.P && G.P.rv && G.P.rv[q];
  box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:${SYS[Q.sys].color}"><small>${SYS[Q.sys].name} · 파티 답안 (선생님이 확인해요)</small><h2>${esc(Q.title)}</h2><p class="qask">${esc(Q.ask)}</p>`
    + (r && !r.ok ? `<p class="back">선생님: 다시 써 보세요${r.c ? ' — ' + esc(r.c) : ''}</p>` : '')
    + `<textarea id="ansT" rows="4" maxlength="400" placeholder="교과서를 보며 파티원과 의논해서 써요">${esc(G.P && G.P.sub && G.P.sub[q] ? G.P.sub[q].a : '')}</textarea><div class="row"><button id="ansX">나중에</button><button id="ansGo" class="go">선생님께 보내기</button></div></div>`;
  $('#ansX').onclick = () => { box.classList.add('hide'); G.modal = false; };
  $('#ansGo').onclick = () => {
    const a = $('#ansT').value.trim(); if (a.length < 4) { $('#ansT').placeholder = '조금 더 써 주세요!'; return; }
    box.classList.add('hide'); G.modal = false;
    if (G.net && S.pid) { G.net.set(`pty/${S.pid}/sub/${q}`, { a, by: S.name, t: G.net.now() }); toast('보냈어요! 선생님이 확인하면 다 같이 다음으로 가요.'); }
    else { G.P.sub = { ...(G.P.sub || {}), [q]: { a, t: Date.now() } }; const from = G.P.st; G.P.st = q + 1; toast('혼자 하기: 자동으로 통과했어요.'); stepUp(from, G.P.st); }
    hud(); refreshParty();
  };
  setTimeout(() => $('#ansT') && $('#ansT').focus(), 50);
}

// ---- 거짓말 탐지기: the teacher's trial for one party ---------------------------------------------------------
function trialNote() {
  const tr = G.P && G.P.tr; if (!tr || !tr.id) return;
  const v = G.P.tv && G.P.tv[tr.id], ans = G.P.ta && G.P.ta[tr.id];
  if (S.fl.trials[tr.id]) return; // already settled on this tablet
  if (v) { S.fl.trials[tr.id] = v.ok ? 'ok' : 'no'; closeTrial(); v.ok ? trialPass() : trialFail('운영자가 탈락시켰어요!'); return; }
  G.trial = tr; const box = $('#trial'); box.classList.remove('hide'); SFX.alarm();
  box.innerHTML = `<div class="tin"><small>⚠ 운영자 시련 · 거짓말 탐지기</small><h2>${esc(tr.q)}</h2><div class="tbar"><i id="trBar"></i></div><b id="trLeft"></b>`
    + (ans ? `<p class="sent">${esc(ans.by)}님이 답했어요: “${esc(ans.a)}”<br>운영자 판정을 기다리는 중…</p>` : `<textarea id="trT" rows="3" maxlength="300" placeholder="파티원 누구든 답을 써요"></textarea><button id="trGo" class="go">답하기</button>`) + '</div>';
  if (!ans) $('#trGo').onclick = () => { const a = $('#trT').value.trim(); if (!a) return; if (G.net) G.net.set(`pty/${S.pid}/ta/${tr.id}`, { a, by: S.name, t: G.net.now() }); };
}
function trialTick() {
  if (!G.trial) return;
  const tr = G.trial, left = tr.t + tr.d * 1000 - (G.net ? G.net.now() : Date.now()), answered = G.P && G.P.ta && G.P.ta[tr.id];
  const bar = $('#trBar'); if (bar) bar.style.width = `${Math.max(0, left / (tr.d * 1000)) * 100}%`;
  const l = $('#trLeft'); if (l) l.textContent = answered ? '' : `${Math.max(0, Math.ceil(left / 1000))}초`;
  if (left <= 0 && !answered) { S.fl.trials[tr.id] = 'late'; closeTrial(); trialFail('시간 안에 답하지 못했어요!'); }
}
function closeTrial() { G.trial = null; $('#trial').classList.add('hide'); }
function trialPass() { SFX.quest(); gainExp(30); G.banner = { big: '시련 통과!', small: '운영자가 인정했어요 · EXP +30', t: 3 }; }
function trialFail(why) { SFX.hurt(); G.banner = { big: '시련 탈락', small: `${why} 세포 마을로 돌아가요.`, t: 4, boss: true }; if (G.mapId !== 'town') enterMap('town', 300); save(); }

// ---- Telling the channel where I am ---------------------------------------------------------------------------
function sendMe(force) {
  if (!G.net || !G.me) return;
  const now = G.net.now();
  if (!force && now < G.nextSend) return; G.nextSend = now + 1000 / tune.send_hz;
  const m = G.me, rec = { n: S.name, j: S.job, lv: S.lv, lk: S.look, m: G.mapKey, x: Math.round(m.x), y: Math.round(m.y), f: m.f, a: m.st, at: m.at, hp: Math.round(m.hp), mh: maxHp(), pid: S.pid, lf: S.fl.left ? 1 : 0, q: stage(), qz: S.quiz ?? null };
  const key = JSON.stringify({ ...rec, t: 0 });
  if (!force && key === G.sent && now - G.sentAt < 2000) return;
  G.sent = key; G.sentAt = now; G.net.set('p/' + G.id, { ...rec, t: now });
}

// ---- Moving and fighting -------------------------------------------------------------------------------------
const frozen = () => G.dlg || G.dead || G.trial || G.modal;
function updateMe(dt) {
  const m = G.me, map = G.map, J = job(), miss = bossMissing();
  const slow = miss.some(r => r.sys === 'vessel') ? 0.45 : 1;
  m.inv = Math.max(0, m.inv - dt); m.hurt = Math.max(0, m.hurt - dt); m.drop = Math.max(0, m.drop - dt);
  m.atkCd = Math.max(0, m.atkCd - dt); m.skillCd = Math.max(0, m.skillCd - dt);
  if (m.atkT >= 0) { m.atkT += dt / 0.28; if (m.atkT >= 1) m.atkT = -1; }
  m.mp = Math.min(maxMp(), m.mp + tune.mp_regen * dt);
  if (!miss.length) m.hp = Math.min(maxHp(), m.hp + tune.hp_regen * dt);
  if (!G.dead && miss.length && bossNow()) bossRules(dt, miss);
  const L = isHeld('left'), R = isHeld('right'), U = isHeld('up'), D = isHeld('down');
  if (frozen()) { m.vx = 0; } else {
    if (isHit('up') && !m.rope && tryPortal()) return;
    if (isHit('up') && !m.rope && tryTalk()) return;
    if (isHit('atk') && m.atkCd <= 0 && !m.rope) attack(false);
    if (isHit('skill') && m.skillCd <= 0 && !m.rope) { if (m.mp >= J.skill.mp) attack(true); else toast('MP가 모자라요. MP는 아주 천천히 차요.'); }
  }
  if (m.rope) { // ropes
    const rp = m.rope; m.vx = 0; m.vy = 0;
    if (!frozen()) m.y += (D ? 1 : U ? -1 : 0) * tune.climb * slow * dt;
    m.st = 'climb';
    if (m.y <= rp[1]) { m.y = rp[1]; m.rope = null; m.ground = G.statics.find(p => Math.abs(p.y - rp[1]) < 3 && rp[0] >= p.x && rp[0] <= p.x + p.w) || null; }
    else if (m.y >= rp[2]) { m.y = rp[2]; m.rope = null; }
    else if (isHit('jump') && (L || R)) { m.rope = null; m.vy = -tune.jump * 0.55; m.vx = (R ? 1 : -1) * tune.walk; m.f = R ? 1 : -1; }
    return;
  }
  if (!frozen() && (U || D)) {
    const rp = map.ropes.find(r => Math.abs(r[0] - m.x) < 18 && (U ? m.y > r[1] + 4 && m.y <= r[2] + 4 : Math.abs(m.y - r[1]) < 4));
    if (rp) { m.rope = rp; m.x = rp[0]; m.ground = null; if (D) m.y += 6; return; }
  }
  if (m.hurt <= 0) {
    const want = frozen() || m.atkT >= 0 && m.ground ? 0 : (R ? 1 : 0) - (L ? 1 : 0);
    m.vx = want * tune.walk * slow; if (want) m.f = want;
  }
  if (!frozen() && isHit('jump') && m.ground) {
    if (D && m.ground.k !== 'ground' && m.ground.k !== 'floor') { m.drop = 0.3; m.ground = null; }
    else { m.vy = -tune.jump * (slow < 1 ? 0.8 : 1); m.ground = null; SFX.jump(); }
  }
  const fh = footholds();
  if (m.ground && m.ground.k === 'mover') { // stay on a moving foothold
    const now = fh.find(p => p.k === 'mover' && Math.abs(p.x - m.ground.x) < 40 && Math.abs(p.w - m.ground.w) < 1 && Math.abs(p.y - m.ground.y) < 40);
    if (now) { m.x += now.x - m.ground.x; m.y = now.y; m.ground = now; } else m.ground = null;
  }
  if (m.ground && m.ground.i >= 0 && blinkOff(m.ground.i)) m.ground = null; // the branch vanished under me
  m.x += m.vx * dt;
  if (m.ground && (m.x < m.ground.x - 4 || m.x > m.ground.x + m.ground.w + 4)) m.ground = null; // walked off the edge
  if (!m.ground) {
    const y0 = m.y; m.vy = Math.min(tune.fall_max, m.vy + tune.gravity * dt); m.y += m.vy * dt;
    if (m.vy >= 0) for (const p of fh) {
      if (m.drop > 0 && p.k !== 'ground' && p.k !== 'floor') continue;
      if (m.x >= p.x - 3 && m.x <= p.x + p.w + 3 && y0 <= p.y + 2 && m.y >= p.y) { m.y = p.y; m.vy = 0; m.ground = p; break; }
    }
  }
  m.x = Math.max(20, Math.min(map.w - 20, m.x));
  if (map.valves) valves(m);
  if (map.hazard && m.y > map.hazard + 20) fallBack(true);
  if (m.y > map.h + 300) fallBack(false);
  m.st = m.hurt > 0 ? 'hurt' : !m.ground ? 'jump' : Math.abs(m.vx) > 1 ? 'walk' : 'stand';
  if (map.gim) hazards(m);
  if (m.inv <= 0 && !G.dead) { // touching monsters, clots, spores
    for (const mo of G.mons) {
      if (mo.dead) continue; const M = MONS[mo.k];
      if (Math.abs(mo.x - m.x) < M.w / 2 + 8 && m.y > mo.y - M.h - 30 && m.y < mo.y + 20) { hurt(M.dmg, mo.x < m.x ? 1 : -1); break; }
    }
    if (map.clots) for (const c of map.clots) { const x = clotX(c); if (Math.abs(x - m.x) < 28 && Math.abs(m.y - c[1]) < 40) { hurt(8, x < m.x ? 1 : -1); break; } }
    for (const s of spores()) if (s.ph > SPORE.warn + SPORE.fall - 0.05 && !G.sporeHit[s.id] && Math.abs(s.x - m.x) < 36 && Math.abs(m.y - s.gy) < 50) { G.sporeHit[s.id] = 1; hurt(MONS.boss.dmg, s.x < m.x ? 1 : -1); break; }
  }
  for (const d of G.drops) if (d.t > 0.4 && Math.abs(d.x - m.x) < 30 && Math.abs(d.y - m.y) < 50 && !d.got) { // drops I walk over
    d.got = true; give(d.id); SFX.pick(); G.nums.push({ x: d.x, y: d.y - 40, v: `${ITEMS[d.id].name} +1`, t: 0, item: true }); hud(); save();
  }
  G.drops = G.drops.filter(d => !d.got);
}
function hazards(m) { // 어려움: dust balls shove, blasts from below knock you off
  if (m.inv > 0) return;
  for (const o of G.map.gim.orbs) { const p = orbAt(o); if (Math.abs(p.x - m.x) < 32 && Math.abs(p.y - (m.y - 30)) < 40) { shove(p.x < m.x ? 1 : -1, 0); return; } }
  for (const g of G.map.gim.geysers) { const s = geyserAt(g); if (s.on && Math.abs(g[0] - m.x) < 30 && m.y <= g[1] + 2 && m.y >= g[1] - s.h) { shove(m.x < g[0] ? -1 : 1, 5); return; } }
}
function shove(dir, dmg) {
  const m = G.me; m.vx = dir * 420; m.vy = -240; m.hurt = 0.45; m.inv = 0.7; m.ground = null; m.rope = null; SFX.hurt();
  if (dmg) { m.hp = Math.max(1, m.hp - dmg); G.nums.push({ x: m.x, y: m.y - 80, v: dmg, t: 0, ouch: true }); }
}
function bossRules(dt, miss) { // what a missing organ system does to me in the lair
  const m = G.me;
  if (miss.some(r => r.sys === 'lung')) m.hp -= maxHp() * tune.suffocate * dt;
  if (miss.some(r => r.sys === 'kidney')) { G.toxinT += dt; if (G.toxinT >= tune.toxin_every) { G.toxinT = 0; G.toxin++; G.nums.push({ x: m.x, y: m.y - 100, v: `독소 ${G.toxin}/10`, t: 0, ouch: true }); if (G.toxin >= 10) m.hp = 0; } }
  if (m.hp <= 0) { m.hp = 0; die(); }
}
const clotX = c => c[0] + (c[2] - c[0]) * (0.5 - 0.5 * Math.cos(netT() / c[3] * Math.PI));
function valves(m) { // 판막: once through, you cannot go back; it is also where you start again
  const vs = G.map.valves;
  for (let i = vs.length - 1; i >= 0; i--) if (m.x > vs[i] + 20 && m.cp < i) { m.cp = i; toast(i === vs.length - 1 ? '마지막 판막 통과! 조직 세포가 보여요.' : `판막 ${i + 1} 통과! 혈액은 거꾸로 흐를 수 없어요.`); SFX.pick(); }
  if (m.cp >= 0 && m.x < vs[m.cp] + 12) { m.x = vs[m.cp] + 12; m.vx = Math.max(0, m.vx); }
}
function fallBack(blood) {
  const m = G.me;
  if (blood) { m.hp = Math.max(1, m.hp - maxHp() * 0.1); toast('혈액 급류에 휩쓸렸어요! 마지막 판막에서 다시.'); SFX.hurt(); }
  const x = m.cp >= 0 && G.map.valves ? G.map.valves[m.cp] + 50 : (G.map.portals[0].x + 60);
  Object.assign(m, { x, y: spawnY(x), vx: 0, vy: 0, ground: null, rope: null, inv: 1 });
}
function hurt(dmg, dir) {
  const m = G.me; m.hp -= dmg; m.inv = tune.hurt_invuln; m.hurt = 0.3; m.vx = dir * 260; m.vy = -330; m.ground = null; m.rope = null;
  G.nums.push({ x: m.x, y: m.y - 80, v: dmg, t: 0, ouch: true }); SFX.hurt();
  if (m.hp <= 0) { m.hp = 0; die(); }
  hud();
}
function die() {
  if (G.dead) return; G.dead = true;
  const lost = Math.min(S.exp, Math.round(expNeed() * tune.death_exp)); S.exp -= lost; save();
  if (G.mapId === 'lair') { bossLose(); respawn(); return; }
  $('#deadMsg').textContent = `쓰러졌어요… 경험치 ${lost}을(를) 잃었어요. HP와 MP는 아주 천천히 차니 조심해요!`;
  $('#dead').classList.remove('hide');
}
function attack(skill) {
  const m = G.me, J = job(), A = skill ? J.skill : J.atk;
  if (skill) { m.mp -= A.mp; m.skillCd = A.cd; } m.atkCd = A.cd; m.atkT = 0; m.at = Math.round(netT() * 1000); SFX.swing();
  const base = tune.dmg_base + mainStat() * tune.dmg_per_main + S.lv * 2, boost = stage() >= 5 ? 1 + tune.energy_bonus : 1;
  const targets = G.mons.filter(mo => !mo.dead && (mo.x - m.x) * m.f > -30 - MONS[mo.k].w / 2 && Math.abs(mo.x - m.x) - MONS[mo.k].w * 0.4 < A.range && Math.abs((mo.y - MONS[mo.k].h / 2) - (m.y - 30)) < MONS[mo.k].h / 2 + 50)
    .sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, A.hits);
  const shoot = (tg, delay) => {
    const dmg = Math.max(1, Math.round(base * A.mult * boost * (0.85 + rng() * 0.3)));
    if (A.shot) G.shots.push({ k: A.shot, x: m.x + m.f * 20, y: m.y - 36, tx: tg ? tg.x : m.x + m.f * A.range, ty: tg ? tg.y - MONS[tg.k].h / 2 : m.y - 36, t: -delay, f: m.f, tg, dmg });
    else if (tg) landHit(tg, dmg);
  };
  if (!targets.length && A.shot) shoot(null, 0);
  targets.forEach(tg => { shoot(tg, 0); if (A.twice) shoot(tg, 0.12); });
  if (skill && J.weapon === 'sword') G.fx.push({ k: 'slash', x: m.x + m.f * 60, y: m.y - 30, f: m.f, t: 0 });
  hud();
}
function updateShots(dt) {
  for (const s of G.shots) {
    s.t += dt; if (s.t < 0) continue;
    const sp = s.k === 'bolt' ? 900 : 1100, dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
    if (d < sp * dt) { s.done = true; if (s.tg && !s.tg.dead) landHit(s.tg, s.dmg); continue; }
    s.x += dx / d * sp * dt; s.y += dy / d * sp * dt;
  }
  G.shots = G.shots.filter(s => !s.done);
}
function tryPortal() {
  const m = G.me, p = G.map.portals.find(p => portalShown(p) && Math.abs(p.x - m.x) < 42 && Math.abs((p.y || G.map.ground || groundBelow(p.x, 0)) - m.y) < 40);
  if (!p) return false;
  if (G.mapId === 'town' && !S.fl.pro) { toast('먼저 셀리 촌장에게 이야기를 들어요.'); return true; }
  if (p.need && stage() < p.need) { toast(`아직 갈 수 없어요. 지금 할 일: ${QUESTS[stage()].go}`); return true; }
  const goTo = id => { if (G.mapId === 'town') leaveTown(); SFX.portal(); enterMap(id, p.tx === 'start' ? 'start' : p.tx); afterPortal(id); };
  if (p.pick) pickLevel(p.to, goTo); else goTo(p.to);
  return true;
}
function portalShown(p) { return !p.boss || !!(G.P && G.P.boss && G.P.boss.t); }
function pickLevel(to, goTo) { // 쉬움 / 어려움, chosen at the portal
  const box = $('#pick'); box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:#3b7fb5"><small>${esc(MAPS[to].name)}</small><h2>난이도를 골라요</h2><p>어려움에는 밀어내는 먼지 덩어리, 사라지는 발판, 아래에서 솟구치는 바람이 있어요. 끝까지 가면 보너스 경험치!</p><div class="row"><button id="pkE" class="go">쉬움</button><button id="pkH" class="go hard">어려움</button></div><button id="pkX" class="tip">취소</button></div>`;
  const close = () => { box.classList.add('hide'); G.modal = false; };
  $('#pkE').onclick = () => { close(); goTo(to); }; $('#pkH').onclick = () => { close(); goTo(to + 'H'); }; $('#pkX').onclick = close;
}
function afterPortal(id) {
  const base = id.replace(/H$/, '');
  if (base === 'lung' && stage() === 2) toast('기관지 나무 꼭대기까지 점프로 올라가요! 떨어지면 아래 가지부터 다시.');
  if (base === 'vessel' && stage() === 3 && !S.fl.loaded) toast('먼저 하트 선장(심장)에게 말을 걸어 짐을 실어요.');
  if (id === 'lair') { const miss = bossMissing(); G.banner = { big: '세균 대왕의 소굴', small: miss.length ? `조심! 준비가 덜 된 것 같아요… (${miss.map(r => r.name).join(' · ')})` : '모든 기관계가 준비됐어요. 파티와 함께 무찔러요!', t: 5, boss: true }; }
}
function npcNear() { return G.map.npcs.find(([, x, y]) => Math.abs(x - G.me.x) < 70 && Math.abs(y - G.me.y) < 60); }
function tryTalk() { const n = npcNear(); if (!n) return false; talk(n[0]); return true; }

// ---- What each NPC says, by the party's step -----------------------------------------------------------------------
function talk(id) {
  const q = stage(), Q = QUESTS[q], say = (lines, then) => openDlg(id, lines, then);
  const atQuest = Q && Q.at === id;
  const turnIn = () => { // my part is done here; the leader may now write
    if (!myDone()) return false;
    if (pending()) { say(['답을 받았어! 선생님이 확인하고 계셔. 조금만 기다려.']); return true; }
    if (allDone()) { if (isLeader()) say(['모두 해냈구나! 파티장, 이제 답을 써서 선생님께 보내 줘.'], answerBox); else say(['모두 해냈구나! 파티장이 답을 써서 보낼 거야.']); }
    else say(['너는 다 했어! 아직 다른 파티원이 퀘스트를 하는 중이야. 도와줘!']);
    return true;
  };
  if (id === 'chief') {
    if (!S.fl.pro) return say(TALK.prologue, () => { S.fl.pro = 1; save(); hud(); SFX.quest(); toast('퀘스트 시작! 파티를 만들려면 왼쪽 위 [파티 · 친구]. 혼자 가도 괜찮아요.'); });
    if (Q.id === 'link') return say(TALK.link, () => { S.fl.linked = 1; save(); showLinks(); });
    if (q >= 6) return say(TALK.free);
    return say([`지금 할 일: ${Q.go}`, canFormParty() ? '파티는 마을에서만 만들 수 있어. 왼쪽 위 [파티 · 친구]를 눌러 친구를 초대해 봐 (최대 4명).' : '파티원 모두가 끝내야 다음으로 갈 수 있어. 서로 도와줘!']);
  }
  if (atQuest && turnIn()) return;
  if (id === 'villi') {
    if (!atQuest) return say(q < 1 ? ['영양소를 흡수하는 게 내 일이야.'] : ['맛있는 영양소, 잘 흡수했어! 고마워.']);
    if (!killsDone()) return say([...TALK.villi_wait, `지금 파티 사냥: ${Object.keys(Q.kill).map(k => `${MONS[k].name} ${killTotal(k)}/${killNeed(k)}`).join(' · ')}`]);
    return say(TALK.villi_done, () => { if (isLeader()) answerBox(); else toast('파티장이 답을 써서 선생님께 보내요.'); });
  }
  if (id === 'trachea') return say(TALK.trachea);
  if (id === 'alveoli') {
    if (!atQuest) return say(q < 2 ? ['여기까지 올라오다니 대단해! 그런데 아직은 산소를 줄 때가 아니야.'] : ['숨 쉴 때마다 산소가 들어와. 후아!']);
    return say(TALK.alveoli_done, () => { if (G.map.hard) { gainExp(40); toast('어려움 완주! 보너스 EXP +40'); } markDone(); });
  }
  if (id === 'heart') {
    if (q !== 3) return say(['쿵쾅쿵쾅! 나는 쉬지 않고 혈액을 내보내.']);
    if (S.fl.loaded) return say(['출발! 판막을 지나 오른쪽 끝의 조직 세포까지!']);
    return say(TALK.heart_go, () => { S.fl.loaded = 1; save(); toast('짐을 실었어요! 오른쪽으로 혈관 급류를 건너요.'); });
  }
  if (id === 'tissue') {
    if (!atQuest) return say(['영양소랑 산소가 오면 나는 에너지를 만들 수 있어.']);
    if (!S.fl.loaded) return say(['심장에서 출발해야 해! 왼쪽 끝 하트 선장에게 먼저 가 봐.']);
    return say(TALK.tissue_done, () => { if (G.map.hard) { gainExp(40); toast('어려움 완주! 보너스 EXP +40'); } markDone(); });
  }
  if (id === 'mito') {
    if (!atQuest) return say(q < 4 ? ['발전소가 멈췄어… 영양소와 산소가 도착해야 세포 호흡을 할 수 있어.'] : ['에너지 펑펑! 고마워, 원정대!']);
    return say(TALK.mito_done, () => markDone());
  }
  if (id === 'diaphragm') {
    if (q === 5 && !myDone()) return say(TALK.diaphragm_exhale, () => { S.fl.exhaled = 1; save(); toast('호흡계: 이산화 탄소를 날숨으로 내보냈어요!'); markDone(); });
    return say(TALK.diaphragm_idle);
  }
  if (id === 'nephron') {
    if (!atQuest) return say(q < 5 ? ['아직 걸러낼 노폐물이 없어. 깨끗해!'] : ['콩팥은 하루에도 엄청 많은 혈액을 걸러.']);
    if (!killsDone()) return say([...TALK.nephron_wait, `지금 파티 사냥: 요소 유령 ${killTotal('urea')}/${killNeed('urea')}`]);
    if (!allDone()) return say(['요소는 다 걸렀어! 그런데 아직 이산화 탄소를 내쉬지 않은 파티원이 있어. 모두 기관지 나무 아래 가로막 아저씨에게!']);
    return say(TALK.nephron_done, () => { if (isLeader()) answerBox(); else toast('파티장이 답을 써서 선생님께 보내요.'); });
  }
}
function openDlg(id, lines, then) {
  const N = NPCS[id]; let i = 0; G.dlg = { id };
  const box = $('#dlg'); box.classList.remove('hide');
  const pc = $('#dlgPic').getContext('2d'); pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, 140, 160); pc.translate(70, 150); pc.scale(1.35, 1.35); drawNpc(pc, id, 0, 0, 0, stage() >= 5);
  $('#dlgName').textContent = `${N.name} · ${N.role}`;
  const draw = () => { $('#dlgText').textContent = lines[i]; $('#dlgNext').textContent = i < lines.length - 1 ? '다음 ▶' : then ? '좋아!' : '닫기'; };
  $('#dlgNext').onclick = () => { if (i < lines.length - 1) { i++; draw(); return; } box.classList.add('hide'); G.dlg = null; then && then(); };
  draw();
}
function card(sys, after) {
  const C = SYS[sys], box = $('#card'); box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:${C.color}"><small>통과! · 이 기관계가 하는 일</small><h2>${C.name}</h2><p>${C.text}</p><button class="go">확인</button></div>`;
  box.querySelector('button').onclick = () => { box.classList.add('hide'); G.modal = false; after && after(); };
}
function showLinks() { // 그림 14: everything the player did, joined up
  const box = $('#links'); box.classList.remove('hide'); G.modal = true;
  const A = (x1, y1, x2, y2, label, col, d, ly = -10) => `<g class="ar" style="animation-delay:${d}s"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="7" marker-end="url(#hd)"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + ly}">${label}</text></g>`;
  const N = (x, y, name, did, col) => `<g><rect x="${x - 95}" y="${y - 38}" width="190" height="76" rx="18" fill="${col}" stroke="#2a1c24" stroke-width="4"/><text x="${x}" y="${y - 6}" class="nn">${name}</text><text x="${x}" y="${y + 20}" class="nd">${did}</text></g>`;
  box.innerHTML = `<div class="lin"><h2>모든 게 이어졌다!</h2><svg viewBox="0 0 1000 560">
  <defs><marker id="hd" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2a1c24"/></marker></defs>
  ${A(250, 280, 420, 280, '영양소', '#e9788f', 0.3)}${A(500, 120, 500, 220, '산소', '#5ab4e6', 0.9)}${A(580, 270, 740, 270, '영양소·산소', '#d9463b', 1.5)}
  ${A(740, 310, 580, 310, '이산화 탄소·노폐물', '#9aa3ad', 2.1, 30)}${A(470, 220, 470, 120, '이산화 탄소', '#5ab4e6', 2.7)}${A(520, 330, 640, 440, '요소 등 노폐물', '#8a6fd0', 3.3)}
  ${N(150, 280, '소화계', '영양소 사냥 · 흡수', '#ffd0da')}${N(500, 80, '호흡계', '점프 퀘 · 산소/날숨', '#d4efff')}${N(500, 280, '순환계', '혈관 급류 배달', '#ffc9c4')}
  ${N(840, 290, '세포', '세포 호흡 → 에너지', '#ffe7a8')}${N(720, 480, '배설계', '요소 → 오줌', '#e3d7ff')}
  </svg><p>소화계가 흡수한 영양소와 호흡계가 받은 산소를 순환계가 세포로 날라, 세포 호흡으로 에너지를 얻었어요. 생긴 노폐물은 순환계를 타고 호흡계와 배설계로 나가요. <b>기관계들은 서로 이어져 함께 일해요!</b></p><button class="go">확인</button></div>`;
  box.querySelector('button').onclick = () => { box.classList.add('hide'); G.modal = false; };
}

// ---- HUD ----------------------------------------------------------------------------------------------------------
let toastT = 0;
function toast(s) { const t = $('#toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600); }
function hud() {
  if (!S || !G.me) return;
  const m = G.me, q = stage(), Q = QUESTS[q] || QUESTS[QUESTS.length - 1];
  $('#hLv').textContent = `Lv.${S.lv}`; $('#hName').textContent = `${S.name} · ${job().name}`;
  hudBars();
  $('#hExp').style.width = `${(S.exp / expNeed()) * 100}%`; $('#hExpT').textContent = `EXP ${S.exp} / ${expNeed()}`;
  let prog = '';
  if (!S.fl.pro) prog = '';
  else if (myDone() && !Q.kill) prog = `<span class="done">내 몫 완료</span>`;
  if (S.fl.pro && Q.kill) prog = Object.keys(Q.kill).map(k => `<span class="${killTotal(k) >= killNeed(k) ? 'done' : ''}">${MONS[k].name} ${Math.min(killTotal(k), killNeed(k))}/${killNeed(k)}</span>`).join('') + (memberIds().length > 1 ? `<span class="wait">파티 ${memberIds().length}명 × ${memberIds().length}배</span>` : '');
  if (Q.id === 'waste') prog += `<span class="${myDone() ? 'done' : ''}">이산화 탄소 내쉬기</span>`;
  if (Q.id === 'vessel' && !myDone()) prog = `<span class="${S.fl.loaded ? 'done' : ''}">하트 선장에게 짐 싣기</span>`;
  let state = '';
  if (Q.ask && S.fl.pro) {
    const r = G.P && G.P.rv && G.P.rv[q];
    if (pending()) state = '<span class="wait">선생님 확인 중…</span>';
    else if (allDone()) state = isLeader() ? '<button id="qAns" class="go small">답 쓰기</button>' : '<span class="wait">파티장이 답을 써요</span>';
    else if (memberIds().length > 1 && !(Q.kill && !Q.also)) state = `<span>파티 ${memberIds().filter(id => G.P.dn && G.P.dn[q] && G.P.dn[q][id]).length}/${memberIds().length} 완료</span>`;
    if (r && !r.ok && !pending()) state += `<span class="back">다시 쓰기${r.c ? ': ' + esc(r.c) : ''}</span>`;
  }
  $('#quest').innerHTML = `<b>${S.fl.pro ? `퀘스트 ${Math.min(q, 6)} · ` : ''}${Q.title}</b><p>${S.fl.pro ? Q.go : '셀리 촌장에게 말 걸기'}</p>${prog}${state}`;
  const qa = $('#qAns'); if (qa) qa.onclick = answerBox;
  $('#bag').innerHTML = Object.entries(S.inv).map(([k, n]) => `<span title="${ITEMS[k].name}"><canvas data-it="${k}" width="34" height="34"></canvas>${n}</span>`).join('') || '<em>가방이 비었어요</em>';
  $('#bag').querySelectorAll('canvas').forEach(c => drawItemIcon(c.getContext('2d'), c.dataset.it, 17, 17, 1.1));
  $('#skillTag').textContent = `X ${job().skill.name} (MP ${job().skill.mp})`;
}
function hudBars() { const m = G.me; $('#hHp').style.width = `${(m.hp / maxHp()) * 100}%`; $('#hHpT').textContent = `HP ${Math.ceil(m.hp)} / ${maxHp()}`; $('#hMp').style.width = `${(m.mp / maxMp()) * 100}%`; $('#hMpT').textContent = `MP ${Math.floor(m.mp)} / ${maxMp()}`; }
function respawn() { G.dead = false; $('#dead').classList.add('hide'); enterMap('town', 300); G.me.hp = Math.round(maxHp() * 0.5); G.me.mp = Math.round(maxMp() * 0.3); G.me.inv = 2; hud(); }

// ---- Drawing --------------------------------------------------------------------------------------------------------
function clampCam() { const map = G.map; G.cam.x = Math.max(0, Math.min(map.w - W, G.cam.x)); G.cam.y = Math.max(-200, Math.min(map.h - H + 150, G.cam.y)); } // a little earth below the ground, so the tablet buttons sit on it
function drawPlay() {
  const map = G.map, cam = G.cam, t = G.t, lit = stage() >= 5;
  ctx.save(); drawBack(ctx, map, cam.x, cam.y, t, W, H, lit); ctx.restore();
  if (map.dark) { ctx.fillStyle = 'rgba(30,10,20,.45)'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  if (map.theme === 'town') drawPlant(lit);
  if (map.theme === 'lung') { drawLungTree(ctx, map); for (const [y, s] of LUNG_STAGES) tag(s, 1330, y - 60, '#3b7fb5'); }
  for (const r of map.ropes) drawRope(ctx, r[0], r[1] - 10, r[2]);
  for (const p of G.statics) {
    if (p.x + p.w < cam.x - 50 || p.x > cam.x + W + 50) continue;
    if (map.gim && map.gim.blink.includes(p.i)) { const ph = blinkPh(p.i); if (ph >= 2.8) continue; if (ph >= 2.2 && Math.floor(t * 14) % 2) continue; }
    drawPlat(ctx, map, p.x, p.y, p.w, p.k === 'ground' ? 'ground' : p.k);
  }
  if (map.movers) for (const mv of map.movers) { const p = moverAt(mv, netT()); drawPlat(ctx, map, p.x, p.y, p.w, 'mover'); }
  if (map.valves) map.valves.forEach((v, i) => drawValve(ctx, v, groundBelow(v + 20, -9999), G.me.cp >= i, t));
  for (const p of map.portals) { if (!portalShown(p)) continue; const py = p.y || map.ground || groundBelow(p.x, 0); drawPortal(ctx, p.x, py, t); if (p.label) tag(p.label + (p.need && stage() < p.need ? ' 🔒' : ''), p.x, py - 112, p.boss ? '#8a1f2a' : p.need && stage() < p.need ? '#555' : '#1f5f8a'); }
  for (const [id, x, y] of map.npcs) { drawNpc(ctx, id, x, y, t, lit); tag(NPCS[id].name, x, y + 16, '#2d6a3e'); if (questMark(id)) bang(x, y - 110, t); }
  if (map.clots) for (const c of map.clots) drawClot(ctx, clotX(c), c[1], t);
  if (map.gim) {
    for (const o of map.gim.orbs) { const p = orbAt(o); drawOrb(ctx, p.x, p.y, t, map.theme); }
    for (const g of map.gim.geysers) { const s = geyserAt(g); if (s.warn) drawGeyser(ctx, g[0], g[1], 0, true, map.theme); else if (s.on) drawGeyser(ctx, g[0], g[1], s.h, false, map.theme); }
  }
  for (const mo of G.mons) if (!mo.dead) drawMon(ctx, mo.k, mo.x, mo.y, mo.dir < 0 ? -1 : 1, t + mo.x * 0.01, mo.flash > 0, mo.hp / mo.mhp);
  for (const d of G.drops) drawItemIcon(ctx, d.id, d.x, d.y - 12 - Math.abs(Math.sin(t * 3)) * 4, 1.2);
  for (const [id, p] of Object.entries(G.others)) {
    if (!onMyMap(p)) continue;
    const d = p._d || (p._d = { x: p.x, y: p.y }); d.x += (p.x - d.x) * 0.25; d.y += (p.y - d.y) * 0.25;
    const ago = netT() * 1000 - (p.at || 0), atk = ago < 280 ? ago / 280 : -1;
    drawHero(ctx, d.x, d.y, p.f || 1, p.j, p.lk || { g: 'boy' }, { st: p.a || 'stand', t: t + id.length, atk });
    tag(`${p.n}`, d.x, d.y + 16, inMyParty(id) ? '#2a5bb8' : '#333');
  }
  const m = G.me;
  if (stage() >= 5) aura(m.x, m.y, t);
  if (!(m.inv > 0 && Math.floor(t * 12) % 2)) drawHero(ctx, m.x, m.y, m.f, S.job, S.look, { st: m.st, t, atk: m.atkT });
  tag(S.name, m.x, m.y + 16, '#b8862a');
  for (const s of G.shots) if (s.t >= 0) shotDraw(s, t);
  for (const sp of spores()) {
    if (sp.ph < SPORE.warn) { ctx.save(); ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 20); ctx.beginPath(); ctx.ellipse(sp.x, sp.gy, 34, 8, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff3b3b'; ctx.fill(); ctx.restore(); }
    else { const k = Math.min(1, (sp.ph - SPORE.warn) / SPORE.fall); ctx.save(); ctx.translate(sp.x, sp.gy - 560 * (1 - k)); ctx.rotate(t * 6); hexa(ctx, 0, -12, 14, '#7ccf5a'); ctx.restore(); }
  }
  for (const f of G.fx) fxDraw(f);
  for (const n of G.nums) {
    const a = 1 - n.t / 1.1; ctx.globalAlpha = Math.max(0, a);
    if (n.exp || n.item) text(String(n.v), n.x, n.y - n.t * 50, 22, n.item ? '#bff7a8' : '#fff59a', 'center', OL);
    else text(String(n.v), n.x, n.y - n.t * 60, n.ouch ? 30 : 34, n.ouch ? '#c86bff' : '#ffb13b', 'center', OL);
    ctx.globalAlpha = 1;
  }
  if (map.hazard) drawBlood(ctx, map, cam.x, cam.y, t, W);
  ctx.restore();
  if (map.theme === 'town' && !lit) { ctx.fillStyle = 'rgba(20,24,50,.32)'; ctx.fillRect(0, 0, W, H); }
  const b = bossNow(); if (b) bossBar(b);
  const miss = bossMissing(); if (miss.length && b) debuffs(miss);
  miniMap();
  if (G.banner && G.banner.t > 0) {
    const a = Math.min(1, G.banner.t * 2);
    ctx.globalAlpha = a; rr(ctx, W / 2 - 360, 92, 720, G.banner.small ? 96 : 66, 18); ctx.fillStyle = G.banner.boss ? 'rgba(90,10,20,.82)' : 'rgba(20,24,46,.72)'; ctx.fill();
    text(G.banner.big, W / 2, 126, 38, '#fff', 'center', OL); if (G.banner.small) text(G.banner.small, W / 2, 166, 19, '#ffe9a8');
    ctx.globalAlpha = 1;
  }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, W, H); }
}
function debuffs(miss) { // the boss rules I suffer from, under the boss bar
  miss.forEach((r, i) => {
    const x = W / 2 - (miss.length * 150) / 2 + i * 150 + 75, label = r.sys === 'kidney' ? `${r.name} ${G.toxin}/10` : r.name;
    rr(ctx, x - 70, 58, 140, 28, 10); ctx.fillStyle = SYS[r.sys].color + 'ee'; ctx.fill(); stroke(ctx, 2);
    text(label, x, 72, 16, '#fff', 'center', OL);
  });
}
function drawPlant(lit) { // the 미토콘드리아 발전소 in town, by 미토
  const x = 1150, y = 800, c = ctx;
  c.save(); c.translate(x + 120, y);
  if (!IMG.town) {
    c.beginPath(); c.ellipse(0, -110, 130, 80, 0, 0, Math.PI * 2); fillS(c, lit ? '#ffb15c' : '#b98a62', 4);
    rr(c, -24, -40, 48, 40, 10); fillS(c, '#6a4a30', 3);
  }
  if (lit) for (let i = 0; i < 5; i++) { const a = G.t * 2 + i * 1.26; star4(c, Math.cos(a) * 150, -110 + Math.sin(a) * 95, 7, '#fff3a0', G.t); }
  c.restore();
  tag('미토콘드리아 발전소' + (lit ? ' · 가동 중' : ' · 멈춤'), x + 120, y - 210, lit ? '#c46a10' : '#555');
}
function questMark(id) {
  if (!S.fl.pro) return id === 'chief';
  const q = stage(), Q = QUESTS[q]; if (!Q) return false;
  if (Q.at === id && (Q.kill ? allDone() && isLeader() && !pending() : !myDone() || (allDone() && isLeader() && Q.ask && !pending()))) return true;
  if (Q.start === id && !S.fl.loaded) return true;
  if (Q.id === 'waste' && id === 'diaphragm' && !S.fl.exhaled && !myDone()) return true;
  return false;
}
function bang(x, y, t) { ctx.save(); ctx.translate(x, y + Math.sin(t * 4) * 4); rr(ctx, -13, -30, 26, 34, 10); fillS(ctx, '#ffd23f', 3); text('!', 0, -12, 26, OL); ctx.restore(); }
function tag(s, x, y, bg) {
  ctx.font = `15px ${FONT}`; const w = ctx.measureText(s).width + 14;
  rr(ctx, x - w / 2, y, w, 22, 7); ctx.fillStyle = bg + 'dd'; ctx.fill(); text(s, x, y + 11.5, 15, '#fff');
}
function aura(x, y, t) { ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5); ctx.beginPath(); ctx.ellipse(x, y - 4, 30, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.restore(); }
function shotDraw(s, t) {
  if (s.k === 'star') star4(ctx, s.x, s.y, 9, '#d8e0ec', t * 20);
  else if (s.k === 'arrow') { ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.f, 1); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(10, 0); stroke(ctx, 3, '#8a5a2b'); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -5); ctx.lineTo(4, 5); ctx.closePath(); fillS(ctx, '#ddd', 1.5); ctx.restore(); }
  else { ctx.save(); ctx.globalAlpha = 0.9; ell(ctx, s.x, s.y, s.k === 'bolt' ? 16 : 9, s.k === 'bolt' ? 12 : 9); ctx.fillStyle = s.k === 'bolt' ? '#ffe45c' : '#9fe6ff'; ctx.fill(); stroke(ctx, 2.5); ctx.restore(); }
}
function fxDraw(f) {
  if (f.k === 'die') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.6); drawMon(ctx, f.mk, f.x, f.y - f.t * 40, 1, 0, true); ctx.restore(); }
  else if (f.k === 'lv') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4); const g = ctx.createLinearGradient(0, f.y - 260, 0, f.y); g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(1, 'rgba(255,230,120,.8)'); ctx.fillStyle = g; ctx.fillRect(G.me.x - 40, f.y - 260, 80, 260); ctx.restore(); }
  else if (f.k === 'slash') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.3); ctx.translate(f.x, f.y); ctx.scale(f.f, 1); ctx.beginPath(); ctx.arc(-30, 0, 80, -1.2, 1.2); ctx.lineWidth = 14; ctx.strokeStyle = '#fff8c8'; ctx.stroke(); ctx.restore(); }
}
function bossBar(b) {
  rr(ctx, W / 2 - 300, 18, 600, 34, 12); ctx.fillStyle = 'rgba(30,8,14,.85)'; ctx.fill();
  rr(ctx, W / 2 - 292, 24, 584 * (b.hp / b.mhp), 22, 8); ctx.fillStyle = '#e8304a'; ctx.fill();
  text(`${MONS.boss.name}  ${Math.max(0, Math.ceil(b.hp))} / ${b.mhp}`, W / 2, 36, 18, '#fff', 'center', OL);
}
function miniMap() {
  const map = G.map, mw = 230, mh = Math.min(170, Math.max(70, mw * map.h / map.w)), sx = mw / map.w, sy = mh / map.h, x0 = 12, y0 = 12;
  rr(ctx, x0, y0, mw + 12, mh + 34, 10); ctx.fillStyle = 'rgba(16,20,40,.72)'; ctx.fill();
  text(map.name, x0 + 10, y0 + 15, 16, '#fff', 'left');
  ctx.save(); ctx.translate(x0 + 6, y0 + 28);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (const p of G.statics) ctx.fillRect(p.x * sx, p.y * sy, Math.max(2, p.w * sx), 2);
  for (const p of map.portals) if (portalShown(p)) { ctx.fillStyle = '#7fd3ff'; ctx.fillRect(p.x * sx - 2, (p.y || map.ground || 0) * sy - 6, 4, 6); }
  for (const [id, x, y] of map.npcs) { ctx.fillStyle = questMark(id) ? '#ffd23f' : '#7be07b'; ctx.beginPath(); ctx.arc(x * sx, y * sy - 3, 3, 0, 7); ctx.fill(); }
  for (const [id, p] of Object.entries(G.others)) if (onMyMap(p)) { ctx.fillStyle = inMyParty(id) ? '#6aa8ff' : '#ff7a7a'; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy - 3, 3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(G.me.x * sx, G.me.y * sy - 3, 4, 0, 7); ctx.fill(); stroke(ctx, 1.5);
  ctx.restore();
}

// ---- Title picture behind the DOM screens ----------------------------------------------------------------------------
function drawTitle() {
  drawBack(ctx, MAPS.town, G.t * 30, 0, G.t, W, H, true);
  drawPlat(ctx, MAPS.town, -10, 600, W + 20, 'ground');
  Object.keys(JOBS).forEach((j, i) => drawHero(ctx, 250 + i * 70, 600, 1, j, { g: i % 2 ? 'girl' : 'boy' }, { st: 'walk', t: G.t + i * 0.3, atk: -1 }));
  drawMon(ctx, 'starch', 760, 600, -1, G.t, false); drawMon(ctx, 'protein', 860, 600, -1, G.t + 1, false); drawMon(ctx, 'fat', 950, 600, -1, G.t + 2, false); drawMon(ctx, 'urea', 1040, 600, -1, G.t + 3, false);
}
function drawFigures() { // every figure side by side (?scene=figures)
  ctx.fillStyle = '#e8f4ff'; ctx.fillRect(0, 0, W, H);
  Object.keys(JOBS).forEach((j, i) => { drawHero(ctx, 80 + i * 70, 220, 1, j, { g: 'boy' }, { st: 'stand', t: 0, atk: -1 }); drawHero(ctx, 80 + i * 70, 330, 1, j, { g: 'girl' }, { st: 'walk', t: 0.1, atk: -1 }); text(JOBS[j].name, 80 + i * 70, 360, 16, OL); });
  ['starch', 'protein', 'fat', 'urea'].forEach((k, i) => { drawMon(ctx, k, 420 + i * 120, 220, 1, 0, false); text(MONS[k].name, 420 + i * 120, 250, 16, OL); });
  Object.keys(NPCS).forEach((id, i) => { drawNpc(ctx, id, 90 + i * 130, 500, 0, true); text(NPCS[id].name, 90 + i * 130, 530, 16, OL); });
  ['town', 'digest', 'lung', 'vessel', 'kidney'].forEach((th, i) => drawPlat(ctx, { theme: th, h: 720 }, 900 + (i % 2) * 190, 120 + i * 60, 170, 'plat'));
  drawMon(ctx, 'boss', 1150, 700, -1, 0, false);
}

// ---- Teacher page (?teacher=1, PIN 1004): every party, its answers, trials and boss lair ------------------------------
async function teacher() {
  show('teacher'); G.scene = 'teacher';
  const pin = $('#tPin');
  await new Promise(ok => { $('#tGo').onclick = () => { if (pin.value === '1004') ok(); else { pin.value = ''; pin.placeholder = '암호가 달라요'; } }; });
  $('#tLock').classList.add('hide'); $('#tMain').classList.remove('hide');
  const nets = {}, data = {}, drafts = {};
  let ch = 1, dirty = true;
  const T = () => nets[ch].now();
  $('#tTabs').innerHTML = [1, 2, 3, 4, 5].map(n => `<button class="chan" data-tc="${n}">채널 ${n}</button>`).join('');
  document.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { ch = +b.dataset.tc; dirty = true; render(); });
  for (let c = 1; c <= 5; c++) {
    try { nets[c] = await netConnect(chanBase(c), m => { $('#tState').textContent = m; }); } catch (e) { $('#tState').textContent = '연결 실패: 학교 와이파이를 확인해 주세요.'; return; }
    data[c] = { p: {}, pty: {} };
    nets[c].onKids('p', p => { data[c].p = p || {}; if (c === ch) dirty = true; });
    nets[c].on('pty', p => { data[c].pty = p || {}; if (c === ch) { dirty = true; render(); } });
  }
  $('#tState').textContent = `연결됨 (${nets[1].mode}) · 학생 답안이 오면 여기에 떠요.`;
  function render() {
    if (!dirty || !nets[ch] || !data[ch]) return; dirty = false;
    const keep = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.dk; // keep what the teacher is typing
    document.querySelectorAll('[data-dk]').forEach(el => { drafts[el.dataset.dk] = el.value; });
    document.querySelectorAll('[data-tc]').forEach(b => b.classList.toggle('sel', +b.dataset.tc === ch));
    const D = data[ch], now = T(), ps = D.p, live = id => ps[id] && now - ps[id].t < tune.stale_ms;
    const parties = Object.entries(D.pty).filter(([, P]) => P && P.m).sort((a, b) => (b[1].st || 0) - (a[1].st || 0));
    const loners = Object.entries(ps).filter(([id, p]) => live(id) && !p.pid);
    const waiting = parties.filter(([, P]) => { const q = P.st || 1, s = P.sub && P.sub[q], r = P.rv && P.rv[q]; return s && (!r || r.t < s.t); }).length;
    $('#tSummary').textContent = `파티 ${parties.length}개 · 확인 기다리는 답 ${waiting}개 · 파티 없는 학생 ${loners.length}명`;
    $('#tChans').innerHTML = parties.map(([pid, P]) => {
      const q = P.st || 1, Q = QUESTS[q], dn = (P.dn && P.dn[q]) || {}, s = P.sub && P.sub[q], r = P.rv && P.rv[q], wait = s && (!r || r.t < s.t);
      const tr = P.tr, ta = tr && P.ta && P.ta[tr.id], tv = tr && P.tv && P.tv[tr.id], br = P.br;
      return `<section class="pty ${wait ? 'wait' : ''}"><h3>${esc(P.nm)} <small>${P.solo ? '혼자' : Object.keys(P.m).length + '명'} · ${P.lock ? '출발함' : '마을에서 모이는 중'} · ${q >= 6 ? '모든 기관계 완료' : `퀘스트 ${q} ${esc(Q.title)}`}</small></h3>
        <div class="mem">${Object.entries(P.m).map(([id, m]) => `<span class="${live(id) ? '' : 'off'}">${P.L === id ? '★' : ''}${esc(m.n)} <small>${JOBS[m.j]?.name || ''} · Lv.${ps[id]?.lv ?? '?'} · ${live(id) ? mapName(ps[id].m) : '접속 끊김'}</small>${dn[id] ? ' ✓' : ''}<button data-kick="${pid}:${id}" title="파티에서 빼기">×</button></span>`).join('')}</div>
        ${wait ? `<div class="ans"><b>${esc(Q.ask)}</b><p>“${esc(s.a)}” <small>— ${esc(s.by)}</small></p><p class="hint">예시: ${esc(Q.hint)}</p>
          <div class="tb"><button data-ok="${pid}:${q}" class="okb">통과</button><input data-dk="rc:${pid}" placeholder="다시 쓰게 할 때 한마디 (선택)"><button data-no="${pid}:${q}">다시 쓰기</button></div></div>` : r && !r.ok ? `<p class="tip">다시 쓰라고 돌려보냄${r.c ? ': ' + esc(r.c) : ''}</p>` : ''}
        <div class="tb trl"><input data-dk="tq:${pid}" placeholder="거짓말 탐지기 질문 (예: 융털이 하는 일은?)"><input data-dk="ts:${pid}" class="sec" placeholder="${tune.trial_secs}" type="number">초<button data-tr="${pid}">시련 보내기</button></div>
        ${tr ? `<div class="ans trial"><b>시련: ${esc(tr.q)}</b>${tv ? `<p>${tv.ok ? '통과시킴' : '탈락시킴'}</p>` : ta ? `<p>“${esc(ta.a)}” <small>— ${esc(ta.by)}</small></p><div class="tb"><button data-tv="${pid}:${tr.id}:1" class="okb">통과</button><button data-tv="${pid}:${tr.id}:0">탈락</button></div>` : now > tr.t + tr.d * 1000 ? '<p>시간 안에 답하지 못해 탈락</p>' : '<p>답을 기다리는 중…</p>'}</div>` : ''}
        <div class="tb"><button data-boss="${pid}" class="${P.boss && P.boss.t ? 'on' : ''}">${P.boss && P.boss.t ? '보스 소굴 닫기' : '보스 소굴 열기'}</button>
          ${br ? `<span class="br">${br.win ? '보스 처치!' : `보스에게 짐 · 빠진 기관계: ${(br.miss || []).map(k => SYS[k].name).join(', ') || '없음'}`}</span>` : ''}
          <button data-st="${pid}:${Math.max(1, q - 1)}">단계 −1</button><button data-st="${pid}:${Math.min(6, q + 1)}">단계 +1</button><button data-del="${pid}" class="warn">파티 해산</button></div></section>`;
    }).join('') + (loners.length ? `<section><h3>아직 파티가 없는 학생 <small>(마을에서 출발하면 혼자 파티가 돼요)</small></h3><div class="mem">${loners.map(([, p]) => `<span>${esc(p.n)} <small>${JOBS[p.j]?.name || ''} · ${mapName(p.m)}</small></span>`).join('')}</div></section>` : '')
      + `<div class="tb"><button data-wipe="${ch}" class="warn">채널 ${ch} 기록 모두 지우기</button></div>`;
    document.querySelectorAll('[data-dk]').forEach(el => { if (drafts[el.dataset.dk] !== undefined) el.value = drafts[el.dataset.dk]; el.oninput = () => { drafts[el.dataset.dk] = el.value; }; });
    if (keep) { const el = document.querySelector(`[data-dk="${keep}"]`); if (el) { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
    const n = nets[ch], on = (sel, f) => document.querySelectorAll(sel).forEach(b => b.onclick = () => f(b));
    on('[data-ok]', b => { const [pid, q] = b.dataset.ok.split(':'); n.set(`pty/${pid}/rv/${q}`, { ok: true, t: T() }); n.set(`pty/${pid}/st`, +q + 1); });
    on('[data-no]', b => { const [pid, q] = b.dataset.no.split(':'); n.set(`pty/${pid}/rv/${q}`, { ok: false, c: drafts['rc:' + pid] || '', t: T() }); drafts['rc:' + pid] = ''; });
    on('[data-tr]', b => { const pid = b.dataset.tr, q = (drafts['tq:' + pid] || '').trim(); if (!q) return; n.set(`pty/${pid}/tr`, { id: 't' + T(), q, t: T(), d: Number(drafts['ts:' + pid]) || tune.trial_secs }); drafts['tq:' + pid] = ''; });
    on('[data-tv]', b => { const [pid, id, ok] = b.dataset.tv.split(':'); n.set(`pty/${pid}/tv/${id}`, { ok: ok === '1', t: T() }); });
    on('[data-boss]', b => { const pid = b.dataset.boss, P = D.pty[pid]; if (P.boss && P.boss.t) n.del(`pty/${pid}/boss`); else n.set(`pty/${pid}/boss`, { t: T() }); });
    on('[data-st]', b => { const [pid, st] = b.dataset.st.split(':'); n.set(`pty/${pid}/st`, +st); });
    on('[data-kick]', b => { const [pid, id] = b.dataset.kick.split(':'); if (confirm('이 학생을 파티에서 뺄까요? (지금까지의 단계는 그대로 가지고 혼자 계속해요)')) n.del(`pty/${pid}/m/${id}`); });
    on('[data-del]', b => { if (confirm('이 파티를 해산할까요? 학생들은 각자 지금 단계부터 혼자 계속해요.')) n.del('pty/' + b.dataset.del); });
    on('[data-wipe]', () => { if (confirm(`채널 ${ch}의 기록(파티, 몬스터, 접속)을 모두 지울까요? 학생 레벨·직업은 각 디벗에 남아요.`)) ['p', 'm', 'k', 'd', 'inv', 'pty'].forEach(k => n.del(k)); });
  }
  setInterval(() => { dirty = true; if (!document.activeElement || !document.activeElement.dataset || !document.activeElement.dataset.dk) render(); }, 2500);
  render();
}

// ---- Loop -------------------------------------------------------------------------------------------------------------------
function step() {
  G.t += STEP;
  if (pressed('KeyM') && !typing()) setMuted(!muted);
  if (G.scene === 'play') {
    updateMe(STEP); updateShots(STEP); trialTick();
    if (G.host) hostTick(STEP);
    else for (const mo of G.mons) if (mo.tx !== undefined) mo.x += (mo.tx - mo.x) * 0.2;
    for (const mo of G.mons) mo.flash = Math.max(0, mo.flash - STEP);
    for (const d of G.drops) { d.t += STEP; if (d.y < d.gy || d.vy < 0) { d.vy += tune.gravity * STEP; d.y = Math.min(d.gy, d.y + d.vy * STEP); } }
    G.fx.forEach(f => { f.t += STEP; }); G.fx = G.fx.filter(f => f.t < 1.5);
    G.nums.forEach(n => { n.t += STEP; }); G.nums = G.nums.filter(n => n.t < 1.1);
    if (G.banner) G.banner.t -= STEP; G.fade = Math.max(0, G.fade - STEP * 2.5);
    const m = G.me, tx = m.x - W / 2, ty = m.y - H * 0.62;
    G.cam.x += (tx - G.cam.x) * 0.12; G.cam.y += (ty - G.cam.y) * 0.12; clampCam();
    sendMe(false);
    if (Math.floor(G.t * 4) !== Math.floor((G.t - STEP) * 4)) hudBars();
    if (Math.floor(G.t) !== Math.floor(G.t - STEP)) { refreshParty(); if (Math.floor(G.t) % 10 === 0) save(); }
  }
  hit.clear();
}
function drawFrame() {
  if (G.scene === 'figures') drawFigures();
  else if (G.scene === 'play') drawPlay();
  else if (G.scene !== 'teacher') { drawTitle(); if (G.scene === 'job') drawJobCards(); }
}
let last = clock.now(), acc = 0;
function tick() { const now = clock.now(); acc += Math.min(now - last, 0.25); last = now; while (acc >= STEP) { step(); acc -= STEP; } drawFrame(); }
function frame() { tick(); requestAnimationFrame(frame); }
function timer() { if (document.visibilityState === 'visible' && clock.now() - last > 0.1) tick(); }

window.game = {
  get scene() { return G.scene === 'play' ? 'play' : G.scene; }, get state() { return { G, S }; },
  press(code) { hit.add(code); }, hold(code, on) { on ? down.add(code) : down.delete(code); }, get events() { return events; },
  step(n = 1, draw = true) { for (let i = 0; i < n; i++) step(); if (draw) drawFrame(); },
  // test helpers: jump straight to a party step or a map
  debug(q, map) { if (!S) return; S.fl.pro = 1; S.fl.left = 1; if (!S.pid) makeParty(true); if (G.net) G.net.set(`pty/${S.pid}/st`, q); else G.P.st = q; S.fl.seen = q - 1; save(); hud(); if (map) enterMap(map, 'start'); },
};

// buttons in the play screen
$('#bMute').onclick = () => setMuted(!muted);
$('#bParty').onclick = () => { $('#partyPanel').classList.toggle('hide'); refreshParty(); };
$('#bChan').onclick = () => {
  const P = $('#chanPanel'); P.classList.toggle('hide');
  P.innerHTML = '<h3>채널 바꾸기</h3>' + (S.fl.left ? '<p class="tip">출발한 뒤에는 채널을 바꿀 수 없어요 (파티가 이 채널에 있어요).</p>' : [1, 2, 3, 4, 5].map(n => `<button class="chan ${n === G.ch ? 'sel' : ''}" data-c="${n}">채널 ${n}</button>`).join('') + '<p class="tip">채널을 바꾸면 파티에서 나가요.</p>');
  P.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const n = +b.dataset.c; if (n === G.ch) return; leaveParty(true); if (G.net) G.net.del('p/' + G.id); save(); sset('bq:ch', n); sset('bq:auto', '1'); location.reload(); });
};
$('#bLeave').onclick = () => leaveParty(false);
$('#bRevive').onclick = respawn;
canvas.addEventListener('pointerdown', e => { // touch an NPC to talk
  startAudio(); if (G.scene !== 'play' || frozen()) return;
  const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / VIEW.k + G.cam.x, y = (e.clientY - r.top) / VIEW.k + G.cam.y;
  const n = G.map.npcs.find(([, nx, ny]) => Math.abs(nx - x) < 50 && y > ny - 110 && y < ny + 20);
  if (n) { if (Math.abs(n[1] - G.me.x) < 160) talk(n[0]); else toast(`${NPCS[n[0]].name}에게 더 가까이 가요.`); }
});
addEventListener('pagehide', () => { save(); if (G.net) G.net.del('p/' + G.id); });

if (params.get('scene') === 'figures') { G.scene = 'figures'; show('none'); }
else if (params.get('teacher')) teacher();
else startLogin();
if (params.get('manual') === '1') drawFrame();
else { requestAnimationFrame(frame); setInterval(timer, 50); }
