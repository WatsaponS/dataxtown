// ห้องส่วนตัว + ร้านค้าไอเทมตกแต่ง
// - แต้มซื้อของ = แต้มสะสมจาก quest (leaderboard) ลบด้วยยอดที่ใช้ไป (spent)
//   ซื้อของหักเฉพาะ "ยอดคงเหลือ" — คะแนนบน leaderboard ไม่ลดลง
// - ห้องเก็บใน Firebase ที่ homes/<uid> = { name, spent, items:[{id, x, y}], greeting,
//   pet, petName } (x,y = null คือยังไม่วาง)
// - เปิดดูห้องคนอื่นได้จากการคลิกชื่อใน online list (read-only), ห้องตัวเองจัดวางของได้
// - สัตว์เลี้ยงของเจ้าของห้องเดินเล่น+โผล่ทริกในห้องด้วย (ดู updateRoomPet/drawRoomPet)

import { addSystemLine } from "./ui.js";
import { makeCustomSheet } from "./avatar.js";
import { spriteFrame } from "./entities.js";
import { CONFIG } from "./data.js";
import { LOGIN_ITEMS, LOGIN_SHEET_COLS, loginItemName } from "./login_data.js";
import { GACHA_SHEET_COLS, gachaItemName } from "./gacha_data.js";
import { SEASON_SHEET_COLS, seasonItemName } from "./season_data.js";
import { EVENT_ID, EVENT_ITEMS, EVENT_NAME, EVENT_END, EVENT_SHEET_COLS, isEventActive, eventItemName } from "./events_data.js";
import { petImageEl, setPet } from "./pets.js";
import { PET_FRAME, PET_SRC_FRAME, petFrameRow } from "./pets_data.js";

const ROOM_TRICKS = ["💤", "🎾", "🦴", "💫", "✨", "😽"];

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
// ROOM_ROWS ขยายจาก 6 เป็น 8 (พื้น 4 แถว -> 6 แถว) รองรับสไปรท์ตัวละครใหม่ที่สูงขึ้น (50px จาก 24px
// เดิม) ไม่งั้นหัวโผล่ทะลุผนังด้านบน — ตำแหน่งไอเทมเดิมที่เคยวางไว้ยังใช้ grid เดิมได้ปกติ (เพิ่มพื้นที่
// ด้านล่างเข้ามาเฉย ๆ ไม่กระทบตำแหน่งเดิม)
const ROOM_COLS = 8, ROOM_ROWS = 8;
const S = 2; // canvas ห้องวาดที่ 2x ให้ป้ายชื่อ/ตัวอักษรคมชัด

// ขอบเขตเดินของบอทเจ้าของห้อง — เผื่อที่ด้านบนให้พอกับความสูงสไปรท์ใหม่ (frameH) ไม่ให้หัวชนผนัง
const ROOM_FLOOR_TOP = CELL * 2, ROOM_FLOOR_BOTTOM = ROOM_ROWS * CELL;
const ROOM_BOT_Y_MIN = ROOM_FLOOR_TOP + CONFIG.frameH - 1 + 4;
const ROOM_BOT_Y_MAX = ROOM_FLOOR_BOTTOM - 6;
const ROOM_PET_Y_MIN = ROOM_FLOOR_TOP + 14, ROOM_PET_Y_MAX = ROOM_FLOOR_BOTTOM - 8;
const DEFAULT_GREETING = name => `สวัสดี! ยินดีต้อนรับสู่ห้องของ ${name} 👋`;

export function initDecor(world, ui) {
  const dec = {
    img: null,
    myHome: {
      name: world.player.name, spent: 0, items: [], greeting: "",
      pet: world.player.petId || null, petName: world.player.petName || null, unlockedPets: [],
      outfit: world.player.outfit || null,
      avatar: { variant: world.player.variant, hair: world.player.hair || null, shirt: world.player.shirt || null },
    },
    selected: null,       // index ใน myHome.items ที่เลือกจาก inventory
    viewing: null,        // { uid, home, mine }
    warned: false,
    anim: null,           // สถานะบอทเจ้าของห้องที่เดินไปมา
    world,
  };
  world.decor = dec;
  window.__openRoom = uid => openRoom(world, uid); // hook สำหรับ automated test

  const img = new Image();
  img.onload = () => { dec.img = img; };
  img.src = "assets/items.png";
  const loginImg = new Image();
  loginImg.onload = () => { dec.loginImg = loginImg; };
  loginImg.src = "assets/items_login.png";
  const gachaImg = new Image();
  gachaImg.onload = () => { dec.gachaImg = gachaImg; };
  gachaImg.src = "assets/gacha_items.png";
  const seasonImg = new Image();
  seasonImg.onload = () => { dec.seasonImg = seasonImg; };
  seasonImg.src = "assets/season_items.png";
  const eventImg = new Image();
  eventImg.onload = () => { dec.eventImg = eventImg; };
  eventImg.src = "assets/event_items.png";

  // โหลดห้องตัวเองจาก Firebase (ถ้ามี) — dec.ready ให้โมดูลอื่นรอก่อนแตะ myHome
  const fb = world.net && world.net.fb;
  dec.ready = (async () => {
    if (!fb || !world.net.uid) return;
    try {
      const snap = await fb.get(fb.ref(fb.db, `homes/${world.net.uid}`));
      const v = snap.val();
      if (v) {
        // ...v ก่อน แล้วค่อย override เฉพาะฟิลด์ที่ต้อง normalize — กันฟิลด์ใหม่ที่โมดูลอื่นเพิ่ม
        // ทีหลัง (achievements, daily, seasonReward, ...) หายไปเงียบ ๆ ตอนโหลดรอบถัดไป
        dec.myHome = {
          ...v,
          name: world.player.name, spent: v.spent || 0, items: v.items || [],
          greeting: v.greeting || "", login: v.login || null,
          pet: v.pet || null, petName: v.petName || null, unlockedPets: v.unlockedPets || [],
          outfit: v.outfit ?? world.player.outfit ?? null,
          avatar: { variant: world.player.variant, hair: world.player.hair || null, shirt: world.player.shirt || null },
        };
        // ห้องมีสัตว์เลี้ยงบันทึกไว้แต่ผู้เล่นยังไม่ได้ setPet ในเซสชันนี้ (เช่น localStorage ถูกล้าง) — ให้ตรงกัน
        if (v.pet && !world.player.petId) setPet(world.player, v.pet, v.petName);
        // เหมือนกัน — ห้องมีชุดคอสตูมบันทึกไว้แต่ session นี้ยังไม่ได้ตั้ง (localStorage ถูกล้าง)
        if (v.outfit) world.player.outfit = v.outfit;
      }
    } catch {}
    // เตือนครั้งเดียวต่ออีเวนต์ว่ามีของตกแต่งจำกัดเวลาขายอยู่ — ไม่งั้นมีแค่ banner เล็ก ๆ ในร้านค้า
    // ที่ต้องเปิดเมนูเองถึงจะเห็น คนส่วนใหญ่พลาดอีเวนต์ไปเลยถ้าไม่เคยเปิดร้านดู
    if (isEventActive() && dec.myHome.seenEventId !== EVENT_ID) {
      dec.myHome.seenEventId = EVENT_ID;
      saveHome(world);
      addSystemLine(ui, `🌧️ ของตกแต่งอีเวนต์ "${EVENT_NAME}" เข้าร้านแล้ว ถึง ${EVENT_END} เท่านั้น — ไปดูที่ปุ่ม 🛍️ ได้เลย!`);
    }
  })();

  document.getElementById("shop-btn").addEventListener("click", () => toggleShop(world, true));
  document.getElementById("home-btn").addEventListener("click", () => openRoom(world, "me"));
  document.getElementById("shop-close").addEventListener("click", () => toggleShop(world, false));
  document.getElementById("room-close").addEventListener("click", () => toggleRoom(world, false));
  const shopOv = document.getElementById("shop-overlay");
  shopOv.addEventListener("click", e => { if (e.target === shopOv) toggleShop(world, false); });
  const roomOv = document.getElementById("room-overlay");
  roomOv.addEventListener("click", e => { if (e.target === roomOv) toggleRoom(world, false); });
  document.getElementById("room-canvas").addEventListener("click", e => onRoomClick(world, e));
  document.getElementById("greeting-save").addEventListener("click", () => {
    const input = document.getElementById("greeting-input");
    dec.myHome.greeting = input.value.trim().slice(0, 100);
    saveHome(world);
    if (dec.anim) dec.anim.bubbleUntil = performance.now() / 1000 + 4; // โชว์คำใหม่ทันที
    const btn = document.getElementById("greeting-save");
    btn.textContent = "บันทึกแล้ว ✓";
    setTimeout(() => { btn.textContent = "บันทึก"; }, 1500);
  });

  // คลิกชื่อผู้เล่นใน online list เพื่อเปิดดูห้อง
  ui.onlineList.addEventListener("click", e => {
    const row = e.target.closest("[data-uid]");
    if (row && row.dataset.uid) openRoom(world, row.dataset.uid);
  });
  // คลิกแถวใน leaderboard = ส่องห้องของคนนั้น (ได้แม้เจ้าตัวออฟไลน์ — ห้องอยู่ใน Firebase)
  document.getElementById("board-list").addEventListener("click", e => {
    const row = e.target.closest("[data-uid]");
    if (row && row.dataset.uid) {
      document.getElementById("board-overlay").classList.add("hidden");
      openRoom(world, row.dataset.uid, row.dataset.name);
    }
  });
}

const earned = world => (world.quests ? world.quests.points : 0);
export const balance = world => Math.max(0, earned(world) - (world.decor.myHome.spent || 0));

// อ้างอิง sprite ของไอเทมทุกชนิด — ร้านค้า (items.png), login exclusive (items_login.png),
// และของรางวัลกาชาปอง (gacha_items.png)
export function spriteRef(dec, id) {
  if (id && id.startsWith("gacha")) {
    const n = parseInt(id.slice(5), 10);
    if (n >= 0) return { img: dec.gachaImg, idx: n, cols: GACHA_SHEET_COLS };
    return null;
  }
  if (id && id.startsWith("login")) {
    const n = parseInt(id.slice(5), 10) - 1;
    if (n >= 0 && n < LOGIN_ITEMS.length) return { img: dec.loginImg, idx: n, cols: LOGIN_SHEET_COLS };
    return null;
  }
  if (id && id.startsWith("season")) {
    const n = parseInt(id.slice(6), 10);
    if (n >= 0) return { img: dec.seasonImg, idx: n, cols: SEASON_SHEET_COLS };
    return null;
  }
  if (id && id.startsWith("event")) {
    const n = parseInt(id.slice(5), 10);
    if (n >= 0) return { img: dec.eventImg, idx: n, cols: EVENT_SHEET_COLS };
    return null;
  }
  const idx = SPRITE[id];
  return idx == null ? null : { img: dec.img, idx, cols: SHEET_COLS };
}

export function itemName(id) {
  if (id && id.startsWith("gacha")) return gachaItemName(id) + " 🎰";
  if (id && id.startsWith("login")) return loginItemName(id) + " ✨";
  if (id && id.startsWith("season")) return seasonItemName(id) + " 🏆";
  if (id && id.startsWith("event")) return eventItemName(id) + " 🌧️";
  const idx = SPRITE[id];
  return idx == null ? id : ITEMS[idx].name;
}

export function saveHome(world) {
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

  const banner = document.getElementById("shop-event-banner");
  const eventOn = isEventActive();
  banner.classList.toggle("hidden", !eventOn);
  if (eventOn) banner.textContent = `🌧️ ของตกแต่งอีเวนต์ "${EVENT_NAME}" มีขายถึง ${EVENT_END} เท่านั้น!`;

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

  if (eventOn) {
    EVENT_ITEMS.forEach(it => {
      const card = document.createElement("div");
      card.className = "shop-card event-card";
      card.appendChild(iconFor(dec, it.id, 2));
      const nm = document.createElement("div");
      nm.className = "shop-name";
      nm.textContent = it.name + " 🌧️";
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
}

function buy(world, it) {
  const dec = world.decor;
  if (balance(world) < it.price) return;
  dec.myHome.spent = (dec.myHome.spent || 0) + it.price;
  dec.myHome.items.push({ id: it.id, x: null, y: null });
  saveHome(world);
  renderShop(world);
  if (world.onShopBuy) world.onShopBuy();
  addSystemLine(worldUi(world), `🛍️ ซื้อ ${it.name} แล้ว! เปิด 🏠 เพื่อจัดวางในห้อง (คงเหลือ ${balance(world)} แต้ม)`);
}

// ---------- ห้องส่วนตัว ----------

export async function openRoom(world, uid, fallbackName) {
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
    // ยังไม่เคยแต่งห้อง = ห้องเปล่า แต่ยังโชว์ชื่อ/บอทของเจ้าของได้
    if (!home && fallbackName) home = { name: fallbackName, spent: 0, items: [] };
    dec.viewing = { uid, home, mine: false };
    if (world.onRoomVisit) world.onRoomVisit();
  }
  dec.selected = null;
  toggleRoom(world, true);
}

export function toggleRoom(world, open) {
  document.getElementById("room-overlay").classList.toggle("hidden", !open);
  if (open) renderRoom(world);
  else stopRoomAnim(world.decor);
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
  const greetRow = document.getElementById("room-greeting-row");
  greetRow.classList.toggle("hidden", !v.mine);
  if (v.mine) document.getElementById("greeting-input").value = dec.myHome.greeting || "";
  startRoomAnim(world);
  renderInventory(world);
}

// ---------- บอทเจ้าของห้อง: เดินไปมา + ทักทายผู้มาเยือน ----------

function startRoomAnim(world) {
  const dec = world.decor;
  stopRoomAnim(dec);
  const v = dec.viewing;
  const home = v.home;
  const av = v.mine
    ? dec.myHome.avatar
    : (home && home.avatar) || { variant: 0, hair: null, shirt: null };
  let sheet = null;
  try { sheet = makeCustomSheet(world, av.variant || 0, { hair: av.hair, shirt: av.shirt }); } catch {}
  const ownerName = v.mine ? world.player.name : (home && home.name) || "?";
  // ห้องตัวเอง: อ่านสัตว์เลี้ยงจาก world.player.petId ตรง ๆ (ค่าที่ใช้งานจริงตอนนี้) แทน
  // dec.myHome.pet ซึ่งเป็นแค่ snapshot ที่โหลดมาจาก Firebase ตอนเข้าเกม — ถ้า snapshot นั้น
  // เก่ากว่ารอบสัตว์เลี้ยงชุดปัจจุบัน (เช่น เคยเลือกสัตว์ชุดก่อนไว้ ยังไม่เคยกดบันทึกใหม่)
  // id เก่าจะ resolve ไม่ได้ใน petFrameRow() ทำให้สัตว์เลี้ยงเงียบ ๆ ไม่โผล่ในห้องทั้งที่โผล่ใน
  // ฉากโลกได้ปกติ (ฉากโลกอ่านจาก player.petId อยู่แล้ว ไม่ได้อ่านจาก myHome)
  const petId = v.mine ? world.player.petId : (home && home.pet);
  const petName = v.mine ? world.player.petName : (home && home.petName);
  const now = performance.now() / 1000;
  dec.anim = {
    sheet, ownerName,
    greeting: () => (v.mine ? dec.myHome.greeting : home && home.greeting) || DEFAULT_GREETING(ownerName),
    bot: { x: 96, y: 140, tx: 96, ty: 140, dir: "down", moving: false, animTime: 0, timer: 1.2 },
    pet: petId ? {
      petId, petName,
      x: 150, y: 110, tx: 150, ty: 110, dir: "down", moving: false, animTime: 0, timer: 1.5,
      trickUntil: 0, trickEmoji: "💤", nextTrick: now + 3 + Math.random() * 3,
    } : null,
    bubbleUntil: now + 4, nextBubble: now + 10,
    last: performance.now(), raf: 0,
  };
  const loop = ts => {
    if (!dec.anim) return;
    const a = dec.anim;
    const dt = Math.min((ts - a.last) / 1000, 0.1);
    a.last = ts;
    updateBot(a, dt);
    if (a.pet) updateRoomPet(a, dt);
    drawRoom(world);
    a.raf = requestAnimationFrame(loop);
  };
  dec.anim.raf = requestAnimationFrame(loop);
}

// สัตว์เลี้ยงในห้อง: เดินเล่นอิสระ (ไม่ตามเจ้าของ) + โผล่ทริกเป็นอิโมจิเป็นระยะ
function updateRoomPet(a, dt) {
  const b = a.pet;
  const now = performance.now() / 1000;
  if (b.moving) {
    const dx = b.tx - b.x, dy = b.ty - b.y;
    const dist = Math.hypot(dx, dy);
    const step = 22 * dt;
    if (dist <= step) {
      b.x = b.tx; b.y = b.ty;
      b.moving = false;
      b.timer = 0.8 + Math.random() * 1.8;
    } else {
      b.x += dx / dist * step;
      b.y += dy / dist * step;
      b.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      b.animTime += dt;
    }
  } else {
    b.timer -= dt;
    if (b.timer <= 0) {
      b.tx = 16 + Math.random() * (192 - 32);
      b.ty = ROOM_PET_Y_MIN + Math.random() * (ROOM_PET_Y_MAX - ROOM_PET_Y_MIN);
      b.moving = true;
    }
  }
  if (now >= b.nextTrick) {
    b.trickEmoji = ROOM_TRICKS[Math.floor(Math.random() * ROOM_TRICKS.length)];
    b.trickUntil = now + 1.6;
    b.nextTrick = now + 4 + Math.random() * 5;
  }
}

function stopRoomAnim(dec) {
  if (dec.anim) {
    cancelAnimationFrame(dec.anim.raf);
    dec.anim = null;
  }
}

function updateBot(a, dt) {
  const b = a.bot;
  const now = performance.now() / 1000;
  if (b.moving) {
    const dx = b.tx - b.x, dy = b.ty - b.y;
    const dist = Math.hypot(dx, dy);
    const step = 34 * dt;
    if (dist <= step) {
      b.x = b.tx; b.y = b.ty;
      b.moving = false;
      b.timer = 1 + Math.random() * 2;
    } else {
      b.x += dx / dist * step;
      b.y += dy / dist * step;
      b.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      b.animTime += dt;
    }
  } else {
    b.timer -= dt;
    if (b.timer <= 0) {
      // เป้าหมายใหม่ในพื้นห้อง — เว้นผนัง/ขอบ และเว้นด้านบนพอกับความสูงสไปรท์ (ดู ROOM_BOT_Y_MIN)
      b.tx = 16 + Math.random() * (192 - 32);
      b.ty = ROOM_BOT_Y_MIN + Math.random() * (ROOM_BOT_Y_MAX - ROOM_BOT_Y_MIN);
      b.moving = true;
    }
  }
  if (now >= a.nextBubble) {
    a.bubbleUntil = now + 4.5;
    a.nextBubble = now + 10 + Math.random() * 5;
  }
}

function drawRoom(world) {
  const dec = world.decor;
  const canvas = document.getElementById("room-canvas");
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  // ผนัง + พื้น สไตล์เดียวกับแผนที่ (วาดที่สเกล S)
  c.fillStyle = "#31566d";
  c.fillRect(0, 0, canvas.width, CELL * 2 * S);
  c.fillStyle = "#47788a";
  c.fillRect(0, (CELL * 2 - 4) * S, canvas.width, 4 * S);
  for (let y = 2; y < ROOM_ROWS; y++) {
    for (let x = 0; x < ROOM_COLS; x++) {
      c.fillStyle = (x + y) % 2 ? "#f0e8d8" : "#e6dcc8";
      c.fillRect(x * CELL * S, y * CELL * S, CELL * S, CELL * S);
    }
  }
  const home = dec.viewing && dec.viewing.home;
  if (home && home.items && dec.img) {
    const placed = home.items
      .map((it, idx) => ({ ...it, idx }))
      .filter(it => it.x != null && it.y != null)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    for (const it of placed) {
      const ref = spriteRef(dec, it.id);
      if (!ref || !ref.img) continue;
      c.drawImage(ref.img, (ref.idx % ref.cols) * CELL, Math.floor(ref.idx / ref.cols) * CELL, CELL, CELL,
        it.x * CELL * S, it.y * CELL * S, CELL * S, CELL * S);
    }
  }
  drawRoomPet(world, c);
  drawBot(world, c);
}

function drawRoomPet(world, c) {
  const a = world.decor.anim;
  if (!a || !a.pet) return;
  const img = petImageEl();
  if (!img || !img.complete) return;
  const b = a.pet;
  const row = petFrameRow(b.petId, b.dir);
  if (row < 0) return;
  const col = b.moving ? Math.floor(b.animTime * 7) % 4 : 0;
  const size = PET_FRAME; // ขนาดที่วาดจริง เท่าเดิมทุกประการ
  const dx = Math.round(b.x - size / 2) * S, dy = Math.round(b.y - size + 3) * S;
  const shadowW = Math.round(size * 0.5), shadowH = Math.max(2, Math.round(size * 0.06));
  c.fillStyle = "rgba(0,0,0,0.22)";
  c.fillRect(Math.round(b.x - shadowW / 2) * S, Math.round(b.y - 1) * S, shadowW * S, shadowH * S);
  // ครอปจาก sheet ต้นฉบับความละเอียดสูง (PET_SRC_FRAME) วาดลงขนาดจอเดิม (size*S)
  c.drawImage(img, col * PET_SRC_FRAME, row * PET_SRC_FRAME, PET_SRC_FRAME, PET_SRC_FRAME, dx, dy, size * S, size * S);
  const now = performance.now() / 1000;
  if (now < b.trickUntil) {
    const bob = Math.sin((b.trickUntil - now) * 10) * 2 * S;
    c.font = `${8 * S}px sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(b.trickEmoji, b.x * S, (b.y - size - 3) * S - bob);
  }
}

function drawBot(world, c) {
  const a = world.decor.anim;
  if (!a || !a.sheet) return;
  const b = a.bot;
  const { frameW, frameH } = CONFIG;
  const col = spriteFrame(b); // ใช้ logic เฟรมเดียวกับตัวละครในเกม
  const dx = Math.round(b.x - frameW / 2) * S, dy = Math.round(b.y - frameH + 1) * S;
  const shadowW = Math.round(frameW * 0.62), shadowH = Math.max(3, Math.round(frameH * 0.06));
  c.fillStyle = "rgba(0,0,0,0.25)";
  c.fillRect(Math.round(b.x - shadowW / 2) * S, Math.round(b.y - 2) * S, shadowW * S, shadowH * S);
  c.drawImage(a.sheet, col * frameW, 0, frameW, frameH, dx, dy, frameW * S, frameH * S);
  // ป้ายชื่อ
  c.font = `700 ${5.5 * S}px 'Segoe UI', 'Leelawadee UI', sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  const nx = b.x * S, ny = (b.y - frameH + 1 - 4) * S;
  const nw = c.measureText(a.ownerName).width + 8 * S / 2;
  c.fillStyle = "rgba(23,27,44,0.75)";
  c.fillRect(nx - nw / 2, ny - 4 * S, nw, 8 * S);
  c.fillStyle = "#e7b94f";
  c.fillText(a.ownerName, nx, ny);
  // คำทักทาย
  const now = performance.now() / 1000;
  if (now < a.bubbleUntil) {
    const text = a.greeting();
    c.font = `${5.5 * S}px 'Segoe UI', 'Leelawadee UI', sans-serif`;
    const maxW = 150 * S;
    const words = String(text).split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    const shown = lines.slice(0, 3);
    const bw = Math.min(maxW, Math.max(...shown.map(l => c.measureText(l).width))) + 10 * S;
    const bh = shown.length * 8 * S + 6 * S;
    let bx = b.x * S - bw / 2;
    bx = Math.max(2 * S, Math.min(bx, ROOM_COLS * CELL * S - bw - 2 * S));
    let by = (b.y - frameH + 1 - 10) * S - bh;
    if (by < 2 * S) by = (b.y + 4) * S; // ถ้าชนขอบบน ย้ายลงใต้ตัว
    c.fillStyle = "rgba(255,246,220,0.95)";
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = "#171b2c";
    c.textAlign = "left";
    c.textBaseline = "top";
    shown.forEach((l, i) => c.fillText(l, bx + 5 * S, by + 3 * S + i * 8 * S));
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
    const cell = iconFor(dec, it.id, 2);
    cell.classList.add("inv-item");
    if (dec.selected === it.idx) cell.classList.add("selected");
    cell.title = itemName(it.id);
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
    if (world.onItemPlaced) world.onItemPlaced();
  } else {
    // คลิกของที่วางอยู่ = เก็บกลับเข้ากระเป๋า
    const hit = dec.myHome.items.find(it => it.x === gx && it.y === gy);
    if (hit) { hit.x = null; hit.y = null; saveHome(world); }
  }
  drawRoom(world);
  renderInventory(world);
}

// ไอคอนจาก item id (รองรับทั้งไอเทมร้านค้าและ login exclusive)
export function iconFor(dec, id, scale) {
  const c = document.createElement("canvas");
  c.width = CELL; c.height = CELL;
  c.style.width = CELL * scale + "px";
  c.style.height = CELL * scale + "px";
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const draw = () => {
    const ref = spriteRef(dec, id);
    if (ref && ref.img) {
      ctx.drawImage(ref.img, (ref.idx % ref.cols) * CELL, Math.floor(ref.idx / ref.cols) * CELL,
        CELL, CELL, 0, 0, CELL, CELL);
    }
  };
  const ref = spriteRef(dec, id);
  if (ref && ref.img) draw();
  else setTimeout(draw, 400);
  return c;
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
