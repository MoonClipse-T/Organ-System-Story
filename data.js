// PROTOTYPE - NOT FOR PRODUCTION
// 몸속 원정대: everything the game says and where things are. Textbook 230~232쪽 (03 소화, 순환, 호흡, 배설의 관계).
'use strict';

// ---- 입장 문제: 1~8차시 전체, 자작 (교과서 범위) ---------------------------------------------
const QUIZ = [
  { q: '녹말을 검출할 때 쓰는 용액은?', a: ['아이오딘-아이오딘화 칼륨 용액', '베네딕트 용액', '뷰렛 용액', '수단 Ⅲ 용액'], c: 0 },
  { q: '단백질에 뷰렛 용액을 넣으면 어떤 색이 될까?', a: ['청람색', '황적색', '보라색', '선홍색'], c: 2 },
  { q: '침 속 아밀레이스는 녹말을 무엇으로 분해할까?', a: ['엿당', '아미노산', '지방산', '모노글리세리드'], c: 0 },
  { q: '소장 안쪽 벽의 융털이 하는 일로 옳은 것은?', a: ['쓸개즙을 만든다', '표면적을 넓혀 영양소를 잘 흡수한다', '음식물을 잘게 부순다', '녹말을 분해한다'], c: 1 },
  { q: '심장에서 온몸으로 혈액을 내보내는 곳은?', a: ['우심방', '우심실', '좌심방', '좌심실'], c: 3 },
  { q: '혈액 속에서 산소를 운반하는 것은?', a: ['백혈구', '적혈구', '혈소판', '혈장'], c: 1 },
  { q: '숨을 들이쉴 때(들숨) 일어나는 일은?', a: ['갈비뼈가 내려간다', '가로막이 올라간다', '흉강의 부피가 커진다', '폐 속 압력이 높아진다'], c: 2 },
  { q: '폐포에서 모세 혈관으로 이동하는 기체는?', a: ['이산화 탄소', '산소', '질소', '수증기'], c: 1 },
  { q: '콩팥에서 혈액이 걸러지는(여과) 곳은?', a: ['사구체 → 보먼주머니', '세뇨관 → 모세 혈관', '방광 → 요도', '오줌관 → 방광'], c: 0 },
  { q: '단백질이 분해될 때 생겨 간에서 요소로 바뀌는 노폐물은?', a: ['물', '이산화 탄소', '암모니아', '포도당'], c: 2 },
];

// ---- 직업 (1차) ------------------------------------------------------------------------------
// range: how far the hit reaches in front (px); mult: × damage; hits: monsters at once; mp: skill cost
const JOBS = {
  warrior: { name: '전사', main: 'STR', color: '#d9534f', weapon: 'sword', blurb: '튼튼한 몸, 가까이서 강하게!',
    atk: { range: 95, mult: 1, hits: 1, cd: 0.45 }, skill: { name: '힘껏 베기', range: 150, mult: 2.2, hits: 4, mp: 8, cd: 0.7 }, hpBonus: 40, mpBase: 20 },
  thief: { name: '도적', main: 'LUK', color: '#6f5bd6', weapon: 'star', blurb: '재빠르게 표창을 휙휙!',
    atk: { range: 380, mult: 0.9, hits: 1, cd: 0.4, shot: 'star' }, skill: { name: '쌍표창', range: 420, mult: 1.5, hits: 1, twice: true, mp: 8, cd: 0.6, shot: 'star' }, hpBonus: 10, mpBase: 26 },
  archer: { name: '궁수', main: 'DEX', color: '#3a9d5d', weapon: 'bow', blurb: '멀리서 정확하게!',
    atk: { range: 480, mult: 1, hits: 1, cd: 0.5, shot: 'arrow' }, skill: { name: '관통 화살', range: 560, mult: 1.6, hits: 3, mp: 10, cd: 0.7, shot: 'arrow' }, hpBonus: 15, mpBase: 26 },
  mage: { name: '마법사', main: 'INT', color: '#2f7fd1', weapon: 'wand', blurb: '에너지를 모아 펑!',
    atk: { range: 260, mult: 0.9, hits: 1, cd: 0.5, shot: 'spark' }, skill: { name: '에너지 볼트', range: 400, mult: 2.4, hits: 1, mp: 10, cd: 0.6, shot: 'bolt' }, hpBonus: 0, mpBase: 50 },
};
const STATS = ['STR', 'DEX', 'INT', 'LUK'];
// 직업 옷: painted parts in assets/sp/<job>-torso|arm|leg.png. th: torso height (px), ty: where the torso's bottom sits
const JOB_LOOK = {
  warrior: { th: 27, ty: -14 }, thief: { th: 30, ty: -13 }, archer: { th: 30, ty: -13 }, mage: { th: 30, ty: -12 },
};
const GENDERS = [['boy', '남학생'], ['girl', '여학생']];

// ---- 몬스터 (맞으면 때린 사람을 쫓아옴) ------------------------------------------------------------
const MONS = {
  starch: { name: '녹말 슬라임', hp: 180, dmg: 14, exp: 9, speed: 40, drop: 'glucose', w: 52, h: 46 },
  protein: { name: '단백질 꾸물이', hp: 240, dmg: 19, exp: 12, speed: 46, drop: 'amino', w: 100, h: 34 },
  fat: { name: '지방 방울', hp: 210, dmg: 16, exp: 11, speed: 54, drop: 'fatty', w: 48, h: 56 },
  urea: { name: '요소 유령', hp: 280, dmg: 21, exp: 14, speed: 48, drop: 'urea', w: 56, h: 70 },
  boss: { name: '세균 대왕 박테리오', hp: 3000, dmg: 24, exp: 200, speed: 62, drop: null, w: 190, h: 170 },
};

// ---- 아이템 ----------------------------------------------------------------------------------
const ITEMS = {
  glucose: { name: '포도당', color: '#f4f0e0' }, amino: { name: '아미노산', color: '#e88aa8' }, fatty: { name: '지방산', color: '#f5c542' },
  nutrients: { name: '흡수된 영양소', color: '#9be36b' }, oxygen: { name: '산소', color: '#7fd3ff' },
  co2: { name: '이산화 탄소', color: '#9aa3ad' }, urea: { name: '요소', color: '#b48ce0' }, energy: { name: '에너지', color: '#ffd23f' },
};

// ---- 맵 -------------------------------------------------------------------------------------
// plats: [x, y, w] one-way footholds (y = the top you stand on); ground is solid. ropes: [x, top, bottom].
// portals: { x, y, to, tx, need (party stage), pick (asks 쉬움/어려움), boss }. npcs: [id, x, y]. spawns: { k, plat, n }.
// Jump reach is about 105 px up, so every first tier sits 95 px over the ground and higher tiers hang on ropes.
const LUNG_FLOORS = [3300, 2560, 1820, 1080, 340];
function lungPlats() { // the 기관지 나무 jump quest: 4 stages, each starts on a full-width branch floor
  const p = [];
  const pattern = [[180, 95], [330, 80], [470, 70], [620, 85], [760, 60], [900, 75], [1050, 65], [1190, 90]];
  for (let s = 0; s < 4; s++) {
    const y0 = LUNG_FLOORS[s];
    if (s) p.push([0, y0, 1500, 'floor']);
    const dir = s % 2 ? -1 : 1, n = 8;
    for (let i = 0; i < n; i++) {
      const [px, w] = pattern[dir > 0 ? i : n - 1 - i];
      p.push([px, y0 - 82 * (i + 1), Math.max(48, w - s * 6)]); // higher stages: narrower branches
    }
  }
  p.push([0, LUNG_FLOORS[4], 1500, 'floor']); // the top: 폐포
  return p;
}
function huntPlats() { // ground + a first tier you can jump onto + a second tier on ropes
  return [[250, 805, 500], [950, 805, 450], [1600, 805, 500], [2250, 805, 420], [480, 650, 420], [1240, 650, 460], [1940, 650, 420]];
}
const HUNT_ROPES = [[660, 650, 805], [1300, 650, 805], [2000, 650, 805]];

const MAPS = {
  town: {
    name: '세포 마을', sub: '마을 · 파티는 여기서만 만들 수 있어요', w: 2600, h: 900, ground: 800, theme: 'town', bgm: 'town',
    plats: [[360, 705, 240], [700, 610, 200], [1460, 705, 280], [1860, 610, 200]],
    ropes: [[790, 610, 800], [1950, 610, 800]],
    portals: [
      { x: 140, to: 'digest', tx: 'start', need: 1, label: '소화계 · 소화관 동굴' },
      { x: 1700, to: 'lung', tx: 'start', need: 2, pick: true, label: '호흡계 · 기관지 나무' },
      { x: 2100, to: 'vessel', tx: 'start', need: 3, pick: true, label: '순환계 · 혈관 급류' },
      { x: 2460, to: 'kidney', tx: 'start', need: 5, label: '배설계 · 콩팥 정수장' },
      { x: 960, to: 'lair', tx: 'start', boss: true, label: '세균 소굴 (보스)' },
    ],
    npcs: [['chief', 520, 800], ['mito', 1150, 800]],
    spawns: [],
  },
  digest: {
    name: '소화관 동굴', sub: '소화계', w: 3000, h: 1000, ground: 900, theme: 'digest', bgm: 'field',
    plats: huntPlats(), ropes: HUNT_ROPES,
    portals: [{ x: 90, to: 'town', tx: 140 }],
    npcs: [['villi', 2780, 900]],
    spawns: [{ k: 'starch', plat: -1, n: 6 }, { k: 'starch', plat: 0, n: 2 }, { k: 'protein', plat: 1, n: 2 }, { k: 'fat', plat: 2, n: 2 }, { k: 'protein', plat: 3, n: 2 },
      { k: 'fat', plat: 4, n: 2 }, { k: 'protein', plat: 5, n: 2 }, { k: 'fat', plat: 6, n: 2 }],
  },
  lung: {
    name: '기관지 나무', sub: '호흡계 · 점프 퀘스트 (쉬움)', w: 1500, h: 3400, ground: 3300, theme: 'lung', bgm: 'jump',
    plats: lungPlats(), ropes: [],
    portals: [{ x: 70, to: 'town', tx: 1700 }, { x: 1400, y: 340, to: 'town', tx: 1700 }],
    npcs: [['trachea', 300, 3300], ['diaphragm', 520, 3300], ['alveoli', 1150, 340]],
    spawns: [],
  },
  vessel: {
    name: '혈관 급류', sub: '순환계 · 컨트롤 맵 (쉬움)', w: 4400, h: 900, ground: 0, hazard: 830, theme: 'vessel', bgm: 'jump',
    // jump reach (walk 230, jump 640, gravity 1900): about 150 px across on the level, 120 px across going up 60
    plats: [[0, 700, 380], [515, 690, 120], [755, 640, 110], [1000, 700, 260], [1390, 660, 100], [1605, 600, 100], [1870, 700, 310],
      [2300, 650, 90], [2850, 700, 260], [3170, 640, 90], [3540, 560, 90], [3760, 700, 640]],
    movers: [[2480, 690, 110, 220, 0, 3.2], [3330, 700, 100, 0, -120, 2.6]], // [x, y, w, dx, dy, period s] 적혈구 발판
    clots: [[1110, 700, 1250, 2.2], [1990, 700, 2170, 1.8], [3900, 700, 4120, 2.0]], // [x0, y, x1, seconds per pass] 혈전
    valves: [1000, 1870, 2850, 3760], // 판막: a one-way door and a checkpoint
    ropes: [],
    portals: [{ x: 60, to: 'town', tx: 2100 }, { x: 4330, to: 'town', tx: 2100 }],
    npcs: [['heart', 200, 700], ['tissue', 4150, 700]],
    spawns: [],
  },
  kidney: {
    name: '콩팥 정수장', sub: '배설계', w: 3000, h: 1000, ground: 900, theme: 'kidney', bgm: 'field',
    plats: huntPlats(), ropes: HUNT_ROPES,
    portals: [{ x: 90, to: 'town', tx: 2460 }],
    npcs: [['nephron', 2780, 900]],
    spawns: [{ k: 'urea', plat: -1, n: 6 }, ...[0, 1, 2, 3, 4, 5, 6].map(p => ({ k: 'urea', plat: p, n: 2 }))],
  },
  lair: { // one per party (inst): the monsters live under m/lair_<party>
    name: '세균 소굴', sub: '보스 · 우리 파티만 들어와요', w: 1900, h: 900, ground: 800, theme: 'digest', dark: true, bgm: 'field', inst: true,
    plats: [[300, 705, 260], [1340, 705, 260]], ropes: [],
    portals: [{ x: 80, to: 'town', tx: 960 }],
    npcs: [], spawns: [],
  },
};
// 어려움: the same course with dust balls that shove you, branches that vanish and blasts from below
// orbs [x0, x1, y, period s, phase]; blink: plat indices gone 1.4 s out of every 4.2 s; geysers [x, floor y, height, period s, phase]
function hardOf(id, extra) { const m = MAPS[id]; MAPS[id + 'H'] = { ...m, ...extra, hard: true, sub: m.sub.replace('쉬움', '어려움') }; }
hardOf('lung', {
  gim: {
    orbs: LUNG_FLOORS.slice(0, 4).flatMap((y, s) => [[160, 1340, y - 250, 4.5 - s * 0.4, s * 0.3], [160, 1340, y - 520, 3.8 - s * 0.3, 0.5 + s * 0.2]]),
    blink: MAPS.lung.plats.map((p, i) => (!p[3] && i % 3 === 1 ? i : -1)).filter(i => i >= 0),
    geysers: LUNG_FLOORS.slice(0, 4).flatMap((y, s) => [[s % 2 ? 1050 : 450, y, 330, 5, s * 1.3], [s % 2 ? 450 : 1050, y, 330, 5, 2.5 + s * 1.3]]),
  },
});
hardOf('vessel', {
  clots: [...MAPS.vessel.clots, [520, 690, 630, 1.4], [2860, 700, 3100, 1.6]],
  gim: { orbs: [[1000, 1500, 560, 3.2, 0], [2300, 2800, 520, 3.6, 1], [3200, 3700, 470, 3.0, 2]], blink: [2, 5, 7, 10], geysers: [[1180, 830, 260, 4.5, 0], [2650, 830, 300, 4, 1.5], [3450, 830, 300, 4.2, 3]] },
});

// ---- NPC ------------------------------------------------------------------------------------
const NPCS = {
  chief: { name: '셀리 촌장', role: '세포 마을' }, mito: { name: '미토 발전소장', role: '미토콘드리아' },
  villi: { name: '융털 문지기', role: '소장' }, trachea: { name: '기관 안내원', role: '기관' },
  diaphragm: { name: '가로막 아저씨', role: '날숨 담당' }, alveoli: { name: '폐포 요정', role: '폐포' },
  heart: { name: '하트 선장', role: '심장' }, tissue: { name: '조직 세포', role: '세포' }, nephron: { name: '네프론 정수기', role: '콩팥 단위' },
};

// ---- 퀘스트 (파티가 함께, 차례대로) ------------------------------------------------------------
// kill: monsters per player; the party shares one count and needs it × its size (2명 ×2 … 4명 ×4). Other tasks: every
// member does them. Then the party leader writes the answer to ask; the teacher OKs it
// and the whole party moves on. hint: what a good answer has, shown to the teacher only. sys: the card shown when done.
const QUESTS = [
  { id: 'start', title: '세포 마을의 정전', at: 'chief', go: '셀리 촌장에게 말 걸기 · 파티는 마을에서만 만들 수 있어요' },
  { id: 'digest', title: '영양소를 분해하라', at: 'villi', kill: { starch: 5, protein: 3, fat: 3 }, sys: 'digest',
    go: '소화관 동굴에서 녹말 슬라임 · 단백질 꾸물이 · 지방 방울을 잡고 융털 문지기에게 (파티 인원만큼 더 많이)',
    ask: '소화계는 우리 몸에서 어떤 일을 할까요? 음식물 속 영양소가 어떻게 되는지 써 보세요.',
    hint: '음식물 속 영양소를 작게 분해하여 흡수한다. 흡수되지 않은 찌꺼기는 대변으로 나간다.' },
  { id: 'lung', title: '산소를 받아라', at: 'alveoli', sys: 'lung', go: '기관지 나무 꼭대기의 폐포 요정에게 (점프 퀘스트)',
    ask: '호흡계는 어떤 기체를 몸 안으로 받아들이고, 어떤 기체를 몸 밖으로 내보낼까요?',
    hint: '산소를 흡수하고 이산화 탄소를 몸 밖으로 내보낸다. (폐포 ↔ 모세 혈관 기체 교환)' },
  { id: 'vessel', title: '세포까지 배달', at: 'tissue', start: 'heart', sys: 'vessel',
    go: '하트 선장에게 짐을 싣고 혈관 급류를 건너 조직 세포에게',
    ask: '순환계는 무엇을 어디로 운반할까요? 두 가지 이상 써 보세요.',
    hint: '영양소와 산소를 온몸의 세포로 운반하고, 세포에서 생긴 이산화 탄소와 노폐물을 호흡계와 배설계로 운반한다.' },
  { id: 'cell', title: '세포 호흡!', at: 'mito', sys: 'cell', go: '세포 마을의 미토 발전소장에게 (파티원 모두)',
    ask: '세포 호흡이란 무엇일까요? 그리고 세포 호흡으로 얻은 에너지는 어디에 쓰일까요?',
    hint: '세포에서 영양소와 산소를 이용해 에너지를 얻는 과정(물·이산화 탄소 생성). 체온 유지, 두뇌 활동, 근육 운동, 소리 내기, 생장 등.' },
  { id: 'waste', title: '노폐물 내보내기', at: 'nephron', kill: { urea: 5 }, also: 'exhale', sys: 'kidney',
    go: '모두 가로막 아저씨(기관지 나무 아래)에게 이산화 탄소 내쉬기 + 콩팥 정수장에서 요소 유령 잡기 → 네프론 정수기에게',
    ask: '세포 호흡으로 생긴 이산화 탄소와 요소는 각각 어떻게 몸 밖으로 나갈까요?',
    hint: '이산화 탄소는 순환계를 거쳐 호흡계(폐)에서 날숨으로, 요소 등 노폐물은 배설계(콩팥)에서 걸러져 오줌으로 나간다.' },
  { id: 'link', title: '모든 게 이어졌다', at: 'chief', go: '셀리 촌장에게 돌아가기' },
  { id: 'free', title: '보스를 기다리며', go: '사냥으로 레벨을 올리며 선생님이 세균 소굴을 열어 주기를 기다려요' },
];

// ---- 보스: 빠진 기관계마다 이길 수 없는 까닭이 하나씩 ------------------------------------------------
const BOSS_RULES = [
  { q: 1, sys: 'digest', name: '굶주림', text: '소화계가 영양소를 흡수하지 못해 힘이 없어요. 공격이 거의 들어가지 않아요.' },
  { q: 2, sys: 'lung', name: '숨막힘', text: '호흡계가 산소를 받아들이지 못해 HP가 계속 줄어요.' },
  { q: 3, sys: 'vessel', name: '순환 정지', text: '순환계가 영양소와 산소를 나르지 못해 몸이 굳어요. 아주 느려져요.' },
  { q: 4, sys: 'cell', name: '에너지 없음', text: '세포 호흡을 하지 못해 보스의 보호막을 깰 에너지가 없어요.' },
  { q: 5, sys: 'kidney', name: '독소 쌓임', text: '배설계가 노폐물을 내보내지 못해 독소가 쌓여요. 10번 쌓이면 쓰러져요.' },
];

// ---- 기관계 카드 (퀘스트를 깨면 나옴, 교과서 230~231쪽) ----------------------------------------
const SYS = {
  digest: { name: '소화계', color: '#e9788f', text: '음식물 속 영양소를 작게 분해하여 흡수해요. 흡수된 영양소는 순환계로 가요. 흡수되지 않은 찌꺼기는 대변으로 나가요.' },
  lung: { name: '호흡계', color: '#5ab4e6', text: '산소를 몸 안으로 흡수하고, 이산화 탄소를 몸 밖으로 내보내요. 폐포에서 산소는 모세 혈관으로 들어가요.' },
  vessel: { name: '순환계', color: '#d9463b', text: '영양소와 산소를 온몸의 세포로 운반하고, 노폐물과 이산화 탄소를 배설계와 호흡계로 운반해요.' },
  cell: { name: '세포 호흡', color: '#f0a020', text: '세포(미토콘드리아)에서 영양소와 산소를 이용해 에너지를 얻는 과정이에요. 이때 물과 이산화 탄소 같은 노폐물이 생겨요. 얻은 에너지는 체온 유지(약 60 %), 두뇌 활동·근육 운동·소리 내기·생장(약 40 %)에 쓰여요.' },
  kidney: { name: '배설계', color: '#8a6fd0', text: '세포 호흡 결과 생긴 노폐물(요소 등)을 콩팥에서 걸러 오줌의 형태로 몸 밖으로 내보내요.' },
};

// ---- 대사 -----------------------------------------------------------------------------------
const TALK = {
  prologue: [
    '어서 와, 원정대! 여기는 우리 몸속 \'세포 마을\'이야.',
    '춤을 추고, 생각하고, 말하는 데 필요한 에너지는 어디서 올까? 바로 우리 몸의 세포에서 만들어져!',
    '세포는 영양소와 산소를 이용해 에너지를 얻어. 이 과정을 \'세포 호흡\'이라고 해. 이때 물과 이산화 탄소 같은 노폐물도 생기지.',
    '이렇게 얻은 에너지는 체온 유지에 약 60 %, 나머지는 두뇌 활동, 근육 운동, 소리 내기, 생장에 쓰여.',
    '그런데 큰일이야! 마을 발전소(미토콘드리아)가 멈춰서 마을이 깜깜해. 세포 호흡을 하려면 영양소와 산소가 필요해.',
    '파티는 지금 이 마을에서만 만들 수 있어 (최대 4명). 포탈을 한 번 지나면 더는 못 만들어! 혼자 가도 괜찮아.',
    '파티원 모두가 퀘스트를 끝내고, 파티장이 답을 써서 선생님께 통과를 받아야 다음 기관계로 갈 수 있어. 먼저 왼쪽 포탈로 소화관 동굴에 가 봐!',
  ],
  villi_wait: ['영양소는 너무 커서 그대로는 못 들어가. 녹말 슬라임, 단백질 꾸물이, 지방 방울을 잡아서 잘게 분해해 줘! 파티원이 잡은 것도 함께 세어져.'],
  villi_done: ['포도당, 아미노산, 지방산! 잘게 분해됐구나. 내 융털로 흡수할게.'],
  trachea: ['코와 기관을 지나 기관지를 타고 끝까지 올라가면 폐포가 있어. 폐포 요정이 산소를 줄 거야. 떨어져도 포기하지 마!'],
  alveoli_done: ['여기까지 올라오다니! 폐포는 아주 많아서 표면적이 넓지. 산소는 폐포에서 모세 혈관으로 들어가.'],
  heart_go: ['나는 심장! 영양소랑 산소를 실었지? 좋아, 쿵쾅! 혈관 급류로 출발!', '판막은 한쪽으로만 열려서 혈액이 거꾸로 흐르지 않아. 굴러오는 혈전은 조심해!'],
  tissue_done: ['배달 고마워! 영양소와 산소가 도착했어. 이걸로 세포 호흡을 할 수 있어!'],
  mito_done: ['영양소 + 산소 → 세포 호흡! 위이잉… 에너지 발생!', '하지만 세포 호흡을 하면 이산화 탄소와 노폐물(요소 등)도 생겨. 그대로 두면 몸에 쌓여 위험해!'],
  diaphragm_exhale: ['이산화 탄소를 가져왔구나. 가로막이 올라가면… 후우! 날숨으로 몸 밖으로 내보냈어!'],
  diaphragm_idle: ['숨을 들이쉴 땐 내가 내려가고, 내쉴 땐 올라가지. 흡! 후!'],
  nephron_wait: ['요소 유령이 혈액 속에 떠다니고 있어! 파티와 함께 잡아 주면 내가 걸러서 오줌으로 내보낼게. 이산화 탄소는 모두 가로막 아저씨에게 내쉬어야 해.'],
  nephron_done: ['사구체에서 보먼주머니로 걸러내고… 필요한 건 다시 흡수하고… 요소는 오줌으로 내보냈어!'],
  link: ['다 해냈구나! 지금까지의 여행을 돌아보자.'],
  free: ['원정대 덕분에 마을이 살아났어! 선생님이 세균 소굴을 열어 주면 파티와 함께 보스에 도전해 봐.'],
};
