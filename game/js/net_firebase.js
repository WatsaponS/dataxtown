// Multiplayer ผ่าน Firebase Realtime Database — ไม่ต้องมีเซิร์ฟเวอร์ของเราเอง
// ใช้เมื่อ FIREBASE_CONFIG ไม่เป็น null (ดู firebase-config.js); โครงข้อมูล:
//   rooms/main/players/<uid> = { name, variant, hair, shirt, pet, petName, x, y, dir, moving, online, ts }
//   rooms/main/chat/<push>   = { uid, name, text, ts }
// เผื่ออนาคต: players/<uid>/points, leaderboard/ ใช้ database เดียวกันได้เลย
//
// online: false = "หลับ" — หลุด/ปิดแท็บไม่ลบ node ทิ้งอีกต่อไป (onDisconnect แค่ update
// online/dir/moving) ตัวละครค้างอยู่ที่เดิม ยืนหน้าตรง ขึ้น 💤 ให้คนอื่นเห็นว่าไม่ได้อยู่จริง
// พอ uid เดิมกลับมาต่อใหม่ จะ resume ตำแหน่งล่าสุดจาก node เดิมแทนจุด spawn ปกติ

import { speak } from "./entities.js";
import { refreshOnlineList, addSystemLine } from "./ui.js";
import { findRemote, addRemote } from "./net.js";
import { setPet } from "./pets.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";
import { EMOTE_DURATION_MS } from "./emotes_data.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";

export async function connectFirebase(world, ui) {
  const net = { connected: false, mode: "firebase", timer: null };
  world.net = net;
  const p = world.player;
  try {
    const { initializeApp } = await import(`${SDK}/firebase-app.js`);
    const {
      getDatabase, ref, get, set, update, onValue, onChildAdded, onChildChanged, onChildRemoved,
      onDisconnect, push, query, orderByChild, startAt, limitToLast, serverTimestamp,
    } = await import(`${SDK}/firebase-database.js`);

    const app = initializeApp(FIREBASE_CONFIG);
    const db = getDatabase(app);
    // ให้โมดูลอื่นใช้ต่อ (quests = leaderboard, history = ประวัติแชต, duel = ท้าเป่ายิ้งฉุบ)
    net.fb = {
      db, ref, get, set, update, onValue, onChildAdded, push,
      query, orderByChild, startAt, limitToLast, serverTimestamp,
    };

    // ไอดีประจำเครื่อง (ไม่ใช้ระบบ auth — เกมภายในบริษัท)
    let uid = localStorage.getItem("dataxtown.uid");
    if (!uid) {
      uid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("dataxtown.uid", uid);
    }
    net.uid = uid;

    const meRef = ref(db, `rooms/main/players/${uid}`);
    // uid เดิมเคยเล่นมาก่อน (มี node ค้างอยู่ ไม่ว่าจะหลับหรือหลุดกลางคัน) — resume ตำแหน่ง
    // ล่าสุดแทนจุด spawn ปกติ เว้นแต่ตั้งใจระบุ ?spawn= มาเอง (ใช้ทดสอบ/พาไปจุดเฉพาะ)
    if (!new URLSearchParams(location.search).get("spawn")) {
      try {
        const prev = (await get(meRef)).val();
        if (prev && typeof prev.x === "number" && typeof prev.y === "number") {
          p.x = prev.x; p.y = prev.y; p.dir = prev.dir || p.dir;
        }
      } catch {}
    }
    await set(meRef, {
      name: p.name, variant: p.variant, hair: p.hair || null, shirt: p.shirt || null,
      pet: p.petId || null, petName: p.petName || null,
      x: p.x, y: p.y, dir: p.dir, moving: false, online: true, ts: serverTimestamp(),
    });
    // หลุด/ปิดแท็บ = ไม่ลบ node ทิ้งอีกต่อไป แค่ทำเครื่องหมาย "หลับ" (ยืนหน้าตรง ค้างตำแหน่งเดิม
    // ให้คนอื่นเห็น) แล้ว resume ตำแหน่งนี้เองตอน uid เดิมกลับมาต่อใหม่ (ดูโค้ดด้านบน)
    onDisconnect(meRef).update({ online: false, dir: "down", moving: false, ts: serverTimestamp() });
    net.connected = true;
    net.updatePet = (petId, petName) =>
      update(meRef, { pet: petId || null, petName: petName || null }).catch(() => {});
    addSystemLine(ui, "🟢 ออนไลน์ผ่าน Firebase — คนอื่นในออฟฟิศจะเห็นคุณ");

    // ---------- ผู้เล่นคนอื่น ----------
    const joinedAt = Date.now();
    const playersRef = ref(db, "rooms/main/players");
    onChildAdded(playersRef, snap => {
      if (snap.key === uid) return;
      const v = snap.val();
      addRemote(world, { id: snap.key, ...v });
      const ent = findRemote(world, snap.key);
      if (ent) {
        ent.online = v.online !== false; // node เก่าก่อนมีฟีลด์นี้ = ถือว่าออนไลน์
        // บังคับยืนหน้าตรงเสมอตอนหลับ ไม่พึ่ง dir/moving ที่ save ไว้ (เผื่อ record เก่าก่อนมี
        // onDisconnect update ตัวนี้ หรือหลุดกลางท่าเดินก่อนจะ sync ครั้งสุดท้ายทัน)
        if (!ent.online) { ent.dir = "down"; ent.moving = false; ent.tx = ent.x; ent.ty = ent.y; }
      }
      refreshOnlineList(ui, world);
      // คนที่กำลังหลับอยู่แล้วตอนเราเพิ่งเข้ามา ไม่ใช่ "เพิ่งเข้ามา" จริง ๆ ไม่ต้องประกาศ
      if (Date.now() - joinedAt > 2000 && v.online !== false) addSystemLine(ui, `${v.name} เข้ามาในออฟฟิศ`);
    });
    onChildChanged(playersRef, snap => {
      const ent = findRemote(world, snap.key);
      if (ent) {
        const v = snap.val();
        const wasOnline = ent.online !== false;
        ent.online = v.online !== false;
        ent.tx = v.x; ent.ty = v.y; ent.dir = v.dir || "down"; ent.moving = !!v.moving; ent.running = !!v.running;
        // บังคับยืนหน้าตรงเสมอตอนหลับ (เผื่อ record ไม่ได้ผ่าน onDisconnect update จริง ๆ)
        if (!ent.online) { ent.dir = "down"; ent.moving = false; }
        // เปลี่ยนแค่ชื่อสัตว์เลี้ยง (ชนิดเดิม) ไม่ต้องรีเซ็ต trail ที่กำลังเดินตามอยู่
        if (v.pet !== ent.petId) setPet(ent, v.pet, v.petName);
        else if (ent.petId) ent.petName = v.petName || null;
        // ท่าทาง — ใช้เวลาที่รับสดบนเครื่องเราเอง (กันนาฬิกา client เพี้ยนกับ serverTimestamp)
        if (v.emote) { ent.emoteType = v.emote.type; ent.emoteUntil = Date.now() + EMOTE_DURATION_MS; }
        if (wasOnline && !ent.online) addSystemLine(ui, `${ent.name} ออกจากออฟฟิศชั่วคราว 💤`);
        else if (!wasOnline && ent.online) addSystemLine(ui, `${ent.name} กลับมาแล้ว 👋`);
        if (wasOnline !== ent.online) refreshOnlineList(ui, world);
      }
    });
    onChildRemoved(playersRef, snap => {
      const idx = world.entities.findIndex(e => e.id === "remote_" + snap.key);
      if (idx >= 0) {
        addSystemLine(ui, `${world.entities[idx].name} ออกจากออฟฟิศ`);
        world.entities.splice(idx, 1);
        refreshOnlineList(ui, world);
      }
    });

    // ---------- ส่งตำแหน่งเมื่อเปลี่ยน (10 ครั้ง/วินาที) ----------
    let last = "";
    net.timer = setInterval(() => {
      const snap = `${Math.round(p.x)},${Math.round(p.y)},${p.dir},${p.moving},${p.running}`;
      if (snap !== last) {
        last = snap;
        update(meRef, { x: p.x, y: p.y, dir: p.dir, moving: p.moving, running: !!p.running }).catch(() => {});
      }
    }, 100);

    // ---------- แชต ----------
    const chatRef = ref(db, "rooms/main/chat");
    onChildAdded(query(chatRef, orderByChild("ts"), startAt(joinedAt - 3000)), snap => {
      const m = snap.val();
      if (!m || m.uid === uid) return;
      const ent = findRemote(world, m.uid);
      if (ent) speak(world, ent, String(m.text)); // ผ่านกติกา canHear ปกติ
    });
    const prev = world.onChat;
    world.onChat = (ent, text) => {
      if (prev) prev(ent, text);
      if (ent === p) push(chatRef, { uid, name: p.name, text, ts: serverTimestamp() }).catch(() => {});
    };
  } catch (err) {
    console.error("firebase connect failed:", err);
    if (net.timer) clearInterval(net.timer);
    addSystemLine(ui, "🔴 ต่อ Firebase ไม่ได้ (" + (err && err.code || err.message || err) + ") — เล่นแบบออฟไลน์");
  }
  return net;
}
