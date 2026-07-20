// ระบบ Quest: จุด ❓ สุ่มตำแหน่งบนแผนที่ → เดินเข้าใกล้กด E (หรือแตะ) → quiz Databricks
// สุ่ม 3 ข้อจากคลัง 100 ข้อ ตอบถูกข้อละ 10 คะแนน → คะแนนขึ้น leaderboard (Firebase)

import { QUIZ } from "./quiz_data.js";
import { tileBlocked } from "./world.js";
import { addSystemLine } from "./ui.js";
import { spawnBurst } from "./fx.js";

const SPOT_COUNT = 3;
const INTERACT_RADIUS = 44;   // px — ระยะกดเริ่ม quiz
const POINTS_PER_CORRECT = 10;
const QUESTIONS_PER_QUEST = 3;

export function initQuests(world, ui) {
  const q = {
    spots: [],
    session: null,      // { questions:[...], idx, correct, spot }
    points: 0,
    board: {},          // uid -> { name, points }
    nearSpot: null,
    el: {
      hint: document.getElementById("quest-hint"),
      badge: document.getElementById("score-badge"),
      quiz: document.getElementById("quiz-overlay"),
      progress: document.getElementById("quiz-progress"),
      question: document.getElementById("quiz-question"),
      choices: document.getElementById("quiz-choices"),
      feedback: document.getElementById("quiz-feedback"),
      next: document.getElementById("quiz-next"),
      board: document.getElementById("board-overlay"),
      boardList: document.getElementById("board-list"),
    },
  };
  world.quests = q;

  for (let i = 0; i < SPOT_COUNT; i++) q.spots.push(randomSpot(world, q));

  // ---------- Firebase: คะแนนสะสม + leaderboard ----------
  const fb = world.net && world.net.fb;
  if (fb) {
    fb.onValue(fb.ref(fb.db, "leaderboard"), snap => {
      q.board = snap.val() || {};
      const mine = q.board[world.net.uid];
      if (mine && mine.points > q.points) q.points = mine.points; // resume คะแนนเดิม
      updateBadge(world);
      if (!q.el.board.classList.contains("hidden")) renderBoard(world);
    });
  }
  updateBadge(world);

  // ---------- DOM events ----------
  q.el.hint.addEventListener("click", () => tryStartQuiz(world, ui));
  q.el.badge.addEventListener("click", () => toggleBoard(world, true));
  q.el.next.addEventListener("click", () => advanceQuiz(world, ui));
  document.getElementById("board-close").addEventListener("click", () => toggleBoard(world, false));
  addSystemLine(ui, "❓ มี Quiz Databricks ซ่อนอยู่ 3 จุดในออฟฟิศ — เดินไปหาแล้วกด E เพื่อสะสมคะแนน!");
}

function randomSpot(world, q) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const tx = Math.floor(Math.random() * world.map.width);
    const ty = Math.floor(Math.random() * world.map.height);
    if (tileBlocked(world, tx, ty)) continue;
    const x = (tx + 0.5) * world.tile, y = (ty + 0.5) * world.tile;
    if (world.player && Math.hypot(x - world.player.x, y - world.player.y) < world.tile * 3) continue;
    if (q.spots.some(s => Math.hypot(x - s.x, y - s.y) < world.tile * 5)) continue;
    return { x, y };
  }
  return { x: world.pxW / 2, y: world.pxH / 2 };
}

export function updateQuests(world) {
  const q = world.quests;
  if (!q) return;
  const p = world.player;
  q.nearSpot = q.spots.find(s => Math.hypot(s.x - p.x, s.y - p.y) <= INTERACT_RADIUS) || null;
  q.el.hint.classList.toggle("hidden", !q.nearSpot || !!q.session);
}

export function isQuizOpen(world) {
  return !!(world.quests && world.quests.session);
}

// ---------- Quiz flow ----------

export function tryStartQuiz(world, ui) {
  const q = world.quests;
  if (!q || !q.nearSpot || q.session) return;
  const picked = [];
  while (picked.length < QUESTIONS_PER_QUEST) {
    const i = Math.floor(Math.random() * QUIZ.length);
    if (!picked.includes(i)) picked.push(i);
  }
  q.session = { questions: picked.map(i => QUIZ[i]), idx: 0, correct: 0, spot: q.nearSpot, answered: false };
  q.el.quiz.classList.remove("hidden");
  showQuestion(world, ui);
}

function showQuestion(world, ui) {
  const q = world.quests, s = q.session;
  const item = s.questions[s.idx];
  s.answered = false;
  // สลับตำแหน่งตัวเลือกทุกครั้ง กันการจำ/เดา pattern ของเฉลย
  s.order = [0, 1, 2, 3].map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  q.el.progress.textContent = `Quiz Databricks — ข้อ ${s.idx + 1}/${s.questions.length}`;
  q.el.question.textContent = item.q;
  q.el.feedback.textContent = "";
  q.el.next.classList.add("hidden");
  q.el.choices.textContent = "";
  ["A", "B", "C", "D"].forEach((label, pos) => {
    const orig = s.order[pos];
    const btn = document.createElement("button");
    btn.className = "quiz-choice";
    btn.textContent = `${label}. ${item.c[orig]}`;
    btn.addEventListener("click", () => answer(world, ui, orig, btn));
    q.el.choices.appendChild(btn);
  });
}

function answer(world, ui, chosenOrig, btn) {
  const q = world.quests, s = q.session;
  if (s.answered) return;
  s.answered = true;
  const item = s.questions[s.idx];
  const buttons = [...q.el.choices.children];
  const correctPos = s.order.indexOf(item.a);
  buttons.forEach(b => b.disabled = true);
  buttons[correctPos].classList.add("correct");
  if (chosenOrig === item.a) {
    s.correct++;
    q.el.feedback.textContent = `✅ ถูกต้อง! +${POINTS_PER_CORRECT} คะแนน`;
  } else {
    btn.classList.add("wrong");
    q.el.feedback.textContent = `❌ ยังไม่ใช่ — คำตอบคือ ${"ABCD"[correctPos]}`;
  }
  q.el.next.textContent = s.idx + 1 < s.questions.length ? "ข้อต่อไป →" : "ดูสรุปคะแนน 🏁";
  q.el.next.classList.remove("hidden");
}

function advanceQuiz(world, ui) {
  const q = world.quests, s = q.session;
  if (!s.answered) return;
  if (s.idx + 1 < s.questions.length) {
    s.idx++;
    showQuestion(world, ui);
  } else {
    finishQuiz(world, ui);
  }
}

// ให้แต้มจากระบบอื่น (เช่น tutorial) — บันทึกขึ้น leaderboard ทันที
export function awardPoints(world, n) {
  const q = world.quests;
  if (!q) return;
  q.points += n;
  savePoints(world);
  updateBadge(world);
}

function finishQuiz(world, ui) {
  const q = world.quests, s = q.session;
  const gained = s.correct * POINTS_PER_CORRECT;
  q.points += gained;
  savePoints(world);
  updateBadge(world);
  addSystemLine(ui, `🏁 จบ quiz: ตอบถูก ${s.correct}/${s.questions.length} ได้ +${gained} คะแนน (รวม ${q.points})`);
  if (world.onQuizDone) world.onQuizDone();
  // จุดเดิมหายไป เกิดจุดใหม่ที่อื่น
  const idx = q.spots.indexOf(s.spot);
  if (idx >= 0) q.spots[idx] = randomSpot(world, q);
  q.session = null;
  q.el.quiz.classList.add("hidden");
  // ระเบิด confetti ตอนโมดัลปิดพอดี (ตอนทำ quiz อยู่บังฉากอยู่ เห็นตอนนี้ถึงจะสวย) — ยิ่งถูกเยอะยิ่งระเบิดใหญ่
  if (s.correct > 0 && world.player) {
    spawnBurst(world.player.x, world.player.y - 10, { count: 8 + s.correct * 6, life: 0.8 });
  }
}

function savePoints(world) {
  const fb = world.net && world.net.fb;
  if (!fb || !world.net.uid) return;
  fb.set(fb.ref(fb.db, `leaderboard/${world.net.uid}`), {
    name: world.player.name,
    points: world.quests.points,
    ts: Date.now(),
  }).catch(() => {});
}

function updateBadge(world) {
  world.quests.el.badge.textContent = `🏆 ${world.quests.points}`;
}

// ---------- Leaderboard ----------

export function toggleBoard(world, open) {
  const q = world.quests;
  if (!q) return;
  q.el.board.classList.toggle("hidden", !open);
  if (open) {
    renderBoard(world);
    if (world.onBoardOpen) world.onBoardOpen();
  }
}

function renderBoard(world) {
  const q = world.quests;
  const list = q.el.boardList;
  list.textContent = "";
  const rows = Object.entries(q.board)
    .map(([uid, v]) => ({ uid, name: v.name || "?", points: v.points || 0 }));
  if (!rows.some(r => r.uid === (world.net && world.net.uid))) {
    rows.push({ uid: world.net && world.net.uid, name: world.player.name + " (คุณ)", points: q.points });
  }
  rows.sort((a, b) => b.points - a.points);
  if (rows.length === 0) {
    list.textContent = "ยังไม่มีคะแนน — ไปตามหา ❓ ในออฟฟิศเลย!";
    return;
  }
  rows.slice(0, 20).forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "board-row" + (world.net && r.uid === world.net.uid ? " me" : "");
    if (r.uid) { row.dataset.uid = r.uid; row.dataset.name = r.name; } // คลิกเพื่อส่องห้อง (decor.js ผูก handler)
    const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${medal} ${r.name}`;
    const ptSpan = document.createElement("span");
    ptSpan.textContent = `${r.points} คะแนน`;
    row.append(nameSpan, ptSpan);
    list.appendChild(row);
  });
}

// ---------- วาด marker (screen space — เรียกจาก render.js) ----------

export function drawQuestMarkers(ctx, world, cam) {
  const q = world.quests;
  if (!q) return;
  for (const s of q.spots) {
    const sx = (s.x - cam.x) * cam.zoom;
    const sy = (s.y - cam.y) * cam.zoom + Math.sin(world.time * 3 + s.x) * 3;
    if (sx < -30 || sy < -30 || sx > ctx.canvas.width + 30 || sy > ctx.canvas.height + 30) continue;
    ctx.beginPath();
    ctx.arc(sx, sy - 10, 13, 0, Math.PI * 2);
    ctx.fillStyle = s === q.nearSpot ? "rgba(231,185,79,0.95)" : "rgba(231,185,79,0.75)";
    ctx.fill();
    ctx.strokeStyle = "#171b2c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#171b2c";
    ctx.font = "700 15px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", sx, sy - 9);
  }
}
