// ปุ่มท่าทาง (โบกมือ/ปรบมือ/ฯลฯ) — โชว์เหนือหัวตัวเองทันที + broadcast ให้คนใกล้เคียงเห็นผ่าน
// field "emote" บน rooms/main/players/<uid> (field เดียวกับที่ pet/petName ใช้อยู่แล้ว)

import { EMOTES, EMOTE_DURATION_MS } from "./emotes_data.js";

export function initEmotes(world, ui) {
  const btn = document.getElementById("emote-btn");
  const panel = document.getElementById("emote-panel");
  btn.addEventListener("click", () => panel.classList.toggle("hidden"));
  panel.querySelectorAll(".emote-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      triggerEmote(world, opt.dataset.emote);
      panel.classList.add("hidden");
    });
  });
  document.addEventListener("click", e => {
    if (panel.classList.contains("hidden")) return;
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.add("hidden");
  });
}

export function toggleEmotePanel(open) {
  document.getElementById("emote-panel").classList.toggle("hidden", !open);
}

export function isEmotePanelOpen() {
  return !document.getElementById("emote-panel").classList.contains("hidden");
}

export function triggerEmote(world, type) {
  if (!world.player || !EMOTES.some(e => e.id === type)) return;
  world.player.emoteType = type;
  world.player.emoteUntil = Date.now() + EMOTE_DURATION_MS;
  const net = world.net;
  if (net && net.fb && net.uid) {
    net.fb.update(net.fb.ref(net.fb.db, `rooms/main/players/${net.uid}`), {
      emote: { type, ts: net.fb.serverTimestamp() },
    }).catch(() => {});
  }
}
