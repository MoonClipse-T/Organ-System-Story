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
  // levels: the entry quiz sets the first level (all right = start_lv, one less for every wrong one), hunting does the rest
  start_lv: { value: 8, min: 1, max: 15, step: 1 },
  boss_lv: { value: 10, min: 1, max: 30, step: 1 },         // the lair lets you in from this level
  dmg_base: { value: 20, min: 1, max: 80, step: 1 },        // attack = base + level × per_lv  (Lv.1 24 · Lv.8 52 · Lv.10 60)
  dmg_per_lv: { value: 4, min: 0, max: 20, step: 0.5 },
  def_per_lv: { value: 0.6, min: 0, max: 3, step: 0.1 },    // 방어: a hit loses this × level (rounded down), never below 1
  mission_exp: { value: 60, min: 0, max: 300, step: 5 },    // every member, for every mission the party clears
  // 혈관 급류 (어려움): the heart beats; each beat opens the valves and the blood shoves you along
  beat_every: { value: 1.8, min: 1, max: 4, step: 0.1 },    // seconds between beats
  beat_open: { value: 0.7, min: 0.2, max: 2, step: 0.05 },  // valves stay open this long after a beat
  beat_push: { value: 420, min: 0, max: 900, step: 10 },    // px/s the surge carries you toward the right
  energy_bonus: { value: 0.3, min: 0, max: 1, step: 0.05 },  // +30% damage after 세포 호흡
  hp_base: { value: 60, min: 20, max: 200, step: 5 },
  hp_per_lv: { value: 20, min: 5, max: 60, step: 1 },
  mp_regen: { value: 0.6, min: 0, max: 20, step: 0.1 },     // per second: slow, so skills are a choice
  hp_regen: { value: 0.4, min: 0, max: 20, step: 0.1 },     // per second: very slow, no potions, so a fight can be lost
  hurt_invuln: { value: 1.2, min: 0.2, max: 3, step: 0.1 },  // seconds after a hit
  exp_per_lv: { value: 20, min: 5, max: 90, step: 1 },       // exp to next = this × lv (Lv.8 → 10: 340)
  death_exp: { value: 0.1, min: 0, max: 0.5, step: 0.05 },   // share of the level's exp lost when you fall
  aggro_time: { value: 6, min: 0, max: 20, step: 0.5 },      // seconds a hit monster chases whoever hit it
  aggro_speed: { value: 1.7, min: 1, max: 3, step: 0.1 },    // × its walk speed while chasing
  drop_rate: { value: 0.6, min: 0.1, max: 1, step: 0.05 },
  respawn: { value: 8, min: 1, max: 30, step: 1 },           // seconds for a monster to come back
  trial_secs: { value: 45, min: 10, max: 300, step: 5 },     // 거짓말 탐지기: seconds to type the sentence
  toxin_every: { value: 4, min: 1, max: 20, step: 0.5 },     // boss without 배설계: one toxin stack per this many seconds
  suffocate: { value: 0.025, min: 0, max: 0.2, step: 0.005 }, // boss without 호흡계: share of max HP lost a second
  // the boss's attacks: a red area blinks first (warn), then the attack lands there
  batk_every: { value: 4, min: 2, max: 10, step: 0.25 },   // seconds from one attack to the next
  batk_warn: { value: 1.2, min: 0.4, max: 3, step: 0.1 },   // seconds the red area shows before it hits
  sweep_dmg: { value: 30, min: 0, max: 120, step: 1 },      // 촉수 휘두르기 (jump over it, or stand on a ledge)
  pillar_dmg: { value: 34, min: 0, max: 120, step: 1 },     // 촉수 기둥 (step out of the red column)
  gas_dmg: { value: 8, min: 0, max: 40, step: 1 },          // 독가스, every half second inside the cloud (armour does not help)
  boss_hp_per_player: { value: 4000, min: 500, max: 20000, step: 250 }, // 6 students ≈ 1~2 minutes of fighting
  // the room
  send_hz: { value: 6, min: 1, max: 15, step: 1 },          // my position, times a second
  host_hz: { value: 5, min: 1, max: 15, step: 1 },          // monster positions from the map host
  stale_ms: { value: 8000, min: 2000, max: 30000, step: 500 },
};
