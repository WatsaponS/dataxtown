// เพลงประกอบ lo-fi/chiptune สังเคราะห์สดด้วย Web Audio API — ไม่ใช้ไฟล์เสียง
// ลูป 8 บาร์ @96 BPM สวิงเบา ๆ: เบส + คอร์ดสแต็บ + เมโลดี้เพนทาโทนิก + กลองจากสัญญาณ noise
// เริ่มเล่นได้หลัง user gesture เท่านั้น (นโยบาย autoplay ของเบราว์เซอร์) — main.js จัดการให้
// Zone-aware: เพลงเปลี่ยนคาแรกเตอร์ตามโซนที่ผู้เล่นยืน (main.js เรียก music.setZone ทุกเฟรม)

import { PRIVATE_ZONE_TYPES } from "./data.js";

const BPM = 96;
const SPB = 60 / BPM;          // วินาทีต่อ beat
const SWING = 0.09;            // หน่วง 8th ตัวหลัง (สัดส่วนของ beat)
const STEPS_PER_BAR = 8;       // นับเป็นโน้ต 8th
const BARS = 8;                // progression 4 บาร์ x 2 รอบ (เมโลดี้ต่างกัน)

// [เบส (midi), โน้ตคอร์ด (midi)] — Fmaj7 / G7 / Em7 / Am7 วนซ้ำ
const PROG = [
  [41, [53, 57, 60, 64]],
  [43, [55, 59, 62, 65]],
  [40, [52, 55, 59, 62]],
  [45, [57, 60, 64, 67]],
];

// เมโลดี้ต่อบาร์: [step(0-7), midi, ความยาว(beat)] — โปร่ง ๆ ให้ฟังสบาย
const MELODY = [
  [[0, 72, 1], [4, 76, 0.5], [6, 74, 1]],
  [[2, 71, 0.5], [5, 67, 1]],
  [[0, 64, 1], [5, 67, 0.5], [6, 71, 1]],
  [[2, 69, 1.5]],
  [[0, 76, 0.5], [2, 74, 0.5], [4, 72, 1]],
  [[3, 71, 0.5], [5, 69, 1]],
  [[0, 67, 1], [4, 64, 1.5]],
  [[2, 60, 2]],
];

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const BASE_GAIN = 0.2; // ดังขึ้นจากเดิม (0.14) แต่ยังเป็น background ไม่กลบการคุยงาน

// คาแรกเตอร์เพลงต่อโซน — gain คูณกับ BASE_GAIN, cutoff คือ lowpass ปลายทาง (Hz)
// hatBoost/chordBoost คูณความดังราย instrument, melodyOct ยกเมโลดี้ขึ้นทั้ง octave
const MOODS = {
  default: { gain: 1.0,  cutoff: 18000, hatBoost: 1.0, chordBoost: 1.0,  melodyOct: 0 },  // ทางเดิน/ทั่วไป
  stage:   { gain: 1.15, cutoff: 18000, hatBoost: 1.6, chordBoost: 1.25, melodyOct: 12 }, // เวที: คึกคัก สว่าง
  social:  { gain: 1.05, cutoff: 18000, hatBoost: 0.7, chordBoost: 1.35, melodyOct: 0 },  // pantry/โซฟา: อบอุ่น
  muffled: { gain: 0.5,  cutoff: 650,   hatBoost: 0.4, chordBoost: 1.0,  melodyOct: 0 },  // ห้องปิด: ลอดผนัง
};

function moodForZone(zone) {
  if (!zone) return "default";
  if (zone.type === "presentation") return "stage";
  if (zone.type === "social" || zone.type === "refreshment") return "social";
  if (PRIVATE_ZONE_TYPES.has(zone.type)) return "muffled";
  return "default"; // transit ฯลฯ
}

export function createMusic() {
  let ctx = null, master = null, masterFilter = null, timer = null, step = 0, nextTime = 0;
  let muted = localStorage.getItem("dataxtown.music") === "off";
  let moodName = "default";
  let mood = MOODS.default;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterFilter = ctx.createBiquadFilter();
      masterFilter.type = "lowpass";
      masterFilter.frequency.value = mood.cutoff;
      master = ctx.createGain();
      master.gain.value = BASE_GAIN * mood.gain;
      master.connect(masterFilter);
      masterFilter.connect(ctx.destination);
    }
  }

  function tone(midi, t, durBeats, { type = "triangle", vol = 0.05, cutoff = 2000 } = {}) {
    const dur = durBeats * SPB;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.value = mtof(midi);
    f.type = "lowpass";
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noiseHit(t, dur, vol, freq, q = 1.2) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf;
    f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    o.connect(g); g.connect(master);
    o.start(t);
    o.stop(t + 0.2);
  }

  function scheduleStep(s, baseT) {
    const t = baseT + (s % 2 ? SWING * SPB : 0); // สวิง 8th ตัวหลัง
    const bar = Math.floor(s / STEPS_PER_BAR) % BARS;
    const inBar = s % STEPS_PER_BAR;
    const [bass, chord] = PROG[bar % 4];

    // กลอง: hat ทุก 8th (เว้นจังหวะแผ่ว), kick ต้น/กลางบาร์, rim ที่ beat 2 กับ 4
    if (!(bar % 2 === 1 && inBar === 7)) noiseHit(t, 0.04, (inBar % 2 ? 0.018 : 0.032) * mood.hatBoost, 7500, 1.5);
    if (inBar === 0 || inBar === 4) kick(t);
    if (inBar === 2 || inBar === 6) noiseHit(t, 0.07, 0.05 * mood.hatBoost, 1900, 0.9);

    // เบส: root ต้นบาร์, คั่นด้วยคู่ 5 และ root ท้ายบาร์
    if (inBar === 0) tone(bass, t, 0.9, { vol: 0.09, cutoff: 700 });
    if (inBar === 3) tone(bass + 7, t, 0.45, { vol: 0.06, cutoff: 700 });
    if (inBar === 6) tone(bass, t, 0.45, { vol: 0.07, cutoff: 700 });

    // คอร์ดสแต็บ off-beat แบบ roll นิด ๆ ให้ฟังนุ่ม
    if (inBar === 2 || inBar === 5) {
      chord.forEach((n, i) => tone(n, t + i * 0.014, 0.55, { vol: 0.032 * mood.chordBoost, cutoff: 1500 }));
    }

    // เมโลดี้ (บนเวทียกขึ้น 1 octave ให้สว่าง)
    for (const [ms, midi, len] of MELODY[bar]) {
      if (ms === inBar) tone(midi + mood.melodyOct, t, len, { type: "square", vol: 0.04, cutoff: 1200 });
    }
  }

  function beginLoop() {
    if (timer || muted) return;
    step = 0;
    nextTime = ctx.currentTime + 0.06;
    timer = setInterval(() => {
      while (nextTime < ctx.currentTime + 0.2) {
        scheduleStep(step % (STEPS_PER_BAR * BARS), nextTime);
        nextTime += SPB / 2;
        step++;
      }
    }, 40);
  }

  function stopLoop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  return {
    // เรียกได้บ่อยเท่าที่ต้องการ — จะเริ่มจริงเมื่อ AudioContext พร้อม (หลัง gesture) และไม่ mute
    start() {
      if (muted) return;
      ensureCtx();
      if (ctx.state === "suspended") {
        ctx.resume().then(() => { if (!muted && ctx.state === "running") beginLoop(); });
      } else {
        beginLoop();
      }
    },
    toggle() {
      muted = !muted;
      localStorage.setItem("dataxtown.music", muted ? "off" : "on");
      if (muted) stopLoop();
      else this.start();
      return muted;
    },
    isMuted: () => muted,
    // เรียกได้ทุกเฟรม — เปลี่ยน mood เฉพาะเมื่อโซนเปลี่ยน แล้ว ramp นุ่ม ๆ ~1 วินาที
    setZone(zone) {
      const name = moodForZone(zone);
      if (name === moodName) return;
      moodName = name;
      mood = MOODS[name];
      if (ctx && master) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.linearRampToValueAtTime(BASE_GAIN * mood.gain, t + 1.0);
        masterFilter.frequency.cancelScheduledValues(t);
        masterFilter.frequency.linearRampToValueAtTime(mood.cutoff, t + 1.0);
      }
    },
    zoneMood: () => moodName, // สำหรับ automated test
  };
}
