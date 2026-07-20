// เป่ายิ้งฉุบท้าดวลระหว่างผู้เล่น — ชนะ 2 ใน 3 ได้ 20 แต้ม (Firebase เท่านั้น เหมือน quest/room)
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

const WIN_POINTS = 20;
const DUEL_RANGE = 60; // px — ต้องเดินเข้าไปใกล้จริง ๆ ถึงจะขึ้นป้ายชวนดวล
const BEATS = { rock: "scissors", scissors: "paper", paper: "rock" };
const CHOICE_EMOJI = { rock: "✊", paper: "✋", scissors: "✂️" };

let duel = null; // ดวลที่กำลังดำเนินอยู่ (มีได้ทีละ 1 ดวลต่อผู้เล่น)
let nearbyTarget = null; // ผู้เล่นคนที่อยู่ใกล้พอจะกด F ท้าได้ตอนนี้ (คำนวณทุกเฟรม)

export function initDuel(world, ui) {
  window.__duelState = () => duel; // hooks สำหรับ automated test (cdp_shot --eval)
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
    if (!duel) { document.getElementById("duel-overlay").classList.add("hidden"); return; }
    if (["done", "declined", "cancelled"].includes(duel.status)) finishDuelCleanup(world);
    else world.net.fb.update(duel.ref, { status: "cancelled" }).catch(() => {});
  });
  document.querySelectorAll(".duel-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!duel || duel.status !== "active") return;
      const field = duel.isA ? "choiceA" : "choiceB";
      world.net.fb.update(duel.ref, { [field]: btn.dataset.choice }).catch(() => {});
    });
  });

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

// เรียกทุกเฟรมจาก game loop — หาผู้เล่นจริงที่ใกล้เราที่สุดในระยะ DUEL_RANGE
export function updateDuelProximity(world) {
  if (duel || !world.player) { nearbyTarget = null; return; }
  let best = null, bestDist = DUEL_RANGE;
  for (const ent of world.entities) {
    if (ent.kind !== "remote") continue;
    const d = Math.hypot(ent.x - world.player.x, ent.y - world.player.y);
    if (d <= bestDist) { bestDist = d; best = ent; }
  }
  nearbyTarget = best ? { ent: best, uid: best.id.slice(7), name: best.name } : null;
}

// ให้ render.js เรียกดูว่าตอนนี้ควรวาดป้ายชวนดวลเหนือหัวใครไหม
export function getDuelPrompt() {
  return nearbyTarget;
}

// ผูกกับคีย์ F ใน main.js — ท้าคนที่ยืนใกล้เราที่สุดตอนนี้
export function tryDuelNearby(world, ui) {
  if (nearbyTarget && !duel) sendChallenge(world, ui, nearbyTarget.uid, nearbyTarget.name);
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
      showDuelPlay(v);
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
  if (duel.unsub) duel.unsub();
  if (duel.isA) {
    const ref = duel.ref, fb = world.net.fb;
    setTimeout(() => { fb.set(ref, null).catch(() => {}); }, 4000); // เก็บกวาด doc หลังทุกฝ่ายเห็นผลแล้ว
  }
  duel = null;
}

function showWaitingForAccept() {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-title").textContent = `⚔️ ท้า ${duel.oppName}`;
  document.getElementById("duel-score").textContent = "";
  document.getElementById("duel-status").textContent = `รอ ${duel.oppName} ตอบรับคำท้า...`;
  document.getElementById("duel-choices").classList.add("hidden");
  document.getElementById("duel-reveal").textContent = "";
  document.getElementById("duel-cancel-btn").textContent = "ยกเลิกคำท้า";
}

function showIncomingChallenge(v) {
  document.getElementById("duel-incoming-text").textContent =
    `⚔️ ${v.aName} ท้าคุณเป่ายิ้งฉุบ! ชนะ 2 ใน 3 รับ ${WIN_POINTS} แต้ม`;
  document.getElementById("duel-incoming-overlay").classList.remove("hidden");
}

function showDuelPlay(v) {
  document.getElementById("duel-incoming-overlay").classList.add("hidden");
  document.getElementById("duel-overlay").classList.remove("hidden");
  document.getElementById("duel-title").textContent = `⚔️ เป่ายิ้งฉุบ vs ${duel.oppName}`;
  const myWins = duel.isA ? v.winsA : v.winsB, oppWins = duel.isA ? v.winsB : v.winsA;
  document.getElementById("duel-score").textContent = `คุณ ${myWins} - ${oppWins} ${duel.oppName} · รอบที่ ${v.round}`;
  document.getElementById("duel-cancel-btn").textContent = "ยกเลิกดวล";

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

  const revealEl = document.getElementById("duel-reveal");
  if (v.lastResult) {
    const mine = duel.isA ? v.lastChoiceA : v.lastChoiceB;
    const theirs = duel.isA ? v.lastChoiceB : v.lastChoiceA;
    const text = v.lastResult === "draw" ? "🤝 เสมอ! เล่นรอบนี้ใหม่"
      : (v.lastResult === "a") === duel.isA ? "🎉 คุณชนะรอบนี้!" : "😢 คุณแพ้รอบนี้";
    revealEl.textContent = `${CHOICE_EMOJI[mine] || ""} vs ${CHOICE_EMOJI[theirs] || ""} — ${text}`;
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
  }
  setTimeout(() => { if (duel && duel.status === "done") finishDuelCleanup(world); }, 3500);
}
