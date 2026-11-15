// PROTOTYPE - NOT FOR PRODUCTION
// 몸속 원정대: the class's channels. Five channels share the free Firebase database that Star-Party,
// Star-Wingtto and 우주의 숲 use (path rooms/body_ch<N>). Each tablet owns its own adventurer (p/<id>);
// the lowest id on a map is that map's host and moves its monsters (m/<map>); others send their hits
// (d/<map>/<id>) and read the host's kill log (k/<map>). The teacher drops a boss (boss).
// ?local joins tabs of one browser instead (testing on one computer).
'use strict';

const FIREBASE = { // not a secret: a web app's Firebase settings are public by design
  apiKey: 'AIzaSyAAwMy-r61onIGMR2sbDekmXkc5f3PjkI8',
  authDomain: 'moonclipse-star-party.firebaseapp.com',
  databaseURL: 'https://moonclipse-star-party-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'moonclipse-star-party',
  storageBucket: 'moonclipse-star-party.firebasestorage.app',
  messagingSenderId: '984441301984',
  appId: '1:984441301984:web:5f13cb2fbf4232e9291985',
};
const NET_LOCAL = /[?&]local\b/.test(location.search);
const STORE = (() => { try { const s = NET_LOCAL ? sessionStorage : localStorage; s.setItem('bq:t', '1'); return s; } catch (e) { return null; } })();
const sget = k => { try { return STORE && STORE.getItem(k); } catch (e) { return null; } };
const sset = (k, v) => { try { STORE && STORE.setItem(k, v); } catch (e) { /* private window: play without saving */ } };
const within = (p, ms, code) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(code)), ms))]);
const nflag = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) === '1'; localStorage.setItem(k, '1'); } catch (e) { return false; } };
const ndec = v => (typeof v === 'string' ? JSON.parse(v) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ndec(x)])) : null);

/** one channel's connection: set/del/on/onKids/get/now; on and onKids return an unsubscribe */
async function netConnect(base, stage = () => {}) {
  if (!NET_LOCAL) {
    if (!nflag('bq:rest')) { try { return await sdkNet(base, stage); } catch (e) { console.warn('body sdk', e.message); } }
    const net = await restNet(base, stage); nflag('bq:rest', 1); return net;
  }
  const K = p => `bq:${base}/${p}`, subs = new Set(), fire = k => subs.forEach(s => s(k));
  addEventListener('storage', e => e.key && fire(e.key));
  const read = k => { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); };
  const kids = p => { const pre = K(p) + '/', o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(pre) && !k.slice(pre.length).includes('/')) o[k.slice(pre.length)] = read(k); } return o; };
  const sub = f => { subs.add(f); return () => subs.delete(f); };
  return {
    mode: 'local', now: () => Date.now(),
    set(p, v) { localStorage.setItem(K(p), JSON.stringify(v)); fire(K(p)); },
    del(p) { const k = K(p), pre = k + '/'; for (let i = localStorage.length - 1; i >= 0; i--) { const x = localStorage.key(i); if (x === k || x.startsWith(pre)) localStorage.removeItem(x); } fire(k); },
    on(p, cb) { const k = K(p); const off = sub(x => (x === k || k.startsWith(x + '/')) && cb(read(k))); cb(read(k)); return off; },
    onKids(p, cb) { const pre = K(p) + '/', k = K(p); const off = sub(x => (x === k || x.startsWith(pre) || k.startsWith(x + '/')) && cb(kids(p))); cb(kids(p)); return off; },
    get: async p => read(K(p)) ?? (Object.keys(kids(p)).length ? kids(p) : null),
  };
}
let SDK = null; // one Firebase app for every channel this page opens
async function sdkNet(base, stage) {
  const V = '10.12.2'; stage('게임 프로그램 불러오는 중…');
  if (!SDK) {
    const [{ initializeApp, getApps }, fb] = await within(Promise.all([import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`), import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`)]), 12000, 'sdk');
    if (nflag('bq:longpoll')) fb.forceLongPolling();
    const db = fb.getDatabase(getApps()[0] || initializeApp(FIREBASE));
    const linked = () => new Promise(ok => { const off = fb.onValue(fb.ref(db, '.info/connected'), s => { if (s.val()) { off(); ok(); } }); });
    stage('게임 서버에 연결 중…');
    try { await within(linked(), 6000, 'db'); } catch (e) {
      stage('다른 길로 다시 연결 중…'); fb.forceLongPolling(); nflag('bq:longpoll', 1); fb.goOffline(db); fb.goOnline(db);
      try { await within(linked(), 7000, 'db'); } catch (e2) { fb.goOffline(db); throw e2; }
    }
    let off = 0; fb.onValue(fb.ref(db, '.info/serverTimeOffset'), s => { off = s.val() || 0; });
    SDK = { fb, db, now: () => Date.now() + off };
  }
  const { fb, db } = SDK, r = p => fb.ref(db, `${base}/${p}`), val = s => (s.exists() ? ndec(s.val()) : null);
  return {
    mode: 'online', now: SDK.now,
    set: (p, v) => fb.set(r(p), JSON.stringify(v)), del: p => fb.remove(r(p)),
    on: (p, cb) => fb.onValue(r(p), s => { try { cb(val(s)); } catch (e) { console.warn(e); } }),
    onKids: (p, cb) => fb.onValue(r(p), s => { const o = {}; s.forEach(c => { try { o[c.key] = JSON.parse(c.val()); } catch (e) { /* a branch, not a value */ } }); cb(o); }),
    get: async p => val(await within(fb.get(r(p)), 10000, 'db')),
  };
}
async function restNet(base, stage) { // plain https for school networks that block web sockets
  stage('서버 주소로 직접 연결 중…');
  const U = `${FIREBASE.databaseURL}/${base}`;
  const req = async (p, opt) => { let res; try { res = await within(fetch(`${U}${p ? '/' + p : ''}.json`, opt), 10000, 'block'); } catch (e) { throw new Error('block'); } if (!res.ok) throw new Error('db'); return res.json(); };
  const tk = `_t/${Math.random().toString(36).slice(2, 10)}`, t1 = Date.now();
  const ts = await req(tk, { method: 'PUT', body: JSON.stringify({ '.sv': 'timestamp' }) }); const off = ts - (t1 + Date.now()) / 2;
  req(tk, { method: 'DELETE' }).catch(() => {});
  let tree = null; const seg = p => p.split('/').filter(Boolean), at = p => seg(p).reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), tree);
  const put = (p, data) => { const ks = seg(p); if (!ks.length) { tree = data; return; } if (!tree || typeof tree !== 'object') tree = {}; let o = tree; for (const k of ks.slice(0, -1)) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; } if (data === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = data; };
  const parse = v => { if (typeof v !== 'string') return null; try { return JSON.parse(v); } catch (e) { return null; } };
  const subs = new Set(), near = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/') || a === '' || b === '';
  const fire = p => { const q = seg(p).join('/'); subs.forEach(s => near(s.p, q) && s.f()); };
  const change = (p, data) => { const before = JSON.stringify(at(p) ?? null); put(p, data); if (JSON.stringify(at(p) ?? null) !== before) fire(p); };
  const es = new EventSource(`${U}.json`);
  await within(new Promise((ok, no) => {
    es.addEventListener('put', e => { const { path, data } = JSON.parse(e.data); change(path, data); ok(); });
    es.addEventListener('patch', e => { const { path, data } = JSON.parse(e.data); for (const [k, v] of Object.entries(data || {})) change(`${path}/${k}`, v); });
    es.addEventListener('cancel', () => no(new Error('db')));
  }), 10000, 'db').catch(e => { es.close(); throw e; });
  const sub = s => { subs.add(s); s.f(); return () => subs.delete(s); };
  return {
    mode: 'rest', now: () => Date.now() + off,
    set: (p, v) => { const s = JSON.stringify(v); change(p, s); return req(p, { method: 'PUT', body: JSON.stringify(s) }).catch(() => {}); },
    del: p => { change(p, null); return req(p, { method: 'DELETE' }).catch(() => {}); },
    on: (p, cb) => sub({ p: seg(p).join('/'), f: () => cb(parse(at(p))) }),
    onKids: (p, cb) => sub({ p: seg(p).join('/'), f: () => { const o = at(p), r = {}; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const x = parse(v); if (x !== null) r[k] = x; } cb(r); } }),
    get: async p => { try { return ndec(at(p) ?? null); } catch (e) { return null; } },
  };
}
const chanBase = n => `rooms/body_ch${n}`;
function myId() { let id = sget('bq:id'); if (!id) { id = 'a' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6); sset('bq:id', id); } return id; }
