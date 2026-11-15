// PROTOTYPE - NOT FOR PRODUCTION
// Question: 기관계마다 다른 메이플식 퀘스트를 깨다 보면 소화·호흡·순환·배설이 세포 호흡으로 이어진다는 걸 아이들이 놀면서 느끼는가?
// Date: 2026-11-16
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html).
window.CONFIG = {
  seed: 1,
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  // moving (px, px/s, px/s²)
  walk: { value: 230, min: 100, max: 400, step: 10 },
  jump: { value: 640, min: 400, max: 900, step: 10 },       // take-off speed
  gravity: { value: 1900, min: 1000, max: 3000, step: 50 },
  climb: { value: 160, min: 60, max: 300, step: 10 },
  fall_max: { value: 1000, min: 500, max: 1600, step: 50 },
  // fighting
  ap_per_answer: { value: 5, min: 1, max: 10, step: 1 },    // stat points per correct entry answer
  base_stat: { value: 4, min: 1, max: 10, step: 1 },
  dmg_base: { value: 10, min: 1, max: 40, step: 1 },        // damage = base + main×k + lv×2
  dmg_per_main: { value: 0.8, min: 0.1, max: 3, step: 0.1 },
  energy_bonus: { value: 0.3, min: 0, max: 1, step: 0.05 },  // +30% damage after 세포 호흡
  hp_base: { value: 60, min: 20, max: 200, step: 5 },
  hp_per_lv: { value: 20, min: 5, max: 60, step: 1 },
  mp_regen: { value: 4, min: 0, max: 20, step: 1 },         // per second
  hp_regen: { value: 2, min: 0, max: 20, step: 1 },
  hurt_invuln: { value: 1.2, min: 0.2, max: 3, step: 0.1 },  // seconds after a hit
  exp_per_lv: { value: 18, min: 5, max: 60, step: 1 },       // exp to next = this × lv
  drop_rate: { value: 0.75, min: 0.1, max: 1, step: 0.05 },
  respawn: { value: 6, min: 1, max: 30, step: 1 },           // seconds for a monster to come back
  boss_hp_per_player: { value: 4000, min: 500, max: 20000, step: 250 }, // 6 students ≈ 1~2 minutes of fighting
  // the room
  send_hz: { value: 6, min: 1, max: 15, step: 1 },          // my position, times a second
  host_hz: { value: 5, min: 1, max: 15, step: 1 },          // monster positions from the map host
  stale_ms: { value: 8000, min: 2000, max: 30000, step: 500 },
};
