// ห้องส่วนตัว + ร้านค้าไอเทมตกแต่ง
// - แต้มซื้อของ = แต้มสะสมจาก quest (leaderboard) ลบด้วยยอดที่ใช้ไป (spent)
//   ซื้อของหักเฉพาะ "ยอดคงเหลือ" — คะแนนบน leaderboard ไม่ลดลง
// - ห้องเก็บใน Firebase ที่ homes/<uid> = { name, spent, items:[{id, x, y}] } (x,y = null คือยังไม่วาง)
// - เปิดดูห้องคนอื่นได้จากการคลิกชื่อใน online list (read-only), ห้องตัวเองจัดวางของได้

import { addSystemLine } from "./ui.js";

// ลำดับต้องตรงกับ sprite ใน assets/items.png (สร้างจาก assets/build_items.py)
export const ITEMS = [
  { id: "coffee",   name: "แก้วกาแฟ",       price: 10 },
  { id: "plant",    name: "ต้นไม้เล็ก",      price: 15 },
  { id: "books",    name: "กองหนังสือ",      price: 20 },
  { id: "lamp",     name: "โคมไฟตั้งโต๊ะ",   price: 30 },
  { id: "chair",    name: "เก้าอี้ทำงาน",    price: 40 },
  { id: "rug",      name: "พรมกลม",          price: 45 },
  { id: "picture",  name: "รูปติดผนัง",      price: 50 },
  { id: "desk",     name: "โต๊ะทำงาน",       price: 60 },
  { id: "teddy",    name: "ตุ๊กตาหมี",       price: 75 },
  { id: "shelf",    name: "ชั้นหนังสือ",     price: 85 },
  { id: "guitar",   name: "กีตาร์",          price: 95 },
  { id: "sofa",     name: "โซฟาเล็ก",        price: 110 },
  { id: "fridge",   name: "ตู้เย็นมินิ",     price: 125 },
  { id: "table",    name: "โต๊ะกาแฟ",        price: 140 },
  { id: "console",  name: "เครื่องเกมเรโทร", price: 160 },
  { id: "aquarium", name: "ตู้ปลา",          price: 180 },
  { id: "catbed",   name: "เตียงแมว",        price: 200 },
  { id: "monitors", name: "จอคอมคู่",        price: 230 },
  { id: "piano",    name: "เปียโนไฟฟ้า",     price: 260 },
  { id: "robot",    name: "หุ่นยนต์ Data-X", price: 300 },
];
const SPRITE = Object.fromEntries(ITEMS.map((it, i) => [it.id, i]));
const CELL = 24, SHEET_COLS = 5;
const ROOM_COLS = 8, ROOM_ROWS = 6;

export function initDecor(world, ui) {
  const dec = {
    img: null,
    myHome: { name: world.player.name, spent: 0, items: [] },
    selected: null,       // index ใน myHome.items ที่เลือกจาก inventory
    viewing: null,        // { uid, home, mine }
    warned: false,
  };
  world.decor = dec;

  const img = new Image();
  img.onload = () => { dec.img = img; };
  img.src = "assets/items.png";

  // โหลดห้องตัวเองจาก Firebase (ถ้ามี)
  const fb = world.net && world.net.fb;
  if (fb && world.net.uid) {
    fb.get(fb.ref(fb.db, `homes/${world.net.uid}`)).then(snap => {
      const v = snap.val();
      if (v) {
        dec.myHome = { name: world.player.name, spent: v.spent || 0, items: v.items || [] };
      }
    }).catch(() => {});
  }

  document.getElementById("shop-btn").addEventListener("click", () => toggleShop(world, true));
  document.getElementById("home-btn").addEventListener("click", () => openRoom(world, "me"));
  document.getElementById("shop-close").addEventListener("click", () => toggleShop(world, false));
  document.getElementById("room-close").addEventListener("click", () => toggleRoom(world, false));
  for (const oid of ["shop-overlay", "room-overlay"]) {
    const el = document.getElementById(oid);
    el.addEventListener("click", e => { if (e.target === el) el.classList.add("hidden"); });
  }
  document.getElementById("room-canvas").addEventListener("click", e => onRoomClick(world, e));

  // คลิกชื่อผู้เล่นใน online list เพื่อเปิดดูห้อง
  ui.onlineList.addEventListener("click", e => {
    const row = e.target.closest("[data-uid]");
    if (row && row.dataset.uid) openRoom(world, row.dataset.uid);
  });
}

const earned = world => (world.quests ? world.quests.points : 0);
export const balance = world => Math.max(0, earned(world) - (world.decor.myHome.spent || 0));

function saveHome(world) {
  const dec = world.decor;
  const fb = world.net && world.net.fb;
  if (!fb || !world.net.uid) {
    if (!dec.warned) {
      dec.warned = true;
      addSystemLine(worldUi(world), "⚠️ ออฟไลน์อยู่ — ของที่ซื้อ/จัดห้องจะไม่ถูกบันทึกถาวร");
    }
    return;
  }
  dec.myHome.name = world.player.name;
  fb.set(fb.ref(fb.db, `homes/${world.net.uid}`), dec.myHome).catch(err => {
    if (!dec.warned) {
      dec.warned = true;
      addSystemLine(worldUi(world), "⚠️ บันทึกห้องไม่สำเร็จ (" + (err && err.code || err) + ") — ต้องอัปเดต Firebase rules ก่อน");
    }
  });
}

// ui object ถูกส่งเข้า initDecor แล้วเก็บ closure ไม่ได้ในฟังก์ชันหลังบ้าน — ดึงจาก DOM ตรง ๆ
function worldUi() {
  return { chatLog: document.getElementById("chat-log") };
}

// ---------- ร้านค้า ----------

export function toggleShop(world, open) {
  const overlay = document.getElementById("shop-overlay");
  overlay.classList.toggle("hidden", !open);
  if (open) renderShop(world);
}

function renderShop(world) {
  const dec = world.decor;
  document.getElementById("shop-balance").textContent =
    `คงเหลือ ${balance(world)} แต้ม · สะสมทั้งหมด ${earned(world)} (leaderboard ไม่ลดตอนซื้อ)`;
  const list = document.getElementById("shop-list");
  list.textContent = "";
  ITEMS.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "shop-card";
    card.appendChild(iconCanvas(dec, idx, 2));
    const nm = document.createElement("div");
    nm.className = "shop-name";
    nm.textContent = it.name;
    const owned = dec.myHome.items.filter(x => x.id === it.id).length;
    if (owned) nm.textContent += ` (มี ${owned})`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-buy";
    btn.textContent = `ซื้อ 🏆${it.price}`;
    btn.disabled = balance(world) < it.price;
    btn.addEventListener("click", () => buy(world, it));
    card.append(nm, btn);
    list.appendChild(card);
  });
}

function buy(world, it) {
  const dec = world.decor;
  if (balance(world) < it.price) return;
  dec.myHome.spent = (dec.myHome.spent || 0) + it.price;
  dec.myHome.items.push({ id: it.id, x: null, y: null });
  saveHome(world);
  renderShop(world);
  addSystemLine(worldUi(world), `🛍️ ซื้อ ${it.name} แล้ว! เปิด 🏠 เพื่อจัดวางในห้อง (คงเหลือ ${balance(world)} แต้ม)`);
}

// ---------- ห้องส่วนตัว ----------

export async function openRoom(world, uid) {
  const dec = world.decor;
  const myUid = (world.net && world.net.uid) || "me";
  const mine = uid === "me" || uid === myUid;
  if (mine) {
    dec.viewing = { uid: myUid, home: dec.myHome, mine: true };
  } else {
    const fb = world.net && world.net.fb;
    let home = null;
    if (fb) {
      try { home = (await fb.get(fb.ref(fb.db, `homes/${uid}`))).val(); } catch {}
    }
    dec.viewing = { uid, home, mine: false };
  }
  dec.selected = null;
  toggleRoom(world, true);
}

export function toggleRoom(world, open) {
  document.getElementById("room-overlay").classList.toggle("hidden", !open);
  if (open) renderRoom(world);
}

function renderRoom(world) {
  const dec = world.decor;
  const v = dec.viewing;
  if (!v) return;
  const home = v.home;
  document.getElementById("room-title").textContent =
    v.mine ? `🏠 ห้องของคุณ (${world.player.name})` : `🏠 ห้องของ ${home && home.name || "?"}`;
  document.getElementById("room-balance").textContent =
    v.mine ? `คงเหลือ ${balance(world)} แต้ม · เลือกของด้านล่างแล้วคลิกตำแหน่งในห้อง (คลิกของในห้องเพื่อเก็บ)` : "";
  drawRoom(world);
  renderInventory(world);
}

function drawRoom(world) {
  const dec = world.decor;
  const canvas = document.getElementById("room-canvas");
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  // ผนัง + พื้น สไตล์เดียวกับแผนที่
  c.fillStyle = "#31566d";
  c.fillRect(0, 0, canvas.width, CELL * 2);
  c.fillStyle = "#47788a";
  c.fillRect(0, CELL * 2 - 4, canvas.width, 4);
  for (let y = 2; y < ROOM_ROWS; y++) {
    for (let x = 0; x < ROOM_COLS; x++) {
      c.fillStyle = (x + y) % 2 ? "#f0e8d8" : "#e6dcc8";
      c.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
  const home = dec.viewing && dec.viewing.home;
  if (!home || !home.items) return;
  const placed = home.items
    .map((it, idx) => ({ ...it, idx }))
    .filter(it => it.x != null && it.y != null)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const it of placed) {
    const s = SPRITE[it.id];
    if (s == null || !dec.img) continue;
    c.drawImage(dec.img, (s % SHEET_COLS) * CELL, Math.floor(s / SHEET_COLS) * CELL, CELL, CELL,
      it.x * CELL, it.y * CELL, CELL, CELL);
  }
}

function renderInventory(world) {
  const dec = world.decor;
  const inv = document.getElementById("room-inventory");
  inv.textContent = "";
  if (!dec.viewing || !dec.viewing.mine) { inv.classList.add("hidden"); return; }
  inv.classList.remove("hidden");
  const unplaced = dec.myHome.items
    .map((it, idx) => ({ ...it, idx }))
    .filter(it => it.x == null || it.y == null);
  if (unplaced.length === 0) {
    const note = document.createElement("span");
    note.className = "inv-note";
    note.textContent = dec.myHome.items.length ? "วางครบทุกชิ้นแล้ว ✨" : "ยังไม่มีไอเทม — ไปช้อปที่ 🛍️ ก่อน";
    inv.appendChild(note);
    return;
  }
  for (const it of unplaced) {
    const cell = iconCanvas(dec, SPRITE[it.id], 2);
    cell.classList.add("inv-item");
    if (dec.selected === it.idx) cell.classList.add("selected");
    cell.title = (ITEMS[SPRITE[it.id]] || {}).name || it.id;
    cell.addEventListener("click", () => {
      dec.selected = dec.selected === it.idx ? null : it.idx;
      renderInventory(world);
    });
    inv.appendChild(cell);
  }
}

function onRoomClick(world, e) {
  const dec = world.decor;
  if (!dec.viewing || !dec.viewing.mine) return;
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const gx = Math.floor((e.clientX - rect.left) / rect.width * ROOM_COLS);
  const gy = Math.floor((e.clientY - rect.top) / rect.height * ROOM_ROWS);
  if (gx < 0 || gy < 0 || gx >= ROOM_COLS || gy >= ROOM_ROWS) return;

  if (dec.selected != null) {
    // วางชิ้นที่เลือก (ถ้าช่องนั้นมีของอยู่ ให้สลับชิ้นเดิมกลับเข้ากระเป๋า)
    const occupying = dec.myHome.items.find(it => it.x === gx && it.y === gy);
    if (occupying) { occupying.x = null; occupying.y = null; }
    dec.myHome.items[dec.selected].x = gx;
    dec.myHome.items[dec.selected].y = gy;
    dec.selected = null;
    saveHome(world);
  } else {
    // คลิกของที่วางอยู่ = เก็บกลับเข้ากระเป๋า
    const hit = dec.myHome.items.find(it => it.x === gx && it.y === gy);
    if (hit) { hit.x = null; hit.y = null; saveHome(world); }
  }
  drawRoom(world);
  renderInventory(world);
}

function iconCanvas(dec, spriteIdx, scale) {
  const c = document.createElement("canvas");
  c.width = CELL; c.height = CELL;
  c.style.width = CELL * scale + "px";
  c.style.height = CELL * scale + "px";
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const draw = () => ctx.drawImage(dec.img, (spriteIdx % SHEET_COLS) * CELL,
    Math.floor(spriteIdx / SHEET_COLS) * CELL, CELL, CELL, 0, 0, CELL, CELL);
  if (dec.img) draw();
  else setTimeout(draw, 400);
  return c;
}
