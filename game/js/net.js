// Multiplayer layer: เชื่อม WebSocket ไปที่ server.py แล้วแปลงผู้เล่นคนอื่นเป็น entity kind "remote"
// ถ้าต่อไม่ได้ (เช่นรันผ่าน serve.py ที่ไม่มี /ws) เกมเล่นแบบออฟไลน์ต่อได้ปกติ

import { makeEntity, speak } from "./entities.js";
import { makeCustomSheet } from "./avatar.js";
import { setPet } from "./pets.js";
import { refreshOnlineList, addSystemLine } from "./ui.js";

export function connectNet(world, ui) {
  const net = { connected: false, ws: null, timer: null };
  world.net = net;
  const p = world.player;

  let ws;
  try {
    // หน้าเสิร์ฟผ่าน https (เช่นผ่าน Cloudflare Tunnel) ต้องใช้ wss
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${scheme}://${location.host}/ws`);
  } catch {
    addSystemLine(ui, "เล่นแบบออฟไลน์ (ต่อเซิร์ฟเวอร์ไม่ได้)");
    return net;
  }
  net.ws = ws;
  const send = obj => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
  const accessKey = new URLSearchParams(location.search).get("key");

  ws.addEventListener("open", () => {
    net.connected = true;
    send({ t: "join", key: accessKey, name: p.name, variant: p.variant, hair: p.hair, shirt: p.shirt, pet: p.petId, x: p.x, y: p.y, dir: p.dir });
    addSystemLine(ui, "🟢 ออนไลน์แล้ว — คนอื่นในออฟฟิศจะเห็นคุณ");

    // ส่งตำแหน่งเมื่อมีการเปลี่ยนแปลง (จังหวะ 10 ครั้ง/วินาที)
    let last = "";
    net.timer = setInterval(() => {
      const snap = `${Math.round(p.x)},${Math.round(p.y)},${p.dir},${p.moving}`;
      if (snap !== last) {
        last = snap;
        send({ t: "move", x: p.x, y: p.y, dir: p.dir, moving: p.moving });
      }
    }, 100);

    // ต่อท้าย chat handler เดิม: ข้อความของเราส่งขึ้นเซิร์ฟเวอร์ด้วย
    const prev = world.onChat;
    world.onChat = (ent, text) => {
      if (prev) prev(ent, text);
      if (ent === p) send({ t: "chat", text });
    };
  });

  ws.addEventListener("message", ev => {
    let data;
    try { data = JSON.parse(ev.data); } catch { return; }
    switch (data.t) {
      case "denied":
        addSystemLine(ui, "⛔ รหัสเข้าห้องไม่ถูกต้อง — ขอลิงก์พร้อม ?key= ที่ถูกต้องจากผู้เปิดเซิร์ฟเวอร์");
        ws.close();
        break;
      case "welcome":
        for (const info of data.players) addRemote(world, info);
        refreshOnlineList(ui, world);
        break;
      case "join":
        addRemote(world, data.player);
        refreshOnlineList(ui, world);
        addSystemLine(ui, `${data.player.name} เข้ามาในออฟฟิศ`);
        break;
      case "leave": {
        const idx = world.entities.findIndex(e => e.id === "remote_" + data.id);
        if (idx >= 0) {
          addSystemLine(ui, `${world.entities[idx].name} ออกจากออฟฟิศ`);
          world.entities.splice(idx, 1);
          refreshOnlineList(ui, world);
        }
        break;
      }
      case "move": {
        const ent = findRemote(world, data.id);
        if (ent) {
          ent.tx = data.x; ent.ty = data.y;
          ent.dir = data.dir; ent.moving = data.moving;
        }
        break;
      }
      case "chat": {
        const ent = findRemote(world, data.id);
        if (ent) speak(world, ent, data.text); // bubble + log ผ่านกติกา canHear ปกติ
        break;
      }
    }
  });

  ws.addEventListener("close", () => {
    if (net.timer) clearInterval(net.timer);
    const hadRemotes = world.entities.some(e => e.kind === "remote");
    world.entities = world.entities.filter(e => e.kind !== "remote");
    if (net.connected || hadRemotes) {
      refreshOnlineList(ui, world);
      addSystemLine(ui, "🔴 หลุดจากเซิร์ฟเวอร์ — เล่นแบบออฟไลน์ต่อ (รีเฟรชเพื่อต่อใหม่)");
    }
    net.connected = false;
  });

  return net;
}

export function findRemote(world, id) {
  return world.entities.find(e => e.id === "remote_" + id);
}

export function addRemote(world, info) {
  if (findRemote(world, info.id)) return;
  const ent = makeEntity({
    id: "remote_" + info.id, name: info.name, variant: info.variant || 0,
    x: info.x, y: info.y, kind: "remote",
  });
  ent.dir = info.dir || "down";
  ent.tx = info.x; ent.ty = info.y;
  if (info.hair || info.shirt) {
    ent.sheet = makeCustomSheet(world, ent.variant, { hair: info.hair, shirt: info.shirt });
  }
  if (info.pet) setPet(ent, info.pet);
  world.entities.push(ent);
}

// เดินเข้าหาตำแหน่งล่าสุดจากเซิร์ฟเวอร์แบบนุ่ม ๆ (interpolation)
export function updateRemotes(world, dt) {
  for (const ent of world.entities) {
    if (ent.kind !== "remote") continue;
    const dx = ent.tx - ent.x, dy = ent.ty - ent.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 120) { ent.x = ent.tx; ent.y = ent.ty; } // teleport ถ้าไกลผิดปกติ
    else if (dist > 0.5) {
      const k = Math.min(1, dt * 12);
      ent.x += dx * k; ent.y += dy * k;
    }
    if (ent.moving) ent.animTime += dt;
  }
}
