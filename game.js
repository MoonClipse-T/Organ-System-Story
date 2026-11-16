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
const TOUCH = matchMedia('(pointer: coarse)').matches;
function fit() {
  const k = Math.min(innerWidth / W, innerHeight / H), r = k * Math.min(devicePixelRatio || 1, TOUCH ? 1 : 1.5); // 디벗: 1x is plenty, 2x+ fills 4× the pixels
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
const K = { left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], jump: ['Space', 'AltLeft', 'KeyC'], atk: ['KeyZ', 'ControlLeft', 'KeyJ'], skill: ['KeyX', 'KeyK'], move: ['ShiftLeft', 'ShiftRight', 'KeyL'], power: ['KeyV', 'KeyI'] };
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
  whoosh: () => tone(900, 0.16, 'sine', 0.1, 0.4), magic: () => { tone(1200, 0.08, 'sine', 0.08, 1.8); setTimeout(() => tone(1600, 0.1, 'sine', 0.07, 0.6), 50); },
  zap: () => { tone(90, 0.3, 'sawtooth', 0.14, 3); tone(1800, 0.12, 'square', 0.06, 0.3); },
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
const maxHp = () => Math.round(tune.hp_base + S.lv * tune.hp_per_lv + job().hpBonus);
const maxMp = () => Math.round(job().mpBase + S.lv * 6);
const knows = k => S.lv >= SKILL_LV[k]; // move (Lv.5) · power (Lv.10)
const atkPower = () => Math.round(tune.dmg_base + (S.quiz || 0) * tune.dmg_per_answer); // only the entry quiz; levels never add
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
const stage = () => (G.P ? Math.min(QUESTS.length - 1, G.P.st || 1) : S.fl.pro ? 1 : 0); // the party's quest step (QUESTS index)
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
// 심장 박동 (혈관 급류 어려움): the same beat on every tablet
const beatPh = () => netT() % tune.beat_every;
const beatOn = () => !!G.map.pulse && beatPh() < 0.35;               // 수축: the surge
const valveOpen = () => !!G.map.pulse && beatPh() < tune.beat_open; // 판막이 열려 있는 동안
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
  return { x, y, vx: 0, vy: 0, f: 1, ground: null, rope: null, drop: 0, hurt: 0, inv: 0, atkT: -1, atkCd: 0, skillCd: 0, moveCd: 0, powCd: 0, push: 0, pvx: 0, dj: false, hp: maxHp(), mp: maxMp(), st: 'stand', at: 0, cp: -1 };
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
  $('#chans').innerHTML = chanList().map(n => `<button class="chan" data-ch="${n}">채널 ${n}</button>`).join('');
  let ch = Number(sget('bq:ch')) || 0; // first time: a random channel, so nobody piles into 채널 1
  if (!(ch >= 1 && ch <= CHANNELS)) ch = 1 + Math.floor(Math.random() * CHANNELS);
  const mark = () => document.querySelectorAll('.chan').forEach(b => b.classList.toggle('sel', +b.dataset.ch === ch));
  document.querySelectorAll('.chan').forEach(b => b.onclick = () => { ch = +b.dataset.ch; mark(); }); mark();
  const R = $('#room'), msg = $('#roomMsg'), solo = !!params.get('offline');
  $('#roomRow').classList.toggle('hide', solo); msg.classList.toggle('hide', solo);
  R.value = sget('bq:room') || ''; R.oninput = () => { R.value = R.value.replace(/\D/g, '').slice(0, 4); };
  const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('bad', !!bad); };
  let busy = false;
  const enter = async then => { // the teacher must have opened this room
    if (busy) return; if (solo) { then(); return; }
    const code = R.value.trim();
    if (!/^\d{4}$/.test(code)) { say('방 번호 4자리를 먼저 써 주세요!', true); R.focus(); return; }
    busy = true; say('방을 찾는 중…');
    let o = null, now = Date.now();
    try { const n = await netConnect(roomBase(code), m => say(m)); o = await n.get('open'); now = n.now(); }
    catch (e) { busy = false; say('서버에 연결하지 못했어요. 와이파이를 확인하고 다시 눌러 주세요.', true); return; }
    busy = false;
    if (!o) { say(`${code}번 방이 없어요. 번호를 다시 확인해 주세요.`, true); return; }
    if (!roomLive(o, now)) { say(`${code}번 방은 아직 열리지 않았어요(또는 닫혔어요). 선생님이 열 때까지 기다려요.`, true); return; }
    sset('bq:room', code); then();
  };
  if (sv && sv.job) {
    $('#cont').classList.remove('hide'); $('#cont').textContent = `이어하기 · ${sv.name} (Lv.${sv.lv} ${JOBS[sv.job].name})`;
    $('#cont').onclick = () => enter(() => { S = sv; sset('bq:ch', ch); go(ch); });
    $('#name').value = sv.name;
  }
  $('#newgame').onclick = () => {
    const name = $('#name').value.trim().slice(0, 8);
    if (!name) { $('#name').focus(); $('#name').placeholder = '이름을 먼저 써 주세요!'; return; }
    enter(() => {
      S = { name, job: '', look: { g: 'boy' }, lv: 1, exp: 0, inv: {}, fl: { trials: {} }, pid: '', lastSt: 1, room: sget('bq:room') || '' };
      sset('bq:ch', ch); startQuiz();
    });
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
    S.quiz = right;
    $('#qq').innerHTML = `${QUIZ.length}문제 중 <b>${right}</b>개 정답!<br>공격력 <b>${atkPower()}</b> <small>(정답이 많을수록 세요 · 이 공격력은 끝까지 그대로예요)</small>`;
    $('#qbar').style.width = '100%'; $('#qn').textContent = '입장 문제 끝';
    $('#qa').innerHTML = '<button class="go">직업 고르러 가기</button>'; $('#qa .go').onclick = startJob;
    events.push({ type: 'quiz', right });
  };
  ask();
}
function startJob() {
  show('job'); G.scene = 'job';
  $('#jobs').innerHTML = Object.entries(JOBS).map(([k, j]) => `<button class="jcard" data-j="${k}"><canvas width="120" height="120"></canvas><b style="color:${j.color}">${j.name}</b><span>${j.blurb}</span><small>스킬 「${j.skill.name}」<br>Lv.5 「${j.move.name}」 · Lv.10 「${j.power.name}」</small></button>`).join('');
  lookRow();
  document.querySelectorAll('.jcard').forEach(b => {
    b.onclick = () => { S.job = b.dataset.j; document.querySelectorAll('.jcard').forEach(x => x.classList.toggle('sel', x === b)); jobPanel(); };
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
function jobPanel() { // what this job learns as it levels up; no stats to share out any more
  const P = $('#stats'), J = job(); P.classList.remove('hide');
  P.innerHTML = `<h3 style="color:${J.color}">${J.name}</h3><div class="sk"><b>공격 · 스킬</b><span>${J.skill.name} (MP ${J.skill.mp})</span></div>`
    + `<div class="sk"><b>Lv.5</b><span>${J.move.name} — ${J.move.text}</span></div><div class="sk"><b>Lv.10</b><span>${J.power.name} — ${J.power.text}</span></div>`
    + `<p class="tip">공격력은 입장 문제로 정해졌어요 (<b>${atkPower()}</b>). 레벨이 올라도 공격력은 그대로이고, HP · MP가 늘고 Lv.5와 Lv.10에 새 스킬을 배워요.</p><button id="startB" class="go">모험 시작!</button>`;
  $('#startB').onclick = () => go(Number(sget('bq:ch')) || 1);
}

// ---- Joining a channel ---------------------------------------------------------------------------------
async function go(ch) {
  show('loading'); G.scene = 'loading'; G.ch = ch; G.id = myId();
  const say = m => { $('#loadMsg').textContent = m; };
  S.fl = S.fl || {}; S.fl.trials = S.fl.trials || {}; S.look = { g: S.look && S.look.g === 'girl' ? 'girl' : 'boy' };
  const solo = !!params.get('offline'), room = solo ? '' : sget('bq:room') || '';
  if (!solo && !room) { startLogin(); return; }
  let fresh = false;
  if (!solo && S.room !== room) { // a new room is a new class: keep level, job and stats, start the quests again
    fresh = !!S.room;
    S.room = room; S.pid = ''; S.lastSt = 1; S.inv = {}; S.fl = { pro: S.fl.pro, boss: S.fl.boss, trials: {} }; delete S.map;
  }
  if (!solo) watchRoom(room);
  try { G.net = solo ? null : await netConnect(chanBase(ch, room), say); }
  catch (e) { G.net = null; say('서버에 연결하지 못해 혼자 하기로 시작해요.'); await new Promise(r => setTimeout(r, 1200)); }
  if (G.net) {
    G.net.onKids('p', ps => { G.others = Object.fromEntries(Object.entries(ps || {}).filter(([k]) => k !== G.id)); pickHost(); refreshParty(); });
    G.net.on('inv/' + G.id, iv => { if (iv && G.net.now() - iv.t < 30000 && iv.pid !== S.pid) invitePopup(iv); });
    G.net.on('cmd/' + G.id, onCmd);
  }
  G.me = null;
  const m = S.map && MAPS[S.map] && !MAPS[S.map].inst ? S.map : 'town';
  enterMap(m, S.map ? S.x : 300, S.map ? S.y : undefined);
  G.me.hp = maxHp(); G.me.mp = maxMp();
  if (S.pid) watchParty(S.pid); else if (!G.net && S.fl.left) makeParty(true);
  show('play'); G.scene = 'play'; startAudio(); hud(); refreshParty();
  $('#chanTag').textContent = `${room ? `방 ${room} · ` : ''}채널 ${ch}${G.net ? '' : ' · 혼자 (선생님 확인 없이 자동 통과)'}`;
  if (fresh) toast(`새 방(${room})이라 퀘스트를 처음부터 시작해요. 레벨·직업은 그대로예요.`);
  if (!S.fl.pro) toast('셀리 촌장에게 다가가 ↑ 키(또는 촌장을 터치)로 말을 걸어 보세요!');
  events.push({ type: 'join', ch, mode: G.net ? G.net.mode : 'solo' });
}
async function onCmd(c) { // the teacher, for me alone
  if (!c || !c.t || c.t <= (S.fl.cmdT || 0)) return;
  S.fl.cmdT = c.t; save();
  if (G.scene !== 'play') return;
  if (c.k === 'town') { if (G.mapId !== 'town') enterMap('town', 300); G.banner = { big: '선생님 호출!', small: '세포 마을로 돌아왔어요.', t: 3 }; SFX.alarm(); }
  if (c.k === 'join' && c.pid && c.pid !== S.pid) {
    const P = await G.net.get('pty/' + c.pid); if (!P || !P.m) return;
    if (S.pid) leaveParty(true);
    S.pid = c.pid; if (P.lock) S.fl.left = 1;
    G.net.set(`pty/${c.pid}/m/${G.id}`, { n: S.name, j: S.job }); watchParty(c.pid); save();
    G.banner = { big: '파티가 바뀌었어요', small: `선생님이 「${P.nm}」에 넣었어요.`, t: 4 }; SFX.quest();
  }
}
function watchRoom(room) { // the teacher closed the room: stop playing, keep my save
  if (G.roomOff) G.roomOff();
  netConnect(roomBase(room)).then(n => {
    G.roomOff = n.on('open', o => {
      if (o && roomLive(o, n.now())) return;
      if (G.scene !== 'play' && G.scene !== 'loading') return;
      save(); if (G.net) G.net.del('p/' + G.id);
      G.unsub.forEach(f => f && f()); G.unsub = []; if (G.pOff) G.pOff(); G.pOff = null; BGM.el.pause(); BGM.want = "";
      show('closed'); G.scene = 'closed';
    });
  }).catch(() => { /* no server: the channel connection reports it */ });
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
    const miss = bossMissing();
    if (miss.some(r => r.sys === 'cell')) { G.nums.push({ x: m.x, y: m.y - 190, v: '보호막! 에너지가 없어요', t: 0, item: true }); return; }
    if (miss.some(r => r.sys === 'digest')) dmg = Math.max(1, Math.round(dmg * 0.02));
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
    S.exp -= expNeed(); S.lv++; G.me.hp = maxHp(); G.me.mp = maxMp();
    G.fx.push({ k: 'lv', x: G.me.x, y: G.me.y, t: 0 }); SFX.lvup();
    const learn = S.lv === SKILL_LV.move ? job().move : S.lv === SKILL_LV.power ? job().power : null;
    G.banner = learn ? { big: `Lv.${S.lv} · 새 스킬 「${learn.name}」!`, small: learn.text, t: 5 } : { big: `레벨 업! Lv.${S.lv}`, small: `HP · MP가 늘었어요${S.lv < SKILL_LV.power ? ` · 다음 스킬은 Lv.${S.lv < SKILL_LV.move ? SKILL_LV.move : SKILL_LV.power}` : ''}`, t: 2 };
    if (learn) toast(`${S.lv === SKILL_LV.move ? 'Shift' : 'V'} 키 또는 오른쪽 아래 「${learn.name}」 버튼`);
  }
  save(); hud();
}

// ---- Boss lair: one per party, opened by the teacher ----------------------------------------------------
const bossMissing = () => (G.mapId === 'lair' ? BOSS_RULES.filter(r => wrongQs().includes(r.q)) : []); // 오답 = that system fails
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
function bossLose(miss, write) { // we fell in the lair: show which answers were wrong, and let the leader write them again
  if (write && G.net && S.pid) G.net.set(`pty/${S.pid}/br`, { lose: G.net.now(), miss: miss.map(r => r.sys) });
  const box = $('#card'); box.classList.remove('hide'); G.modal = true;
  const lead = isLeader();
  box.innerHTML = `<div class="cin" style="--c:#c8324a"><small>세균 대왕에게 졌어요</small><h2>${miss.length ? '말썽을 부린 기관계' : '아쉽게 졌어요'}</h2>`
    + (miss.length ? `<p>선생님이 <b>오답</b>으로 확인한 기관계가 제 일을 못 했어요. 무엇이 틀렸는지 보고 ${lead ? '다시 써서' : '파티장이 다시 써서'} 내면, 정답일 때 이 말썽이 사라져요.</p><ul class="miss">${miss.map(r => { const s = subOf(r.q), g = grOf(r.q); return `<li style="--c:${SYS[r.sys].color}"><b>${SYS[r.sys].name} · ${r.name}</b> ${r.text}${s ? `<br><small>우리 답: “${esc(s.a)}”${g && g.c ? ` · 선생님: ${esc(g.c)}` : ''}</small>` : ''}${lead ? `<br><button class="go small" data-rw="${r.q}">이 답 다시 쓰기</button>` : ''}</li>`; }).join('')}</ul>`
      : '<p>모든 기관계가 제 일을 했어요. 포자를 피하고, 아무도 쓰러지지 않게 서로 도우며 다시 도전해요!</p>')
    + '<button class="go" id="blX">마을로</button></div>';
  const close = () => { box.classList.add('hide'); G.modal = false; hud(); };
  $('#blX').onclick = close;
  box.querySelectorAll('[data-rw]').forEach(b => b.onclick = () => { close(); answerBox(+b.dataset.rw, true); });
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
    if (G.pOff) G.pOff(); G.pOff = null; // stop listening before making my own party (same id): no echo loop
    S.pid = ''; save(); if (S.fl.left) makeParty(true, was); refreshParty(); hud(); return;
  }
  S.lastSt = G.P.st || 1;
  if (was && (G.P.st || 1) > (was.st || 1)) stepUp(was.st || 1, G.P.st);
  else if (!was && (S.fl.seen || 0) < (G.P.st || 1) - 1) stepUp(S.fl.seen || 1, G.P.st); // came back to a party that moved on
  trialNote();
  orders(was, 'wipe'); orders(was, 'call');
  refreshParty(); hud(); save();
}
function stepUp(from, to) { // a mission is done: back to town, cards for every step cleared, then the chief says where next
  S.fl.seen = to - 1; delete S.fl.loaded; delete S.fl.exhaled; delete S.fl.urine;
  if (G.mapId !== 'town') { enterMap('town', 640); G.me.hp = Math.max(G.me.hp, Math.round(maxHp() * 0.6)); }
  const cards = QUESTS.slice(from, to).filter(Q => Q.sys).map(Q => Q.sys);
  SFX.quest(); G.fx.push({ k: 'lv', x: G.me.x, y: G.me.y, t: 0 });
  const next = () => {
    const s = cards.shift(); if (s) { card(s, next); return; }
    if (to >= QUESTS.length - 1) { G.banner = { big: '마지막 미션!', small: '셀리 촌장에게 이야기를 듣고 세균 소굴 포탈로 · 선생님이 답을 모두 확인해야 들어갈 수 있어요.', t: 5, boss: true }; SFX.alarm(); }
    else { G.banner = { big: '미션 완료! 세포 마을로', small: '셀리 촌장(!)에게 다음에 갈 곳을 들어요.', t: 4 }; toast('셀리 촌장에게 말을 걸면 다음에 갈 곳을 알려 줘요.'); }
  };
  next(); save();
}
function orders(was, k) { // wipe: a party member fell · call: the teacher called the party home → everyone back to town
  const w = G.P && G.P[k]; if (!w || !w.t) return;
  const key = k + 'T', seen = S.fl[key]; S.fl[key] = w.t;
  if (!was || seen === w.t || w.id === G.id || G.dead) return; // first look at the party, old news, or my own fall
  const miss = bossMissing(), inLair = G.mapId === 'lair';
  if (inLair && k === 'wipe') S.fl.lostAt = G.net ? G.net.now() : Date.now();
  if (G.mapId !== 'town') enterMap('town', 300);
  G.me.hp = Math.max(G.me.hp, Math.round(maxHp() * 0.5)); G.me.inv = 2;
  G.banner = k === 'wipe' ? { big: `${w.n} 쓰러짐!`, small: '파티원 한 명이 쓰러지면 파티 모두 세포 마을로 돌아와요.', t: 4, boss: true } : { big: '선생님 호출!', small: '파티 모두 세포 마을로 돌아왔어요.', t: 4 };
  SFX.alarm(); save(); hud();
  if (inLair && k === 'wipe') bossLose(miss, false);
}
function makeParty(solo, carry) { // carry: the party I was taken out of — I keep its answers
  const pid = 'P' + G.id;
  const P = { L: G.id, nm: `${S.name}${solo ? '' : '의 파티'}`, st: Math.max(1, S.lastSt || 1), m: { [G.id]: { n: S.name, j: S.job } }, solo: solo ? 1 : 0 };
  S.pid = pid;
  if (!G.net) { G.P = P; if (S.fl.left) G.P.lock = 1; save(); return; }
  G.net.set(`pty/${pid}/m/${G.id}`, P.m[G.id]); // membership first, so nobody reads a party without me in it
  G.net.set(`pty/${pid}/L`, G.id); G.net.set(`pty/${pid}/nm`, P.nm); G.net.set(`pty/${pid}/st`, P.st);
  if (solo) G.net.set(`pty/${pid}/solo`, 1); else G.net.del(`pty/${pid}/solo`);
  if (carry) for (const k of ['sub', 'gr']) for (const [q, v] of Object.entries(carry[k] || {})) if (v) G.net.set(`pty/${pid}/${k}/${q}`, v);
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
  const pid = S.pid, lead = isLeader(), rest = partyMembers();
  if (G.pOff) G.pOff(); G.pOff = null; G.P = null; S.pid = ''; // stop listening first: our own delete must not look like a kick
  if (G.net) {
    if (lead && rest.length) G.net.set(`pty/${pid}/L`, rest[0]); // a leader who leaves hands the party on
    if (lead && !rest.length) G.net.del('pty/' + pid); else G.net.del(`pty/${pid}/m/${G.id}`);
  }
  save(); refreshParty(); hud();
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
// 답: sub/<q> = { a, by, t, n } (n-th try) · gr/<q> = { ok, c, t } from the teacher, for the answer it is newer than
const ASKQ = QUESTS.map((Q, i) => (Q.ask ? i : -1)).filter(i => i > 0);
const subOf = q => (G.P && G.P.sub && G.P.sub[q]) || null;
const grOf = q => { const g = G.P && G.P.gr && G.P.gr[q], s = subOf(q); return g && s && g.t >= s.t ? g : null; };
const ungraded = () => (G.net ? ASKQ.filter(q => subOf(q) && !grOf(q)) : []);
const wrongQs = () => ASKQ.filter(q => { const g = grOf(q); return g && !g.ok; });
const canRewrite = q => { const g = grOf(q); return !!(g && !g.ok && (S.fl.lostAt || 0) > g.t); }; // only after the boss showed us
function markDone() { // my part of this step is finished
  const q = stage();
  if (G.net && S.pid) G.net.set(`pty/${S.pid}/dn/${q}/${G.id}`, 1);
  else if (G.P) { G.P.dn = G.P.dn || {}; (G.P.dn[q] = G.P.dn[q] || {})[G.id] = 1; }
  SFX.quest(); toast(QUESTS[q].ask ? (memberIds().length > 1 ? '내 몫 끝! 파티원이 모두 끝내면 파티장이 답을 써요.' : '퀘스트 끝! 이제 답을 써요 (한 번만 낼 수 있어요).') : '완료!');
  hud(); refreshParty(); save();
  setTimeout(() => { if (allDone() && isLeader() && QUESTS[q].ask) answerBox(); }, 400);
}
function answerBox(q0, again) { // the leader writes the party's answer: once, then on to the next mission
  const q = q0 ?? stage(), Q = QUESTS[q]; if (!Q || !Q.ask) return;
  if (!isLeader()) { toast('파티장이 답을 써요.'); return; }
  if (again) { if (!canRewrite(q)) { toast('보스전에서 진 다음에 틀린 답만 다시 쓸 수 있어요.'); return; } }
  else {
    if (subOf(q)) { toast('이 미션의 답은 벌써 냈어요.'); return; }
    if (!allDone()) { toast('파티원이 모두 퀘스트를 끝내야 답을 낼 수 있어요.'); return; }
  }
  const box = $('#answer'), g = grOf(q), old = subOf(q);
  box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:${SYS[Q.sys].color}"><small>${SYS[Q.sys].name} · ${again ? '다시 쓰기' : '파티 답안'}</small><h2>${esc(Q.title)}</h2>`
    + `<p class="once">${again ? '다시 낼 수 있는 기회도 <b>1회</b>예요.' : '답은 <b>1회</b>만 낼 수 있어요. 낸 뒤에는 고칠 수 없어요.'} 글자 수 제한은 없으니 아는 만큼 자세히 써요.</p><p class="qask">${esc(Q.ask)}</p>`
    + (again && old ? `<p class="back">지난 답: “${esc(old.a)}”${g && g.c ? `<br>선생님: ${esc(g.c)}` : ''}</p>` : '')
    + `<textarea id="ansT" rows="5" placeholder="교과서를 보며 파티원과 의논해서 써요. 틀리면 보스전에서 이 기관계가 말썽을 부려요!"></textarea><div class="row"><button id="ansX">나중에</button><button id="ansGo" class="go">${again ? '다시 내기' : '답 내기'}</button></div></div>`;
  $('#ansX').onclick = () => { box.classList.add('hide'); G.modal = false; };
  $('#ansGo').onclick = () => {
    const a = $('#ansT').value.trim(); if (!a) { $('#ansT').placeholder = '답을 써 주세요!'; return; }
    if (!confirm(`답은 1회만 낼 수 있어요. 이 답으로 낼까요?\n\n${a}`)) return;
    box.classList.add('hide'); G.modal = false;
    const rec = { a, by: S.name, t: G.net ? G.net.now() : Date.now(), n: ((old && old.n) || 1) + (again ? 1 : 0) };
    if (G.net && S.pid) {
      G.net.set(`pty/${S.pid}/sub/${q}`, rec);
      if (!again) G.net.set(`pty/${S.pid}/st`, q + 1);
      toast(again ? '다시 냈어요! 선생님이 확인하면 보스에 다시 도전해요.' : '답을 냈어요! 다음 미션으로 가요. 선생님이 나중에 확인해요.');
    } else { // 혼자 하기 (?offline): no teacher, every answer counts as right
      G.P.sub = { ...(G.P.sub || {}), [q]: rec }; G.P.gr = { ...(G.P.gr || {}), [q]: { ok: true, t: rec.t } };
      if (!again) { const from = G.P.st; G.P.st = q + 1; stepUp(from, G.P.st); }
    }
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
    + (ans ? `<p class="sent">${esc(ans.by)}님이 답했어요: “${esc(ans.a)}”<br>운영자 판정을 기다리는 중…</p>` : `<textarea id="trT" rows="3" placeholder="파티원 누구든 답을 써요"></textarea><button id="trGo" class="go">답하기</button>`) + '</div>';
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
  m.moveCd = Math.max(0, (m.moveCd || 0) - dt); m.powCd = Math.max(0, (m.powCd || 0) - dt); m.push = Math.max(0, (m.push || 0) - dt);
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
    if (isHit('move') && !m.rope) moveSkill();
    if (isHit('power') && !m.rope) powerSkill();
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
  m.prone = !frozen() && D && !!m.ground && m.push <= 0 && m.hurt <= 0; // 엎드리기: ▼ on the ground, still turns with ◀ ▶
  if (m.hurt <= 0) {
    const want = frozen() || m.prone || m.atkT >= 0 && m.ground ? 0 : (R ? 1 : 0) - (L ? 1 : 0);
    m.vx = want * tune.walk * slow; if (want) m.f = want;
    if (m.prone && (L || R)) m.f = R ? 1 : -1;
  }
  if (m.push > 0) m.vx = m.pvx; // 대쉬 · 백대쉬 · 더블 점프: the skill moves me, not the stick
  if (!frozen() && isHit('jump') && m.ground) {
    if (D && m.ground.k !== 'ground' && m.ground.k !== 'floor') { m.drop = 0.3; m.ground = null; }
    else { m.vy = -tune.jump * (slow < 1 ? 0.8 : 1); m.ground = null; SFX.jump(); }
  } else if (!frozen() && isHit('jump') && !m.ground && J.move.kind === 'djump' && knows('move')) moveSkill(); // 도적: jump again in the air
  const fh = footholds();
  if (m.ground && m.ground.k === 'mover') { // stay on a moving foothold
    const now = fh.find(p => p.k === 'mover' && Math.abs(p.x - m.ground.x) < 40 && Math.abs(p.w - m.ground.w) < 1 && Math.abs(p.y - m.ground.y) < 40);
    if (now) { m.x += now.x - m.ground.x; m.y = now.y; m.ground = now; } else m.ground = null;
  }
  if (m.ground && m.ground.i >= 0 && blinkOff(m.ground.i)) m.ground = null; // the branch vanished under me
  if (beatOn() && !m.rope) m.vx += tune.beat_push * (m.ground ? 0.55 : 1) * (1 - beatPh() / 0.35); // 쿵! the blood carries me right
  m.x += m.vx * dt;
  if (m.ground && (m.x < m.ground.x - 4 || m.x > m.ground.x + m.ground.w + 4)) m.ground = null; // walked off the edge
  if (!m.ground) {
    const y0 = m.y; m.vy = Math.min(tune.fall_max, m.vy + tune.gravity * dt); m.y += m.vy * dt;
    if (m.vy >= 0) for (const p of fh) {
      if (m.drop > 0 && p.k !== 'ground' && p.k !== 'floor') continue;
      if (m.x >= p.x - 3 && m.x <= p.x + p.w + 3 && y0 <= p.y + 2 && m.y >= p.y) { m.y = p.y; m.vy = 0; m.ground = p; m.dj = false; break; }
    }
  }
  m.x = Math.max(20, Math.min(map.w - 20, m.x));
  if (map.valves) valves(m);
  if (map.hazard && m.y > map.hazard + 20) fallBack(true);
  if (m.y > map.h + 300) fallBack(false);
  m.st = m.hurt > 0 ? 'hurt' : !m.ground ? 'jump' : m.prone && m.ground ? 'prone' : Math.abs(m.vx) > 1 ? 'walk' : 'stand';
  if (map.gim) hazards(m);
  if (m.inv <= 0 && !G.dead && !(m.push > 0 && J.move.kind === 'dash')) { // touching monsters, clots, spores (not while dashing)
    for (const mo of G.mons) {
      if (mo.dead) continue; const M = MONS[mo.k];
      if (Math.abs(mo.x - m.x) < M.w / 2 + 8 && m.y > mo.y - M.h - 30 && m.y < mo.y + 20) { hurt(M.dmg, mo.x < m.x ? 1 : -1); break; }
    }
    if (map.clots) for (const c of map.clots) { const x = clotX(c); if (Math.abs(x - m.x) < (m.prone ? 40 : 28) && Math.abs(m.y - c[1]) < 40) { hurt(8, x < m.x ? 1 : -1); break; } }
    for (const s of spores()) if (s.ph > SPORE.warn + SPORE.fall - 0.05 && !G.sporeHit[s.id] && Math.abs(s.x - m.x) < 36 && Math.abs(m.y - s.gy) < 50) { G.sporeHit[s.id] = 1; hurt(MONS.boss.dmg, s.x < m.x ? 1 : -1); break; }
  }
  for (const d of G.drops) if (d.t > 0.4 && Math.abs(d.x - m.x) < 30 && Math.abs(d.y - m.y) < 50 && !d.got) { // drops I walk over
    d.got = true; give(d.id); SFX.pick(); G.nums.push({ x: d.x, y: d.y - 40, v: `${ITEMS[d.id].name} +1`, t: 0, item: true }); hud(); save();
  }
  G.drops = G.drops.filter(d => !d.got);
}
function hazards(m) { // 어려움: dust balls shove, blasts from below knock you off
  if (m.inv > 0) return;
  const body = m.prone ? m.y - 10 : m.y - 30, tall = m.prone ? 22 : 40; // lying flat, the dust balls fly over
  for (const o of G.map.gim.orbs) { const p = orbAt(o); if (Math.abs(p.x - m.x) < 32 && Math.abs(p.y - body) < tall) { shove(p.x < m.x ? 1 : -1, 0); return; } }
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
  if (G.map.pulse && !valveOpen()) for (let i = 0; i < vs.length; i++) // shut between beats: wait for 쿵!
    if (m.cp < i && m.x > vs[i] + 6 && m.x < vs[i] + 34) { m.x = vs[i] + 6; m.vx = Math.min(0, m.vx); /* stand on the floor in front of it */ if (!G.waitT || G.t - G.waitT > 4) { G.waitT = G.t; toast('판막이 닫혀 있어요. 심장이 쿵! 뛸 때 열려요.'); } break; }
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
  const m = G.me; m.hp -= dmg; m.inv = tune.hurt_invuln; m.hurt = 0.3; m.push = 0; m.vx = dir * 260; m.vy = -330; m.ground = null; m.rope = null;
  G.nums.push({ x: m.x, y: m.y - 80, v: dmg, t: 0, ouch: true }); SFX.hurt();
  if (m.hp <= 0) { m.hp = 0; die(); }
  hud();
}
function die() {
  if (G.dead) return; G.dead = true;
  const lost = Math.min(S.exp, Math.round(expNeed() * tune.death_exp)); S.exp -= lost;
  if (G.net && S.pid && partyMembers().length) G.net.set(`pty/${S.pid}/wipe`, { t: G.net.now(), id: G.id, n: S.name });
  if (G.mapId === 'lair') { S.fl.lostAt = G.net ? G.net.now() : Date.now(); const miss = bossMissing(); save(); respawn(); bossLose(miss, true); return; }
  save();
  $('#deadMsg').textContent = `쓰러졌어요… 경험치 ${lost}을(를) 잃었어요.${partyMembers().length ? ' 파티 모두 세포 마을로 돌아가요.' : ''} HP와 MP는 아주 천천히 차니 조심해요!`;
  $('#dead').classList.remove('hide');
}
function attack(kind) { // false: attack · true: skill (X) · 'power': the Lv.10 skill (V)
  const m = G.me, J = job(), A = kind === 'power' ? J.power : kind ? J.skill : J.atk;
  if (kind) m.mp -= A.mp;
  if (kind === 'power') m.powCd = A.cd; else if (kind) m.skillCd = A.cd;
  m.atkCd = Math.max(m.atkCd, A.cd); m.atkT = 0; m.at = Math.round(netT() * 1000); A.magic ? SFX.magic() : SFX.swing();
  const base = atkPower(), boost = stage() >= 5 ? 1 + tune.energy_bonus : 1;
  const targets = G.mons.filter(mo => !mo.dead && (mo.x - m.x) * m.f > -30 - MONS[mo.k].w / 2 && Math.abs(mo.x - m.x) - MONS[mo.k].w * 0.4 < A.range && Math.abs((mo.y - MONS[mo.k].h / 2) - (m.y - 30)) < MONS[mo.k].h / 2 + 50)
    .sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, A.hits);
  const shoot = (tg, delay) => {
    const dmg = Math.max(1, Math.round(base * A.mult * boost * (0.85 + rng() * 0.3)));
    const tx = tg ? tg.x : m.x + m.f * A.range * 0.7, ty = tg ? tg.y - MONS[tg.k].h / 2 : m.y - 36;
    if (A.shot) G.shots.push({ k: A.shot, x: m.x + m.f * (m.prone ? 40 : 20), y: m.y - (m.prone ? 14 : 36), tx, ty, t: -delay, f: m.f, tg, dmg });
    else if (A.magic) G.shots.push({ k: 'magic', mg: A.magic, x: tx, y: ty, tx, ty, t: -delay - 0.08, f: m.f, tg, dmg });
    else if (tg) landHit(tg, dmg);
  };
  if (!targets.length && (A.shot || A.magic)) shoot(null, 0);
  targets.forEach(tg => { shoot(tg, 0); if (A.twice) shoot(tg, A.magic ? 0.16 : 0.12); });
  if (A.magic) G.fx.push({ k: 'cast', x: m.x + m.f * 26, y: m.y - 44, f: m.f, t: 0 });
  if (kind === true && J.weapon === 'sword') G.fx.push({ k: 'slash', x: m.x + m.f * 60, y: m.y - 30, f: m.f, t: 0 });
  if (A.fx === 'quake') { const tg = targets[0]; G.fx.push({ k: 'slash', x: m.x + m.f * 60, y: m.y - 30, f: m.f, t: 0, big: 1 }); G.fx.push({ k: 'quake', x: tg ? tg.x : m.x + m.f * 90, y: tg ? tg.y : m.y, t: 0 }); SFX.zap(); }
  hud();
}
function moveSkill() { // Lv.5: 대쉬 · 더블 점프 · 백대쉬 · 텔레포트
  const m = G.me, A = job().move;
  if (!knows('move')) { toast(`「${A.name}」은 Lv.${SKILL_LV.move}에 배워요. 사냥으로 레벨을 올려요!`); return; }
  if (m.moveCd > 0 || G.dead) return;
  if (A.kind === 'djump' && m.ground) { m.vy = -tune.jump; m.ground = null; SFX.jump(); return; } // on the ground it is just a jump
  if (A.kind === 'djump' && m.dj) return;
  if (m.mp < A.mp) { toast('MP가 모자라요. MP는 아주 천천히 차요.'); return; }
  const dir = isHeld('right') ? 1 : isHeld('left') ? -1 : m.f;
  if (A.kind === 'dash') { m.f = dir; m.push = 0.24; m.pvx = dir * 980; G.fx.push({ k: 'dash', x: m.x, y: m.y, f: dir, t: 0 }); }
  else if (A.kind === 'back') { m.push = 0.34; m.pvx = -m.f * 640; m.vy = -380; m.ground = null; G.fx.push({ k: 'dash', x: m.x, y: m.y, f: -m.f, t: 0 }); }
  else if (A.kind === 'djump') { m.dj = true; m.f = dir; m.vy = -tune.jump * 0.85; m.push = 0.3; m.pvx = dir * 520; G.fx.push({ k: 'puff', x: m.x, y: m.y, t: 0 }); }
  else if (A.kind === 'tele') {
    const x0 = m.x; m.f = dir; m.x = Math.max(20, Math.min(G.map.w - 20, m.x + dir * 250)); m.vx = 0;
    if (m.ground && (m.x < m.ground.x - 4 || m.x > m.ground.x + m.ground.w + 4)) m.ground = null;
    G.fx.push({ k: 'tele', x: x0, y: m.y, t: 0 }, { k: 'tele', x: m.x, y: m.y, t: 0.05 });
  }
  m.mp -= A.mp; m.moveCd = A.cd; SFX.whoosh(); hudBars();
}
function powerSkill() { // Lv.10: one strong hit, long cooldown
  const m = G.me, A = job().power;
  if (!knows('power')) { toast(`「${A.name}」은 Lv.${SKILL_LV.power}에 배워요.`); return; }
  if (m.powCd > 0) { toast(`「${A.name}」은 ${Math.ceil(m.powCd)}초 뒤에 다시 쓸 수 있어요.`); return; }
  if (m.mp < A.mp) { toast('MP가 모자라요. MP는 아주 천천히 차요.'); return; }
  attack('power');
}
function updateShots(dt) {
  for (const s of G.shots) {
    s.t += dt; if (s.t < 0) continue;
    if (s.k === 'magic') { // nothing flies: it happens on the target
      s.done = true; G.fx.push({ k: s.mg, x: s.tx, y: s.ty, f: s.f, t: 0 });
      if (s.mg === 'zap') SFX.zap(); else if (s.mg === 'claw') SFX.magic();
      if (s.tg && !s.tg.dead) landHit(s.tg, s.dmg);
      continue;
    }
    const sp = s.k === 'snipe' ? 1900 : s.k === 'bigstar' ? 1000 : 1100, dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
    if (d < sp * dt) { s.done = true; if (s.tg && !s.tg.dead) landHit(s.tg, s.dmg); continue; }
    s.x += dx / d * sp * dt; s.y += dy / d * sp * dt;
  }
  G.shots = G.shots.filter(s => !s.done);
}
function tryPortal() {
  const m = G.me, p = G.map.portals.find(p => portalShown(p) && Math.abs(p.x - m.x) < 42 && Math.abs((p.y || G.map.ground || groundBelow(p.x, 0)) - m.y) < 40);
  if (!p) return false;
  if (G.mapId === 'town' && !S.fl.pro) { toast('먼저 셀리 촌장에게 이야기를 들어요.'); return true; }
  if (p.for && !told()) { toast('먼저 셀리 촌장에게 다음에 갈 곳을 들어요.'); return true; }
  if (p.for && !p.for.includes(stage())) { toast(`지금은 이 포탈로 갈 수 없어요. 지금 할 일: ${QUESTS[stage()].go}`); return true; }
  if (p.boss && ungraded().length) { toast(`선생님이 아직 확인하지 않은 답이 ${ungraded().length}개 있어요. 확인이 끝나면 들어갈 수 있어요!`); return true; }
  const goTo = id => { if (G.mapId === 'town') leaveTown(); SFX.portal(); enterMap(id, p.tx === 'start' ? 'start' : p.tx); afterPortal(id); };
  if (p.pick) pickLevel(p.to, goTo); else goTo(p.to);
  return true;
}
function portalShown(p) { return !p.boss || stage() >= QUESTS.length - 1; }
const told = () => (stage() >= QUESTS.length - 1 ? !!S.fl.linked : S.fl.told === stage()); // the chief has said where to go now
const portalOpen = p => !p.for || (p.for.includes(stage()) && told());
function pickLevel(to, goTo) { // 쉬움 / 어려움, chosen at the portal
  const box = $('#pick'); box.classList.remove('hide'); G.modal = true;
  box.innerHTML = `<div class="cin" style="--c:#3b7fb5"><small>${esc(MAPS[to].name)}</small><h2>난이도를 골라요</h2><p>${MAPS[to + 'H'].pulse ? '어려움: 심장이 쿵! 뛸 때만 판막이 열리고, 뛸 때마다 혈액이 오른쪽으로 세게 밀어내요. 혈전도 더 많아요.' : '어려움에는 밀어내는 먼지 덩어리, 사라지는 발판, 아래에서 솟구치는 바람이 있어요.'} 끝까지 가면 보너스 경험치!</p><div class="row"><button id="pkE" class="go">쉬움</button><button id="pkH" class="go hard">어려움</button></div><button id="pkX" class="tip">취소</button></div>`;
  const close = () => { box.classList.add('hide'); G.modal = false; };
  $('#pkE').onclick = () => { close(); goTo(to); }; $('#pkH').onclick = () => { close(); goTo(to + 'H'); }; $('#pkX').onclick = close;
}
function afterPortal(id) {
  const base = id.replace(/H$/, '');
  if (base === 'lung' && stage() === 2) toast('기관지 나무 꼭대기까지 점프로 올라가요! 떨어지면 아래 가지부터 다시.');
  if (base === 'vessel' && stage() === 3 && !S.fl.loaded) toast('먼저 하트 선장(심장)에게 말을 걸어 짐을 실어요.');
  else if (MAPS[id] && MAPS[id].pulse) toast('쿵! 심장이 뛸 때만 판막이 열리고, 혈액이 오른쪽으로 밀어 줘요. 박동에 맞춰 뛰어요!');
  if (id === 'lair') { const miss = bossMissing(); G.banner = { big: '세균 대왕의 소굴', small: miss.length ? `어딘가 몸이 이상해요… (${miss.map(r => r.name).join(' · ')})` : '모든 기관계가 제 일을 해요. 파티와 함께 무찔러요!', t: 5, boss: true }; }
}
function npcNear() { return G.map.npcs.find(([, x, y]) => Math.abs(x - G.me.x) < 70 && Math.abs(y - G.me.y) < 60); }
function tryTalk() { const n = npcNear(); if (!n) return false; talk(n[0]); return true; }

// ---- What each NPC says, by the party's step -----------------------------------------------------------------------
function talk(id) {
  const q = stage(), Q = QUESTS[q], say = (lines, then) => openDlg(id, lines, then);
  const atQuest = Q && Q.at === id;
  const turnIn = () => { // my part is done here; the leader may now write
    if (!myDone()) return false;
    if (allDone()) { if (isLeader()) say(['모두 해냈구나! 파티장, 이제 답을 써 줘. 딱 한 번만 낼 수 있으니 파티원과 의논해서!'], () => answerBox()); else say(['모두 해냈구나! 파티장이 답을 써서 낼 거야.']); }
    else say(['너는 다 했어! 아직 다른 파티원이 퀘스트를 하는 중이야. 도와줘!']);
    return true;
  };
  if (id === 'chief') {
    if (!S.fl.pro) return say(TALK.prologue, () => { S.fl.pro = 1; S.fl.told = 1; save(); hud(); SFX.quest(); toast('퀘스트 시작! 파티를 만들려면 왼쪽 위 [파티 · 친구]. 혼자 가도 괜찮아요.'); });
    if (Q.id === 'boss' && !S.fl.linked) return say(TALK.link, () => { S.fl.linked = 1; save(); showLinks(); hud(); });
    if (Q.id === 'boss') return say(TALK.free);
    const fresh = S.fl.told !== q, guide = GUIDE[q] || [`지금 할 일: ${Q.go}`];
    return say([...guide, canFormParty() ? '파티는 마을에서만 만들 수 있어. 왼쪽 위 [파티 · 친구]를 눌러 친구를 초대해 봐 (최대 4명).' : '파티원 모두가 끝내야 다음으로 갈 수 있어. 서로 도와줘!'],
      () => { if (fresh) { S.fl.told = q; save(); hud(); SFX.pick(); toast('그 포탈이 열렸어요!'); } });
  }
  if (atQuest && turnIn()) return;
  if (id === 'villi') {
    if (!atQuest) return say(q < 1 ? ['영양소를 흡수하는 게 내 일이야.'] : ['맛있는 영양소, 잘 흡수했어! 고마워.']);
    if (!killsDone()) return say([...TALK.villi_wait, `지금 파티 사냥: ${Object.keys(Q.kill).map(k => `${MONS[k].name} ${killTotal(k)}/${killNeed(k)}`).join(' · ')}`]);
    return say(TALK.villi_done, () => { if (isLeader()) answerBox(); else toast('파티장이 답을 써서 내요.'); });
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
    return say(TALK.nephron_done, () => { if (isLeader()) answerBox(); else toast('파티장이 답을 써서 내요.'); });
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
  $('#hLv').textContent = `Lv.${S.lv}`; $('#hName').textContent = `${S.name} · ${job().name} · 공격 ${atkPower()}`;
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
    if (allDone()) state = isLeader() ? '<button id="qAns" class="go small">답 쓰기 (한 번!)</button>' : '<span class="wait">파티장이 답을 써요</span>';
    else if (memberIds().length > 1 && !(Q.kill && !Q.also)) state = `<span>파티 ${memberIds().filter(id => G.P.dn && G.P.dn[q] && G.P.dn[q][id]).length}/${memberIds().length} 완료</span>`;
  }
  if (Q.id === 'boss' && S.fl.pro) { // the last mission: wait for the teacher, then the lair; after a loss, rewrite what was wrong
    const ug = ungraded(), rw = ASKQ.filter(canRewrite);
    state = ug.length ? `<span class="wait">선생님이 답을 확인하는 중 (${ug.length}개 남음)</span>` : '<span class="done">세균 소굴 포탈로!</span>';
    if (rw.length) state += rw.map(k => isLeader() ? `<button class="go small" data-rw="${k}">다시 쓰기: ${SYS[QUESTS[k].sys].name}</button>` : `<span class="back">다시 써야 해요: ${SYS[QUESTS[k].sys].name}</span>`).join('');
  }
  if (S.fl.pro && !told()) { prog = ''; state = '<span class="wait">셀리 촌장에게 가서 다음에 갈 곳 듣기</span>'; }
  $('#quest').innerHTML = `<b>${S.fl.pro ? (Q.id === 'boss' ? '최종 · ' : `퀘스트 ${q} · `) : ''}${Q.title}</b><p>${S.fl.pro ? Q.go : '셀리 촌장에게 말 걸기'}</p>${prog}${state}`;
  const qa = $('#qAns'); if (qa) qa.onclick = () => answerBox();
  $('#quest').querySelectorAll('[data-rw]').forEach(b => b.onclick = () => answerBox(+b.dataset.rw, true));
  $('#bag').innerHTML = Object.entries(S.inv).map(([k, n]) => `<span title="${ITEMS[k].name}"><canvas data-it="${k}" width="34" height="34"></canvas>${n}</span>`).join('') || '<em>가방이 비었어요</em>';
  $('#bag').querySelectorAll('canvas').forEach(c => drawItemIcon(c.getContext('2d'), c.dataset.it, 17, 17, 1.1));
  const J = job();
  $('#skillTag').textContent = `X ${J.skill.name} · Shift ${J.move.name}${knows('move') ? '' : ' (Lv.5)'} · V ${J.power.name}${knows('power') ? '' : ' (Lv.10)'}`;
  skillButtons();
}
function skillButtons() { // the Lv.5 / Lv.10 buttons: locked until learned, the strong one shows its cooldown
  const J = job(), m = G.me, mv = $('#aMove'), pw = $('#aPow'); if (!mv || !m) return;
  mv.classList.toggle('lock', !knows('move')); pw.classList.toggle('lock', !knows('power'));
  const a = knows('move') ? J.move.name : `${J.move.name}<small>Lv.5</small>`;
  const b = !knows('power') ? `${J.power.name}<small>Lv.10</small>` : m.powCd > 0 ? `${J.power.name}<small>${Math.ceil(m.powCd)}초</small>` : J.power.name;
  if (mv.dataset.h !== a) { mv.innerHTML = a; mv.dataset.h = a; } if (pw.dataset.h !== b) { pw.innerHTML = b; pw.dataset.h = b; }
}
function hudBars() { skillButtons(); const m = G.me; $('#hHp').style.width = `${(m.hp / maxHp()) * 100}%`; $('#hHpT').textContent = `HP ${Math.ceil(m.hp)} / ${maxHp()}`; $('#hMp').style.width = `${(m.mp / maxMp()) * 100}%`; $('#hMpT').textContent = `MP ${Math.floor(m.mp)} / ${maxMp()}`; }
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
  if (map.valves) map.valves.forEach((v, i) => drawValve(ctx, v, groundBelow(v + 20, -9999), G.me.cp >= i || valveOpen(), t));
  if (map.pulse && beatOn()) { // the surge: streaks of blood rushing right
    const k = 1 - beatPh() / 0.35; ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.strokeStyle = '#ffd0d4'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) { const x = cam.x + ((i * 211 + beatPh() * 2400) % (W + 200)) - 100, y = cam.y + 120 + (i * 97) % (H - 200); ctx.beginPath(); ctx.moveTo(x - 70, y); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.restore();
  }
  for (const p of map.portals) { if (!portalShown(p)) continue; const py = p.y || map.ground || groundBelow(p.x, 0); const op = portalOpen(p); if (!op) ctx.globalAlpha = 0.45; drawPortal(ctx, p.x, py, t); ctx.globalAlpha = 1; if (p.label) tag(p.label + (op ? '' : ' (잠김)'), p.x, py - 112, !op ? '#555' : p.boss ? '#8a1f2a' : '#1f5f8a'); }
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
  if (map.pulse) { // the heart: a red pulse round the edge, and a heart that beats in the corner
    const ph = beatPh(), k = Math.max(0, 1 - ph / 0.45);
    if (k > 0) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); g.addColorStop(0, 'rgba(200,0,30,0)'); g.addColorStop(1, `rgba(200,0,30,${0.45 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const s = 1 + 0.25 * k, hx = W / 2, hy = 46; ctx.save(); ctx.translate(hx, hy); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-30, -6, -18, -30, 0, -14); ctx.bezierCurveTo(18, -30, 30, -6, 0, 14); fillS(ctx, '#e0283c', 3); ctx.restore();
    text(valveOpen() ? '쿵! 판막 열림' : '판막 닫힘', hx, hy + 28, 16, valveOpen() ? '#ffe0e4' : '#cfd6e6', 'center', OL);
  }
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
  if (id === 'chief' && !told()) return true; // 다음에 갈 곳을 들어야 해요
  const q = stage(), Q = QUESTS[q]; if (!Q) return false;
  if (Q.id === 'boss') return id === 'chief' && !S.fl.linked;
  if (Q.at === id && (Q.kill ? allDone() && isLeader() : !myDone() || (allDone() && isLeader() && Q.ask))) return true;
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
  if (s.k === 'star' || s.k === 'bigstar') star4(ctx, s.x, s.y, s.k === 'bigstar' ? 22 : 9, s.k === 'bigstar' ? '#ffe28a' : '#d8e0ec', t * 20);
  else if (s.k === 'snipe') { ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.f, 1); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(0, 0); stroke(ctx, 6, '#bff7a8'); ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(12, 0); stroke(ctx, 4, '#8a5a2b'); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(6, -7); ctx.lineTo(6, 7); ctx.closePath(); fillS(ctx, '#fff', 1.5); ctx.restore(); }
  else if (s.k === 'arrow') { ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.f, 1); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(10, 0); stroke(ctx, 3, '#8a5a2b'); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -5); ctx.lineTo(4, 5); ctx.closePath(); fillS(ctx, '#ddd', 1.5); ctx.restore(); }
  else { ctx.save(); ctx.globalAlpha = 0.9; ell(ctx, s.x, s.y, s.k === 'bolt' ? 16 : 9, s.k === 'bolt' ? 12 : 9); ctx.fillStyle = s.k === 'bolt' ? '#ffe45c' : '#9fe6ff'; ctx.fill(); stroke(ctx, 2.5); ctx.restore(); }
}
function fxDraw(f) {
  if (f.k === 'die') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.6); drawMon(ctx, f.mk, f.x, f.y - f.t * 40, 1, 0, true); ctx.restore(); }
  else if (f.k === 'lv') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4); const g = ctx.createLinearGradient(0, f.y - 260, 0, f.y); g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(1, 'rgba(255,230,120,.8)'); ctx.fillStyle = g; ctx.fillRect(G.me.x - 40, f.y - 260, 80, 260); ctx.restore(); }
  else if (f.k === 'slash') { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 0.3); ctx.translate(f.x, f.y); ctx.scale(f.f * (f.big ? 1.6 : 1), f.big ? 1.6 : 1); ctx.beginPath(); ctx.arc(-30, 0, 80, -1.2, 1.2); ctx.lineWidth = 14; ctx.strokeStyle = f.big ? '#ffd76a' : '#fff8c8'; ctx.stroke(); ctx.restore(); }
  else if (f.t >= 0) magicFx(f);
}
function magicFx(f) { // 마법사 · 이동 스킬 · 강타 effects (drawn on the spot, nothing flies)
  const c = ctx, a = (d) => Math.max(0, 1 - f.t / d);
  c.save(); c.translate(f.x, f.y);
  if (f.k === 'cast') { // a small spell circle at the wand
    c.globalAlpha = a(0.3); c.rotate(f.t * 8); c.beginPath(); c.arc(0, 0, 16 + f.t * 30, 0, 7); c.lineWidth = 3; c.strokeStyle = '#9fd8ff'; c.stroke();
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillStyle = '#e8f6ff'; c.fillRect(14 + f.t * 30, -2, 6, 4); }
  } else if (f.k === 'burst') { // 마법 공격: light bursts on the monster
    const r = 12 + f.t * 140; c.globalAlpha = a(0.35);
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.lineWidth = 10; c.strokeStyle = 'rgba(30,80,170,.6)'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#9fe0ff'; c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.45, 0, 7); c.fillStyle = 'rgba(220,245,255,.8)'; c.fill();
    for (let i = 0; i < 6; i++) { const q = i / 6 * 6.283 + 0.3; star4(c, Math.cos(q) * r * 0.9, Math.sin(q) * r * 0.9, 6, '#e8f6ff', f.t * 9); }
  } else if (f.k === 'claw') { // 매직 클로: three glowing claw marks rip across the monster
    const k = Math.min(1, f.t / 0.1); c.globalAlpha = a(0.42); c.scale(f.f || 1, 1); c.rotate(-0.55);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = 'rgba(120,80,255,.18)'; c.fill();
    for (let i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(-62, i * 22 - 8); c.quadraticCurveTo(0, i * 22 + 14, -62 + 124 * k, i * 22 - 8 + 6 * k);
      c.lineCap = 'round'; c.lineWidth = 18; c.strokeStyle = 'rgba(80,40,210,.7)'; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke();
    }
  } else if (f.k === 'zap') { // 번개 일격
    c.globalAlpha = a(0.4); c.beginPath(); c.moveTo(0, -620);
    for (let i = 1; i <= 10; i++) c.lineTo((hash2(Math.floor(f.x), i) - 0.5) * 60, -620 + i * 62);
    c.lineWidth = 14; c.strokeStyle = 'rgba(255,240,140,.45)'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#fffbe0'; c.stroke();
    c.beginPath(); c.arc(0, 0, 20 + f.t * 160, 0, 7); c.lineWidth = 6; c.strokeStyle = '#ffe45c'; c.stroke();
  } else if (f.k === 'quake') { // 대지 강타
    c.globalAlpha = a(0.45); c.beginPath(); c.ellipse(0, 0, 30 + f.t * 260, 10 + f.t * 40, 0, 0, 7); c.lineWidth = 7; c.strokeStyle = '#ffd76a'; c.stroke();
    for (let i = 0; i < 7; i++) { c.fillStyle = '#b08a5a'; c.fillRect((i - 3) * 22, -f.t * 260 * (0.5 + hash2(i, 3)) , 8, 8); }
  } else if (f.k === 'tele') { // 텔레포트: a column of light where I left and where I land
    c.globalAlpha = a(0.4); const g = c.createLinearGradient(0, -120, 0, 0); g.addColorStop(0, 'rgba(150,200,255,0)'); g.addColorStop(1, 'rgba(150,200,255,.85)');
    c.fillStyle = g; c.fillRect(-26 + f.t * 40, -120, 52 - f.t * 80, 120); for (let i = 0; i < 5; i++) star4(c, (hash2(i, 7) - 0.5) * 60, -hash2(i, 9) * 110 - f.t * 80, 5, '#fff', f.t * 9);
  } else if (f.k === 'dash') { // 대쉬 · 백대쉬: speed lines behind
    c.globalAlpha = a(0.3); c.scale(f.f || 1, 1); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3;
    for (let i = 0; i < 5; i++) { c.beginPath(); const y = -12 - i * 14; c.moveTo(-30 - f.t * 200, y); c.lineTo(-90 - f.t * 200, y); c.stroke(); }
  } else if (f.k === 'puff') { // 더블 점프
    c.globalAlpha = a(0.35); for (let i = 0; i < 6; i++) { const q = i / 6 * 3.14; c.beginPath(); c.arc(Math.cos(q) * (14 + f.t * 90), 6 + Math.sin(q) * 6, 9, 0, 7); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); }
  }
  c.restore();
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

// ---- Teacher page (?teacher=1, 암호 교사): open a room, then every party, its answers, trials and boss lair ----------
// 교사 typed in Korean, or the same keys on an English keyboard (rytk / RYTK): password fields often block Korean.
const teacherOk = v => ['교사', 'rytk'].includes(String(v || '').normalize('NFC').replace(/\s+/g, '').toLowerCase());
async function teacher() {
  show('teacher'); G.scene = 'teacher';
  const pin = $('#tPin');
  await new Promise(ok => {
    const tryPin = () => { if (teacherOk(pin.value)) ok(); else { pin.value = ''; pin.placeholder = '암호가 달라요'; } };
    $('#tGo').onclick = tryPin; pin.onkeydown = e => { if (e.key === 'Enter') tryPin(); };
  });
  $('#tLock').classList.add('hide');
  const room = await openRoom();
  $('#tOpen').classList.add('hide'); $('#tMain').classList.remove('hide');
  const nets = {}, data = {}, drafts = {};
  let ch = 1, dirty = true;
  const T = () => nets[ch].now();
  $('#tTabs').innerHTML = chanList().map(n => `<button class="chan" data-tc="${n}">채널 ${n}</button>`).join('');
  document.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { ch = +b.dataset.tc; dirty = true; render(); });
  try { // all channels at once: one by one, ten of them took too long
    const all = await Promise.all(chanList().map(c => netConnect(chanBase(c, room.code), m => { $('#tState').textContent = m; })));
    all.forEach((n, i) => { nets[i + 1] = n; });
  } catch (e) { $('#tState').textContent = '연결 실패: 학교 와이파이를 확인해 주세요.'; return; }
  for (const c of chanList()) {
    data[c] = { p: {}, pty: {} };
    nets[c].onKids('p', p => { data[c].p = p || {}; dirty = true; });
    nets[c].on('pty', p => { data[c].pty = p || {}; dirty = true; if (c === ch) render(); });
  }
  $('#tState').textContent = `연결됨 (${nets[1].mode}) · 학생 답안이 오면 여기에 떠요.`;
  const ugOf = P => ASKQ.filter(q => { const sb = P.sub && P.sub[q], g = P.gr && P.gr[q]; return sb && !(g && g.t >= sb.t); });
  const stName = q => (q >= QUESTS.length - 1 ? '최종 미션 · 보스' : `미션 ${q} · ${QUESTS[q].title}`);
  function render() {
    if (!dirty || !nets[ch] || !data[ch]) return; dirty = false;
    const keep = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.dk; // keep what the teacher is typing
    document.querySelectorAll('[data-dk]').forEach(el => { drafts[el.dataset.dk] = el.value; });
    document.querySelectorAll('[data-tc]').forEach(b => { // each tab: who is in it, and answers waiting there
      const c = +b.dataset.tc, d = data[c], t = nets[c] ? nets[c].now() : 0;
      const n = d ? Object.values(d.p).filter(p => p && t - p.t < tune.stale_ms).length : 0;
      const w = d ? Object.values(d.pty).filter(P => P && P.m).reduce((a, P) => a + ugOf(P).length, 0) : 0;
      b.innerHTML = `채널 ${c} <small>${n}명</small>${w ? ` <i>답 ${w}</i>` : ''}`;
      b.classList.toggle('sel', c === ch); b.classList.toggle('wait', w > 0);
    });
    const D = data[ch], now = T(), ps = D.p, live = id => ps[id] && now - ps[id].t < tune.stale_ms;
    const parties = Object.entries(D.pty).filter(([, P]) => P && P.m && Object.keys(P.m).length)
      .sort((a, b) => ugOf(b[1]).length - ugOf(a[1]).length || (b[1].st || 0) - (a[1].st || 0));
    const pidOf = {}; parties.forEach(([pid, P]) => Object.keys(P.m).forEach(id => { pidOf[id] = pid; }));
    const roster = Object.entries(ps).filter(([id]) => live(id)).sort((a, b) => String(a[1].n).localeCompare(String(b[1].n), 'ko'));
    const ugAll = parties.reduce((a, [, P]) => a + ugOf(P).length, 0), solos = parties.filter(([, P]) => P.solo).length;
    $('#tSummary').textContent = `접속 ${roster.length}명 · 파티 ${parties.length - solos}개 · 혼자 ${solos}명 · 파티 없음 ${roster.filter(([id]) => !pidOf[id]).length}명 · 확인할 답 ${ugAll}개`;
    const opts = id => '<option value="">파티 옮기기…</option>' + parties.filter(([pid, P]) => pid !== pidOf[id] && Object.keys(P.m).length < 4)
      .map(([pid, P]) => `<option value="${pid}">${P.solo ? '혼자: ' : ''}${esc(P.nm)} (${Object.keys(P.m).length}명)</option>`).join('');
    const rosterHtml = `<section><h3>접속한 학생 <small>이름을 보고 마을로 부르거나 다른 파티로 옮겨요</small></h3>`
      + (roster.length ? `<table class="ros"><tr><th>이름</th><th>직업 · Lv</th><th>있는 곳</th><th>파티</th><th>미션</th><th></th></tr>` + roster.map(([id, p]) => {
        const P = pidOf[id] && D.pty[pidOf[id]];
        return `<tr><td>${esc(p.n)}</td><td>${JOBS[p.j]?.name || ''} · Lv.${p.lv}</td><td>${mapName(p.m)}</td><td>${P ? (P.solo ? '<em>혼자</em>' : esc(P.nm)) : '<em class="no">없음</em>'}</td><td>${P ? stName(P.st || 1) : '마을 (아직 출발 전)'}</td>`
          + `<td class="tb"><button data-town="${id}">마을로</button><select data-dk="mv:${id}" data-mv="${id}">${opts(id)}</select>${P && !P.solo ? `<button data-kick="${pidOf[id]}:${id}">혼자로</button>` : ''}</td></tr>`;
      }).join('') + '</table>' : '<p class="tip">이 채널에 접속한 학생이 없어요.</p>') + '</section>';
    const cards = parties.map(([pid, P]) => {
      const q = P.st || 1, ug = ugOf(P), br = P.br, tr = P.tr, ta = tr && P.ta && P.ta[tr.id], tv = tr && P.tv && P.tv[tr.id];
      const ans = ASKQ.map(k => {
        const Q = QUESTS[k], sb = P.sub && P.sub[k], g = P.gr && P.gr[k], cur = sb && g && g.t >= sb.t ? g : null, S2 = SYS[Q.sys];
        if (!sb) return `<div class="an none"><b style="--c:${S2.color}">${S2.name}</b><p>${q > k ? '(답 없음)' : '아직 이 미션 전'}</p></div>`;
        return `<div class="an ${cur ? (cur.ok ? 'ok' : 'no') : 'ug'}"><b style="--c:${S2.color}">${S2.name}</b><p>“${esc(sb.a)}” <small>— ${esc(sb.by)}${sb.n > 1 ? ` · ${sb.n}번째 답` : ''}</small></p>`
          + (cur ? `<div class="tb"><em>${cur.ok ? '정답' : '오답'}${cur.c ? ` · ${esc(cur.c)}` : ''}</em><button data-gr="${pid}:${k}:${cur.ok ? 0 : 1}">${cur.ok ? '오답으로 바꾸기' : '정답으로 바꾸기'}</button></div>`
            : `<p class="hint">예시: ${esc(Q.hint)}</p><div class="tb"><button class="okb" data-gr="${pid}:${k}:1">정답</button><input data-dk="gc:${pid}:${k}" placeholder="오답일 때 한마디 (선택, 학생이 보스전에서 진 뒤 봐요)"><button class="nob" data-gr="${pid}:${k}:0">오답</button></div>`) + '</div>';
      }).join('');
      const boss = br ? (br.win ? '<span class="br">보스 처치!</span>' : `<span class="br">보스에게 짐 · 말썽: ${(br.miss || []).map(k => SYS[k].name).join(', ') || '없음 (기관계는 모두 정답)'}</span>`)
        : q >= QUESTS.length - 1 ? `<span class="br">${ug.length ? `답 ${ug.length}개를 확인하면 보스에 들어갈 수 있어요` : '보스 소굴에 들어갈 수 있어요'}</span>` : '';
      return `<section class="pty ${ug.length ? 'wait' : ''}"><h3>${P.solo ? '혼자 · ' : ''}${esc(P.nm)} <small>${Object.keys(P.m).length}명 · ${P.lock ? '출발함' : '마을에서 모이는 중'} · ${stName(q)}${ug.length ? ` · <b>확인할 답 ${ug.length}</b>` : ''}</small></h3>
        <div class="mem">${Object.entries(P.m).map(([id, m]) => `<span class="${live(id) ? '' : 'off'}">${P.L === id ? '★' : ''}${esc(m.n)} <small>${JOBS[m.j]?.name || ''} · Lv.${ps[id]?.lv ?? '?'} · ${live(id) ? mapName(ps[id].m) : '접속 끊김'}</small><button data-kick="${pid}:${id}" title="파티에서 빼기 (혼자로)">×</button></span>`).join('')}</div>
        <div class="anl">${ans}</div>
        <div class="tb trl"><input data-dk="tq:${pid}" placeholder="거짓말 탐지기 질문 (예: 융털이 하는 일은?)"><input data-dk="ts:${pid}" class="sec" placeholder="${tune.trial_secs}" type="number">초<button data-tr="${pid}">시련 보내기</button></div>
        ${tr ? `<div class="ans trial"><b>시련: ${esc(tr.q)}</b>${tv ? `<p>${tv.ok ? '통과시킴' : '탈락시킴'}</p>` : ta ? `<p>“${esc(ta.a)}” <small>— ${esc(ta.by)}</small></p><div class="tb"><button data-tv="${pid}:${tr.id}:1" class="okb">통과</button><button data-tv="${pid}:${tr.id}:0">탈락</button></div>` : now > tr.t + tr.d * 1000 ? '<p>시간 안에 답하지 못해 탈락</p>' : '<p>답을 기다리는 중…</p>'}</div>` : ''}
        <div class="tb">${boss}<button data-call="${pid}">모두 마을로</button><button data-st="${pid}:${Math.max(1, q - 1)}">단계 −1</button><button data-st="${pid}:${Math.min(QUESTS.length - 1, q + 1)}">단계 +1</button><button data-del="${pid}" class="warn">파티 해산</button></div></section>`;
    }).join('');
    $('#tChans').innerHTML = rosterHtml + cards + `<div class="tb"><button data-wipe="${ch}" class="warn">채널 ${ch} 기록 모두 지우기</button></div>`;
    document.querySelectorAll('[data-dk]').forEach(el => { if (drafts[el.dataset.dk] !== undefined && el.tagName !== 'SELECT') el.value = drafts[el.dataset.dk]; el.oninput = () => { drafts[el.dataset.dk] = el.value; }; });
    if (keep) { const el = document.querySelector(`[data-dk="${keep}"]`); if (el) { el.focus(); if (el.setSelectionRange && el.tagName === 'INPUT') el.setSelectionRange(el.value.length, el.value.length); } }
    const n = nets[ch], on = (sel, f) => document.querySelectorAll(sel).forEach(b => b.onclick = () => f(b));
    on('[data-gr]', b => { const [pid, k, ok] = b.dataset.gr.split(':'); n.set(`pty/${pid}/gr/${k}`, { ok: ok === '1', c: ok === '1' ? '' : drafts[`gc:${pid}:${k}`] || '', t: T() }); drafts[`gc:${pid}:${k}`] = ''; dirty = true; setTimeout(render, 150); });
    on('[data-town]', b => n.set('cmd/' + b.dataset.town, { k: 'town', t: T() }));
    on('[data-call]', b => n.set(`pty/${b.dataset.call}/call`, { t: T(), n: '선생님' }));
    document.querySelectorAll('[data-mv]').forEach(sel => sel.onchange = () => {
      const id = sel.dataset.mv, pid = sel.value, P = D.pty[pid]; sel.blur(); drafts['mv:' + id] = '';
      if (!pid || !P) return;
      if (!confirm(`${ps[id]?.n || '이 학생'}을(를) 「${P.nm}」에 넣을까요? (지금 파티에서는 빠져요)`)) { sel.value = ''; return; }
      if (P.solo) { n.del(`pty/${pid}/solo`); n.set(`pty/${pid}/nm`, `${P.nm}의 파티`); }
      n.set('cmd/' + id, { k: 'join', pid, t: T() });
    });
    on('[data-tr]', b => { const pid = b.dataset.tr, q = (drafts['tq:' + pid] || '').trim(); if (!q) return; n.set(`pty/${pid}/tr`, { id: 't' + T(), q, t: T(), d: Number(drafts['ts:' + pid]) || tune.trial_secs }); drafts['tq:' + pid] = ''; });
    on('[data-tv]', b => { const [pid, id, ok] = b.dataset.tv.split(':'); n.set(`pty/${pid}/tv/${id}`, { ok: ok === '1', t: T() }); });
    on('[data-st]', b => { const [pid, st] = b.dataset.st.split(':'); n.set(`pty/${pid}/st`, +st); });
    on('[data-kick]', b => { const [pid, id] = b.dataset.kick.split(':'); if (confirm('이 학생을 파티에서 뺄까요? (지금까지의 단계와 답은 그대로 가지고 혼자 계속해요)')) n.del(`pty/${pid}/m/${id}`); });
    on('[data-del]', b => { if (confirm('이 파티를 해산할까요? 학생들은 각자 지금 단계부터 혼자 계속해요.')) n.del('pty/' + b.dataset.del); });
    on('[data-wipe]', () => { if (confirm(`채널 ${ch}의 기록(파티, 몬스터, 접속)을 모두 지울까요? 학생 레벨·직업은 각 디벗에 남아요.`)) ['p', 'm', 'k', 'd', 'inv', 'pty', 'cmd'].forEach(k => n.del(k)); });
  }
  setInterval(() => { dirty = true; if (!document.activeElement || !document.activeElement.dataset || !document.activeElement.dataset.dk) render(); }, 2500);
  render();
}

async function openRoom() { // the teacher opens the game: a room number the students type in
  $('#tOpen').classList.remove('hide');
  const msg = t => { $('#tOpenMsg').textContent = t; }, last = sget('bq:troom');
  if (last) { $('#tAgain').classList.remove('hide'); $('#tAgain').textContent = `${last}번 방 다시 열기`; }
  let busy = false;
  const open = async code => {
    if (busy) throw new Error('busy'); busy = true; msg('방을 여는 중…');
    try {
      for (let tries = 0; ; tries++) {
        const c = code || String(1000 + Math.floor(Math.random() * 9000));
        const n = await netConnect(roomBase(c), msg);
        if (!code && tries < 5 && roomLive(await n.get('open'), n.now())) continue; // another class has it now
        await n.set('open', { on: 1, t: n.now() }); sset('bq:troom', c); return { code: c, n };
      }
    } catch (e) { busy = false; msg('연결 실패: 학교 와이파이를 확인하고 다시 눌러 주세요.'); throw e; }
  };
  const r = await new Promise(ok => {
    $('#tNew').onclick = () => open('').then(ok, () => {});
    $('#tAgain').onclick = () => open(last).then(ok, () => {});
  });
  let on = true;
  const bar = () => {
    $('#tCode').textContent = r.code;
    $('#tRoomState').textContent = on ? '열림 · 학생들이 이 번호로 들어와요' : '닫힘 · 새로 들어올 수 없고, 하던 학생도 멈춰요';
    $('#tRoomState').classList.toggle('off', !on);
    $('#tClose').textContent = on ? '게임 닫기' : '다시 열기'; $('#tClose').classList.toggle('on', !on);
  };
  $('#tClose').onclick = () => {
    if (on && !confirm(`${r.code}번 방을 닫을까요? 하던 학생들도 처음 화면으로 돌아가요 (레벨·직업은 남아요).`)) return;
    on = !on; r.n.set('open', { on: on ? 1 : 0, t: r.n.now() }); bar();
  };
  setInterval(() => { if (on) r.n.set('open', { on: 1, t: r.n.now() }); }, 30 * 60e3); // keep it fresh through a long class
  bar(); return r;
}

// ---- Loop -------------------------------------------------------------------------------------------------------------------
function step() {
  G.t += STEP;
  if (pressed('KeyM') && !typing()) setMuted(!muted);
  if (G.scene === 'play') {
    updateMe(STEP); updateShots(STEP); trialTick();
    if (G.host) hostTick(STEP);
    if (G.map.pulse) { const n = Math.floor(netT() / tune.beat_every); if (n !== G.beatN) { G.beatN = n; tone(70, 0.18, 'sine', 0.22, 0.6); setTimeout(() => tone(60, 0.14, 'sine', 0.16, 0.6), 160); } }
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
  P.innerHTML = '<h3>채널 바꾸기</h3>' + (S.fl.left ? '<p class="tip">출발한 뒤에는 채널을 바꿀 수 없어요 (파티가 이 채널에 있어요).</p>' : chanList().map(n => `<button class="chan ${n === G.ch ? 'sel' : ''}" data-c="${n}">채널 ${n}</button>`).join('') + '<p class="tip">채널을 바꾸면 파티에서 나가요.</p>');
  P.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const n = +b.dataset.c; if (n === G.ch) return; leaveParty(true); if (G.net) G.net.del('p/' + G.id); save(); sset('bq:ch', n); sset('bq:auto', '1'); location.reload(); });
};
$('#bLeave').onclick = () => leaveParty(false);
$('#bRevive').onclick = respawn;
$('#bBack').onclick = () => { location.href = location.pathname + location.search; };
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
