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
  exp_per_answer: { value: 6, min: 0, max: 30, step: 1 },   // EXP per correct entry answer (no stat points any more)
  dmg_base: { value: 30, min: 1, max: 80, step: 1 },        // damage = base + lv × per_lv (levels give skills, not stats)
  dmg_per_lv: { value: 4, min: 0, max: 20, step: 0.5 },
  energy_bonus: { value: 0.3, min: 0, max: 1, step: 0.05 },  // +30% damage after 세포 호흡
  hp_base: { value: 60, min: 20, max: 200, step: 5 },
  hp_per_lv: { value: 20, min: 5, max: 60, step: 1 },
  mp_regen: { value: 0.6, min: 0, max: 20, step: 0.1 },     // per second: slow, so skills are a choice
  hp_regen: { value: 0.4, min: 0, max: 20, step: 0.1 },     // per second: very slow, no potions, so a fight can be lost
  hurt_invuln: { value: 1.2, min: 0.2, max: 3, step: 0.1 },  // seconds after a hit
  exp_per_lv: { value: 30, min: 5, max: 90, step: 1 },       // exp to next = this × lv
  death_exp: { value: 0.1, min: 0, max: 0.5, step: 0.05 },   // share of the level's exp lost when you fall
  aggro_time: { value: 6, min: 0, max: 20, step: 0.5 },      // seconds a hit monster chases whoever hit it
  aggro_speed: { value: 1.7, min: 1, max: 3, step: 0.1 },    // × its walk speed while chasing
  drop_rate: { value: 0.6, min: 0.1, max: 1, step: 0.05 },
  respawn: { value: 8, min: 1, max: 30, step: 1 },           // seconds for a monster to come back
  trial_secs: { value: 60, min: 15, max: 300, step: 5 },     // 거짓말 탐지기: seconds to answer
  toxin_every: { value: 4, min: 1, max: 20, step: 0.5 },     // boss without 배설계: one toxin stack per this many seconds
  suffocate: { value: 0.025, min: 0, max: 0.2, step: 0.005 }, // boss without 호흡계: share of max HP lost a second
  boss_hp_per_player: { value: 4000, min: 500, max: 20000, step: 250 }, // 6 students ≈ 1~2 minutes of fighting
  // the room
  send_hz: { value: 6, min: 1, max: 15, step: 1 },          // my position, times a second
  host_hz: { value: 5, min: 1, max: 15, step: 1 },          // monster positions from the map host
  stale_ms: { value: 8000, min: 2000, max: 30000, step: 500 },
};
