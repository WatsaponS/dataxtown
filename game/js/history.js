// ประวัติแชตรวมของออฟฟิศ — ทุกข้อความถูก append ไว้ที่ rooms/main/chat ใน Firebase อยู่แล้ว
// หน้านี้เปิดดูย้อนหลังได้ทุกคน (ล่าสุด 200 ข้อความ) — bubble สดยังใช้กติกา proximity ตามเดิม

const HISTORY_LIMIT = 200;

export function initHistory(world, ui) {
  const overlay = document.getElementById("history-overlay");
  document.getElementById("history-btn").addEventListener("click", () => toggleHistory(world, true));
  document.getElementById("history-close").addEventListener("click", () => toggleHistory(world, false));
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleHistory(world, false); });
}

export function toggleHistory(world, open) {
  const overlay = document.getElementById("history-overlay");
  overlay.classList.toggle("hidden", !open);
  if (open) renderHistory(world);
}

async function renderHistory(world) {
  const list = document.getElementById("history-list");
  const fb = world.net && world.net.fb;
  if (!fb) {
    list.textContent = "ประวัติแชตดูได้เมื่อออนไลน์ผ่าน Firebase เท่านั้น (ตอนนี้เล่นแบบออฟไลน์)";
    return;
  }
  list.textContent = "กำลังโหลด…";
  try {
    // query แบบ orderByChild ต้องมี .indexOn ใน rules — ถ้ายังไม่มี ให้โหลดทั้งก้อนแล้ว sort เอง
    let messages;
    try {
      const snap = await fb.get(fb.query(
        fb.ref(fb.db, "rooms/main/chat"),
        fb.orderByChild("ts"),
        fb.limitToLast(HISTORY_LIMIT),
      ));
      messages = [];
      snap.forEach(child => { messages.push(child.val()); });
    } catch {
      const snap = await fb.get(fb.ref(fb.db, "rooms/main/chat"));
      messages = Object.values(snap.val() || {});
      messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      messages = messages.slice(-HISTORY_LIMIT);
    }
    list.textContent = "";
    let count = 0;
    for (const m of messages) {
      if (!m || !m.text) continue;
      const row = document.createElement("div");
      row.className = "history-row" + (world.net.uid && m.uid === world.net.uid ? " me" : "");
      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = m.ts
        ? new Date(m.ts).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "";
      const body = document.createElement("span");
      const name = document.createElement("b");
      name.textContent = m.name || "?";
      body.append(name, document.createTextNode(": " + m.text));
      row.append(time, body);
      list.appendChild(row);
      count++;
    }
    if (count === 0) list.textContent = "ยังไม่มีข้อความ — ทักทายกันหน่อย! 💬";
    else list.scrollTop = list.scrollHeight;
  } catch (err) {
    list.textContent = "โหลดประวัติไม่สำเร็จ: " + (err && err.message || err);
  }
}
