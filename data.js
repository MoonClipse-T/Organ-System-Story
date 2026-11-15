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
// 의상: painted parts in assets/sp/<id>-torso|arm|leg.png. th: torso height (px), ty: where the torso's bottom sits
const OUTFITS = [
  { id: 'o0', name: '모험가 옷', th: 28, ty: -14 },
  { id: 'o1', name: '후드티', th: 30, ty: -14 },
  { id: 'o2', name: '교복', th: 34, ty: -9 },
];
const GENDERS = [['boy', '남학생'], ['girl', '여학생']];

// ---- 몬스터 ----------------------------------------------------------------------------------
const MONS = {
  starch: { name: '녹말 슬라임', hp: 60, dmg: 6, exp: 5, speed: 38, drop: 'glucose', w: 52, h: 40 },
  protein: { name: '단백질 꾸물이', hp: 80, dmg: 8, exp: 7, speed: 44, drop: 'amino', w: 100, h: 34 },
  fat: { name: '지방 방울', hp: 70, dmg: 7, exp: 6, speed: 52, drop: 'fatty', w: 48, h: 56 },
  urea: { name: '요소 유령', hp: 90, dmg: 9, exp: 8, speed: 46, drop: 'urea', w: 56, h: 70 },
  boss: { name: '세균 대왕 박테리오', hp: 3000, dmg: 16, exp: 120, speed: 60, drop: null, w: 190, h: 170 },
};

// ---- 아이템 ----------------------------------------------------------------------------------
const ITEMS = {
  glucose: { name: '포도당', color: '#f4f0e0' }, amino: { name: '아미노산', color: '#e88aa8' }, fatty: { name: '지방산', color: '#f5c542' },
  nutrients: { name: '흡수된 영양소', color: '#9be36b' }, oxygen: { name: '산소', color: '#7fd3ff' },
  co2: { name: '이산화 탄소', color: '#9aa3ad' }, urea: { name: '요소', color: '#b48ce0' }, energy: { name: '에너지', color: '#ffd23f' },
};

// ---- 맵 -------------------------------------------------------------------------------------
// plats: [x, y, w] one-way footholds (y = the top you stand on); ground is solid. ropes: [x, top, bottom].
// portals: { x, y, to, tx } (tx: where you come out). npcs: [id, x, y]. spawns: { k, plat, n }.
function lungPlats() { // the 기관지 나무 jump quest: 4 stages, each starts on a full-width branch floor
  const p = [], floors = [3300, 2560, 1820, 1080, 340];
  const pattern = [[180, 95], [330, 80], [470, 70], [620, 85], [760, 60], [900, 75], [1050, 65], [1190, 90]];
  for (let s = 0; s < 4; s++) {
    const y0 = floors[s];
    if (s) p.push([0, y0, 1500, 'floor']);
    const dir = s % 2 ? -1 : 1, n = 8;
    for (let i = 0; i < n; i++) {
      const [px, w] = pattern[dir > 0 ? i : n - 1 - i];
      const y = y0 - 82 * (i + 1);
      p.push([px, y, Math.max(48, w - s * 6)]); // higher stages: narrower branches
    }
  }
  p.push([0, floors[4], 1500, 'floor']); // the top: 폐포
  return p;
}

const MAPS = {
  town: {
    name: '세포 마을', sub: '마을', w: 2600, h: 900, ground: 800, theme: 'town', bgm: 'town',
    plats: [[380, 680, 220], [700, 590, 200], [1500, 660, 260], [1880, 580, 200]],
    ropes: [[800, 590, 800]],
    portals: [
      { x: 140, to: 'digest', tx: 'start', label: '소화계 · 소화관 동굴' },
      { x: 1700, to: 'lung', tx: 'start', label: '호흡계 · 기관지 나무' },
      { x: 2100, to: 'vessel', tx: 'start', label: '순환계 · 혈관 급류' },
      { x: 2460, to: 'kidney', tx: 'start', label: '배설계 · 콩팥 정수장' },
    ],
    npcs: [['chief', 520, 800], ['mito', 1150, 800]],
    spawns: [],
  },
  digest: {
    name: '소화관 동굴', sub: '소화계', w: 3000, h: 1000, ground: 900, theme: 'digest', bgm: 'field',
    plats: [[300, 760, 520], [980, 700, 440], [1600, 760, 520], [2250, 700, 420], [600, 560, 460], [1300, 520, 520], [2000, 560, 460]],
    ropes: [[520, 560, 760], [1200, 520, 700], [1750, 560, 760], [2400, 560, 700]],
    portals: [{ x: 90, to: 'town', tx: 140 }, { x: 2920, to: 'town', tx: 140 }],
    npcs: [['villi', 2780, 900]],
    spawns: [{ k: 'starch', plat: -1, n: 6 }, { k: 'starch', plat: 0, n: 2 }, { k: 'protein', plat: 1, n: 2 }, { k: 'protein', plat: 3, n: 2 }, { k: 'protein', plat: 5, n: 2 },
      { k: 'fat', plat: 2, n: 2 }, { k: 'fat', plat: 4, n: 2 }, { k: 'fat', plat: 6, n: 2 }],
  },
  lung: {
    name: '기관지 나무', sub: '호흡계 · 점프 퀘스트', w: 1500, h: 3400, ground: 3300, theme: 'lung', bgm: 'jump',
    plats: lungPlats(), ropes: [],
    portals: [{ x: 70, to: 'town', tx: 1700 }, { x: 1400, y: 340, to: 'town', tx: 1700 }],
    npcs: [['trachea', 300, 3300], ['diaphragm', 520, 3300], ['alveoli', 1150, 340]],
    spawns: [],
  },
  vessel: {
    name: '혈관 급류', sub: '순환계 · 컨트롤 맵', w: 4400, h: 900, ground: 0, hazard: 830, theme: 'vessel', bgm: 'jump',
    // jump reach (walk 230, jump 640, gravity 1900): about 150 px across on the level, 120 px across going up 60
    plats: [[0, 700, 380], [515, 690, 120], [755, 640, 110], [1000, 700, 260], [1390, 660, 100], [1605, 600, 100], [1870, 700, 310],
      [2300, 650, 90], [2850, 700, 260], [3170, 640, 90], [3540, 560, 90], [3760, 700, 640]],
    movers: [ // [x, y, w, dx, dy, period s]  (moving 적혈구 발판; it swings out by dx, dy and back)
      [2480, 690, 110, 220, 0, 3.2], [3330, 700, 100, 0, -120, 2.6]],
    clots: [[1110, 700, 1250, 2.2], [1990, 700, 2170, 1.8], [3900, 700, 4120, 2.0]], // [x0, y, x1, seconds per pass] 굴러다니는 혈전
    valves: [1000, 1870, 2850, 3760], // 판막: a one-way door and a checkpoint
    ropes: [],
    portals: [{ x: 60, to: 'town', tx: 2100 }, { x: 4330, to: 'town', tx: 2100 }],
    npcs: [['heart', 200, 700], ['tissue', 4150, 700]],
    spawns: [],
  },
  kidney: {
    name: '콩팥 정수장', sub: '배설계', w: 2800, h: 1000, ground: 900, theme: 'kidney', bgm: 'field',
    plats: [[350, 740, 480], [1050, 680, 480], [1750, 740, 480], [700, 540, 420], [1450, 520, 420]],
    ropes: [[600, 740, 900], [1250, 680, 900], [900, 540, 740], [1650, 520, 680]],
    portals: [{ x: 90, to: 'town', tx: 2460 }],
    npcs: [['nephron', 2580, 900]],
    spawns: [{ k: 'urea', plat: -1, n: 6 }, { k: 'urea', plat: 0, n: 2 }, { k: 'urea', plat: 1, n: 2 }, { k: 'urea', plat: 2, n: 2 }, { k: 'urea', plat: 3, n: 2 }, { k: 'urea', plat: 4, n: 2 }],
  },
};

// ---- NPC ------------------------------------------------------------------------------------
const NPCS = {
  chief: { name: '셀리 촌장', role: '세포 마을' }, mito: { name: '미토 발전소장', role: '미토콘드리아' },
  villi: { name: '융털 문지기', role: '소장' }, trachea: { name: '기관 안내원', role: '기관' },
  diaphragm: { name: '가로막 아저씨', role: '날숨 담당' }, alveoli: { name: '폐포 요정', role: '폐포' },
  heart: { name: '하트 선장', role: '심장' }, tissue: { name: '조직 세포', role: '세포' }, nephron: { name: '네프론 정수기', role: '콩팥 단위' },
};

// ---- 퀘스트 (차례대로) ------------------------------------------------------------------------
// need: items to carry in; take: items the NPC takes; give: items you get. sys: the card shown when done.
const QUESTS = [
  { id: 'start', title: '세포 마을의 정전', at: 'chief', go: '셀리 촌장에게 말 걸기' },
  { id: 'digest', title: '영양소를 모아라', at: 'villi', map: 'digest', need: { glucose: 6, amino: 4, fatty: 4 }, give: ['nutrients'], sys: 'digest',
    go: '소화관 동굴에서 포도당 6 · 아미노산 4 · 지방산 4를 모아 융털 문지기에게' },
  { id: 'lung', title: '산소를 받아라', at: 'alveoli', map: 'lung', give: ['oxygen'], sys: 'lung', go: '기관지 나무 꼭대기의 폐포 요정에게 (점프 퀘스트)' },
  { id: 'vessel', title: '세포까지 배달', at: 'tissue', map: 'vessel', start: 'heart', need: { nutrients: 1, oxygen: 1 }, sys: 'vessel',
    go: '하트 선장에게 짐을 싣고 혈관 급류를 건너 조직 세포에게' },
  { id: 'cell', title: '세포 호흡!', at: 'mito', map: 'town', give: ['energy', 'co2'], sys: 'cell', go: '세포 마을의 미토 발전소장에게' },
  { id: 'waste', title: '노폐물 내보내기', at: 'nephron', map: 'kidney', need: { urea: 6 }, also: 'exhale', sys: 'kidney',
    go: '가로막 아저씨에게 이산화 탄소 내쉬기 + 콩팥 정수장에서 요소 6을 모아 네프론 정수기에게' },
  { id: 'link', title: '모든 게 이어졌다', at: 'chief', go: '셀리 촌장에게 돌아가기' },
  { id: 'free', title: '보스를 기다리며', go: '자유 사냥 · 파티를 맺고 보스를 기다리자' },
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
// [text, choices?]  The game picks a script by NPC and quest progress (game.js talk()).
const TALK = {
  prologue: [
    '어서 와, 원정대! 여기는 우리 몸속 \'세포 마을\'이야.',
    '춤을 추고, 생각하고, 말하는 데 필요한 에너지는 어디서 올까? 바로 우리 몸의 세포에서 만들어져!',
    '세포는 영양소와 산소를 이용해 에너지를 얻어. 이 과정을 \'세포 호흡\'이라고 해. 이때 물과 이산화 탄소 같은 노폐물도 생기지.',
    '이렇게 얻은 에너지는 체온 유지에 약 60 %, 나머지는 두뇌 활동, 근육 운동, 소리 내기, 생장에 쓰여.',
    '그런데 큰일이야! 마을 발전소(미토콘드리아)가 멈춰서 마을이 깜깜해. 세포 호흡을 하려면 영양소와 산소가 필요해.',
    '먼저 마을 왼쪽 포탈로 소화관 동굴에 가서 영양소 몬스터를 잡아 와 줘. 파티를 맺으면 더 빨리 모을 수 있어!',
  ],
  villi_wait: ['영양소는 너무 커서 그대로는 못 들어가. 녹말 슬라임, 단백질 꾸물이, 지방 방울을 잡아 잘게 분해된 영양소를 가져와!'],
  villi_done: ['포도당, 아미노산, 지방산! 잘게 분해됐구나. 내 융털로 흡수할게.', '흡수된 영양소는 혈액을 타고 온몸으로 가. 이제 산소가 필요해. 마을의 호흡계 포탈(기관지 나무)로 가 봐!'],
  trachea: ['코와 기관을 지나 기관지를 타고 끝까지 올라가면 폐포가 있어. 폐포 요정이 산소를 줄 거야. 떨어져도 포기하지 마!'],
  alveoli_done: ['여기까지 올라오다니! 폐포는 아주 많아서 표면적이 넓지. 산소를 줄게.', '산소는 폐포에서 모세 혈관으로 들어가. 이제 영양소와 산소를 세포까지 배달해야 해. 순환계 포탈로!'],
  heart_go: ['나는 심장! 영양소랑 산소를 실었지? 좋아, 쿵쾅! 혈관 급류로 출발!', '판막은 한쪽으로만 열려서 혈액이 거꾸로 흐르지 않아. 굴러오는 혈전은 조심해!'],
  heart_need: ['흡수된 영양소와 산소를 둘 다 가져와야 출발할 수 있어.'],
  tissue_done: ['배달 고마워! 영양소와 산소가 도착했어.', '이걸로 세포 호흡을 할 수 있어. 세포 마을의 미토 발전소장에게 가서 발전소를 켜 줘!'],
  mito_done: ['영양소 + 산소 → 세포 호흡! 위이잉… 에너지 발생!', '에너지 덕분에 마을에 불이 켜졌어! 너도 힘이 솟을 거야(공격력 +30 %).', '그런데 세포 호흡을 하면 이산화 탄소와 노폐물(요소 등)이 생겨. 그대로 두면 몸에 쌓여 위험해!', '이산화 탄소는 기관지 나무 아래 가로막 아저씨에게, 요소는 콩팥 정수장의 네프론 정수기에게 보내 줘.'],
  diaphragm_exhale: ['이산화 탄소를 가져왔구나. 가로막이 올라가면… 후우! 날숨으로 몸 밖으로 내보냈어!'],
  diaphragm_idle: ['숨을 들이쉴 땐 내가 내려가고, 내쉴 땐 올라가지. 흡! 후!'],
  nephron_wait: ['요소 유령이 혈액 속에 떠다니고 있어! 잡아서 요소를 모아 오면 내가 걸러서 오줌으로 내보낼게.'],
  nephron_done: ['사구체에서 보먼주머니로 걸러내고… 필요한 건 다시 흡수하고… 요소는 오줌으로 내보냈어! 깨끗해졌다!'],
  link: ['다 해냈구나! 지금까지의 여행을 돌아보자.'],
  free: ['원정대 덕분에 마을이 살아났어! 이제 파티를 맺고, 선생님이 보내는 보스를 기다려 봐.'],
  locked: ['아직은 할 일이 없어. 퀘스트 창(왼쪽 위)을 확인해 봐!'],
};
