// เป่ายิ้งฉุบท้าดวลระหว่างผู้เล่น — ชนะ 2 ใน 3 ได้ 20 แต้ม (Firebase เท่านั้น เหมือน quest/room)
// ท้า NPC (C-level) ก็ได้เหมือนกัน — จำลองในเครื่องล้วน ๆ ไม่ผ่าน Firebase (ดู npcDuel ด้านล่าง)
// เพราะ NPC ไม่มีฝั่งจริงให้ sync ด้วย ควบคุมอัตราชนะเองผ่าน ent.duelWinRate (ดู data.js)
//
// โครงข้อมูล duels/<id> (top-level — คนละ path กับ rooms/main/players|chat) = {
//   a, aName, b, bName,                 // ผู้ท้า (a) กับผู้ถูกท้า (b)
//   status: pending|declined|cancelled|active|done,
//   choiceA, choiceB,                   // "rock"|"paper"|"scissors"|null — ล้างทุกจบรอบ
//   lastChoiceA, lastChoiceB, lastResult,  // ไว้โชว์ผลรอบล่าสุด (a|b|draw)
//   winsA, winsB, round, winner, ts,
// }
// ฝั่ง "a" (ผู้สร้างคำท้า) เป็นตัวตัดสินผลรอบเดียว — กันเขียนชนกัน ไม่ต้องมี Cloud Function

import { addSystemLine } from "./ui.js";
import { awardPoints } from "./quests.js";
import { spawnBurst } from "./fx.js";
import { bumpStat } from "./achievements.js";
import { bumpMission } from "./missions.js";

const WIN_POINTS = 20;
const DUEL_RANGE = 120; // px — ต้องเดินเข้าไปใกล้จริง ๆ ถึงจะขึ้นป้ายชวนดวล (2x จาก 60 — ตาม tile 24->48px)
const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };     // key ชนะอะไร
const COUNTERS = { rock: "paper", paper: "scissors", scissors: "rock" }; // อะไรชนะ key (ตรงข้าม BEATS)
const CHOICE_EMOJI = { rock: "✊", paper: "✋", scissors: "✂️" };
const NPC_DRAW_CHANCE = 0.2;             // โอกาสเสมอต่อรอบ คงที่ทุก NPC (ให้ยังรู้สึกเป็นเป่ายิ้งฉุบจริง)
const NPC_DUEL_COOLDOWN_MS = 10 * 60 * 1000; // กันสแปมท้า NPC ซ้ำรัว ๆ ฟาร์มแต้ม (10 นาที/คน)
const npcCooldownUntil = new Map(); // npc entity id -> timestamp ที่ท้าใหม่ได้

let duel = null; // ดวลกับผู้เล่นจริง (ผ่าน Firebase) ที่กำลังดำเนินอยู่
let npcDuel = null; // ดวลกับ NPC (จำลองในเครื่อง) ที่กำลังดำเนินอยู่ — มีได้ทีละ 1 อย่างใดอย่างหนึ่ง
let nearbyTarget = null; // เป้าหมาย (ผู้เล่นจริงหรือ NPC) ที่อยู่ใกล้พอจะกด F ท้าได้ตอนนี้ (คำนวณทุกเฟรม)

export function initDuel(world, ui) {
  window.__duelState = () => duel; // hooks สำหรับ automated test (cdp_shot --eval)
  window.__npcDuelState = () => npcDuel;
  window.__duelPrompt = () => nearbyTarget;
  window.addEventListener("duel-challenge", e => sendChallenge(world, ui, e.detail.uid, e.detail.name));

  document.getElementById("duel-accept-btn").addEventListener("click", () => {
    if (!duel) return;
    world.net.fb.update(duel.ref, { status: "active" }).catch(() => {});
  });
  document.getElementById("duel-decline-btn").addEventListener("click", () => {
    if (!duel) return;
    world.net.fb.update(duel.ref, { status: "declined" }).catch(() => {});
  });
  document.getElementById("duel-cancel-btn").addEventListener("click", () => {
    if (npcDuel) { finishNpcDuelCleanup(); return; }
    if (!duel) { document.getElementById("duel-overlay").classList.add("hidden"); return; }
    if (["done", "declined", "cancelled"].includes(duel.status)) finishDuelCleanup(world);
    else world.net.fb.update(duel.ref, { status: "cancelled" }).catch(() => {});
  });
  document.querySelectorAll(".duel-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      if (npcDuel) { playNpcRound(world, ui, btn.dataset.choice); return; }
      if (!duel || duel.status !== "active") return;
      const field = duel.isA ? "choiceA" : "choiceB";
      world.net.fb.update(duel.ref, { [field]: btn.dataset.choice }).catch(() => {});
    });
  });
  document.getElementById("duel-hint").addEventListener("click", () => tryDuelNearby(world, ui));

  const fb = world.net && world.net.fb;
  if (!fb || !world.net.uid) return; // โหมด WebSocket/ออฟไลน์: ปุ่มยังกดได้แต่ sendChallenge จะแจ้งเตือนแทน

  // ฟังคำท้าที่พุ่งเข้ามาหาเรา (เฉพาะที่สร้างหลังต่อ Firebase กันโดนคำท้าเก่าค้าง)
  const connectedAt = Date.now();
  fb.onChildAdded(fb.query(fb.ref(fb.db, "duels"), fb.orderByChild("ts"), fb.startAt(connectedAt - 3000)), snap => {
    const v = snap.val();
    if (!v || v.b !== world.net.uid || v.status !== "pending") return;
    if (duel) { // กำลังท้าคนอื่นอยู่แล้ว — ปฏิเสธอัตโนมัติกันค้าง
      fb.update(fb.ref(fb.db, `duels/${snap.key}`), { status: "declined" }).catch(() => {});
      return;
    }
    duel = {
      id: snap.key, ref: fb.ref(fb.db, `duels/${snap.key}`),
      isA: false, myUid: world.net.uid, oppUid: v.a, oppName: v.aName,
      status: "pending", awarded: false, resolving: false,
    };
    duel.unsub = fb.onValue(duel.ref, s2 => handleDuelUpdate(world, ui, s2));
  });
}

// เรียกทุกเฟรมจาก game loop — หาผู้เล่นจริง/NPC ที่ใกล้เราที่สุดในระยะ DUEL_RANGE
export function updateDuelProximity(world) {
  if (duel || npcDuel || !world.player) {
    nearbyTarget = null;
    document.getElementById("duel-hint").classList.add("hidden");
    return;
  }
  let best = null, bestDist = DUEL_RANGE, bestIsNpc = false;
  for (const ent of world.entities) {
    const isNpc = ent.kind === "npc" && typeof ent.duelWinRate === "number";
    if (!isNpc && (ent.kind !== "remote" || ent.online === false)) continue; // หลับอยู่/ไม่ใช่เป้าที่ท้าได้
    if (isNpc && (npcCooldownUntil.get(ent.id) || 0) > Date.now()) continue; // เพิ่งท้าไปเมื่อกี้ ยังพักอยู่
    const d = Math.hypot(ent.x - world.player.x, ent.y - world.player.y);
    if (d <= bestDist) { bestDist = d; best = ent; bestIsNpc = isNpc; }
  }
  nearbyTarget = best ? { ent: best, uid: bestIsNpc ? null : best.id.slice(7), name: best.name, isNpc: bestIsNpc } : null;
  document.getElementById("duel-hint").classList.toggle("hidden", !nearbyTarget);
}

// ให้ render.js เรียกดูว่าตอนนี้ควรวาดป้ายชวนดวลเหนือหัวใครไหม
export function getDuelPrompt() {
  return nearbyTarget;
}

// ผูกกับคีย์ F ใน main.js — ท้าคนที่ยืนใกล้เราที่สุดตอนนี้
export function tryDuelNearby(world, ui) {
  if (!nearbyTarget || duel || npcDuel) return;
  if (nearbyTarget.isNpc) startNpcDuel(world, ui, nearbyTarget.ent);
  else sendChallenge(world, ui, nearbyTarget.uid, nearbyTarget.name);
}

function sendChallenge(world, ui, targetUid, targetName) {
  const fb = world.net && world.net.fb;
  if (!fb || !world.net.uid) {
    addSystemLine(ui, "⚔️ ท้าเป่ายิ้งฉุบได้เฉพาะตอนออนไลน์ผ่าน Firebase เท่านั้น");
    return;
  }
  if (duel) { addSystemLine(ui, "⚔️ คุณกำลังท้าใครอยู่แล้ว รอให้จบก่อนนะ"); return; }

  const newRef = fb.push(fb.ref(fb.db, "duels"));
  const data = {
    a: world.net.uid, aName: world.player.name, b: targetUid, bName: targetName,
    status: "pending", choiceA: null, choiceB: null,
    lastChoiceA: null, lastChoiceB: null, lastResult: null,
    winsA: 0, winsB: 0, round: 1, winner: null, ts: fb.serverTimestamp(),
  };
  duel = {
    id: newRef.key, ref: newRef, isA: true, myUid: world.net.uid,
    oppUid: targetUid, oppName: targetName, status: "pending", awarded: false, resolving: false,
  };
  fb.set(newRef, data).then(() => {
    if (duel && duel.id === newRef.key) duel.unsub = fb.onValue(newRef, s2 => handleDuelUpdate(world, ui, s2));
  }).catch(() => { addSystemLine(ui, "⚔️ ส่งคำท้าไม่สำเร็จ ลองใหม่อีกครั้ง"); duel = null; });
}

function handleDuelUpdate(world, ui, snap) {
  if (!duel || duel.id !== snap.key) return;
  const v = snap.val();
  if (!v) { finishDuelCleanup(world); return; } // ถูกลบ (เก็บกวาดหลังจบ)
  duel.status = v.status;

  switch (v.status) {
    case "pending":
      if (duel.isA) showWaitingForAccept();
      else showIncomingChallenge(v);
      break;
    case "declined":
      addSystemLine(ui, duel.isA ? `⚔️ ${duel.oppName} ปฏิเสธคำท้า` : "⚔️ คุณปฏิเสธคำท้าแล้ว");
      finishDuelCleanup(world);
      break;
    case "cancelled":
      addSystemLine(ui, "⚔️ คำท้าถูกยกเลิก");
      finishDuelCleanup(world);
      break;
    case "active":
      showDuelPlay(world, v);
      if (duel.isA && !duel.resolving && v.choiceA && v.choiceB) resolveRound(world, v);
      break;
    case "done":
      showDuelResult(world, ui, v);
      break;
  }
}

function resolveRound(world, v) {
  duel.resolving = true;
  const fb = world.net.fb;
  const result = v.choiceA === v.choiceB ? "draw" : (BEATS[v.choiceA] === v.choiceB ? "a" : "b");
  const patch = {
    choiceA: null, choiceB: null,
    lastChoiceA: v.choiceA, lastChoiceB: v.choiceB, lastResult: result,
  };
  if (result === "draw") {
    // เสมอ — เล่นรอบเดิมใหม่ ไม่นับแพ้ชนะ
  } else {
    patch.winsA = v.winsA + (result === "a" ? 1 : 0);
    patch.winsB = v.winsB + (result === "b" ? 1 : 0);
    patch[`history/${v.round}`] = { a: v.choiceA, b: v.choiceB, result }; // เก็บผลแต่ละตาไว้สรุปตอนจบ
    if (patch.winsA >= 2 || patch.winsB >= 2) {
      patch.status = "done";
      patch.winner = patch.winsA >= 2 ? v.a : v.b;
    } else {
      patch.round = v.round + 1;
    }
  }
  fb.update(duel.ref, patch).catch(() => {}).finally(() => { duel.resolving = false; });
}

function finishDuelCleanup(world) {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.add("hidden");
  if (!duel) return;
  // ระเบิด confetti ตอนโมดัลปิดพอดี (ตอนเปิดโมดัลบังฉากอยู่ เห็นตอนนี้ถึงจะสวย)
  if (duel.awarded && world.player) spawnBurst(world.player.x, world.player.y - 10, { count: 26, life: 0.9 });
  if (duel.unsub) duel.unsub();
  if (duel.isA) {
    const ref = duel.ref, fb = world.net.fb;
    setTimeout(() => { fb.set(ref, null).catch(() => {}); }, 4000); // เก็บกวาด doc หลังทุกฝ่ายเห็นผลแล้ว
  }
  duel = null;
}

// ---------- ดวลกับ NPC (C-level) — จำลองในเครื่องล้วน ๆ ไม่ผ่าน Firebase ----------
// ใช้ DOM overlay ชุดเดียวกับดวลผู้เล่นจริง แค่ขับด้วย state ในเครื่อง (npcDuel) แทน snapshot
// จาก Firebase — ทำให้หน้าตา/ฟีล เหมือนกันทุกอย่างแม้ฝั่งตรงข้ามไม่ใช่ผู้เล่นจริง

// สุ่มไม้ของ NPC โดยดูไม้ผู้เล่นก่อน (แทนที่จะสุ่มอิสระ 3 ทาง) เพื่อคุมอัตราชนะ/แพ้/เสมอได้
// ตรงตาม winRate ที่ตั้งไว้ — โอกาสเสมอคงที่ (NPC_DRAW_CHANCE) ส่วนที่เหลือแบ่งตาม winRate
function pickNpcMove(myChoice, winRate) {
  const r = Math.random();
  if (r < NPC_DRAW_CHANCE) return myChoice;
  if (r < NPC_DRAW_CHANCE + (1 - NPC_DRAW_CHANCE) * winRate) return BEATS[myChoice]; // ผู้เล่นชนะรอบนี้
  return COUNTERS[myChoice]; // NPC ชนะรอบนี้
}

function startNpcDuel(world, ui, ent) {
  npcDuel = {
    ent, name: ent.name, winRate: typeof ent.duelWinRate === "number" ? ent.duelWinRate : 0.5,
    myWins: 0, oppWins: 0, round: 1, awarded: false,
    lastResult: null, lastChoiceMine: null, lastChoiceOpp: null, history: {},
  };
  addSystemLine(ui, `⚔️ ${ent.name} รับคำท้าเป่ายิ้งฉุบทันที!`);
  showNpcDuelPlay(world);
}

function playNpcRound(world, ui, myChoice) {
  if (!npcDuel || npcDuel.myWins >= 2 || npcDuel.oppWins >= 2) return; // แมตช์จบไปแล้ว (เผื่อ event ค้าง)
  const oppChoice = pickNpcMove(myChoice, npcDuel.winRate);
  const result = myChoice === oppChoice ? "draw" : (BEATS[myChoice] === oppChoice ? "me" : "opp");
  npcDuel.lastChoiceMine = myChoice;
  npcDuel.lastChoiceOpp = oppChoice;
  npcDuel.lastResult = result;
  if (result === "draw") {
    showNpcDuelPlay(world);
    return;
  }
  if (result === "me") npcDuel.myWins++; else npcDuel.oppWins++;
  npcDuel.history[npcDuel.round] = { mine: myChoice, opp: oppChoice, result };
  if (npcDuel.myWins >= 2 || npcDuel.oppWins >= 2) { showNpcDuelResult(world, ui); return; }
  npcDuel.round++;
  showNpcDuelPlay(world);
}

function showNpcDuelPlay(world) {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-title").textContent = `⚔️ เป่ายิ้งฉุบ vs ${npcDuel.name}`;
  document.getElementById("duel-score").textContent =
    `คุณ ${npcDuel.myWins} - ${npcDuel.oppWins} ${npcDuel.name} · รอบที่ ${npcDuel.round}`;
  document.getElementById("duel-cancel-btn").textContent = "ยกเลิกดวล";
  document.getElementById("duel-history").classList.add("hidden");
  document.getElementById("duel-choices").classList.remove("hidden");
  document.getElementById("duel-status").textContent = "เลือกไม้ของคุณ!";

  const revealEl = document.getElementById("duel-reveal");
  if (npcDuel.lastResult) {
    const text = npcDuel.lastResult === "draw" ? "🤝 เสมอ! เล่นรอบนี้ใหม่"
      : npcDuel.lastResult === "me" ? "🎉 คุณชนะรอบนี้!" : "😢 คุณแพ้รอบนี้";
    revealEl.textContent =
      `${world.player.name} ${CHOICE_EMOJI[npcDuel.lastChoiceMine] || ""} vs ${npcDuel.name} ${CHOICE_EMOJI[npcDuel.lastChoiceOpp] || ""} — ${text}`;
  } else {
    revealEl.textContent = "";
  }
}

function showNpcDuelResult(world, ui) {
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-choices").classList.add("hidden");
  document.getElementById("duel-reveal").textContent = "";
  document.getElementById("duel-cancel-btn").textContent = "ปิด";
  document.getElementById("duel-score").textContent = `คุณ ${npcDuel.myWins} - ${npcDuel.oppWins} ${npcDuel.name}`;

  const iWon = npcDuel.myWins >= 2;
  document.getElementById("duel-status").textContent = iWon
    ? `🏆 คุณชนะ ${npcDuel.name}! +${WIN_POINTS} แต้ม`
    : `${npcDuel.name} ชนะไปครับ — สู้ใหม่รอบหน้านะ!`;

  if (iWon && !npcDuel.awarded) {
    npcDuel.awarded = true;
    awardPoints(world, WIN_POINTS);
    addSystemLine(ui, `⚔️ ชนะ ${npcDuel.name} เป่ายิ้งฉุบ 2 ใน 3! +${WIN_POINTS} แต้ม 🎉`);
    bumpStat(world, ui, "duelWins", 1);
    bumpMission(world, ui, "duel_win", 1);
  }
  npcCooldownUntil.set(npcDuel.ent.id, Date.now() + NPC_DUEL_COOLDOWN_MS); // จบแมตช์แล้ว (ชนะ/แพ้) ถึงเริ่มพัก กันฟาร์ม
  renderNpcDuelHistory(world);
  setTimeout(() => { if (npcDuel) finishNpcDuelCleanup(world); }, 3500);
}

function finishNpcDuelCleanup(world) {
  document.getElementById("duel-overlay").classList.add("hidden");
  if (!npcDuel) return;
  if (npcDuel.awarded && world) spawnBurst(world.player.x, world.player.y - 10, { count: 26, life: 0.9 });
  npcDuel = null;
}

function renderNpcDuelHistory(world) {
  const el = document.getElementById("duel-history");
  const hist = npcDuel.history;
  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) { el.classList.add("hidden"); return; }
  el.innerHTML = "";
  const title = document.createElement("div");
  title.className = "duel-history-title";
  title.textContent = "📋 สรุปผลแต่ละตา";
  el.appendChild(title);
  for (const rnd of rounds) {
    const h = hist[rnd];
    const iWonRound = h.result === "me";
    const row = document.createElement("div");
    row.className = "duel-history-row";
    const label = document.createElement("span");
    label.className = "rlabel";
    label.textContent = ROUND_LABEL[rnd - 1] || `ตาที่ ${rnd}`;
    const mid = document.createElement("span");
    mid.className = "rboth";
    mid.textContent = `${world.player.name} ${CHOICE_EMOJI[h.mine] || ""} vs ${CHOICE_EMOJI[h.opp] || ""} ${npcDuel.name}`;
    const res = document.createElement("span");
    res.className = "rresult " + (iWonRound ? "win" : "lose");
    res.textContent = iWonRound ? "ชนะ" : "แพ้";
    row.append(label, mid, res);
    el.appendChild(row);
  }
  el.classList.remove("hidden");
}

function showWaitingForAccept() {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-title").textContent = `⚔️ ท้า ${duel.oppName}`;
  document.getElementById("duel-score").textContent = "";
  document.getElementById("duel-status").textContent = `รอ ${duel.oppName} ตอบรับคำท้า...`;
  document.getElementById("duel-choices").classList.add("hidden");
  document.getElementById("duel-reveal").textContent = "";
  document.getElementById("duel-history").classList.add("hidden");
  document.getElementById("duel-cancel-btn").textContent = "ยกเลิกคำท้า";
}

function showIncomingChallenge(v) {
  document.getElementById("duel-incoming-text").textContent =
    `⚔️ ${v.aName} ท้าคุณเป่ายิ้งฉุบ! ชนะ 2 ใน 3 รับ ${WIN_POINTS} แต้ม`;
  document.getElementById("duel-incoming-overlay").classList.remove("hidden");
}

function showDuelPlay(world, v) {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-title").textContent = `⚔️ เป่ายิ้งฉุบ vs ${duel.oppName}`;
  const myWins = duel.isA ? v.winsA : v.winsB, oppWins = duel.isA ? v.winsB : v.winsA;
  document.getElementById("duel-score").textContent = `คุณ ${myWins} - ${oppWins} ${duel.oppName} · รอบที่ ${v.round}`;
  document.getElementById("duel-cancel-btn").textContent = "ยกเลิกดวล";
  document.getElementById("duel-history").classList.add("hidden");

  const myChoice = duel.isA ? v.choiceA : v.choiceB;
  const oppChoice = duel.isA ? v.choiceB : v.choiceA;
  const choicesEl = document.getElementById("duel-choices");
  const statusEl = document.getElementById("duel-status");
  if (myChoice) {
    choicesEl.classList.add("hidden");
    statusEl.textContent = oppChoice ? "กำลังเทียบไม้..." : "เลือกแล้ว! รอคู่ต่อสู้เลือก...";
  } else {
    choicesEl.classList.remove("hidden");
    statusEl.textContent = "เลือกไม้ของคุณ!";
  }

  // ป้ายสรุปผลตาล่าสุด บอกชื่อจริงว่าใครออกอะไร (ไม่ใช่แค่ "คุณ")
  const revealEl = document.getElementById("duel-reveal");
  if (v.lastResult) {
    const mine = duel.isA ? v.lastChoiceA : v.lastChoiceB;
    const theirs = duel.isA ? v.lastChoiceB : v.lastChoiceA;
    const text = v.lastResult === "draw" ? "🤝 เสมอ! เล่นรอบนี้ใหม่"
      : (v.lastResult === "a") === duel.isA ? "🎉 คุณชนะรอบนี้!" : "😢 คุณแพ้รอบนี้";
    revealEl.textContent =
      `${world.player.name} ${CHOICE_EMOJI[mine] || ""} vs ${duel.oppName} ${CHOICE_EMOJI[theirs] || ""} — ${text}`;
  } else {
    revealEl.textContent = "";
  }
}

function showDuelResult(world, ui, v) {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-choices").classList.add("hidden");
  document.getElementById("duel-reveal").textContent = "";
  document.getElementById("duel-cancel-btn").textContent = "ปิด";
  const myWins = duel.isA ? v.winsA : v.winsB, oppWins = duel.isA ? v.winsB : v.winsA;
  document.getElementById("duel-score").textContent = `คุณ ${myWins} - ${oppWins} ${duel.oppName}`;

  const iWon = v.winner === duel.myUid;
  document.getElementById("duel-status").textContent = iWon
    ? `🏆 คุณชนะ ${duel.oppName}! +${WIN_POINTS} แต้ม`
    : `${duel.oppName} ชนะไปครับ — สู้ใหม่รอบหน้านะ!`;

  if (iWon && !duel.awarded) {
    duel.awarded = true;
    awardPoints(world, WIN_POINTS);
    addSystemLine(ui, `⚔️ ชนะ ${duel.oppName} เป่ายิ้งฉุบ 2 ใน 3! +${WIN_POINTS} แต้ม 🎉`);
    bumpStat(world, ui, "duelWins", 1);
    bumpMission(world, ui, "duel_win", 1);
  }
  renderDuelHistory(world, v);
  setTimeout(() => { if (duel && duel.status === "done") finishDuelCleanup(world); }, 3500);
}

const ROUND_LABEL = ["ตาแรก", "ตาที่สอง", "ตาที่สาม"];

// สรุปภาพรวมทุกตาตอนจบดวล — ใครออกอะไร ใครชนะ/แพ้/เสมอในแต่ละตา
function renderDuelHistory(world, v) {
  const el = document.getElementById("duel-history");
  const hist = v.history || {};
  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) { el.classList.add("hidden"); return; }

  el.innerHTML = "";
  const title = document.createElement("div");
  title.className = "duel-history-title";
  title.textContent = "📋 สรุปผลแต่ละตา";
  el.appendChild(title);

  for (const rnd of rounds) {
    const h = hist[rnd];
    const myChoice = duel.isA ? h.a : h.b;
    const oppChoice = duel.isA ? h.b : h.a;
    const iWonRound = (h.result === "a") === duel.isA;
    const row = document.createElement("div");
    row.className = "duel-history-row";
    const label = document.createElement("span");
    label.className = "rlabel";
    label.textContent = ROUND_LABEL[rnd - 1] || `ตาที่ ${rnd}`;
    const mid = document.createElement("span");
    mid.className = "rboth";
    mid.textContent =
      `${world.player.name} ${CHOICE_EMOJI[myChoice] || ""} vs ${CHOICE_EMOJI[oppChoice] || ""} ${duel.oppName}`;
    const res = document.createElement("span");
    res.className = "rresult " + (iWonRound ? "win" : "lose");
    res.textContent = iWonRound ? "ชนะ" : "แพ้";
    row.append(label, mid, res);
    el.appendChild(row);
  }
  el.classList.remove("hidden");
}
