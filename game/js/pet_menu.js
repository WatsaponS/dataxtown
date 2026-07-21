// เมนู 🐾 ในเกม — เปลี่ยน/ตั้งชื่อสัตว์เลี้ยงได้ตลอด เลือกได้ทั้ง 13 นักษัตร ไม่ต้องปลดล็อก
// เปลี่ยนแล้ว sync ไปให้คนอื่นเห็นทันทีผ่าน world.net.updatePet (WebSocket หรือ Firebase)

import { ALL_PETS, PET_FRAME, petIconRow, petInfo } from "./pets_data.js";
import { setPet, petImageEl } from "./pets.js";
import { saveHome } from "./decor.js";
import { addSystemLine } from "./ui.js";

export function initPetMenu(world, ui) {
  let selected = world.player.petId;

  document.getElementById("pet-btn").addEventListener("click", () => togglePetMenu(world, true));
  document.getElementById("pet-menu-close").addEventListener("click", () => togglePetMenu(world, false));
  const overlay = document.getElementById("pet-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) togglePetMenu(world, false); });

  document.getElementById("pet-menu-save").addEventListener("click", () => {
    const name = document.getElementById("pet-menu-name").value.trim().slice(0, 16);
    setPet(world.player, selected, name);
    const dec = world.decor;
    if (dec) {
      dec.myHome.pet = selected;
      dec.myHome.petName = name || null;
      saveHome(world);
    }
    if (world.net && world.net.updatePet) world.net.updatePet(selected, name);
    const label = selected ? (petInfo(selected) ? petInfo(selected).name : selected) : null;
    addSystemLine(ui, label
      ? `🐾 เปลี่ยนสัตว์เลี้ยงเป็น "${name || label}" แล้ว!`
      : "🐾 ปล่อยสัตว์เลี้ยงกลับบ้านแล้ว (ไม่มีสัตว์เลี้ยงตอนนี้)");
    togglePetMenu(world, false);
  });

  document.getElementById("pet-menu-grid").addEventListener("click", e => {
    const opt = e.target.closest(".pet-opt");
    if (!opt) return;
    selected = opt.dataset.pet || null;
    render(world, selected);
  });
}

export function togglePetMenu(world, open) {
  document.getElementById("pet-overlay").classList.toggle("hidden", !open);
  if (open) {
    const selected = world.player.petId;
    document.getElementById("pet-menu-name").value = world.player.petName || "";
    render(world, selected);
  }
}

function render(world, selected) {
  const grid = document.getElementById("pet-menu-grid");
  grid.textContent = "";

  const none = document.createElement("div");
  none.className = "pet-opt none-opt" + (selected ? "" : " selected");
  none.innerHTML = '<span class="pet-emoji">🚫</span><span>ไม่มี</span>';
  none.addEventListener("click", () => {}); // จับที่ delegation ด้านบนแล้ว (dataset.pet ว่าง = none)
  grid.appendChild(none);

  const img = petImageEl();
  ALL_PETS.forEach(pet => {
    const opt = document.createElement("div");
    opt.className = "pet-opt" + (selected === pet.id ? " selected" : "");
    opt.dataset.pet = pet.id;
    const c = document.createElement("canvas");
    c.width = PET_FRAME; c.height = PET_FRAME;
    const cc = c.getContext("2d");
    cc.imageSmoothingEnabled = false;
    const draw = () => cc.drawImage(img, 0, petIconRow(pet.id) * PET_FRAME, PET_FRAME, PET_FRAME, 0, 0, PET_FRAME, PET_FRAME);
    if (img && img.complete) draw(); else if (img) img.addEventListener("load", draw, { once: true });
    const label = document.createElement("span");
    label.textContent = `${pet.emoji} ${pet.name}`;
    opt.append(c, label);
    grid.appendChild(opt);
  });
}
