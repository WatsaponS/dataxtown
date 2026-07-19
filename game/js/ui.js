// HUD: แชต, minimap, แบนเนอร์โซน, รายชื่อออนไลน์, หน้าจอเริ่มเกม

import { ZONE_INFO } from "./data.js";
import { zoneAt, tileBlocked } from "./world.js";
import { speak, canHear } from "./entities.js";

export function setupUI(world) {
  const ui = {
    banner: document.getElementById("zone-banner"),
    minimap: document.getElementById("minimap"),
    onlineList: document.getElementById("online-list"),
    onlineBadge: document.getElementById("online-badge"),
    chatLog: document.getElementById("chat-log"),
    chatBar: document.getElementById("chat-bar"),
    chatInput: document.getElementById("chat-input"),
    lastZoneId: null, bannerTimer: null,
    chatOpen: false,
    miniBase: buildMinimapBase(world),
  };

  world.onChat = (ent, text) => {
    if (canHear(world, world.player, ent)) addChatLine(ui, ent.name, text, ent === world.player);
  };

  // จอเล็ก: online list ยุบเป็น badge แตะเพื่อกางดูรายชื่อ
  ui.onlineBadge.addEventListener("click", () => ui.onlineList.classList.toggle("open"));

  return ui;
}

export function isChatOpen(ui) { return ui.chatOpen; }

export function toggleChat(ui, world, open) {
  ui.chatOpen = open;
  ui.chatBar.classList.toggle("hidden", !open);
  if (open) ui.chatInput.focus();
  else { ui.chatInput.value = ""; ui.chatInput.blur(); }
}

export function submitChat(ui, world) {
  const text = ui.chatInput.value.trim();
  if (text) speak(world, world.player, text);
  toggleChat(ui, world, false);
}

export function addChatLine(ui, name, text, self) {
  const div = document.createElement("div");
  div.className = "msg";
  const b = document.createElement("b");
  b.textContent = self ? name + " (คุณ)" : name;
  div.appendChild(b);
  div.appendChild(document.createTextNode(": " + text));
  ui.chatLog.appendChild(div);
  while (ui.chatLog.children.length > 30) ui.chatLog.firstChild.remove();
  ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
}

export function addSystemLine(ui, text) {
  const div = document.createElement("div");
  div.className = "msg sys";
  div.textContent = text;
  ui.chatLog.appendChild(div);
  ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
}

// แบนเนอร์เมื่อผู้เล่นเข้า/ออกโซน
export function updateZoneBanner(ui, world) {
  const z = zoneAt(world, world.player.x, world.player.y);
  const id = z ? z.id : null;
  if (id === ui.lastZoneId) return;
  ui.lastZoneId = id;
  clearTimeout(ui.bannerTimer);
  if (z) {
    const info = ZONE_INFO[z.id] || { name: z.id, note: "" };
    ui.banner.textContent = info.name + (info.note ? " — " + info.note : "");
    ui.banner.classList.remove("hidden");
    ui.bannerTimer = setTimeout(() => ui.banner.classList.add("hidden"), 3500);
  } else {
    ui.banner.classList.add("hidden");
  }
}

function buildMinimapBase(world) {
  const m = world.map;
  const off = document.createElement("canvas");
  off.width = m.width; off.height = m.height;
  const c = off.getContext("2d");
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++)
      if (!tileBlocked(world, x, y)) { c.fillStyle = "#3a4360"; c.fillRect(x, y, 1, 1); }
  c.fillStyle = "rgba(231,185,79,0.35)";
  for (const z of m.interactionZones) c.fillRect(...z.rect);
  return off;
}

export function drawMinimap(ui, world) {
  const c = ui.minimap.getContext("2d");
  const s = ui.minimap.width / world.map.width;
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#171b2c";
  c.fillRect(0, 0, ui.minimap.width, ui.minimap.height);
  c.drawImage(ui.miniBase, 0, 0, ui.minimap.width, ui.minimap.height);
  for (const ent of world.entities) {
    c.fillStyle = ent === world.player ? "#e7b94f" : "#77b9b4";
    const x = (ent.x / world.tile) * s, y = (ent.y / world.tile) * s;
    c.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
}

export function refreshOnlineList(ui, world) {
  ui.onlineBadge.textContent = `👥 ${world.entities.length}`;
  ui.onlineList.textContent = "";
  const head = document.createElement("div");
  head.className = "head";
  head.textContent = `ออนไลน์ (${world.entities.length})`;
  ui.onlineList.appendChild(head);
  for (const ent of world.entities) {
    const row = document.createElement("div");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = ent === world.player ? "#e7b94f" : "#57b06b";
    row.appendChild(dot);
    row.appendChild(document.createTextNode(ent.name + (ent.role ? " · " + ent.role : "")));
    ui.onlineList.appendChild(row);
  }
}
